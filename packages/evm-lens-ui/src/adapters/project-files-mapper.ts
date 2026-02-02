import type { Item } from '@/components/ProjectFilesViewer.tsx';

export function contractFQNListToProjectFiles(contractFQNList: string[]): {
  items: Record<string, Item>;
  rootItemId: string;
  firstLevelFolderNames: string[];
} {
  const items: Record<string, Item> = {};

  const sourcePaths = [...new Set(contractFQNList.map((fqn) => fqn.split(':')[0]).filter(Boolean))];

  if (sourcePaths.length === 0) {
    return { items: {}, rootItemId: '', firstLevelFolderNames: [] };
  }

  let rootDir: string | null = null;

  sourcePaths.forEach((path) => {
    const segments = path.split('/');
    const firstSegment = segments[0];

    if (!firstSegment) {
      throw new Error(`Invalid source path: ${path}`);
    }

    if (rootDir === null) {
      rootDir = firstSegment;
    } else if (rootDir !== firstSegment) {
      throw new Error('Multiple root directories detected. All files must be under the same root directory.');
    }

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath = index === 0 ? segment : `${currentPath}/${segment}`;
      if (!items[currentPath]) {
        items[currentPath] = { name: segment };
        if (index < segments.length - 1) {
          items[currentPath].children = [];
        }
      }
    });
  });

  sourcePaths.forEach((path) => {
    const segments = path.split('/');
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath = index === 0 ? segment : `${currentPath}/${segment}`;
      if (index > 0) {
        const parentPath = segments.slice(0, index).join('/');
        const parentId = parentPath;
        if (items[parentId] && !items[parentId].children?.includes(currentPath)) {
          items[parentId].children!.push(currentPath);
        }
      }
    });
  });

  const firstLevelFolderNames = Object.keys(items)
    .filter((path) => path.split('/').length === 2 && items[path].children)
    .sort();

  return { items, rootItemId: rootDir!, firstLevelFolderNames };
}
