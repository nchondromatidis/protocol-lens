import type { LensArtifact, LensFunctionIndex, LensPcLocationIndex } from '../types.ts';

export interface IResourceLoader {
  getProtocols(): Promise<string[]>;

  getSource(contractFQN: string): Promise<string>;

  getArtifact(contractFQN: string): Promise<LensArtifact>;

  getArtifacts(contractFQN: string[]): Promise<LensArtifact[]>;

  getProtocolContractsFqn(protocolName: string): Promise<string[]>;

  getProtocolArtifacts(protocolName: string): Promise<LensArtifact[]>;

  getFunctionIndexes(protocolName: string): Promise<LensFunctionIndex[]>;

  getPcLocationIndexes(protocolName: string): Promise<LensPcLocationIndex[]>;
}
