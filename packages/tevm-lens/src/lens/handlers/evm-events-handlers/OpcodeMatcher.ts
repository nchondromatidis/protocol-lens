import { HandlerBase } from '../HandlerBase.ts';
import { isExternalCallEvmEvent, isExternalCallResultEvmEvent } from '../_events/lens-evm-events.ts';
import type { EvmStoreEntry } from './EventStore.ts';
import type { CallTraceEvents } from '../_events/call-trace-events.ts';

export class OpcodeMatcher extends HandlerBase {
  public async match(evmStoreEntries: ReadonlyArray<EvmStoreEntry>): Promise<ReadonlyArray<CallTraceEvents>> {
    const callTraceEvents: Array<CallTraceEvents> = [];
    for (const evmStoreEntry of evmStoreEntries) {
      if (isExternalCallEvmEvent(evmStoreEntry.evmEvent)) callTraceEvents.push(evmStoreEntry.evmEvent);
      if (isExternalCallResultEvmEvent(evmStoreEntry.evmEvent)) callTraceEvents.push(evmStoreEntry.evmEvent);
    }

    return callTraceEvents;
  }

  reset() {}
}
