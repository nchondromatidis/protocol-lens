import { HandlerBase } from './HandlerBase.ts';

import type { InterpreterStep } from 'tevm/evm';
import { QueryBy } from '../indexes/FunctionIndexesRegistry.ts';
import type { FunctionCallEvent } from '../tx-tracer/TxTrace.ts';

// Handles JUMPDEST opcode, with PC that is a function entry
export class OpcodesCallHandler extends HandlerBase {
  public async handle(stepEvent: InterpreterStep, parentFunctionCallEvent: FunctionCallEvent) {
    const contractAddress = stepEvent.address.toString();
    const contractFQN = this.addressLabeler.getContractFqnForAddress(contractAddress);
    if (!contractFQN) return undefined;

    if (parentFunctionCallEvent.depth !== stepEvent.depth) return undefined;

    const functionData = this.debugMetadata.functions.getBy(QueryBy.contractFqnAndPC(contractFQN, stepEvent.pc));
    if (!functionData) return undefined;

    const functionCallEvent: FunctionCallEvent = {
      type: 'FunctionCallEvent',
      to: stepEvent.address.toString(),
      from: '0x',
      depth: stepEvent.depth,
      rawData: '0x',
      value: 0n,
      callType: 'INTERNAL',
      precompile: false,
      contractFQN,
      functionName: functionData.name,
      functionType: functionData.kind,
      lineStart: functionData.lineStart,
      lineEnd: functionData.lineEnd,
      source: functionData.source,
    };
    // TODO: continue here
    //  - distinguish internal from external calls
    //    - external call opcodes are fired before the jump, I can ignore them the first time
    //  - save function calls on the correct depth
    console.log(functionCallEvent);
    console.log(stepEvent.stack);
    console.log(parentFunctionCallEvent.functionName); // first this fires then the opcode
    console.log(parentFunctionCallEvent.depth, stepEvent.depth);

    return functionCallEvent;
  }
}
