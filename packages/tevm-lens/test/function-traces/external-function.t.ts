import { test, beforeEach, describe } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { tevmSetAccount } from 'tevm';
import { LensClient } from '../../src/lens/LensClient.ts';
import { buildClient } from '../../src/lens/client.ts';
import { TestResourceLoader } from '../_setup/TestResourceLoader.ts';
import { DeployedContracts } from '../../src/lens/indexes/DeployedContracts.ts';
import { SupportedContracts } from '../../src/lens/indexes/SupportedContracts.ts';
import { LensCallTracer } from '../../src/lens/callTracer/LensCallTracer.ts';
import { inspect } from '../_setup/utils/debug.ts';
import { ETHER_1 } from '../_setup/utils/constants.ts';
import type { FunctionTracesArtifactsMap } from './_setup/types.ts';
import type { ProtocolName } from '../_setup/artifacts';
import { deployFunctionTracesContracts } from './_setup/deploy.ts';
import type { Hex } from '../../src/lens/types/artifact.ts';

describe('function traces', () => {
  let lensClient: LensClient<FunctionTracesArtifactsMap>;
  let callerContract: Awaited<ReturnType<typeof deployFunctionTracesContracts>>['callerContract'];

  beforeEach(async () => {
    const deployerAccount = privateKeyToAccount(generatePrivateKey());

    const client = await buildClient(deployerAccount);

    const resourceLoader = new TestResourceLoader<FunctionTracesArtifactsMap, ProtocolName>();

    const supportedContracts = new SupportedContracts();
    const labeledContracts = new DeployedContracts();
    const tracer = new LensCallTracer<FunctionTracesArtifactsMap>(supportedContracts, labeledContracts);
    lensClient = new LensClient<FunctionTracesArtifactsMap>(client, supportedContracts, labeledContracts, tracer);

    const artifacts = await resourceLoader.getProtocolArtifacts('function-traces');
    await supportedContracts.registerArtifacts(artifacts);

    const functionIndexes = await resourceLoader.getFunctionIndexes('function-traces');
    await supportedContracts.registerFunctionIndexes(functionIndexes);

    await tevmSetAccount(lensClient.client, {
      address: deployerAccount.address,
      balance: ETHER_1,
    });

    const deployment = await deployFunctionTracesContracts(lensClient, resourceLoader);
    callerContract = deployment.callerContract;
  });

  test('deployContract', async () => {
    await lensClient.contract(callerContract, 'callPublicFunction', []);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('create2Contract', async () => {
    const hex32Pattern = ('0x' + '11'.repeat(32)) as Hex;
    await lensClient.contract(callerContract, 'create2Contract', [hex32Pattern]);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('callPublicFunction', async () => {
    await lensClient.contract(callerContract, 'callPublicFunction', []);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('callExternalFunction', async () => {
    await lensClient.contract(callerContract, 'callExternalFunction', []);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('callWithFallback', async () => {
    const calldata = '0x20';
    await lensClient.contract(callerContract, 'callWithFallback', [calldata], ETHER_1);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('callReceiveFunction', async () => {
    await lensClient.contract(callerContract, 'callReceiveFunction', [], ETHER_1);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('callStaticCallViewFunction', async () => {
    await lensClient.contract(callerContract, 'callStaticCallViewFunction', []);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('callDelegateCall', async () => {
    const calldata = '0x'; // Example calldata, adjust as needed
    await lensClient.contract(callerContract, 'callDelegateCall', [calldata]);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('callPublicAndExternal', async () => {
    await lensClient.contract(callerContract, 'callPublicAndExternal', []);
    inspect(lensClient.callDecodeTracer.succeededTxs);
  });

  test('precompile', async () => {});

  test('emitted different log with same log signature from different contracts', async () => {});
});
