import {
  type Abi,
  AbiFunctionSignatureNotFoundError,
  decodeFunctionData,
  type DecodeFunctionResultParameters,
  decodeFunctionResult,
  AbiFunctionNotFoundError,
  decodeAbiParameters,
} from 'viem';
import { InvariantError } from '../../../common/errors.js';
import type { FunctionCallTypes, Hex } from '../../types/artifact.js';
import { trySync } from '../../../common/utils.js';

// Function Data

type DecodeFunctionCallParameters<AbiT extends Abi> = {
  abi: AbiT;
  data: Hex;
  value?: bigint;
  createdBytecode?: Hex;
};

type DecodedFunctionResult = {
  functionName: string;
  type: FunctionCallTypes;
  args: unknown;
};

export function decodeFunctionCall<const AbiT extends Abi>(
  parameters: DecodeFunctionCallParameters<AbiT>
): DecodedFunctionResult | undefined {
  const { abi, data, value, createdBytecode } = parameters;
  // constructor: data = contract bytecode + encoded constructor args
  if (createdBytecode) {
    const constructorArgsEncoded = ('0x' + data.slice(createdBytecode.length)) as Hex;
    const description = abi.find((x) => x.type === 'constructor');
    if (!description) throw new InvariantError('constructor not found', { parameters });
    return {
      functionName: '',
      type: 'constructor',
      args: ('inputs' in description && description.inputs && description.inputs.length > 0
        ? decodeAbiParameters(description.inputs, constructorArgsEncoded)
        : undefined) as readonly unknown[] | undefined,
    };
  }

  // function: : function selector + encoded function args
  const decodeFunctionDataResult = trySync(() => decodeFunctionData(parameters));
  if (decodeFunctionDataResult.ok) {
    return {
      functionName: decodeFunctionDataResult.value.functionName,
      type: 'function',
      args: decodeFunctionDataResult.value.args,
    };
  }
  if (!decodeFunctionDataResult.ok && !(decodeFunctionDataResult.error instanceof AbiFunctionSignatureNotFoundError)) {
    throw decodeFunctionDataResult.error;
  }

  // fallback/receive: function selector failed to match
  const receive = abi.find((x) => x.type === 'receive');
  const fallback = abi.find((x) => x.type === 'fallback');

  const hasData = data.length !== 0;
  const hasValue = value !== undefined;
  const hasReceive = receive !== undefined;
  const hasFallbackPayable = fallback !== undefined && fallback.stateMutability === 'payable';
  const hasFallbackNonPayable = fallback !== undefined && fallback.stateMutability === 'nonpayable';

  const calledFunction = getCalledFunction(hasData, hasValue, hasFallbackPayable, hasFallbackNonPayable, hasReceive);
  if (calledFunction === 'fallback' && fallback !== undefined) {
    return { functionName: '', type: 'fallback', args: [] };
  }
  if (calledFunction === 'receive' && receive !== undefined) {
    return { functionName: '', type: 'receive', args: [] };
  }

  return undefined;
}

function getCalledFunction(
  hasData: boolean,
  hasValue: boolean,
  hasFallbackPayable: boolean,
  hasFallbackNonPayable: boolean,
  hasReceive: boolean
): 'fallback' | 'receive' | 'revert' {
  if (hasData) {
    return hasFallbackPayable || hasFallbackNonPayable ? 'fallback' : 'revert';
  }
  if (hasValue) {
    if (hasReceive) return 'receive';
    if (hasFallbackPayable) return 'fallback';
    return 'revert';
  }
  if (hasFallbackPayable || hasFallbackNonPayable) return 'fallback';
  return 'revert';
}

// Result Data

// TODO: change to decode all kinds
export function decodeFunctionResultComplete(
  parameters: Parameters<typeof decodeFunctionResult>[0]
): ReturnType<typeof decodeFunctionResult> | undefined {
  try {
    return decodeFunctionResult(parameters);
  } catch (error: unknown) {
    if (error instanceof AbiFunctionNotFoundError) {
      const { functionName } = parameters as DecodeFunctionResultParameters;
      if (functionName === 'revert') return undefined;
      if (functionName === 'fallback') return undefined;
    }
    throw new InvariantError('Error: decodeFunctionResult:', { parameters, error });
  }
}
