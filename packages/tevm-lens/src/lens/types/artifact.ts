import { type Abi, isHex } from 'viem';

// hex types
export type Address = `0x${string}`;
export type Hex = `0x${string}`;

export function safeCastToHex(value: string): Hex {
  if (!isHex(value)) throw new Error(`Invalid hex string: ${value}`);
  return value;
}

// Artifact schema
export type LensArtifact = {
  readonly contractName: string;
  readonly sourceName: string;
  readonly abi: Abi;
  readonly bytecode: Hex;
  readonly deployedBytecode: Hex;
  readonly linkReferences: Record<string, Record<string, unknown>>;
};

export type LensProjects = string;

// Object must be:
// - values satisfy LensArtifact type
// - key formated as `LensArtifact['sourceName']:LensArtifact['contractName']`
// - `LensArtifact['sourceName']` formated as  `${RootT}/${ProjectT}/contracts/`
export type LensArtifactsMap<
  ArtifactMapT extends object,
  ProjectsT extends LensProjects,
  ProjectT extends ProjectsT,
  RootT extends string,
> = {
  [K in keyof ArtifactMapT as ArtifactMapT[K] extends LensArtifact
    ? K extends `${ArtifactMapT[K]['sourceName']}:${ArtifactMapT[K]['contractName']}`
      ? ArtifactMapT[K]['sourceName'] extends `${RootT}/${ProjectT}/${string}`
        ? K
        : never
      : never
    : never]: Extract<ArtifactMapT[K], LensArtifact>;
};

export type FunctionCallTypes = 'function' | 'constructor' | 'fallback' | 'receive' | 'freeFunction';

export type RawLog = [address: Hex, topics: Hex[], data: Hex];

// function index
export type LensFunctionIndex = {
  nameOrKind: string;
  name: string;
  kind: FunctionCallTypes;
  selector: string | undefined;
  humanReadableABI: string | undefined;
  functionLineStart: number;
  functionLineEnd: number;
  source: string;
  contractFQN: string;
  jumpDestPc: number;
  visibility: 'external' | 'public' | 'internal' | 'private';
  parameterSlots: number;
  returnSlots: number;
  linearizationOrderNumber: number;
};
export type LensSourceFunctionIndexes = Array<LensFunctionIndex>;

// opcodes index
export type LensCallSiteIndex = {
  callSitePc: number;
  jumpDestPc: number;
  callSiteLineStart: number;
  callSiteLineEnd: number;
  source: string;
  contractFQN: string;
};
