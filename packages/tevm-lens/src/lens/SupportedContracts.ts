import type { ContractFQN } from '../common/utils.ts';
import { GenericError } from '../common/errors.ts';
import type { ArtifactMap, ProtocolArtifact } from '@defi-notes/protocols/types';

export class SupportedContracts {
  constructor() {}

  protected deployedBytecodeToContractFqnIndex: Map<string, ContractFQN> = new Map();
  protected bytecodeToContractFqnIndex: Map<string, ContractFQN> = new Map();
  protected contractFqnToArtifactIndex: Map<ContractFQN, ProtocolArtifact> = new Map();

  public async registerArtifacts(artifacts: Array<ProtocolArtifact>) {
    artifacts.forEach((it) => {
      const contractFQN = (it.sourceName + ':' + it.contractName) as ContractFQN;
      this.deployedBytecodeToContractFqnIndex.set(it.deployedBytecode, contractFQN);
      this.bytecodeToContractFqnIndex.set(it.bytecode, contractFQN);
      this.contractFqnToArtifactIndex.set(contractFQN, it);
    });
  }

  public async registerContractSources() {}

  public async getContractFqnFromBytecode(bytecode: string) {
    return this.bytecodeToContractFqnIndex.get(bytecode);
  }
  public async getContractFqnFromDeployedBytecode(bytecode: string) {
    return this.deployedBytecodeToContractFqnIndex.get(bytecode);
  }

  public async getArtifactFrom<ContractFqnT extends ContractFQN>(
    contractFQN: ContractFqnT
  ): Promise<ArtifactMap[ContractFqnT]> {
    if (!this.contractFqnToArtifactIndex.has(contractFQN)) {
      throw new GenericError('Contract not supported', { name: contractFQN });
    }
    return this.contractFqnToArtifactIndex.get(contractFQN)! as ArtifactMap[ContractFqnT];
  }
}
