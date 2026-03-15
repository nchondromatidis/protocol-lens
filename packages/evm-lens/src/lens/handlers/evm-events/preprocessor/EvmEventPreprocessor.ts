import { EventsHandlerBase } from '../../EventsHandlerBase.ts';
import { isExternalCallEvmEvent, isExternalCallResultEvmEvent } from '../events/evm-events.ts';
import type { EvmStoreEntry } from '../EvmEventStore.ts';
import type { FunctionCallEvent } from '../../function-call-events/events/function-call-events.ts';
import { generateFunctionCallEventsFromMatchedJumpOpcodes, matchJumpOpcodes } from './match-jump-opcodes.ts';

export class EvmEventPreprocessor extends EventsHandlerBase {
  public async matchFunctionCallOpcodeSequence(
    evmStoreEntries: ReadonlyArray<EvmStoreEntry>
  ): Promise<ReadonlyArray<FunctionCallEvent>> {
    const callTraceEvents: Array<FunctionCallEvent> = [];
    for (const evmStoreEntry of evmStoreEntries) {
      if (isExternalCallEvmEvent(evmStoreEntry.evmEvent)) callTraceEvents.push(evmStoreEntry.evmEvent);
      if (isExternalCallResultEvmEvent(evmStoreEntry.evmEvent)) callTraceEvents.push(evmStoreEntry.evmEvent);
    }
    const opcodeStepEvents = evmStoreEntries.filter((it) => it._type == 'Opcode');
    const matchedJumpsPerDepth = matchJumpOpcodes(opcodeStepEvents);
    const functionCallEvents = generateFunctionCallEventsFromMatchedJumpOpcodes(opcodeStepEvents, matchedJumpsPerDepth);

    callTraceEvents.push(...functionCallEvents);
    callTraceEvents.sort((a, b) => a.opcodeSequenceNum - b.opcodeSequenceNum);

    return callTraceEvents;
  }

  reset() {}
}
