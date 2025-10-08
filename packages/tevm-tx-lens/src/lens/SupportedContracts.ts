import type { ContractFQN, Option } from '../common/utils.ts';
import { GenericError } from '../common/errors.ts';
import type { ProtocolArtifact } from '@defi-notes/protocols/types';

export class SupportedContracts {
  constructor() {}

  protected bytecodeToContractFqnIndex: Map<string, ContractFQN> = new Map();
  protected contractFqnToArtifactIndex: Map<ContractFQN, ProtocolArtifact> = new Map();

  public async register(artifacts: Array<ProtocolArtifact>) {
    artifacts.forEach((it) => {
      const contractFQN = (it.sourceName + ':' + it.contractName) as ContractFQN;
      this.bytecodeToContractFqnIndex.set(it.deployedBytecode, contractFQN);
      this.contractFqnToArtifactIndex.set(contractFQN, it as ProtocolArtifact);
    });
  }

  public getContractFqnFrom(bytecode: string): Option<ContractFQN> {
    return this.bytecodeToContractFqnIndex.get(bytecode);
  }

  public async getContractArtifact(contractFQN: ContractFQN) {
    if (this.contractFqnToArtifactIndex.has(contractFQN)) {
      return this.contractFqnToArtifactIndex.get(contractFQN)!;
    }
    throw new GenericError('Contract not supported', { name: contractFQN });
  }
}
