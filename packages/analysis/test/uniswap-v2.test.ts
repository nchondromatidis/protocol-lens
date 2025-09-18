import { expect, test } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {  parseEther } from 'tevm';
import {buildTevmClient} from "../src/adapters/vm";
import {deployUniswapV2} from "../src/adapters/uniswap-v2";

const ETHER_1 = parseEther('1');

test('deploy', async () => {
  // arrange
  const deployerAccount = privateKeyToAccount(generatePrivateKey());
  const feeToSetAccount = privateKeyToAccount(generatePrivateKey());

  const client = await buildTevmClient(deployerAccount);
  await client.setBalance({ address: deployerAccount.address, value: ETHER_1 });
  const {factory} = await deployUniswapV2(client, feeToSetAccount.address)

  // act
  const result = await factory.read.feeToSetter()

  // assert
  expect(result).toEqual(feeToSetAccount.address);
});
