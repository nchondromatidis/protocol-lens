import { HandlerBase } from './HandlerBase.ts';

import type { InterpreterStep } from 'tevm/evm';
import type { FunctionCallEvent, FunctionResultEvent } from '../tx-tracer/TxTrace.ts';
import type { RuntimeTraceMetadata } from './trace-metadata.ts';

export class FunctionExitHandler extends HandlerBase {
  public async handle(
    stepEvent: InterpreterStep,
    executionContext: RuntimeTraceMetadata['executionContext'],
    functionCallEvent: FunctionCallEvent,
    functionExits: RuntimeTraceMetadata['functionExits']
  ) {
    if (functionCallEvent.callType !== 'INTERNAL') {
      // already decoded by ExternalCallResultHandler
      return undefined;
    }

    let contractAddress = stepEvent.address.toString();
    const currentDepthExecutionContext = executionContext.get(stepEvent.depth)!;

    if (currentDepthExecutionContext.functionCallEvent.callType === 'DELEGATECALL')
      contractAddress = currentDepthExecutionContext.functionCallEvent.implAddress!;

    const pc = stepEvent.pc;
    if (functionExits.get(contractAddress)?.has(pc)) {
      const functionResultEvent: FunctionResultEvent = {
        type: 'FunctionResultEvent',
        returnValueRaw: '',
        isError: false,
        isCreate: false,
        logs: [],
      };
      functionExits.get(contractAddress)!.delete(pc);
      return functionResultEvent;
    }

    return undefined;
  }
}
