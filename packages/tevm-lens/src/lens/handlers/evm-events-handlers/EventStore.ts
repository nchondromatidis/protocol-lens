import { type EvmEvent, isEvmResult, isInterpreterStep, isMessage } from '../_events/client-evm-events.ts';
import type { Address, LensFunctionIndex } from '../../types.ts';
import type { ExternalCallEvmEvent, ExternalCallResultEvmEvent, OpcodeStepEvent } from '../_events/lens-evm-events.ts';
import { InvariantError } from '../../../common/errors.ts';
import { isExternalCallOpcode, isJumpDestOpcode, isJumpOpcode } from '../../opcodes';
import { HandlerBase } from '../HandlerBase.ts';
import { bytesToHex } from 'viem';

export type EvmStoreEntry =
  | { evmEvent: OpcodeStepEvent; functionIndex: LensFunctionIndex }
  | { evmEvent: ExternalCallResultEvmEvent | ExternalCallEvmEvent };

export class EventStore extends HandlerBase {
  private evmEvents: Array<EvmStoreEntry> = [];
  private currSequenceNum = 0;
  private delegateCallContractAddress?: Address = undefined;

  store(event: EvmEvent) {
    switch (true) {
      case isMessage(event): {
        const evmEvent: ExternalCallEvmEvent = {
          _type: 'ExternalCallEvmEvent',
          data: bytesToHex(event.data),
          to: event?.to?.toString(),
          caller: event.caller.toString(),
          depth: event.depth,
          value: event.value,
          isCompiled: event.isCompiled,
          salt: event.salt,
          isStatic: event.isStatic,
          delegatecall: event.delegatecall,
          // on delegatecal: callEvent type missing _codeAddress, but implementation has it
          _codeAddress: (event as any)?._codeAddress?.toString() as Address,
        };
        this.delegateCallContractAddress = evmEvent.delegatecall ? evmEvent._codeAddress : undefined;
        this.evmEvents.push({ evmEvent });
        break;
      }
      case isEvmResult(event): {
        const evmEvent: ExternalCallResultEvmEvent = {
          _type: 'ExternalCallResultEvmEvent',
          execResult: {
            returnValue: event.execResult.returnValue,
            exceptionError: event.execResult.exceptionError,
            logs: event.execResult.logs,
          },
          createdAddress: event?.createdAddress?.toString(),
        };
        this.delegateCallContractAddress = undefined;
        this.evmEvents.push({ evmEvent });
        break;
      }
      case isInterpreterStep(event): {
        if (this.isSelectedOpcode(event.opcode.name)) {
          const evmEvent: OpcodeStepEvent = {
            _type: 'OpcodeStep',
            to: event.address.toString(),
            sequenceNum: this.currSequenceNum,
            pc: event.pc,
            name: event.opcode.name,
            stack: event.stack.map((s: bigint) => s.toString(16)),
            depth: event.depth,
          };
          const contractAddress = this.delegateCallContractAddress ?? evmEvent.to;
          const functionIndex = this.debugMetadata.pcLocations.getFunctionIndex(contractAddress, evmEvent.pc);
          if (functionIndex) this.evmEvents.push({ evmEvent, functionIndex });
        }

        this.currSequenceNum++;
        break;
      }
      default:
        throw new InvariantError('Event mapping not supported');
    }
  }

  getEvmEvents(): ReadonlyArray<EvmStoreEntry> {
    return this.evmEvents;
  }

  reset() {
    this.evmEvents = [];
    this.currSequenceNum = 0;
  }

  private isSelectedOpcode(opcodeName: string) {
    return isJumpOpcode(opcodeName) || isJumpDestOpcode(opcodeName) || isExternalCallOpcode(opcodeName);
  }
}
