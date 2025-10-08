import path from 'node:path';
import fs from 'node:fs';
import * as url from 'node:url';
import { artifactsPath } from '../tasks-config.ts';

export function injectSourceMaps(artifactsPath: string) {
  const buildInfoDir = path.join(artifactsPath, 'build-info');
  const files = fs.readdirSync(buildInfoDir).filter((f) => f.endsWith('.output.json'));
  if (files.length === 0) throw new Error('No build-info files found');

  for (const file of files) {
    const filePath = path.join(buildInfoDir, file);
    const buildInfo = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const [sourceFile, contracts] of Object.entries<any>(buildInfo.output.contracts)) {
      for (const [contractName, contractData] of Object.entries<any>(contracts)) {
        const sourceFileCleaned = sourceFile.replace('project/', '');
        const artifactPath = path.join(artifactsPath, sourceFileCleaned, `${contractName}.json`);
        if (!fs.existsSync(artifactPath)) continue;

        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

        artifact.bytecodeSourceMap = contractData.evm.bytecode.sourceMap;
        artifact.deployedBytecodeSourceMap = contractData.evm.deployedBytecode.sourceMap;

        fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
      }
    }
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  injectSourceMaps(artifactsPath);
}
