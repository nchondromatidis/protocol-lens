import { GenericError } from '../common/errors.ts';
import type { ContractFQN, ArtifactMap, ProtocolArtifact } from './artifact.ts';

export class SupportedContracts {
  constructor() {}

  protected bytecodeToContractFqnIndex: Map<string, ContractFQN> = new Map();
  protected contractFqnToArtifactIndex: Map<ContractFQN, ProtocolArtifact> = new Map();

  public async registerArtifacts(artifacts: Array<ProtocolArtifact>) {
    artifacts.forEach((it) => {
      const contractFQN = (it.sourceName + ':' + it.contractName) as ContractFQN;
      this.bytecodeToContractFqnIndex.set(it.bytecode, contractFQN);
      this.contractFqnToArtifactIndex.set(contractFQN, it);
    });
  }

  public async registerContractSources() {}

  public async getContractFqnFromBytecode(bytecode: string) {
    return this.bytecodeToContractFqnIndex.get(bytecode);
  }

  public async getArtifactFrom<ContractFqnT extends ContractFQN>(
    contractFQN: ContractFqnT
  ): Promise<ArtifactMap[ContractFqnT]> {
    if (!this.contractFqnToArtifactIndex.has(contractFQN)) {
      throw new GenericError('Contract not supported', { name: contractFQN });
    }
    return this.contractFqnToArtifactIndex.get(contractFQN)! as ArtifactMap[ContractFqnT];
  }

  public async getArtifactPart<ContractFqnT extends ContractFQN, ArtifactPartT extends keyof ArtifactMap[ContractFqnT]>(
    contractFQN: ContractFqnT,
    artifactPart: ArtifactPartT
  ): Promise<ArtifactMap[ContractFqnT][ArtifactPartT]> {
    const artifact = await this.getArtifactFrom(contractFQN);
    return artifact[artifactPart];
  }
}
