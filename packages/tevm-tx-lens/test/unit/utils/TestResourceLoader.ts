import type { ContractFQN } from '../../../src/common/utils.ts';
import type { ProtocolArtifact } from '@defi-notes/protocols/types';
import { promises as fs } from 'fs';
import type { IResourceLoader } from '../../../src/lens/IResourceLoader.ts';
import * as path from 'node:path';
import type { ProtocolsContractsMapD } from '@defi-notes/protocols/artifacts/protocols-contracts-map.d.ts';
import protocolsContractsMap from '@defi-notes/protocols/artifacts/protocols-contracts-map.json' assert { type: 'json' };

export class TestResourceLoader implements IResourceLoader {
  constructor(private readonly basePath: string) {}

  async getArtifact(contractFQN: ContractFQN): Promise<ProtocolArtifact> {
    try {
      const _path = contractFQN.replace(':', '/') + '.json';
      const fullPath = path.join(this.basePath, _path);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content) as ProtocolArtifact;
    } catch (error) {
      throw new Error(`Failed to load artifact from ${contractFQN}: ${error}`);
    }
  }

  async getArtifacts(contractFQN: ContractFQN[]): Promise<ProtocolArtifact[]> {
    return Promise.all(contractFQN.map((it) => this.getArtifact(it)));
  }

  async getProtocolContractsFqn(protocolName: keyof ProtocolsContractsMapD): Promise<ContractFQN[]> {
    const protocolContractsMaps = protocolsContractsMap as ProtocolsContractsMapD;
    return protocolContractsMaps[protocolName] as ContractFQN[];
  }

  async getProtocolArtifacts(protocolName: keyof ProtocolsContractsMapD): Promise<ProtocolArtifact[]> {
    const protocolContracts = await this.getProtocolContractsFqn(protocolName);
    return this.getArtifacts(protocolContracts);
  }
}
