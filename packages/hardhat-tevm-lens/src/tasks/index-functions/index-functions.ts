import type { BuildInfoPair } from './build-info-pairs';
import type { FunctionData, FunctionEntryIndexes } from './types';
import { type ASTDereferencer, astDereferencer, type SrcDecoder, srcDecoder } from 'solidity-ast/utils.js'; // force common.js
import { hardhatConvertFromSourceInputToContractFQN, isNotUndefined, trySync } from '../../utils';
import type { FunctionDefinition } from 'solidity-ast';
import type { CompilerOutputBytecode, SolidityBuildInfoOutput } from 'hardhat/types/solidity';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { debug } from './_debug';

//*************************************** TYPES ***************************************//

// CompilerOutputBytecode types miss functionDebugData
declare module 'hardhat/types/solidity' {
  export interface CompilerOutputBytecode {
    functionDebugData?: {
      [internalFunctionName: string]: {
        entryPoint: number; // Byte offset into the bytecode where the function starts (optional)
        id: number; // AST ID of the function definition or null for compiler-internal functions (optional)
        parameterSlots: number; // Number of EVM stack slots for the function parameters (optional)
        returnSlots: number; // Number of EVM stack slots for the return values (optional)
      };
    };
  }
}

//*************************************** INDEXES ***************************************//

export function createFunctionIndexes(
  buildInfoPair: BuildInfoPair,
  functionEntryIndexes: FunctionEntryIndexes // mutates
) {
  const { buildInfoInput, buildInfoOutput } = buildInfoPair;
  const contracts = buildInfoOutput.output.contracts;
  if (!contracts) return undefined;

  const deref = astDereferencer(buildInfoOutput.output);

  const decodeSrc = srcDecoder(buildInfoInput.input, buildInfoOutput.output);

  for (const [inputSourceName, contractsData] of Object.entries(contracts))
    for (const [contractName, contractData] of Object.entries(contractsData)) {
      const contractFQN = hardhatConvertFromSourceInputToContractFQN(`${inputSourceName}:${contractName}`);
      debug(`Indexing contract: ${contractFQN}`);

      const deployedBytecodeFunctionData = convertToFunctionData(
        contractFQN,
        contractData.evm?.deployedBytecode?.functionDebugData,
        decodeSrc,
        deref
      );

      const bytecodeFunctionData = convertToFunctionData(
        contractFQN,
        contractData.evm?.bytecode?.functionDebugData,
        decodeSrc,
        deref
      );

      if (deployedBytecodeFunctionData) functionEntryIndexes.push(...deployedBytecodeFunctionData);
      if (bytecodeFunctionData) functionEntryIndexes.push(...bytecodeFunctionData);
    }
}

function convertToFunctionData(
  contractFQN: string,
  functionDebugData: CompilerOutputBytecode['functionDebugData'],
  decodeSrc: SrcDecoder,
  deref: ASTDereferencer
) {
  if (!functionDebugData) return undefined;

  return Object.entries(functionDebugData)
    .filter(([functionName]) => functionName.startsWith('@'))
    .map(([_functionName, functionData]) => {
      const result = trySync(() => deref.withSourceUnit('*', functionData.id));
      if (!result.ok) {
        const msg = (result.error as any).message;
        console.warn(`Failed to find ast.id: ${msg}`);
        return undefined;
      }

      const { node } = result.value;
      const { lineStart, lineEnd, source } = getLines(node.src, decodeSrc);

      if (node.nodeType != 'FunctionDefinition') {
        // expected and ignored generated public variable getters
        console.warn(`Ignoring function call from: ast.id ${node.id}, type is ${node.nodeType}`);
        return undefined;
      }

      const functionInterface = toFunctionInterface(node);
      const functionSelector =
        (node.functionSelector ?? (node.visibility === 'external' || node.visibility === 'public'))
          ? toFunctionSelector(toFunctionSignature(node))
          : undefined;

      const newFunctionData: FunctionData = {
        nameOrKind: node.name ? node.name : node.kind,
        name: node.name,
        kind: node.kind,
        visibility: node.visibility,
        stateMutability: node.stateMutability,
        functionInterface,
        functionSelector,
        src: node.src,
        lineStart,
        lineEnd,
        source,
        contractFQN,
        pc: functionData.entryPoint,
        parameterSlots: functionData.parameterSlots,
        returnSlots: functionData.returnSlots,
      };

      return newFunctionData;
    })
    .filter(isNotUndefined);
}

function toFunctionInterface(node: FunctionDefinition | undefined) {
  if (!node) return undefined;

  // Handle function name (constructor/fallback/receive)
  let fnName;
  switch (node.kind) {
    case 'constructor':
      fnName = 'constructor';
      break;
    case 'fallback':
      fnName = 'fallback';
      break;
    case 'receive':
      fnName = 'receive';
      break;
    default:
      fnName = `function ${node.name || ''}`;
  }

  // Parameters
  const params = node.parameters?.parameters || [];
  const paramList = params
    .map((p) => {
      const type = p.typeDescriptions?.typeString || 'unknown';
      const name = p.name ? ` ${p.name}` : '';
      return `${type}${name}`;
    })
    .join(', ');

  // Returns
  const returns = node.returnParameters?.parameters || [];
  const returnList = returns.map((p) => p.typeDescriptions?.typeString || 'unknown').join(', ');
  const returnClause = returns.length ? ` returns (${returnList})` : '';

  // Visibility + state mutability
  const visibility = node.visibility ? ` ${node.visibility}` : '';
  const stateMutability =
    node.stateMutability && node.stateMutability !== 'nonpayable' ? ` ${node.stateMutability}` : '';

  // Assemble the interface
  const signature = `${fnName}(${paramList})${visibility}${stateMutability}${returnClause};`;

  // Clean up spacing
  return signature.replace(/\s+/g, ' ').trim();
}

function toFunctionSignature(node: FunctionDefinition | undefined) {
  if (!node) return undefined;

  const functionName = node.name;
  const functionSignatureParams = node.parameters.parameters
    .map((it) => {
      let paramSignature = it.typeDescriptions.typeString;
      paramSignature += it.storageLocation === 'storage' ? ' ' + it.storageLocation : '';
      return paramSignature;
    })
    .join(',');
  const functionSignature = functionName + '(' + functionSignatureParams + ')';
  if (functionName) return functionSignature;
}

function toFunctionSelector(functionSignature: string | undefined) {
  if (!functionSignature) return undefined;
  const hash = keccak_256(utf8ToBytes(functionSignature));
  return bytesToHex(hash).slice(0, 8);
}

function getLines(location: string, decodeSrc: SrcDecoder) {
  const [start, length, fileIndex] = location.split(':').map(Number);
  const endSrc = `${start + length}:0:${fileIndex}`;
  try {
    const start = decodeSrc({ src: location });
    const end = decodeSrc({ src: endSrc });

    const source1 = start.split(':')[0];
    const source2 = end.split(':')[0];
    if (source1 != source2) throw new Error(`Source does not match: ${start}, ${end}`);

    const source = hardhatConvertFromSourceInputToContractFQN(source1);

    const lineStart = Number(start.split(':')[1]);
    const lineEnd = Number(end.split(':')[1]);

    return { lineStart, lineEnd, source };
  } catch (e: unknown) {
    debug(`Location not found: ${location}: ${e}`);
    return { lineStart: -1, lineEnd: -1, source: '' };
  }
}
