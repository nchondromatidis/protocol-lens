import fs from 'fs';
import path from 'node:path';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import { fileURLToPath } from 'node:url';
import type { FunctionData, FunctionEntryIndexes } from './types';
import { getBuildInfoPair, getBuildInfoPairsPath } from './build-info-pairs';
import { createFunctionIndexes } from './index-functions';
import { debug } from './_debug';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function groupFunctionIndexesPerProtocol(data: FunctionEntryIndexes) {
  const protocolFunctionIndexes: Record<string, Array<FunctionData>> = {};
  for (const functionData of data) {
    const secondFolder = functionData.source.split('/')[1];
    if (!protocolFunctionIndexes[secondFolder]) protocolFunctionIndexes[secondFolder] = [];
    protocolFunctionIndexes[secondFolder].push(functionData);
  }

  return protocolFunctionIndexes;
}

function copyFunctionIndexesTypes(indexFilePath: string) {
  // after compilation in dist folder types inside types.ts go to types.d.ts
  const functionIndexesTypes =
    fs.readFileSync(path.join(__dirname, 'types.ts'), { encoding: 'utf8' }) ??
    fs.readFileSync(path.join(__dirname, 'types.d.ts'), { encoding: 'utf8' });

  fs.writeFileSync(indexFilePath, functionIndexesTypes, {
    encoding: 'utf8',
  });
}

//*************************************** MAIN ***************************************//

export default async function (_taskArgs: Record<string, any>, hre: HardhatRuntimeEnvironment) {
  debug('Index functions task started');

  const artifactsContractPath = hre.config.artifactsAugment.artifactContractsPath;
  const buildInfoPairPaths = await getBuildInfoPairsPath(hre);

  const functionEntryIndexes: FunctionEntryIndexes = [];

  for (const buildInfoPairPath of buildInfoPairPaths) {
    const buildInfoPair = getBuildInfoPair(buildInfoPairPath);
    createFunctionIndexes(buildInfoPair, functionEntryIndexes);
  }

  const protocolFunctionEntryIndexes = groupFunctionIndexesPerProtocol(functionEntryIndexes);

  for (const [protocol, sourceFunctionIndexes] of Object.entries(protocolFunctionEntryIndexes)) {
    const protocolSourceFunctionIndexesPath = path.join(artifactsContractPath, protocol, 'function-indexes.json');
    debug('Paths:', { protocolSourceFunctionIndexesPath });
    fs.writeFileSync(protocolSourceFunctionIndexesPath, JSON.stringify(sourceFunctionIndexes, null, 2), 'utf-8');
  }
  const functionIndexesTypesPath = path.join(artifactsContractPath, 'function-indexes.d.ts');
  debug('Paths:', { functionIndexesTypesPath });

  copyFunctionIndexesTypes(functionIndexesTypesPath);

  debug('Index functions task ended');
}
