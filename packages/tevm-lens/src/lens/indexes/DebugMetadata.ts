import { FunctionIndexesRegistry } from './FunctionIndexesRegistry.ts';
import { ArtifactsProvider } from './ArtifactsProvider.ts';
import type { CallSiteIndexesRegistry } from './CallSiteIndexesRegistry.ts';

export class DebugMetadata {
  constructor(
    public readonly artifacts: ArtifactsProvider,
    public readonly functions: FunctionIndexesRegistry,
    public readonly callsites: CallSiteIndexesRegistry
  ) {}
}
