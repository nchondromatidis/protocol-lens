import type { ArtifactMap } from '@defi-notes/protocols/types';
import { isHex } from 'viem';
export type { ArtifactMap, ProtocolArtifact, ProtocolsContractsMapD } from '@defi-notes/protocols/types';
export { default as protocolsContractsMap } from '@defi-notes/protocols/artifacts/protocols-contracts-map.json' with { type: 'json' };

// artifacts
export type ArtifactName = keyof ArtifactMap;
type ContractFQNPattern = `${string}.sol:${string}`;
export type ContractFQN = Extract<ArtifactName, ContractFQNPattern>;

// hex
export type Address = `0x${string}`;
export type Hex = `0x${string}`;

export function safeCastToHex(value: string): Hex {
  if (!isHex(value)) throw new Error(`Invalid hex string: ${value}`);
  return value;
}
