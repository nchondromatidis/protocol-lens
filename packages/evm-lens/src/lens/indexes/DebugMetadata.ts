import { FunctionIndexesRegistry } from './FunctionIndexesRegistry.ts';
import { ArtifactsProvider } from './ArtifactsProvider.ts';
import { PcLocationIndexesRegistry } from './PcLocationIndexesRegistry.ts';
import type { IResourceLoader } from '../_ports/IResourceLoader.ts';

export class DebugMetadata {
  public contractFqnRegistered: string[] = [];

  constructor(
    public readonly artifacts: ArtifactsProvider,
    public readonly functions: FunctionIndexesRegistry,
    public readonly pcLocations: PcLocationIndexesRegistry
  ) {}

  async register(resourceLoader: IResourceLoader, protocolName: string) {
    const artifacts = await resourceLoader.getProtocolArtifacts(protocolName);
    await this.artifacts.register(artifacts);

    const functionIndexes = await resourceLoader.getFunctionIndexes(protocolName);
    await this.functions.register(functionIndexes);

    const pcLocationIndexes = await resourceLoader.getPcLocationIndexes(protocolName);
    await this.pcLocations.register(functionIndexes, pcLocationIndexes);

    const protocolContractFqn = await resourceLoader.getProtocolContractsFqn(protocolName);
    this.contractFqnRegistered.push(...protocolContractFqn);
  }

  reset() {
    this.artifacts.reset();
    this.functions.reset();
    this.pcLocations.reset();

    this.contractFqnRegistered = [];
  }
}
