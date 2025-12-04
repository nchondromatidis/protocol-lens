import { test, beforeEach, describe } from 'vitest';
import { LensClient } from '../../src/lens/LensClient.ts';
import { inspect } from '../_setup/utils/debug.ts';
import type { FunctionTracesArtifactsMap } from './_setup/types.ts';
import { deployFunctionTracesContracts } from './_setup/deploy.ts';
import { testSetup } from './_setup/testSetup.ts';
import { getTracedTxFactory } from './_setup/utils.ts';

describe('function traces - 4.external-libraries', () => {
  let lensClient: LensClient<FunctionTracesArtifactsMap>;
  let callerContract: Awaited<ReturnType<typeof deployFunctionTracesContracts>>['callerContract'];
  let getTracedTx: ReturnType<typeof getTracedTxFactory>;

  beforeEach(async () => {
    ({ lensClient, callerContract } = await testSetup());
    getTracedTx = getTracedTxFactory(lensClient);
  });

  // TODO: continue here
  test('testExternalLibCall', async () => {
    const result = await lensClient.contract(callerContract, 'testExternalLibCall', []);
    inspect(getTracedTx.success(result));
    // TODO: fails to decode external library call with argument typed storage
    // https://docs.soliditylang.org/en/latest/contracts.html#function-signatures-and-selectors-in-libraries
  });
});
