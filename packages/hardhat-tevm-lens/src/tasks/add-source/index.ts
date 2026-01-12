import fs from 'fs';
import path from 'node:path';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import createDebug from 'debug';
import { DEBUG_PREFIX } from '../../debug';
import { type BuildInfoPair, getBuildInfoPair, getBuildInfoPairsPath } from '../../_utils/build-info';
import { toUserSource } from '../../_utils/hardhat';
import type { Source } from './types';
import { fileURLToPath } from 'node:url';

const debug = createDebug(`${DEBUG_PREFIX}:add-source`);

//************************************** COPY TYPES ***************************************//

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  debug('Add source task started');

  const artifactsPath = hre.config.paths.artifacts;
  const buildInfoPairPaths = await getBuildInfoPairsPath(hre);

  for (const buildInfoPairPath of buildInfoPairPaths) {
    const buildInfoPair = getBuildInfoPair(buildInfoPairPath);
    createSource(buildInfoPair, artifactsPath);
  }

  // create types
  const artifactsContractPath = hre.config.artifactsAugment.artifactContractsPath;
  const sourceTypePath = path.join(artifactsContractPath, 'source.d.ts');
  copyFunctionIndexesTypes(sourceTypePath);

  debug('Add source task ended');
}

//*************************************** INDEX ***************************************//

function createSource(buildInfoPair: BuildInfoPair, artifactsPath: string) {
  const { buildInfoInput, buildInfoOutput } = buildInfoPair;

  const inputSources = buildInfoInput.input.sources;
  const outputSources = buildInfoOutput.output.sources;

  for (const [inputSourceName, inputSourceData] of Object.entries(inputSources)) {
    const content = inputSourceData.content;
    const ast = outputSources?.[inputSourceName]?.ast;

    const sourceContents: Source = {
      content,
      ast,
    };

    // write file
    const userSourcePath = toUserSource(inputSourceName);
    const destinationPath = path.join(artifactsPath, userSourcePath, 'source.json');
    const destinationDir = path.dirname(destinationPath);
    fs.mkdirSync(destinationDir, { recursive: true });
    debug('Writing source file', { destinationPath });
    fs.writeFileSync(destinationPath, JSON.stringify(sourceContents, null, 2), 'utf-8');
  }
}
