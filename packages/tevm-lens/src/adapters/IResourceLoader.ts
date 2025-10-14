import type { ContractFQN } from '../common/utils.ts';
import type { ProtocolsContractsMapD } from '@defi-notes/protocols/artifacts/protocols-contracts-map.d.ts';
import type { ArtifactMap, ProtocolArtifact } from '@defi-notes/protocols/types';

export interface IResourceLoader {
  getArtifact<ContractFqnT extends ContractFQN>(contractFQN: ContractFqnT): Promise<ArtifactMap[ContractFqnT]>;
  getArtifacts(contractFQN: ContractFQN[]): Promise<ProtocolArtifact[]>;
  getProtocolContractsFqn(protocolName: keyof ProtocolsContractsMapD): Promise<ContractFQN[]>;
  getProtocolArtifacts(protocolName: keyof ProtocolsContractsMapD): Promise<ProtocolArtifact[]>;
}
