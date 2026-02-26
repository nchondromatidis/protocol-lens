import { promises as fs } from 'fs';
import { glob } from 'glob';
import * as url from 'node:url';

const CONTRACTS_PATH = 'contracts';

const changes = [
  {
    fileGlob: '**/UniswapV2Library.sol',
    replaceString: "hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'",
    withString: "hex'd63ed9b24d62284d59595d1b60c5585b5027bfd5edbcfd936a12fcaf2396843c'", // keccak256(UniswapV2Pair.bytecode);
  },
];

async function changeSource() {
  for (const change of changes) {
    const files = glob.sync(change.fileGlob, { cwd: CONTRACTS_PATH, absolute: true });

    for (const filePath of files) {
      console.log(`Processing: ${filePath}`);

      let content = await fs.readFile(filePath, 'utf-8');

      const stat = await fs.lstat(filePath);

      if (stat.isSymbolicLink()) {
        const targetPath = await fs.readlink(filePath);
        content = await fs.readFile(targetPath, 'utf-8');

        await fs.unlink(filePath);
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`  Copied symlink target to: ${filePath}`);
      }

      if (content.includes(change.replaceString)) {
        const newContent = content.replace(change.replaceString, change.withString);
        await fs.writeFile(filePath, newContent, 'utf-8');
        console.log(`  Replaced string in: ${filePath}`);
      } else {
        console.log(`  String not found in: ${filePath}`);
      }
    }
  }
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  changeSource().catch(console.error);
}
