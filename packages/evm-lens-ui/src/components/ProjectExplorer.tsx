import {
  expandAllFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type TreeState,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MaterialIcon } from './lib/MaterialIcon.tsx';
import type { ProjectFileItem } from './types/ProjectFileItem.ts';

type ProjectExplorerProps = Readonly<{
  items: Record<string, ProjectFileItem>;
  rootItemId: string;
  initialExpandedItems: string[];
  selectedFileId?: string;
  onSelectFileFromTree: (fileId: string) => void;
  onScrollToFile?: (fileId: string) => void;
  scrollToFileId?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}>;

const DEFAULT_INDENT = 24;

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  items,
  rootItemId,
  initialExpandedItems,
  selectedFileId,
  onSelectFileFromTree,
  onScrollToFile,
  scrollToFileId,
  collapsed,
  onToggleCollapse,
}) => {
  const [state, setState] = useState<Partial<TreeState<ProjectFileItem>>>({});
  const treeRef = useRef<HTMLDivElement>(null);
  const processedScrollToFileId = useRef<string | null>(null);

  const tree = useTree<ProjectFileItem>({
    dataLoader: {
      getChildren: (itemId) => items[itemId]?.children ?? [],
      getItem: (itemId) => items[itemId],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature, expandAllFeature],
    getItemName: (item) => item.getItemData().name,
    indent: DEFAULT_INDENT,
    initialState: { expandedItems: initialExpandedItems, selectedItems: [] },
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    rootItemId,
    setState,
    state,
  });

  const treeItems = tree.getItems();

  const getParentPaths = useCallback((filePath: string): string[] => {
    const parts = filePath.split('/');
    const parents: string[] = [];
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      parents.push(currentPath);
    }
    return parents;
  }, []);

  useEffect(() => {
    if (!scrollToFileId) return;
    if (processedScrollToFileId.current !== scrollToFileId) {
      processedScrollToFileId.current = null;
    }
    if (processedScrollToFileId.current === scrollToFileId) return;

    const parentPaths = getParentPaths(scrollToFileId);
    const allParentsExpanded = parentPaths.every((parent) => (state.expandedItems || []).includes(parent));

    if (!allParentsExpanded) {
      const currentExpanded = new Set(state.expandedItems || []);
      parentPaths.forEach((parent) => currentExpanded.add(parent));
      requestAnimationFrame(() => {
        setState((prev) => ({ ...prev, expandedItems: Array.from(currentExpanded) }));
      });
      return;
    }

    if (treeRef.current) {
      processedScrollToFileId.current = scrollToFileId;
      requestAnimationFrame(() => {
        const itemElement = treeRef.current?.querySelector(`[data-item-id="${scrollToFileId}"]`);
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        onScrollToFile?.(scrollToFileId);
      });
    }
  }, [scrollToFileId, getParentPaths, onScrollToFile, state.expandedItems]);

  useEffect(() => {
    if (scrollToFileId) {
      requestAnimationFrame(() => {
        setState((prev) => ({ ...prev, selectedItems: [scrollToFileId!] }));
      });
    }
  }, [scrollToFileId]);

  if (collapsed) {
    return (
      <div
        className="w-10 h-full border-r border-border bg-background flex flex-col items-center pt-2 cursor-pointer hover:bg-muted"
        onClick={onToggleCollapse}
      >
        <button className="p-1.5" title="Expand Sidebar">
          <MaterialIcon name="dock_to_left" className="text-muted-foreground hover:text-foreground" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-10 px-3 flex items-center justify-between border-b border-border shrink-0">
        <span className="font-sans text-[10px] font-bold text-muted-foreground tracking-wider">PROJECT EXPLORER</span>
        <button onClick={onToggleCollapse} className="p-1 hover:bg-muted cursor-pointer" title="Collapse Sidebar">
          <MaterialIcon name="dock_to_left" className="text-muted-foreground hover:text-foreground" size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 text-[12px] font-medium text-muted-foreground" ref={treeRef}>
        {treeItems.map((item) => {
          const isFolder = item.isFolder();
          const isExpanded = isFolder && item.isExpanded();
          const isSelected = !isFolder && item.getId() === selectedFileId;

          const indentPx = item.getItemMeta().level * DEFAULT_INDENT;

          if (isFolder) {
            return (
              <div
                key={item.getId()}
                data-item-id={item.getId()}
                className="py-1 flex items-center gap-2 hover:bg-muted cursor-pointer group"
                style={{ paddingLeft: indentPx + 8 }}
                onClick={() => (isExpanded ? item.collapse() : item.expand())}
              >
                <MaterialIcon
                  name={isExpanded ? 'expand_more' : 'chevron_right'}
                  className="text-muted-foreground group-hover:text-foreground"
                  size={16}
                  weight={400}
                />
                <MaterialIcon name="folder" className="text-muted-foreground" size={16} />
                <span className="text-foreground">{item.getItemName()}</span>
              </div>
            );
          }

          return (
            <div
              key={item.getId()}
              data-item-id={item.getId()}
              className={`py-1 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-violet-500/5 text-violet-500 dark:text-violet-400 border-r-2 border-violet-500/50'
                  : 'hover:bg-muted'
              }`}
              style={{ paddingLeft: indentPx + 8 }}
              onClick={() => {
                onSelectFileFromTree(item.getId());
                setState((prev) => ({ ...prev, selectedItems: [item.getId()] }));
              }}
            >
              <MaterialIcon
                name="description"
                className={isSelected ? 'text-violet-500' : 'text-muted-foreground'}
                size={16}
              />
              <span className={isSelected ? 'text-violet-500 dark:text-violet-400' : 'text-muted-foreground'}>
                {item.getItemName()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
