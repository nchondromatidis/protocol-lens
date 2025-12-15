import type { Message } from 'tevm/actions';
import type { EvmResult, InterpreterStep } from 'tevm/evm';
import { InvariantError } from '../../common/errors.ts';
import { TxTrace } from './TxTrace.ts';
import { type Hex } from '../types/artifact.ts';
import { ExternalCallHandler } from '../event-handlers/ExternalCallHandler.ts';
import { ExternalCallResultHandler } from '../event-handlers/ExternalCallResultHandler.ts';
import { OpcodesCallHandler } from '../event-handlers/OpcodesCallHandler.ts';

type TempTxId = string;
type TxId = Hex;

export class TxTracer {
  public readonly tracingTxs: Map<string, TxTrace> = new Map();
  public readonly succeededTxs: Map<TxId, TxTrace> = new Map();
  public readonly failedTxs: Map<TempTxId, TxTrace> = new Map();

  constructor(
    private readonly externalCallHandler: ExternalCallHandler,
    private readonly externalCallResultHandler: ExternalCallResultHandler,
    private readonly opcodesCallHandler: OpcodesCallHandler
  ) {}

  //** Start-Stop tracing **/

  public startTracing(tempId: string) {
    const txTrace = new TxTrace();
    this.tracingTxs.set(tempId, txTrace);
  }

  public stopTracingSuccess(txHash: Hex | undefined, tempId: string) {
    if (!txHash) throw new InvariantError('tx hash is empty');
    const currentTxTrace = this.tracingTxs.get(tempId);
    if (!currentTxTrace) throw new InvariantError('current tx trace is empty');

    this.succeededTxs.set(txHash, currentTxTrace);
    this.tracingTxs.delete(tempId);
    this.externalCallResultHandler.cleanCache(tempId);
  }

  public stopTracingFailed(txHash: string, tempId: string) {
    const currentTxTrace = this.tracingTxs.get(tempId);
    if (!currentTxTrace) throw new InvariantError('current tx trace is empty');

    this.failedTxs.set(txHash, currentTxTrace);
    this.tracingTxs.delete(tempId);
    this.externalCallResultHandler.cleanCache(tempId);
  }

  //** Event Handlers **/

  public async handleExternalCall(callEvent: Message, tempId: string): Promise<void> {
    const tempIdTxTrace = this.getTracingTx(tempId);
    const functionCallEvent = await this.externalCallHandler.handle(callEvent);
    tempIdTxTrace.addFunctionCall(functionCallEvent);
  }

  public async handleExternalCallResult(resultEvent: EvmResult, tempId: string) {
    const tempIdTxTrace = this.getTracingTx(tempId);
    const parentFunctionCallEvent = tempIdTxTrace.getCurrentFunctionCallEvent();
    const functionResultEvent = await this.externalCallResultHandler.handle(
      resultEvent,
      tempId,
      parentFunctionCallEvent
    );
    tempIdTxTrace.addResult(functionResultEvent);
  }

  public async handleInternalCall(stepEvent: InterpreterStep, tempId: string) {
    const tempIdTxTrace = this.getTracingTx(tempId);
    const parentFunctionCallEvent = tempIdTxTrace.getCurrentFunctionCallEvent();
    const newFunctionCallEvent = await this.opcodesCallHandler.handle(stepEvent, parentFunctionCallEvent);
    if (newFunctionCallEvent) tempIdTxTrace.addFunctionCall(newFunctionCallEvent);
  }

  //** Helper Functions **/

  private getTracingTx(tempId: string) {
    if (!this.tracingTxs.has(tempId)) {
      throw new InvariantError('getTracingTx called without startTxTrace');
    }
    return this.tracingTxs.get(tempId)!;
  }
}
