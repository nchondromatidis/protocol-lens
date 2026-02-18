import type { ArtifactMap } from '@defi-notes/protocols/artifacts';
import { buildLens } from '@/workflows/_common.ts';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import type { LensClient } from '@defi-notes/evm-lens/src/lens/LensClient.ts';
import type { IResourceLoader } from '@defi-notes/evm-lens/src/lens/_ports/IResourceLoader.ts';
import type { ReadOnlyFunctionCallEvent } from '@defi-notes/evm-lens/src/lens/call-tracer/CallTrace.ts';
import type { TraceResult } from '@defi-notes/evm-lens-ui';

export type UniswapV2Artifacts = {
  [K in keyof ArtifactMap as K extends `contracts/uniswap-v2/${string}` ? K : never]: ArtifactMap[K];
};

export class UniswapV2Workflows {
  private protocolsFqnListCache: string[] | undefined;

  constructor(
    private readonly lensClient: LensClient<UniswapV2Artifacts>,
    protected resourceLoader: IResourceLoader
  ) {}

  static async create(resourcesBaseUrl: string, contractsFolder: string) {
    const { lensClient, resourceLoader } = await buildLens<UniswapV2Artifacts>(resourcesBaseUrl, contractsFolder);
    return new UniswapV2Workflows(lensClient, resourceLoader);
  }

  async deploy() {
    const feeToSetAccount = privateKeyToAccount(generatePrivateKey());

    const factoryDeployResult = await this.lensClient.deploy(
      'contracts/uniswap-v2/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory',
      [feeToSetAccount.address]
    );
    await this.lensClient.deploy('contracts/uniswap-v2/v2-periphery/contracts/test/WETH9.sol:WETH9', []);

    const factory = this.lensClient.getContract(
      factoryDeployResult.createdAddress!,
      'contracts/uniswap-v2/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory'
    );

    return { factory };
  }

  async createPair() {
    const { factory } = await this.deploy();

    const ercToken1 = await this.lensClient.deploy(
      'contracts/uniswap-v2/v2-core/contracts/UniswapV2ERC20.sol:UniswapV2ERC20',
      []
    );
    const ercToken2 = await this.lensClient.deploy(
      'contracts/uniswap-v2/v2-core/contracts/UniswapV2ERC20.sol:UniswapV2ERC20',
      []
    );

    const result = await this.lensClient.contract(factory, 'createPair', [
      ercToken1.createdAddress!,
      ercToken2.createdAddress!,
    ]);

    const trace = this.lensClient.getSucceeded(result)!;

    return this.toTraceResult(trace);
  }

  // helpers

  async getProjectFiles() {
    if (!this.protocolsFqnListCache) {
      this.protocolsFqnListCache = await this.resourceLoader.getProtocolContractsFqn('uniswap-v2');
    }
    return this.protocolsFqnListCache;
  }

  async toTraceResult(trace: ReadOnlyFunctionCallEvent): Promise<TraceResult> {
    return { resourceLoader: this.resourceLoader, trace, contractFqnList: await this.getProjectFiles() };
  }
}
