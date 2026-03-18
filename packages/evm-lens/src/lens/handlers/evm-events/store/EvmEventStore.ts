import type { Address } from '../../../types.ts';
import {
  type EvmEvent,
  isExternalCallEvmEvent,
  isExternalCallResultEvmEvent,
  isOpcodeStepEvent,
} from '../events/evm-events.ts';
import createDebug from 'debug';
import { DEBUG_PREFIX, jsonStr } from '../../../../_common/debug.ts';
import { InvariantError } from '../../../../_common/errors.ts';
import type { EvmStoreEntry, ExternalCallStoreEntry, OpcodeStoreEntry } from './evm-store-entry.ts';
import { AddressLabeler } from '../../../indexes/AddressLabeler.ts';
import { PcLocationIndexesRegistry } from '../../../indexes/PcLocationIndexesRegistry.ts';

const debug = createDebug(`${DEBUG_PREFIX}:EvmEventStore`);

export class EvmEventStore {
  constructor(
    private readonly pcLocations: PcLocationIndexesRegistry,
    private readonly addressLabeler: AddressLabeler
  ) {}

  private evmEvents: Array<EvmStoreEntry> = [];
  private delegateCallContractAddress?: Address = undefined;

  store(evmEvent: EvmEvent) {
    switch (true) {
      case isExternalCallEvmEvent(evmEvent): {
        this.delegateCallContractAddress = evmEvent.delegatecall ? evmEvent._codeAddress : undefined;
        const event: ExternalCallStoreEntry = { _type: 'ExternalCall', evmEvent };

        this.evmEvents.push(event);
        // debugLogEvmEvents(debug, event);

        break;
      }
      case isExternalCallResultEvmEvent(evmEvent): {
        this.delegateCallContractAddress = undefined;
        const event: ExternalCallStoreEntry = { _type: 'ExternalCall', evmEvent };

        this.evmEvents.push(event);
        // debugLogEvmEvents(debug, event);

        break;
      }
      case isOpcodeStepEvent(evmEvent): {
        const contractAddress = this.delegateCallContractAddress ?? evmEvent.to;
        const contractFQN = this.addressLabeler.getContractFqnForAddress(contractAddress);
        if (!contractFQN) {
          debug('ContractFQN not found for event, skipping...', { pc: evmEvent.pc });
          break;
        }

        const functionIndex = this.pcLocations.getFunctionIndex(contractFQN, evmEvent.pc);
        const pcLocationIndex = this.pcLocations.getPcLocationIndex(contractFQN, evmEvent.pc);

        if (functionIndex && pcLocationIndex) {
          const event: OpcodeStoreEntry = { _type: 'Opcode', evmEvent, functionIndex, pcLocationIndex };
          this.evmEvents.push(event);
          debug('Stored opcode event:', jsonStr(event));
        }

        // debug('functionIndex or pcLocationIndex not found for event, skipping...', { pc: evmEvent.pc });

        break;
      }
      default:
        throw new InvariantError('Event mapping not supported', evmEvent);
    }
  }

  getEvmEvents(): ReadonlyArray<EvmStoreEntry> {
    return this.evmEvents;
  }

  reset() {
    this.evmEvents = [];
  }
}
