import { CallTrace } from './CallTrace.ts';
import { type TxId } from './types.ts';
import type { EvmEvent } from './handlers/_events/client-evm-events.ts';
import type { EvmEventsHandler } from './handlers/EvmEventsHandler.ts';
import type { CallTraceEventHandler } from './handlers/CallTraceEventHandler.ts';
import type { Hex } from 'viem';
import type { DeepReadonly } from './_common/type-utils.ts';

export class CallTracer {
  public readonly succeededTxs: Map<TxId, DeepReadonly<CallTrace>> = new Map();
  public readonly failedTxs: Map<TxId, DeepReadonly<CallTrace>> = new Map();

  constructor(
    private readonly evmEventsProcessor: EvmEventsHandler,
    private readonly callTraceEventHandler: CallTraceEventHandler
  ) {}

  public async register(event: EvmEvent) {
    await this.evmEventsProcessor.register(event);
  }

  public async process() {
    const callTraceEvents = await this.evmEventsProcessor.processRegistered();
    for (const callTraceEvent of callTraceEvents) {
      await this.callTraceEventHandler.route(callTraceEvent);
    }
  }
  public save(txHash: Hex, status: 'success' | 'failed') {
    const callTrace = this.callTraceEventHandler.getCallTrace();

    if (status == 'failed') this.failedTxs.set(txHash, callTrace);
    if (status == 'success') this.succeededTxs.set(txHash, callTrace);
  }

  public reset() {
    this.evmEventsProcessor.reset();
    this.callTraceEventHandler.reset();
  }
}
