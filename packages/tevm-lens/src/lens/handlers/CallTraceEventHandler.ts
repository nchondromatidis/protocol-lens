import { ExternalCallHandler } from './call-trace-event-handlers/ExternalCallHandler.ts';
import { ExternalCallResultHandler } from './call-trace-event-handlers/ExternalCallResultHandler.ts';
import { FunctionEntryHandler } from './call-trace-event-handlers/FunctionEntryHandler.ts';
import { FunctionExitHandler } from './call-trace-event-handlers/FunctionExitHandler.ts';
import { CallTrace } from '../CallTrace.ts';
import { emptyRuntimeTraceMetadata, type RuntimeTraceMetadata } from './trace-metadata.ts';
import { InvariantError } from '../../common/errors.ts';
import {
  type ExternalCallEvmEvent,
  type ExternalCallResultEvmEvent,
  isExternalCallEvmEvent,
  isExternalCallResultEvmEvent,
  type LensEvmEvent,
} from './_events/lens-evm-events.ts';
import type { DeepReadonly } from '../../common/utils.ts';

export class CallTraceEventHandler {
  private callTrace: CallTrace;
  private runtimeTraceMetadata: RuntimeTraceMetadata;

  constructor(
    private readonly externalCallHandler: ExternalCallHandler,
    private readonly externalCallResultHandler: ExternalCallResultHandler,
    private readonly functionEntryHandler: FunctionEntryHandler,
    private readonly functionExitHandler: FunctionExitHandler
  ) {
    this.callTrace = new CallTrace();
    this.runtimeTraceMetadata = emptyRuntimeTraceMetadata();
  }

  public getCallTrace(): DeepReadonly<CallTrace> {
    return this.callTrace;
  }

  public reset() {
    this.callTrace = new CallTrace();
    this.runtimeTraceMetadata = emptyRuntimeTraceMetadata();
    this.externalCallResultHandler.reset();
  }

  //** Route **/

  public async route(event: LensEvmEvent) {
    switch (true) {
      case isExternalCallEvmEvent(event): {
        await this.handleExternalCall(event);
        break;
      }
      case isExternalCallResultEvmEvent(event): {
        await this.handleExternalCallResult(event);
        break;
      }
      default:
        throw new InvariantError('Missing routing entry for event type');
    }
  }

  //** Event Handlers **/

  private async handleExternalCall(callEvent: ExternalCallEvmEvent): Promise<void> {
    const functionCallEvent = await this.externalCallHandler.handle(callEvent);

    this.callTrace.addFunctionCall(functionCallEvent);

    this.runtimeTraceMetadata.executionContext.set(functionCallEvent.depth, {
      functionCallEvent,
      isJumpDestReached: false,
    });
  }

  private async handleExternalCallResult(resultEvent: ExternalCallResultEvmEvent) {
    const functionCallEvent = this.callTrace.getLatestFunctionCallEvent();
    if (!functionCallEvent) throw new InvariantError('handleExternalCallResult without call registered');
    const functionResultEvent = await this.externalCallResultHandler.handle(resultEvent, functionCallEvent);

    this.callTrace.addResult(functionResultEvent);
    this.runtimeTraceMetadata.executionContext.delete(functionCallEvent.depth);
  }

  // private async handleFunctionEntryHandler(stepEvent: OpcodeStepEvent, tracingId: string) {
  //   const parentFunctionCallEvent = this.tracingTx.get(tracingId)!.getLatestFunctionCallEvent();
  //   if (!parentFunctionCallEvent) {
  //     throw new InvariantError('handleFunctionEntryHandler called before external call handers');
  //   }
  //   const executionContext = this.runtimeTraceMetadata.get(tracingId)!.executionContext;
  //
  //   const result = await this.functionEntryHandler.handle(stepEvent, executionContext, parentFunctionCallEvent);
  //
  //   if (!result) return;
  //
  //   const { functionCallEvent, functionExitPc } = result;
  //
  //   if (functionCallEvent !== executionContext.get(stepEvent.depth)!.functionCallEvent) {
  //     this.tracingTx.get(tracingId)!.addFunctionCall(functionCallEvent);
  //   }
  //
  //   const depth = stepEvent.depth;
  //   if (!this.runtimeTraceMetadata.get(tracingId)!.functionExits.has(depth)) {
  //     this.runtimeTraceMetadata.get(tracingId)!.functionExits.set(depth, new Map());
  //   }
  //   this.runtimeTraceMetadata.get(tracingId)!.functionExits.get(depth)!.set(functionExitPc, functionCallEvent);
  // }
  //
  // private async handleFunctionExitHandler(stepEvent: OpcodeStepEvent, tracingId: string) {
  //   const functionCallEvent = this.tracingTx.get(tracingId)!.getLatestFunctionCallEvent()!;
  //   const functionExits = this.runtimeTraceMetadata.get(tracingId)!.functionExits;
  //
  //   const functionResultEvent = await this.functionExitHandler.handle(stepEvent, functionCallEvent, functionExits);
  //
  //   if (functionResultEvent) this.tracingTx.get(tracingId)!.addResult(functionResultEvent);
  // }
}
