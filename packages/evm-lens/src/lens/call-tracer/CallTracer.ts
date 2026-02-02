import { type ReadOnlyFunctionCallEvent } from './CallTrace.ts';
import { type TxId } from '../types.ts';
import type { EvmEvent } from '../handlers/_events/client-evm-events.ts';
import type { EvmEventsHandler } from '../handlers/EvmEventsHandler.ts';
import type { CallTraceEventsHandler } from '../handlers/CallTraceEventsHandler.ts';
import type { Hex } from 'viem';

export class CallTracer {
  public readonly succeededTxs: Map<TxId, ReadOnlyFunctionCallEvent> = new Map();
  public readonly failedTxs: Map<TxId, ReadOnlyFunctionCallEvent> = new Map();

  constructor(
    private readonly evmEventsHandler: EvmEventsHandler,
    private readonly callTraceEventsHandler: CallTraceEventsHandler
  ) {}

  public async register(event: EvmEvent) {
    await this.evmEventsHandler.register(event);
  }

  public async process() {
    const callTraceEvents = await this.evmEventsHandler.processRegistered();
    for (const callTraceEvent of callTraceEvents) {
      await this.callTraceEventsHandler.route(callTraceEvent);
    }
  }

  public save(txHash: Hex, status: 'success' | 'failed') {
    const callTrace = this.callTraceEventsHandler.getCallTrace();

    if (callTrace && status == 'failed') this.failedTxs.set(txHash, callTrace);
    if (callTrace && status == 'success') this.succeededTxs.set(txHash, callTrace);
  }

  public reset() {
    this.evmEventsHandler.reset();
    this.callTraceEventsHandler.reset();
  }
}
