import { type ContractFunctionName, type TevmTransport } from 'tevm';
import { tevmContract, tevmDeploy } from 'tevm';
import {
  type Abi,
  type AbiStateMutability,
  type Client,
  type ContractConstructorArgs,
  type ContractFunctionArgs,
  getContract,
} from 'viem';
import type { ContractResult, Message } from 'tevm/actions';
import type { EvmResult } from 'tevm/evm';
import type { ArtifactMap } from '@defi-notes/protocols/types';
import { type Address, type ContractFQN, type Hex, type Next, randomId } from '../common/utils.ts';
import { SupportedContracts } from './SupportedContracts.ts';
import { DeployedContracts } from './DeployedContracts.ts';
import { Tracer } from './Tracer.ts';
import { InvariantError } from '../common/errors.ts';

export class LensClient {
  constructor(
    public readonly client: Client<TevmTransport>,
    public readonly supportedContracts: SupportedContracts,
    public readonly deployedContracts: DeployedContracts,
    public readonly tracer: Tracer
  ) {}

  async deploy<ContractFQNT extends ContractFQN>(
    contractFQN: ContractFQNT,
    args: ContractConstructorArgs<ArtifactMap[ContractFQNT]['abi']>
  ) {
    const artifact = await this.supportedContracts.getArtifactFrom(contractFQN);
    const deployResult = await tevmDeploy(this.client, {
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: args as unknown[],
    });
    if (!deployResult.createdAddress) throw new InvariantError('createdAddress missing after deploy');
    this.deployedContracts.markContractAddress(deployResult.createdAddress, contractFQN);
    return deployResult;
  }

  async contract<
    TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi>,
    TArgs extends ContractFunctionArgs<TAbi, AbiStateMutability, TFunctionName>,
  >(
    contract: { abi: TAbi; address: Address },
    functionName: TFunctionName,
    args: TArgs,
    traceTx = true
  ): Promise<ContractResult<TAbi, TFunctionName>> {
    const tempId = randomId();
    if (traceTx) this.tracer.startTxTrace(tempId);
    const deployedResult = await tevmContract(this.client, {
      to: contract.address,
      code: undefined,
      deployedBytecode: undefined,
      abi: contract.abi,
      functionName: functionName,
      args: args,
      onBeforeMessage: async (event: Message, next?: Next) => {
        console.debug('onBeforeMessage:Message', event.to?.toString(), event.depth);
        if (traceTx) await this.tracer.handleFunctionCall(event, tempId);
        next?.();
      },
      onAfterMessage: async (event: EvmResult, next?: Next) => {
        console.log('onAfterMessage:EvmResult', event.execResult.returnValue);
        if (traceTx) await this.tracer.handleFunctionResult(event, tempId);
        next?.();
      },
    });
    if (traceTx) this.tracer.stopTxTrace(deployedResult.txHash, tempId);

    return deployedResult;
  }

  async getContract<ContractFqnT extends ContractFQN>(address: Hex, contractFQN: ContractFqnT) {
    const contractArtifact = await this.supportedContracts.getArtifactFrom(contractFQN);
    return getContract({
      address: address,
      abi: contractArtifact.abi as ArtifactMap[ContractFqnT]['abi'],
      client: this.client,
    });
  }
}
