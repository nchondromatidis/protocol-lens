import type { ArtifactMap } from '@defi-notes/protocols/*';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { ProtocolWorkflowBaseBase } from '@/workflows/protocols/ProtocolWorkflowBase.ts';
import type { IResourceLoader } from '@defi-notes/evm-lens/src/lens/_ports/IResourceLoader.ts';

export type UniswapV2Artifacts = {
  [K in keyof ArtifactMap as K extends `contracts/uniswap-v2/${string}` ? K : never]: ArtifactMap[K];
};

export class UniswapV2Workflows extends ProtocolWorkflowBaseBase<UniswapV2Artifacts> {
  static async create(resourceLoader: IResourceLoader) {
    const lensClient = await ProtocolWorkflowBaseBase.buildLens<UniswapV2Artifacts>(resourceLoader);
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

    return this.lensClient.getTracedTx(result);
  }

  // helpers
}
