import type { IResourceLoader } from '@defi-notes/evm-lens/src/lens/_ports/IResourceLoader.ts';
import type { ReadOnlyFunctionCallEvent } from '@defi-notes/evm-lens/src/lens/handlers/FunctionTrace.ts';

export type TraceResultSuccess = {
  resourceLoader: IResourceLoader;
  trace: ReadOnlyFunctionCallEvent;
  contractFqnList: string[];
};
export type TraceResultError = {
  error: string;
};

export type TraceResult = TraceResultSuccess | TraceResultError;
