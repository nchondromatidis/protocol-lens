import type { Address } from 'tevm';
import type { ContractFQN } from '../common/utils.ts';

type DeployedContract = { name: ContractFQN; isDeployedByCA: boolean };

export class DeployedContracts {
  // address -> contract fqn
  public readonly deployedContracts: Map<Address, DeployedContract> = new Map();

  public register(address: Address, contractFQN: ContractFQN, isDeployedByCA = false): void {
    this.deployedContracts.set(address, { name: contractFQN, isDeployedByCA });
  }

  public getContractFrom(address: Address) {
    return this.deployedContracts.get(address);
  }
}
