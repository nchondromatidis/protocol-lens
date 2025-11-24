import type { FunctionCallTypes, Hex, LensArtifact, LensSourceFunctionIndexes } from '../types/artifact.ts';
import type { Abi } from 'viem';
import { hardhatGetReferencesFQN } from '../../utils/hardhat.ts';

type Bytecode = Hex;
type ContractFQN = string;
type FunctionName = string;
type Source = string;
type Location = { lineStart: number; lineEnd: number; source: string };

export class SupportedContracts {
  protected bytecodeToContractFqnIndex: Map<Bytecode, ContractFQN> = new Map();
  protected contractFqnToArtifactIndex: Map<ContractFQN, LensArtifact> = new Map();

  protected sourceFunctionNameFunctionIndexes: Map<
    Source,
    Map<FunctionName, LensSourceFunctionIndexes[string][number]>
  > = new Map();
  protected sourceFunctionIndexes: Map<Source, LensSourceFunctionIndexes[string]> = new Map();

  // create indexes

  public async registerArtifacts(artifacts: Array<LensArtifact>) {
    artifacts.forEach((it) => {
      const contractFQN = it.sourceName + ':' + it.contractName;
      this.bytecodeToContractFqnIndex.set(it.bytecode, contractFQN);
      this.contractFqnToArtifactIndex.set(contractFQN, it);
    });
  }

  public async registerFunctionIndexes(artifacts: LensSourceFunctionIndexes) {
    for (const [source, functionIndexes] of Object.entries(artifacts)) {
      this.sourceFunctionIndexes.set(source, functionIndexes);
      const sourceFunctionIndexes: Map<FunctionName, LensSourceFunctionIndexes[string][number]> = new Map();
      this.sourceFunctionNameFunctionIndexes.set(source, sourceFunctionIndexes);
      for (const functionIndex of functionIndexes) {
        sourceFunctionIndexes.set(functionIndex.name, functionIndex);
      }
    }
  }

  // query indexes

  public getContractFqnFromCallData(callData: Hex) {
    for (const [bytecode, contractFQN] of this.bytecodeToContractFqnIndex.entries()) {
      if (callData.startsWith(bytecode)) return { bytecode, newContractFQN: contractFQN };
    }
    return { bytecode: undefined, contractFQN: undefined };
  }

  public getArtifactFrom(contractFQN: ContractFQN): LensArtifact | undefined {
    return this.contractFqnToArtifactIndex.get(contractFQN);
  }

  public getArtifactAbi(contractFQN: ContractFQN | undefined): LensArtifact['abi'] | undefined {
    if (!contractFQN) return undefined;
    const contractArtifact = this.getArtifactFrom(contractFQN);
    return contractArtifact?.['abi'];
  }

  public getArtifactsRelatedTo(contractFQN: ContractFQN): {
    contractArtifact: LensArtifact | undefined;
    linkLibraries: { fqn: string | undefined; artifact: LensArtifact | undefined }[];
  } {
    const contractArtifact = this.contractFqnToArtifactIndex.get(contractFQN);
    const linkLibrariesFQNs = hardhatGetReferencesFQN(contractArtifact?.linkReferences);
    const linkLibraries = linkLibrariesFQNs.map((it) => ({
      fqn: it,
      artifact: this.contractFqnToArtifactIndex.get(it),
    }));
    return { contractArtifact, linkLibraries };
  }

  public getAllAbisRelatedTo(contractFQN: ContractFQN | undefined): {
    contractAbi: Abi | undefined;
    linkLibraries: { fqn: string | undefined; abi: Abi | undefined }[];
  } {
    if (!contractFQN) return { contractAbi: undefined, linkLibraries: [] };
    const { contractArtifact, linkLibraries } = this.getArtifactsRelatedTo(contractFQN);
    const linkLibrariesAbis = linkLibraries.map((it) => ({
      fqn: it.fqn,
      abi: it.artifact?.abi,
    }));
    return { contractAbi: contractArtifact?.['abi'], linkLibraries: linkLibrariesAbis };
  }

  public getFunctionCallLocation(
    contractFQN: ContractFQN,
    functionName: string,
    type: FunctionCallTypes
  ): Location | undefined {
    if (functionName !== '') return this.getAbiFunctionNameLocation(contractFQN, functionName);
    if (functionName === '') return this.getAbiTypeLocation(contractFQN, type);
    return undefined;
  }

  public getAbiFunctionNameLocation(contractFQN: ContractFQN, functionName: string): Location | undefined {
    const source = contractFQN.split(':')[0];
    const { lineStart, lineEnd } = this.sourceFunctionNameFunctionIndexes.get(source)?.get(functionName) ?? {};
    return lineStart !== undefined && lineEnd !== undefined ? { lineStart, lineEnd, source } : undefined;
  }

  public getAbiTypeLocation(contractFQN: ContractFQN, type: FunctionCallTypes): Location | undefined {
    const source = contractFQN.split(':')[0];
    const sourceFunctionIndexes = this.sourceFunctionIndexes.get(source) ?? [];
    const functionIndex = sourceFunctionIndexes.find((it) => it.kind === type);
    if (!functionIndex) return undefined;
    return {
      lineStart: functionIndex.lineStart,
      lineEnd: functionIndex.lineEnd,
      source,
    };
  }
}
