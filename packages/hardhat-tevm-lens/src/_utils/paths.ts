export function groupByFolder(files: string[], folderNumber: number): Record<string, string[]> {
  return files.reduce<Record<string, string[]>>((acc, filePath) => {
    const groupFolder = filePath.split('/')[folderNumber];
    if (!acc[groupFolder]) acc[groupFolder] = [];
    acc[groupFolder].push(filePath);

    return acc;
  }, {});
}

export function groupByPathSegment<T, K extends keyof T>(
  items: T[],
  propertyKey: K,
  segmentIndex: number
): Record<string, Array<T>> {
  const groupedItems: Record<string, Array<T>> = {};

  for (const item of items) {
    const propertyValue = item[propertyKey];
    if (typeof propertyValue !== 'string') continue;
    const segment = propertyValue.split('/')[segmentIndex];
    if (!segment) continue;
    if (!groupedItems[segment]) groupedItems[segment] = [];
    groupedItems[segment].push(item);
  }

  return groupedItems;
}
