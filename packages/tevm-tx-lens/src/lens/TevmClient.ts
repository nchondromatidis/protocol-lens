import { createTevmTransport, tevmReady, createClient, tevmContract, tevmDeploy } from 'tevm';
import type { ContractFunctionName, TevmTransport } from 'tevm';
import type { Abi, Address, Account, Client, ContractFunctionArgs, AbiStateMutability } from 'viem';
import type { ContractResult, NewContractEvent, Message } from '@tevm/actions';
import type { InterpreterStep, EvmResult } from '@tevm/evm';

type Next = () => void;

export class TevmClient {
  constructor(public readonly client: Client<TevmTransport>) {}

  static async build(nodeAccount: Account): Promise<TevmClient> {
    const tevmTransport = createTevmTransport({
      miningConfig: { type: 'auto' },
    });
    const client = createClient({
      account: nodeAccount,
      transport: tevmTransport,
    });
    await tevmReady(client);

    return new TevmClient(client);
  }

  async tevmDeploy(params: Parameters<typeof tevmDeploy>[1]) {
    return await tevmDeploy(this.client, params);
  }

  async tevmContract<
    TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi>,
    TArgs extends ContractFunctionArgs<TAbi, AbiStateMutability, TFunctionName>,
  >(
    contract: { abi: TAbi; address: Address },
    functionName: TFunctionName,
    args: TArgs
  ): Promise<ContractResult<TAbi, TFunctionName>> {
    return await tevmContract(this.client, {
      abi: contract.abi,
      to: contract.address,
      functionName,
      args,
      onStep: (_data: InterpreterStep, next: Next) => {
        // console.log('EVM Step:', {
        //   cpc: _data.pc, // Program counter
        //   opcode: _data.opcode, // Current opcode
        //   gasLeft: _data.gasLeft, // Remaining gas
        //   stack: _data.stack, // Stack contents
        //   depth: _data.depth, // Call depth
        //   address: _data.address.toString(), // Call depth
        // });
        next?.();
      },
      onNewContract: (data: NewContractEvent, next?: Next) => {
        console.log('New Contract', {
          address: data.address,
        });
        next?.();
      },
      onBeforeMessage: (data: Message, next?: Next) => {
        console.log('Executing message:', {
          to: data.to?.toString(),
          value: data.value.toString(),
          delegatecall: data.delegatecall,
        });
        next?.();
      },
      onAfterMessage: (data: EvmResult, next?: Next) => {
        console.log('Message result:', {
          gasUsed: data.execResult.executionGasUsed.toString(),
          returnValue: data.execResult.returnValue.toString(),
          error: data.execResult.exceptionError?.error,
        });
        next?.();
      },
    } as never); // TODO: fix casting to never
  }
}
