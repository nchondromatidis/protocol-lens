import fs from 'fs';
import path from 'node:path';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import createDebug from 'debug';
import { DEBUG_PREFIX } from '../../debug';
import { type BuildInfoPair, getBuildInfoPair, getBuildInfoPairsPath } from '../../_utils/build-info';
import { toUserSource } from '../../_utils/hardhat';
import { createByteCodeIndex } from '../../_utils/bytecode';
import { decompressSourceMap } from '../../_utils/sourcemap';
import type { PcLocationIndex } from './types';
import { srcDecoder } from 'solidity-ast/utils.js';
import { getSrcLocation } from '../../_utils/source-location';
import { isExternalCallOpcode, isJumpDestOpcode, isJumpOpcode, isPushOpcode } from '../../_utils/opcodes';
import { fileURLToPath } from 'node:url';
import { groupByPathSegment } from '../../_utils/paths';

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

  const buildInfoPairPaths = await getBuildInfoPairsPath(hre);
  const pcLocationsIndexes: PcLocationIndex[] = [];

  for (const buildInfoPairPath of buildInfoPairPaths) {
    const buildInfoPair = getBuildInfoPair(buildInfoPairPath);
    const newPcLocationIndexes = createIndex(buildInfoPair);
    pcLocationsIndexes.push(...newPcLocationIndexes);
  }

  const artifactsContractPath = hre.config.artifactsAugment.artifactContractsPath;

  // write file
  const pcLocationsIndexesPerProtocol = groupByPathSegment(pcLocationsIndexes, 'contractFQN', 1);
  for (const [group, files] of Object.entries(pcLocationsIndexesPerProtocol)) {
    const pcLocationIndexPath = path.join(artifactsContractPath, group, 'pc-locations-index.json');

    debug('Paths:', { pcLocationIndexPath });
    fs.writeFileSync(pcLocationIndexPath.split(':')[0], JSON.stringify(files, null, 2), 'utf-8');
  }

  // create types
  const sourceTypePath = path.join(artifactsContractPath, 'source.d.ts');
  copyFunctionIndexesTypes(sourceTypePath);

  debug('Add source task ended');
}

//*************************************** INDEX ***************************************//

function createIndex(buildInfoPair: BuildInfoPair) {
  const { buildInfoInput, buildInfoOutput } = buildInfoPair;

  const decodeSrc = srcDecoder(buildInfoInput.input, buildInfoOutput.output);

  const pcLocationIndexes: PcLocationIndex[] = [];

  for (const [inputSourceName, outputContract] of Object.entries(buildInfoOutput.output.contracts!)) {
    for (const [contractName, contractData] of Object.entries(outputContract)) {
      const opcodesMnemonicsString = contractData!.evm!.bytecode!.opcodes;
      const sourcemap = contractData!.evm!.bytecode!.sourceMap;
      if (!opcodesMnemonicsString || !sourcemap) {
        // most probably interface
        console.warn(`Skipping ${inputSourceName}:${contractName}, missing bytecode or sourcemap`);
        continue;
      }

      const bytecodeIndex = createByteCodeIndex(opcodesMnemonicsString);
      const sourceMapD = decompressSourceMap(sourcemap);

      const userSource = toUserSource(inputSourceName);
      const contractFQN = `${userSource}:${contractName}`;

      const pcLocationIndex: PcLocationIndex = {
        contractFQN,
        locationSources: [],
        pcLocations: [],
      };

      bytecodeIndex.opcodeEntries
        // only track specific opcodes for efficiency
        .filter(
          (opcodeEntry) =>
            isExternalCallOpcode(opcodeEntry.name) ||
            isPushOpcode(opcodeEntry.name) ||
            isJumpOpcode(opcodeEntry.name) ||
            isJumpDestOpcode(opcodeEntry.name)
        )
        // ignore opcodes after the sourcemap (eg create contract opcodes)
        .filter((opcodeEntry) => opcodeEntry.index <= sourceMapD.length)
        // get location of opcodes in a "compressed" form
        .forEach((it) => {
          const pcLocation = getSrcLocation(sourceMapD[it.index].src, decodeSrc, debug);
          if (!pcLocation) return;
          if (!pcLocationIndex.locationSources.includes(pcLocation.userSource)) {
            pcLocationIndex.locationSources.push(pcLocation.userSource);
          }

          pcLocationIndex.pcLocations.push([
            it.pc,
            [
              pcLocation.lineStart,
              pcLocation.lineEnd,
              pcLocationIndex.locationSources.indexOf(pcLocation.userSource),
            ] as const,
          ]);
        });

      pcLocationIndexes.push(pcLocationIndex);
    }
  }
  return pcLocationIndexes;
}
