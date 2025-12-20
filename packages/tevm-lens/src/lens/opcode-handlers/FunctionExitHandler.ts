import { HandlerBase } from './HandlerBase.ts';

import type { InterpreterStep } from 'tevm/evm';
import type { FunctionCallEvent, FunctionResultEvent } from '../tx-tracer/TxTrace.ts';
import type { RuntimeTraceMetadata } from './trace-metadata.ts';

export class FunctionExitHandler extends HandlerBase {
  public async handle(
    stepEvent: InterpreterStep,
    functionCallEvent: FunctionCallEvent,
    functionExits: RuntimeTraceMetadata['functionExits']
  ) {
    // TODO: maybe check executionContext, like in  FunctionEntryHandler
    if (functionCallEvent.callType !== 'INTERNAL') {
      // already decoded by ExternalCallResultHandler
      return undefined;
    }

    const pc = stepEvent.pc;
    const depth = stepEvent.depth;
    if (functionExits.get(depth)?.has(pc)) {
      const functionResultEvent: FunctionResultEvent = {
        type: 'FunctionResultEvent',
        returnValueRaw: '',
        isError: false,
        isCreate: false,
        logs: [],
      };
      // console.log('FunctionResultEvent', functionCallEvent.contractFQN, functionCallEvent.functionName);
      functionExits.get(depth)!.delete(pc);
      return functionResultEvent;
    }

    return undefined;
  }
}
