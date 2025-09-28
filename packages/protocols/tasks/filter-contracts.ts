import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'node:url';
import * as url from "node:url";


async function copySymlinkRecursive(src: string, dest: string, include: string[], exclude: string[]) {
  // Remove destination folder and all its contents
  await fs.rm(dest, { recursive: true, force: true });
  // Recreate destination folder
  await fs.mkdir(dest, { recursive: true });

  const pattern = '**/*';
  const files = glob.sync(pattern, { cwd: src, dot: true, nodir: false, absolute: true });

  for (const filePath of files) {
    const relativePath = path.relative(src, filePath);

    // Skip if excluded
    if (exclude.some(folder => relativePath.split(path.sep).includes(folder))) continue;
    // Skip if not included
    if (!include.some(folder => relativePath.split(path.sep).includes(folder))) continue;

    const targetPath = path.join(dest, relativePath);
    const stat = await fs.lstat(filePath);

    if (stat.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.symlink(filePath, targetPath);
    }
  }
}

// TODO: cannot make this task to register in Hardhat v3, so I ran it as a standalone script
if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const sourcePath = path.join(__dirname, '..', 'lib');
  const destinationPath = path.join(__dirname, '..', 'contracts');
  const excludeFolders = ['test', 'examples'];
  const includeFolders = ['contracts'];

  copySymlinkRecursive(sourcePath, destinationPath, includeFolders, excludeFolders).catch(console.error);
}

