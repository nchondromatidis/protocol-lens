import { beforeEach, describe, test } from 'vitest';
import { LensClient } from '../src/lens/LensClient.ts';
import type { FunctionTracesArtifactsMap } from './function-traces/_setup/types.ts';
import { deployFunctionTracesContracts } from './function-traces/_setup/deploy.ts';
import { testSetup } from './function-traces/_setup/testSetup.ts';
import { getTracedTxFactory } from './function-traces/_setup/utils.ts';

describe('exploratory tests', () => {
  let lensClient: LensClient<FunctionTracesArtifactsMap>;
  let _callerContract: Awaited<ReturnType<typeof deployFunctionTracesContracts>>['callerContract'];
  let _getTracedTx: ReturnType<typeof getTracedTxFactory>;

  beforeEach(async () => {
    ({ lensClient, callerContract: _callerContract } = await testSetup());
    _getTracedTx = getTracedTxFactory(lensClient);
  });

  test.skip('debug_traceTransaction', async () => {});
});
