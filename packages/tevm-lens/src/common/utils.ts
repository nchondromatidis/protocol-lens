import type { ArtifactMap } from '@defi-notes/protocols/types';

export type Next = () => void;

export type ArtifactName = keyof ArtifactMap;
type ContractFQNPattern = `${string}.sol:${string}`;
export type ContractFQN = Extract<ArtifactName, ContractFQNPattern>;

export type Address = `0x${string}`;
export type Hex = `0x${string}`;

export function randomId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
