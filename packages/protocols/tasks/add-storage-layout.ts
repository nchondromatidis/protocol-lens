import fs from 'fs';
import path from 'path';
import { artifactsBuildInfoPath, artifactsPath } from '../tasks-config.ts';
import url from 'node:url';

interface BuildInfo {
  _format: string;
  solcVersion: string;
  output: {
    contracts: Record<string, Record<string, { storageLayout: any }>>;
  };
}

function buildStorageLayoutMap(): Map<string, any> {
  const storageLayoutMap = new Map<string, any>();
  const buildInfoFiles = fs.readdirSync(artifactsBuildInfoPath).filter((file) => file.endsWith('.output.json'));

  for (const file of buildInfoFiles) {
    const buildInfoPath = path.join(artifactsBuildInfoPath, file);
    const buildInfo: BuildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf-8'));

    const contracts = buildInfo.output.contracts;
    for (const sourceName in contracts) {
      for (const contractName in contracts[sourceName]) {
        const fqn = `${sourceName}:${contractName}`;
        const storageLayout = contracts[sourceName][contractName].storageLayout;
        if (storageLayout) {
          storageLayoutMap.set(fqn, storageLayout);
        }
      }
    }
  }

  return storageLayoutMap;
}

function processContractArtifacts(storageLayoutMap: Map<string, any>) {
  for (const [fqn, storageLayout] of storageLayoutMap.entries()) {
    if (!storageLayout) {
      continue;
    }

    const [sourceName] = fqn.split(':');

    // remove projects folder
    const sourceNormalized = sourceName.split('/').slice(1).join('/');

    // Hardhat artifact path structure: <artifactsPath>/<sourceNormalized>/storageLayout.json
    const artifactDir = path.join(artifactsPath, sourceNormalized);
    const storageLayoutFilePath = path.join(artifactDir, 'storageLayout.json');

    fs.writeFileSync(storageLayoutFilePath, JSON.stringify(storageLayout, null, 2));
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  console.log('Starting to add storageLayout to contract artifacts...');
  const storageLayoutMap = buildStorageLayoutMap();
  processContractArtifacts(storageLayoutMap);
  console.log('Finished adding storageLayout.');
}
