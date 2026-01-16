import type { Address, Hex } from '../../types.ts';

export type ExternalCallEvmEvent = {
  _type: 'ExternalCallEvmEvent';
  data: Hex;
  to?: Address;
  caller: Address;
  depth: number;
  value: bigint;
  isCompiled: boolean;
  salt?: Uint8Array;
  isStatic: boolean;
  delegatecall: boolean;
  _codeAddress?: Address;
};

export type ExternalCallResultEvmEvent = {
  _type: 'ExternalCallResultEvmEvent';
  execResult: {
    returnValue: Uint8Array;
    exceptionError?: any;
    logs?: Array<[Uint8Array, Uint8Array[], Uint8Array]>;
  };
  createdAddress?: Address;
};

export type OpcodeStepEvent = {
  _type: 'OpcodeStep';
  to: Address;
  sequenceNum: number;
  pc: number;
  name: string;
  stack: string[];
  depth: number;
};

export type LensEvmEvent = ExternalCallEvmEvent | ExternalCallResultEvmEvent | OpcodeStepEvent;

export function isExternalCallEvmEvent(event: LensEvmEvent): event is ExternalCallEvmEvent {
  return event._type === 'ExternalCallEvmEvent';
}

export function isExternalCallResultEvmEvent(event: LensEvmEvent): event is ExternalCallResultEvmEvent {
  return event._type === 'ExternalCallResultEvmEvent';
}

export function isOpcodeStepEvent(event: LensEvmEvent): event is OpcodeStepEvent {
  return event._type === 'OpcodeStep';
}
