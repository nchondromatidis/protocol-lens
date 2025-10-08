import fs from 'fs';
import path from 'path';
import { artifactsContractPath, artifactsPath } from '../tasks-config.ts';
import url from 'node:url';

function listJsonFilesRecursively(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      fileList = listJsonFilesRecursively(path.join(dir, file), fileList);
    } else {
      const filePath = path.relative(artifactsPath, path.join(dir, file));
      if (filePath.endsWith('.json')) {
        const lastSlashIndex = filePath.lastIndexOf('/');
        const filePathColon = filePath.slice(0, lastSlashIndex) + ':' + filePath.slice(lastSlashIndex + 1);
        const filePathColonNoJson = filePathColon.replace('.json', '');
        fileList.push(filePathColonNoJson);
      }
    }
  });

  return fileList;
}

function groupBySecondFolder(files: string[]): Record<string, string[]> {
  return files.reduce<Record<string, string[]>>((acc, filePath) => {
    const secondFolder = filePath.split('/')[1];

    if (!acc[secondFolder]) {
      acc[secondFolder] = [];
    }
    acc[secondFolder].push(filePath);

    return acc;
  }, {});
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  const fileList = listJsonFilesRecursively(artifactsContractPath);
  const groupedBySecondFolder = groupBySecondFolder(fileList);

  const protocolContractMapPath = path.join(artifactsPath, 'protocols-contracts-map.json');
  fs.writeFileSync(protocolContractMapPath, JSON.stringify(groupedBySecondFolder, null, 2));
}
