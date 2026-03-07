import type { ArtifactMap } from '@defi-notes/protocols/*';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { ProtocolWorkflowsBase } from '@/protocols/workflows/ProtocolWorkflowsBase.ts';
import type { IResourceLoader } from '@defi-notes/evm-lens/src/lens/_ports/IResourceLoader.ts';
import { _1e18, USER_0, USER_1 } from '@/protocols/workflows/_constants.ts';
import type { Address } from 'viem';
import type { LensClient } from '@defi-notes/evm-lens/src/lens/LensClient.ts';

export type UniswapV2Artifacts = {
  [K in keyof ArtifactMap as K extends `contracts/uniswap-v2/${string}` ? K : never]: ArtifactMap[K];
};

export class UniswapV2Workflows extends ProtocolWorkflowsBase<UniswapV2Artifacts> {
  static async create(resourceLoader: IResourceLoader) {
    const lensClient = await ProtocolWorkflowsBase.buildLens<UniswapV2Artifacts>(resourceLoader, USER_0);
    const deployment = await this.deploy(lensClient);
    return new UniswapV2Workflows(lensClient, resourceLoader, deployment);
  }

  static async deploy(lensClient: LensClient<UniswapV2Artifacts>) {
    const feeToSetAccount = privateKeyToAccount(generatePrivateKey());

    const factoryDeployResult = await lensClient.deploy(
      'contracts/uniswap-v2/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory',
      [feeToSetAccount.address]
    );

    const wethDeployResult = await lensClient.deploy(
      'contracts/uniswap-v2/v2-periphery/contracts/test/WETH9.sol:WETH9',
      []
    );

    const router2DeployResult = await lensClient.deploy(
      'contracts/uniswap-v2/v2-periphery/contracts/UniswapV2Router02.sol:UniswapV2Router02',
      [factoryDeployResult.createdAddress!, wethDeployResult.createdAddress!]
    );

    const factory = lensClient.getContract(
      factoryDeployResult.createdAddress!,
      'contracts/uniswap-v2/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory'
    );

    const router2 = lensClient.getContract(
      router2DeployResult.createdAddress!,
      'contracts/uniswap-v2/v2-periphery/contracts/UniswapV2Router02.sol:UniswapV2Router02'
    );

    return { factory, router2 };
  }

  constructor(
    protected readonly lensClient: LensClient<UniswapV2Artifacts>,
    protected readonly resourceLoader: IResourceLoader,
    protected readonly deployment: Awaited<ReturnType<(typeof UniswapV2Workflows)['deploy']>>
  ) {
    super(lensClient, resourceLoader);
  }

  async initialLiquidity({
    user = USER_1.address,
    amountADesired = 200n * _1e18,
    amountBDesired = 400n * _1e18,
    traceTx = true,
  } = {}) {
    await this.lensClient.fundAccount(user, _1e18);

    const ercTokenA = await this.deployErc20(USER_0.address, 1_000_000n * _1e18);

    const ercTokenB = await this.deployErc20(USER_0.address, 1_000_000n * _1e18);

    const trace = await this._addLiquidity(
      ercTokenA,
      ercTokenB,
      amountADesired,
      amountBDesired,
      0n,
      0n,
      user,
      this.maxUint256(),
      traceTx
    );

    return { trace, ercTokenA: ercTokenA, ercTokenB: ercTokenB };
  }

  async addLiquidity({
    user = USER_1.address,
    amountADesired = 200n * _1e18,
    amountBDesired = 200n * _1e18,
    amountAMin = 50n * _1e18,
    amountBMin = 50n * _1e18,
  } = {}) {
    const { ercTokenA, ercTokenB } = await this.initialLiquidity({
      user: USER_1.address,
      amountADesired: 200n * _1e18,
      amountBDesired: 400n * _1e18,
    });

    const trace = await this._addLiquidity(
      ercTokenA,
      ercTokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      user,
      this.maxUint256()
    );

    return { trace, ercTokenA, ercTokenB };
  }

  private async _addLiquidity(
    tokenA: any,
    tokenB: any,
    amountADesired: bigint,
    amountBDesired: bigint,
    amountAMin: bigint,
    amountBMin: bigint,
    user: Address,
    deadline: bigint,
    trace = true
  ) {
    const { router2 } = this.deployment;

    await this.transferErc20(tokenA, USER_0.address, user, amountADesired);
    await this.transferErc20(tokenB, USER_0.address, user, amountBDesired);

    await this.approve(tokenA, router2.address, amountADesired, user);
    await this.approve(tokenB, router2.address, amountBDesired, user);

    const result = await this.lensClient.contract(
      router2,
      'addLiquidity',
      [tokenA.address, tokenB.address, amountADesired, amountBDesired, amountAMin, amountBMin, user, deadline],
      user,
      undefined,
      trace
    );

    return this.lensClient.getTracedTx(result);
  }

  // helpers

  private async deployErc20(initialUser: Address, initialSupply: bigint) {
    const ercTokenDeployResult = await this.lensClient.deploy(
      'contracts/uniswap-v2/v2-periphery/contracts/test/ERC20.sol:ERC20',
      [initialSupply],
      [],
      initialUser
    );
    return this.lensClient.getContract(
      ercTokenDeployResult.createdAddress!,
      'contracts/uniswap-v2/v2-periphery/contracts/test/ERC20.sol:ERC20'
    );
  }

  private async transferErc20(erc20: any, fromUser: Address, toUser: Address, amount: bigint) {
    await this.lensClient.contract(erc20, 'transfer', [toUser, amount], fromUser);
  }

  private async approve(erc20: any, spender: `0x${string}`, amount: bigint, caller: Address) {
    await this.lensClient.contract(erc20, 'approve', [spender, amount], caller);
  }
}
