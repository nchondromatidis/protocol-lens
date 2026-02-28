import { fileURLToPath } from 'url';
import path from 'path';
import { Project } from 'ts-morph';
import { trimFirstSpaces } from '@/utils/trim-first-spaces.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ACTIONS_DIR = path.join(__dirname, '..', 'actions');

export function extractProtocolActionCode(protocolClass: string, actionName: string) {
  const filePath = path.join(ACTIONS_DIR, `${protocolClass}.ts`);
  const methodText = extractMethod(filePath, protocolClass, actionName, true, 2);

  const augmentedMethodText = (methodText ?? '').split('\n').filter(Boolean);
  augmentedMethodText.unshift(`// ${protocolClass}:${actionName}`);

  return augmentedMethodText.join('\n');
}

function extractMethod(
  filePath: string,
  className: string,
  methodName: string,
  shouldTrimFirstSpaces: boolean,
  trimCount: number
): string | undefined {
  const project = new Project({
    skipFileDependencyResolution: true,
  });

  const sourceFile = project.addSourceFileAtPath(filePath);

  const classDeclaration = sourceFile.getClass(className);
  if (!classDeclaration) {
    return undefined;
  }

  const method = classDeclaration.getMethod(methodName);
  if (!method) {
    return undefined;
  }

  let methodText = method.getFullText();
  if (shouldTrimFirstSpaces) {
    methodText = trimFirstSpaces(methodText, trimCount);
  }

  return methodText;
}
