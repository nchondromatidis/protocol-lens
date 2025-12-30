import type { Message } from 'tevm/actions';
import type { EvmResult, InterpreterStep } from 'tevm/evm';
import { InvariantError } from '../../common/errors.ts';
import { TxTrace } from './TxTrace.ts';
import { type Hex } from '../types/artifact.ts';
import { ExternalCallHandler } from '../opcode-handlers/ExternalCallHandler.ts';
import { ExternalCallResultHandler } from '../opcode-handlers/ExternalCallResultHandler.ts';
import { FunctionEntryHandler } from '../opcode-handlers/FunctionEntryHandler.ts';
import { emptyRuntimeTraceMetadata, type RuntimeTraceMetadata } from '../opcode-handlers/trace-metadata.ts';
import { FunctionExitHandler } from '../opcode-handlers/FunctionExitHandler.ts';

type TracingId = string;
type TxId = Hex;

export class TxTracer {
  public readonly tracingTx: Map<string, TxTrace> = new Map();
  public readonly runtimeTraceMetadata: Map<TracingId, RuntimeTraceMetadata> = new Map();

  public readonly succeededTxs: Map<TxId, TxTrace> = new Map();
  public readonly failedTxs: Map<TxId, TxTrace> = new Map();

  constructor(
    private readonly externalCallHandler: ExternalCallHandler,
    private readonly externalCallResultHandler: ExternalCallResultHandler,
    private readonly functionEntryHandler: FunctionEntryHandler,
    private readonly functionExitHandler: FunctionExitHandler
  ) {}

  //** Start-Stop tracing **/

  public startTracing(tracingId: string) {
    const txTrace = new TxTrace();
    this.tracingTx.set(tracingId, txTrace);
    this.runtimeTraceMetadata.set(tracingId, emptyRuntimeTraceMetadata());
  }

  public stopTracing(txHash: Hex, tracingId: string, status: 'success' | 'failed') {
    const currentTxTrace = this.tracingTx.get(tracingId);
    if (!currentTxTrace) throw new InvariantError('current tx trace is empty');

    if (status == 'failed') this.failedTxs.set(txHash, currentTxTrace);
    if (status == 'success') this.succeededTxs.set(txHash, currentTxTrace);

    this.tracingTx.delete(tracingId);
    this.runtimeTraceMetadata.delete(tracingId);
    this.externalCallResultHandler.cleanCache(tracingId);
    // this.functionEntryHandler.cleanCache(tracingId);
  }

  //** Event Handlers **/

  public async handleExternalCall(callEvent: Message, tracingId: string): Promise<void> {
    const functionCallEvent = await this.externalCallHandler.handle(callEvent);

    this.tracingTx.get(tracingId)!.addFunctionCall(functionCallEvent);

    this.runtimeTraceMetadata
      .get(tracingId)!
      .executionContext.set(functionCallEvent.depth, { functionCallEvent, isJumpDestReached: false });
  }

  public async handleExternalCallResult(resultEvent: EvmResult, tracingId: string) {
    const functionCallEvent = this.tracingTx.get(tracingId)!.getLatestFunctionCallEvent();
    if (!functionCallEvent) throw new InvariantError('handleExternalCallResult without call registered');
    const functionResultEvent = await this.externalCallResultHandler.handle(resultEvent, tracingId, functionCallEvent);

    this.tracingTx.get(tracingId)!.addResult(functionResultEvent);
    this.runtimeTraceMetadata.get(tracingId)!.executionContext.delete(functionCallEvent.depth);
  }

  public async handleFunctionEntryHandler(stepEvent: InterpreterStep, tracingId: string) {
    const parentFunctionCallEvent = this.tracingTx.get(tracingId)!.getLatestFunctionCallEvent();
    if (!parentFunctionCallEvent) {
      throw new InvariantError('handleFunctionEntryHandler called before external call handers');
    }
    const executionContext = this.runtimeTraceMetadata.get(tracingId)!.executionContext;

    const result = await this.functionEntryHandler.handle(stepEvent, executionContext, parentFunctionCallEvent);

    if (!result) return;

    const { functionCallEvent, functionExitPc } = result;

    if (functionCallEvent !== executionContext.get(stepEvent.depth)!.functionCallEvent) {
      this.tracingTx.get(tracingId)!.addFunctionCall(functionCallEvent);
    }

    const depth = stepEvent.depth;
    if (!this.runtimeTraceMetadata.get(tracingId)!.functionExits.has(depth)) {
      this.runtimeTraceMetadata.get(tracingId)!.functionExits.set(depth, new Map());
    }
    this.runtimeTraceMetadata.get(tracingId)!.functionExits.get(depth)!.set(functionExitPc, functionCallEvent);
  }

  public async handleFunctionExitHandler(stepEvent: InterpreterStep, tracingId: string) {
    const functionCallEvent = this.tracingTx.get(tracingId)!.getLatestFunctionCallEvent()!;
    const functionExits = this.runtimeTraceMetadata.get(tracingId)!.functionExits;

    const functionResultEvent = await this.functionExitHandler.handle(stepEvent, functionCallEvent, functionExits);

    if (functionResultEvent) this.tracingTx.get(tracingId)!.addResult(functionResultEvent);
  }
}
