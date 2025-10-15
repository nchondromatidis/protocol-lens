import { type Hex } from '../common/utils.ts';
import { SupportedContracts } from './SupportedContracts.ts';
import { DeployedContracts } from './DeployedContracts.ts';
import type { Message } from 'tevm/actions';
import type { EvmResult } from 'tevm/evm';
import { bytesToHex, decodeFunctionData, toHex } from 'viem';
import { InvariantError } from '../common/errors.ts';
import { type FunctionCallEvent, type FunctionResultEvent, TxTrace } from './TxTrace.ts';

export class Tracer {
  public readonly tracedTx: Map<Hex, TxTrace> = new Map();
  public readonly tracingTx: Map<string, TxTrace> = new Map();

  constructor(
    private readonly supportedContracts: SupportedContracts,
    private readonly deployedContracts: DeployedContracts
  ) {}

  //** Start-Stop tx-tracing **/

  public startTxTrace(tempId: string) {
    const txTrace = new TxTrace();
    this.tracingTx.set(tempId, txTrace);
  }

  public stopTxTrace(txHash: Hex | undefined, tempId: string) {
    if (!txHash) throw new InvariantError('tx hash is empty');
    const currentTxTrace = this.tracingTx.get(tempId);
    if (!currentTxTrace) throw new InvariantError('current tx trace is empty');

    this.tracedTx.set(txHash, currentTxTrace);
  }

  //** Event Handlers **/

  public async handleFunctionCall(event: Message, tempId: string): Promise<void> {
    const tempIdTxTrace = this.getTracingTx(tempId);
    const functionCallEvent: FunctionCallEvent = { ...event, type: 'FunctionCallEvent' };

    // new contract deployment
    if (!event.to) {
      functionCallEvent.isCreate = true;
      const hexBytecode = bytesToHex(event.data);
      const contractFQN = await this.supportedContracts.getContractFqnFromBytecode(hexBytecode);
      if (contractFQN) {
        functionCallEvent.createdContractFQN = contractFQN;
        const contractArtifact = await this.supportedContracts.getArtifactFrom(contractFQN);
        const constructorCode = contractArtifact.bytecode.slice(hexBytecode.length) as Hex;
        if (constructorCode.length === 0) {
          functionCallEvent.constructorArgs = [];
        } else {
          const decodedNew = decodeFunctionData({
            abi: contractArtifact.abi,
            data: constructorCode,
          });
          functionCallEvent.constructorArgs = decodedNew.args;
        }
      }
    }

    // function call/send
    if (event.to) {
      const contractFQN = this.deployedContracts.getContractForAddress(event.to.toString());
      if (contractFQN) {
        const contractArtifact = await this.supportedContracts.getArtifactFrom(contractFQN);
        const decoded = decodeFunctionData({
          abi: contractArtifact.abi,
          data: toHex(event.data),
        });
        functionCallEvent.contractFQN = contractFQN;
        functionCallEvent.functionName = decoded.functionName;
        functionCallEvent.args = decoded.args ?? [];
      }
    }

    tempIdTxTrace.addFunctionCall(functionCallEvent);
  }

  public async handleFunctionResult(event: EvmResult, tempId: string) {
    const tempIdTxTrace = this.getTracingTx(tempId);

    const functionResultEvent: FunctionResultEvent = { ...event, type: 'FunctionResultEvent' };

    // new contract deployment
    if (functionResultEvent.createdAddress) {
      const hexDeployedBytecode = bytesToHex(event.execResult.returnValue);
      // TODO: maybe access function call ande node decode again
      const contractFQN = await this.supportedContracts.getContractFqnFromDeployedBytecode(hexDeployedBytecode);
      if (contractFQN) {
        functionResultEvent.createdContractFQN = contractFQN;
        this.deployedContracts.markContractAddress(functionResultEvent.createdAddress.toString(), contractFQN);
      }
    }

    // function result with error
    if (!functionResultEvent.createdAddress && functionResultEvent.execResult.exceptionError) {
      // decode logs
    }

    // function result without error
    if (!functionResultEvent.createdAddress && !functionResultEvent.execResult.exceptionError) {
      // TODO: continue here
      // decodeFunctionResult({
      //   abi: yourContractAbi,
      //   functionName: 'balanceOf',
      //   data: '0x000000000000000000000000000000000000000000000000000000000000002a', // raw return data
      // });
      // success
    }

    // logs

    tempIdTxTrace.addResult(functionResultEvent);
  }

  private getTracingTx(tempId: string) {
    if (!this.tracingTx.has(tempId)) {
      throw new InvariantError('getTracingTx called without startTxTrace');
    }
    return this.tracingTx.get(tempId)!;
  }
}
