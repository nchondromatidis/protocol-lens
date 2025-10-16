import type { ArtifactMap, ProtocolArtifact, ProtocolsContractsMapD } from '../lens/artifact.ts';
import type { ContractFQN } from '../lens/artifact.ts';

export interface IResourceLoader {
  getArtifact<ContractFqnT extends ContractFQN>(contractFQN: ContractFqnT): Promise<ArtifactMap[ContractFqnT]>;
  getArtifactPart<ContractFqnT extends ContractFQN, ArtifactPartT extends keyof ArtifactMap[ContractFqnT]>(
    contractFQN: ContractFqnT,
    artifactPart: ArtifactPartT
  ): Promise<ArtifactMap[ContractFqnT][ArtifactPartT]>;
  getArtifacts(contractFQN: ContractFQN[]): Promise<ProtocolArtifact[]>;
  getProtocolContractsFqn(protocolName: keyof ProtocolsContractsMapD): Promise<ContractFQN[]>;
  getProtocolArtifacts(protocolName: keyof ProtocolsContractsMapD): Promise<ProtocolArtifact[]>;
}
