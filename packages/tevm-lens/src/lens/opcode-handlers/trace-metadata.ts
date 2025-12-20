import type { FunctionCallEvent } from '../tx-tracer/TxTrace.ts';
import type { Address } from '../types/artifact.ts';

export type PC = number;
export type Depth = number;

export type RuntimeTraceMetadata = {
  executionContext: Map<Depth, { functionCallEvent: FunctionCallEvent; isJumpDestReached: boolean }>;
  functionExits: Map<Address, Map<PC, FunctionCallEvent>>;
};

export function emptyRuntimeTraceMetadata(): RuntimeTraceMetadata {
  return {
    executionContext: new Map(),
    functionExits: new Map(),
  };
}
