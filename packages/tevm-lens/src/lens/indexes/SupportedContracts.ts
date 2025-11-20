import { GenericError } from '../../common/errors.js';
import type {
  FunctionCallTypes,
  Hex,
  LensArtifactsMap,
  LensContractFQN,
  LensSourceFunctionIndexes,
} from '../types/artifact.js';

type Bytecode = Hex;
type FunctionName = string;
type Source = string;
type Location = { lineStart: number; lineEnd: number; source: string };

export class SupportedContracts<ArtifactMapT extends LensArtifactsMap<ArtifactMapT>> {
  protected bytecodeToContractFqnIndex: Map<Bytecode, LensContractFQN<ArtifactMapT>> = new Map();
  protected contractFqnToArtifactIndex: Map<
    LensContractFQN<ArtifactMapT>,
    ArtifactMapT[LensContractFQN<ArtifactMapT>]
  > = new Map();

  protected sourceFunctionNameFunctionIndexes: Map<
    Source,
    Map<FunctionName, LensSourceFunctionIndexes[string][number]>
  > = new Map();
  protected sourceFunctionIndexes: Map<Source, LensSourceFunctionIndexes[string]> = new Map();

  // create indexes

  public async registerArtifacts(artifacts: Array<ArtifactMapT[LensContractFQN<ArtifactMapT>]>) {
    artifacts.forEach((it) => {
      const contractFQN = (it.sourceName + ':' + it.contractName) as LensContractFQN<ArtifactMapT>;
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
      if (callData.startsWith(bytecode)) return { bytecode, contractFQN };
    }
    return { bytecode: undefined, contractFQN: undefined };
  }

  public getArtifactFrom<ContractFqnT extends LensContractFQN<ArtifactMapT>>(
    contractFQN: ContractFqnT
  ): ArtifactMapT[ContractFqnT] {
    if (!this.contractFqnToArtifactIndex.has(contractFQN)) {
      throw new GenericError('Contract not supported', { name: contractFQN });
    }
    return this.contractFqnToArtifactIndex.get(contractFQN)! as ArtifactMapT[ContractFqnT];
  }

  public getArtifactPart<
    ContractFqnT extends LensContractFQN<ArtifactMapT>,
    ArtifactPartT extends keyof ArtifactMapT[ContractFqnT],
  >(contractFQN: ContractFqnT, artifactPart: ArtifactPartT): ArtifactMapT[ContractFqnT][ArtifactPartT] {
    const artifact = this.getArtifactFrom(contractFQN);
    return artifact[artifactPart];
  }

  public getFunctionCallLocation(
    contractFQN: LensContractFQN<ArtifactMapT>,
    functionName: string,
    type: FunctionCallTypes
  ) {
    if (functionName !== '') return this.getAbiFunctionNameLocation(contractFQN, functionName);
    if (functionName === '') return this.getAbiTypeLocation(contractFQN, type);
    return undefined;
  }

  public getAbiFunctionNameLocation(
    contractFQN: LensContractFQN<ArtifactMapT>,
    functionName: string
  ): Location | undefined {
    const source = contractFQN.split(':')[0];
    const { lineStart, lineEnd } = this.sourceFunctionNameFunctionIndexes.get(source)?.get(functionName) ?? {};
    return lineStart !== undefined && lineEnd !== undefined ? { lineStart, lineEnd, source } : undefined;
  }

  public getAbiTypeLocation(contractFQN: LensContractFQN<ArtifactMapT>, type: FunctionCallTypes): Location | undefined {
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
