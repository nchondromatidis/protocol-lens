import type { FunctionCallEvent } from '../CallTrace.ts';

export type PC = number;
export type Depth = number;

export type RuntimeTraceMetadata = {
  executionContext: Map<Depth, { functionCallEvent: FunctionCallEvent; isJumpDestReached: boolean }>;
  functionExits: Map<Depth, Map<PC, FunctionCallEvent>>;
};

export function emptyRuntimeTraceMetadata(): RuntimeTraceMetadata {
  return {
    executionContext: new Map(),
    functionExits: new Map(),
  };
}
