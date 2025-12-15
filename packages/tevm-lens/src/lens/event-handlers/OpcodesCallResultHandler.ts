import { HandlerBase } from './HandlerBase.ts';

import type { InterpreterStep } from 'tevm/evm';
import type { FunctionCallEvent } from '../tx-tracer/TxTrace.ts';

export class OpcodesCallResultHandler extends HandlerBase {
  public async handle(stepEvent: InterpreterStep, parentFunctionCallEvent: FunctionCallEvent) {
    if (parentFunctionCallEvent.callType === 'INTERNAL') {
      if (parentFunctionCallEvent.depth !== stepEvent.depth) return undefined;
    }
    return undefined;
  }
}
