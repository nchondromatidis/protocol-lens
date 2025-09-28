import { type Abi, type Hex, type Address, getContract } from 'viem';
import UniswapV2Factory from '@defi-notes/protocols/artifacts/contracts/v2-core/contracts/UniswapV2Factory.sol/UniswapV2Factory.json';
import WETH9 from '@defi-notes/protocols/artifacts/contracts/v2-periphery/contracts/test/WETH9.sol/WETH9.json';
import UniswapV2Router02 from '@defi-notes/protocols/artifacts/contracts/v2-periphery/contracts/UniswapV2Router02.sol/UniswapV2Router02.json';
import { iUniswapV2FactoryAbi } from '@defi-notes/protocols/artifacts/types/v2-core/contracts.ts';
import { iUniswapV2Router02Abi } from '@defi-notes/protocols/artifacts/types/v2-periphery/contracts.ts';
import type { TevmClient } from '../../src/lens/TevmClient.ts';

export async function deployUniswapV2(client: TevmClient, feeToSetAddress: Address) {
  const factoryDeployResult = await client.tevmDeploy({
    abi: UniswapV2Factory.abi as Abi,
    bytecode: UniswapV2Factory.bytecode as Hex,
    args: [feeToSetAddress],
  });

  const wethDeployResult = await client.tevmDeploy({
    abi: WETH9.abi as Abi,
    bytecode: WETH9.bytecode as Hex,
  });

  const routerDeployResult = await client.tevmDeploy({
    abi: UniswapV2Router02.abi as Abi,
    bytecode: UniswapV2Router02.bytecode as Hex,
    args: [factoryDeployResult.createdAddress, wethDeployResult.createdAddress],
  });

  const factory = getContract({
    address: factoryDeployResult.createdAddress!,
    abi: iUniswapV2FactoryAbi,
    client: client.client,
  });

  const router = getContract({
    address: routerDeployResult.createdAddress!,
    abi: iUniswapV2Router02Abi,
    client: client.client,
  });

  return {
    factory,
    router,
  };
}
