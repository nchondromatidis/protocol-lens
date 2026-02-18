import { buildCallTracer } from '@defi-notes/evm-lens/src/lens';
import { HardhatEvmLensHttpRL } from '@defi-notes/evm-lens/src/adapters/resource-loader/HardhatEvmLensHttpRL.ts';

export const ETHER_1 = 1n * 10n ** 18n;

export async function buildLens<T extends object>(resourcesBaseUrl: string, contractsFolder: string) {
  const { lensClient, deployerAccount } = await buildCallTracer<T>();
  const resourceLoader = new HardhatEvmLensHttpRL(resourcesBaseUrl, contractsFolder);
  await lensClient.registerIndexes(resourceLoader, 'uniswap-v2');
  await lensClient.fundAccount(deployerAccount.address, ETHER_1);

  return {
    lensClient,
    resourceLoader,
  };
}
