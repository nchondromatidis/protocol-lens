import type { IResourceLoader } from '../../lens/_ports/IResourceLoader.ts';
import type { LensArtifact, LensFunctionIndex, LensPcLocationIndex } from '../../lens/types.ts';

export abstract class BaseHardhatEvmLensRL implements IResourceLoader {
  artifactsUri!: string;
  artifactsContractUri!: string;

  protocolsListFileName = 'protocols-list.json';
  contractFqnListFileName = 'contract-fqn-list.json';
  sourceFunctionIndexFileName = 'function-indexes.json';
  pcLocationsIndexFileName = 'pc-locations-indexes.json';

  abstract getArtifact(contractFQN: string): Promise<LensArtifact>;

  abstract getArtifacts(contractFQN: string[]): Promise<LensArtifact[]>;

  abstract getFunctionIndexes(protocolName: string): Promise<LensFunctionIndex[]>;

  abstract getPcLocationIndexes(protocolName: string): Promise<LensPcLocationIndex[]>;

  abstract getProtocolArtifacts(protocolName: string): Promise<LensArtifact[]>;

  abstract getProtocolContractsFqn(protocolName: string): Promise<string[]>;

  abstract getProtocols(): Promise<string[]>;

  abstract getSource(contractFQN: string): Promise<string>;
}
