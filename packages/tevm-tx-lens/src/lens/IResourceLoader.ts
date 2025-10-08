import type { ContractFQN } from '../common/utils.ts';
import type { ProtocolArtifact } from '@defi-notes/protocols/types';
import type { ProtocolsContractsMapD } from '@defi-notes/protocols/artifacts/protocols-contracts-map.d.ts';

export interface IResourceLoader {
  getArtifact(contractFQN: ContractFQN): Promise<ProtocolArtifact>;
  getArtifacts(contractFQN: ContractFQN[]): Promise<ProtocolArtifact[]>;
  getProtocolContractsFqn(protocolName: keyof ProtocolsContractsMapD): Promise<ContractFQN[]>;
  getProtocolArtifacts(protocolName: keyof ProtocolsContractsMapD): Promise<ProtocolArtifact[]>;
}
