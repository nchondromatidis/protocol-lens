import type { Debugger } from 'debug';
import {
  type FunctionCallEvent,
  isExternalCallEvmEvent,
  isExternalCallResultEvmEvent,
  isInternalFunctionCallEvent,
  isInternalFunctionCallResultEvent,
} from './events/function-call-events.ts';
import { jsonStr } from '../../../_common/debug.ts';

export function debugLogFunctionCallEvents(debug: Debugger, events: FunctionCallEvent[]) {
  if (!debug.enabled) return;

  for (const event of events) {
    if (isInternalFunctionCallEvent(event))
      debug(
        'Created InternalFunctionCallEvent:',
        jsonStr({
          type: event._type,
          contractFQN: event.contractFQN,
          functionName: event.functionName,
          depth: event.opcodeStepEvent.depth,
          entryPc: event.entryPc,
          seqNum: event.opcodeSequenceNum,
        })
      );

    if (isInternalFunctionCallResultEvent(event))
      debug(
        'Created InternalFunctionCallResultEvent:',
        jsonStr({
          type: event._type,
          contractFQN: event.contractFQN,
          functionName: event.functionName,
          depth: event.opcodeStepEvent.depth,
          exitPc: event.exitPc,
          seqNum: event.opcodeSequenceNum,
        })
      );

    if (isExternalCallEvmEvent(event))
      debug(
        'Created ExternalCallEvmEvent:',
        jsonStr({
          type: event._type,
          contractFQN: event.to,
          functionName: 'N/A',
          depth: event.depth,
          pc: 'N/A',
          seqNum: event.opcodeSequenceNum,
        })
      );

    if (isExternalCallResultEvmEvent(event))
      debug(
        'Created ExternalCallResultEvmEvent',
        jsonStr({
          type: event._type,
          contractFQN: 'N/A',
          functionName: 'N/A',
          depth: 'N/A',
          pc: 'N/A',
          seqNum: event.opcodeSequenceNum,
        })
      );
  }
}
