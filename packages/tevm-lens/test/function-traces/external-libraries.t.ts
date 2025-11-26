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

  // TODO: continue here
  test('testExternalLibCall', async () => {
    await lensClient.contract(callerContract, 'testExternalLibCall', []);
    inspect(lensClient.callDecodeTracer.succeededTxs);
    // TODO: fails to decode external library call with argument typed storage
    // https://docs.soliditylang.org/en/latest/contracts.html#function-signatures-and-selectors-in-libraries
  });
});
