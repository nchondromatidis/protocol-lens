import type { LensArtifact, LensFunctionIndex, LensPcLocationIndex } from '../../lens/types.ts';
import { BaseHardhatEvmLensRL } from './BaseHardhatEvmLensRL.ts';

export class HardhatEvmLensHttpRL extends BaseHardhatEvmLensRL {
  constructor(
    protected resourcesUri: string,
    contractsFolder: string
  ) {
    super();
    this.artifactsUri = `${this.resourcesUri}/artifacts`;
    this.artifactsContractUri = `${this.artifactsUri}/${contractsFolder}`;
  }

  async getProtocols(): Promise<string[]> {
    const protocolsListUrl = `${this.artifactsUri}/${this.protocolsListFileName}`;
    return await this.fetchJson<string[]>(protocolsListUrl);
  }

  async getSource(contractFqnOrUserSource: string): Promise<string> {
    const userSourceFileName = contractFqnOrUserSource.split(':')[0];
    const userSourceUrl = `${this.resourcesUri}/${userSourceFileName}`;
    return await this.fetchText(userSourceUrl);
  }

  async getArtifact(contractFQN: string): Promise<LensArtifact> {
    const _path = contractFQN.replace(':', '/') + '.json';
    const fullUrl = `${this.artifactsUri}/${_path}`;
    return await this.fetchJson<LensArtifact>(fullUrl);
  }

  async getArtifacts(contractFQN: string[]): Promise<LensArtifact[]> {
    return Promise.all(contractFQN.map((it) => this.getArtifact(it)));
  }

  async getProtocolContractsFqn(protocolName: string): Promise<string[]> {
    const protocolListUrl = `${this.artifactsContractUri}/${protocolName}/${this.contractFqnListFileName}`;
    return await this.fetchJson<string[]>(protocolListUrl);
  }

  async getProtocolArtifacts(protocolName: string): Promise<LensArtifact[]> {
    const protocolContracts = await this.getProtocolContractsFqn(protocolName);
    return this.getArtifacts(protocolContracts);
  }

  async getFunctionIndexes(protocolName: string): Promise<LensFunctionIndex[]> {
    const sourceFunctionIndexUrl = `${this.artifactsContractUri}/${protocolName}/${this.sourceFunctionIndexFileName}`;
    return await this.fetchJson<LensFunctionIndex[]>(sourceFunctionIndexUrl);
  }

  async getPcLocationIndexes(protocolName: string): Promise<LensPcLocationIndex[]> {
    const pcLocationsIndexUrl = `${this.artifactsContractUri}/${protocolName}/${this.pcLocationsIndexFileName}`;
    return await this.fetchJson<LensPcLocationIndex[]>(pcLocationsIndexUrl);
  }

  // helper functions

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - Failed to fetch ${url}`);
    }
    return (await response.json()) as T;
  }

  private async fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - Failed to fetch ${url}`);
    }
    return await response.text();
  }
}
