import type { ProtocolArtifact, ArtifactMap, ContractFQN, ProtocolsContractsMapD } from '../../src/lens/artifact.ts';
import { protocolsContractsMap } from '../../src/lens/artifact.ts' with { type: 'json' };
import { promises as fs } from 'fs';
import type { IResourceLoader } from '../../src/adapters/IResourceLoader.ts';
import * as path from 'node:path';

export class TestResourceLoader implements IResourceLoader {
  constructor(private readonly basePath: string) {}

  async getArtifact<ContractFqnT extends ContractFQN>(contractFQN: ContractFqnT): Promise<ArtifactMap[ContractFqnT]> {
    try {
      const _path = contractFQN.replace(':', '/') + '.json';
      const fullPath = path.join(this.basePath, _path);
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content) as ArtifactMap[ContractFqnT];
    } catch (error) {
      throw new Error(`Failed to load artifact from ${contractFQN}: ${error}`);
    }
  }

  async getArtifactPart<ContractFqnT extends ContractFQN, ArtifactPartT extends keyof ArtifactMap[ContractFqnT]>(
    contractFQN: ContractFqnT,
    artifactPartT: ArtifactPartT
  ): Promise<ArtifactMap[ContractFqnT][ArtifactPartT]> {
    const artifact = await this.getArtifact(contractFQN);
    return artifact[artifactPartT] as ArtifactMap[ContractFqnT][ArtifactPartT];
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
