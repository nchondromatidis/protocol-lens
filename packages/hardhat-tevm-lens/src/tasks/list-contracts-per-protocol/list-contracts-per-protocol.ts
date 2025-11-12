import fs from 'fs';
import path from 'path';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import createDebug from 'debug';
import { DEBUG_PREFIX } from '../../debug.js';

const debug = createDebug(`${DEBUG_PREFIX}:list-folder-contracts`);

async function getAllFullyQualifiedNames(hre: HardhatRuntimeEnvironment) {
  return Array.from(await hre.artifacts.getAllFullyQualifiedNames()).filter(
    (it) => !it.includes('function-indexes') && !it.includes('contract-fqn-list')
  );
}

function groupByFolder(files: string[], folderNumber: number): Record<string, string[]> {
  return files.reduce<Record<string, string[]>>((acc, filePath) => {
    const groupFolder = filePath.split('/')[folderNumber];
    if (!acc[groupFolder]) acc[groupFolder] = [];
    acc[groupFolder].push(filePath);

    return acc;
  }, {});
}

export default async function (_taskArgs: Record<string, any>, hre: HardhatRuntimeEnvironment) {
  const artifactsContractPath = path.join(hre.config.paths.artifacts, hre.config.artifactsAugment.contracts.path);

  const fileList = await getAllFullyQualifiedNames(hre);
  const groupedByProtocol = groupByFolder(fileList, 1);

  for (const [group, files] of Object.entries(groupedByProtocol)) {
    const protocolContractsListPath = path.join(artifactsContractPath, group, 'contract-fqn-list.json');

    fs.writeFileSync(protocolContractsListPath, JSON.stringify(files, null, 2));
    debug('Created contracts list for folder:', group);
  }
}
