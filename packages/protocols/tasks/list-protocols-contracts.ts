import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import { artifactsContractPath } from '../tasks-config.ts';
import url from 'node:url';
import { Project } from 'ts-morph';

async function listJsonFiles(dir: string): Promise<string[]> {
  const files = await glob('**/*.json', { cwd: dir, posix: true });

  return files.map((filePath) => {
    const lastSlashIndex = filePath.lastIndexOf('/');
    const filePathColon = filePath.slice(0, lastSlashIndex) + ':' + filePath.slice(lastSlashIndex + 1);
    return filePathColon.replace('.json', '');
  });
}

function groupByFirstFolder(files: string[]): Record<string, string[]> {
  return files.reduce<Record<string, string[]>>((acc, filePath) => {
    const secondFolder = filePath.split('/')[0];
    if (!acc[secondFolder]) acc[secondFolder] = [];
    acc[secondFolder].push(filePath);

    return acc;
  }, {});
}

function createProtocolsType(values: string[]) {
  const unique = Array.from(new Set(values)).sort();

  const project = new Project();
  const protocolsTypeFilePath = path.join(artifactsContractPath, 'protocols-list.d.ts');
  const sourceFile = project.createSourceFile(protocolsTypeFilePath, '', { overwrite: true });

  const unionTypes = unique.length === 0 ? ['never'] : unique.map((v) => `'${v}'`);

  sourceFile.addTypeAlias({
    isExported: true,
    name: 'ProtocolName',
    type: unionTypes.join(' | '),
  });

  const code = sourceFile.getFullText();
  fs.writeFileSync(protocolsTypeFilePath, code);
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  const fileList = await listJsonFiles(artifactsContractPath);
  const groupedBySecondFolder = groupByFirstFolder(fileList);

  for (const [group, files] of Object.entries(groupedBySecondFolder)) {
    const protocolContractsListPath = path.join(artifactsContractPath, group, 'contract-fqn-list.json');
    fs.writeFileSync(protocolContractsListPath, JSON.stringify(files, null, 2));
  }
  const protocolList = Object.keys(groupedBySecondFolder);
  createProtocolsType(protocolList);
}
