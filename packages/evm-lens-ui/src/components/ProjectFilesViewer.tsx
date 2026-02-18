// source: https://coss.com/origin/tree
'use client';

import {
  expandAllFeature,
  hotkeysCoreFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
  type TreeState,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { FileIcon, FolderIcon, FolderOpenIcon, SearchIcon } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from './ui/input.tsx';
import { Tree, TreeItem, TreeItemLabel } from './ui/tree.tsx';

export const DEFAULT_INDENT = 20;

export interface Item {
  name: string;
  children?: string[];
}

export interface ProjectFilesViewerProps {
  items: Record<string, Item>;
  rootItemId: string;
  initialExpandedItems: string[];
  onSelectFileFromTree: (fileId: string) => void;
  onScrollToFile?: (fileId: string) => void;
  scrollToFileId?: string;
  indent?: number;
}

const getItemIcon = (item: ItemInstance<Item>) => {
  if (!item.isFolder()) return <FileIcon className="pointer-events-none size-4 text-muted-foreground" />;
  const Icon = item.isExpanded() ? FolderOpenIcon : FolderIcon;
  return <Icon className="pointer-events-none size-4 text-muted-foreground" />;
};

export const ProjectFilesViewer: React.FC<ProjectFilesViewerProps> = ({
  items,
  rootItemId,
  initialExpandedItems,
  indent = DEFAULT_INDENT,
  onSelectFileFromTree,
  onScrollToFile,
  scrollToFileId,
}) => {
  const [state, setState] = useState<Partial<TreeState<Item>>>({});
  const treeRef = useRef<HTMLDivElement>(null);
  const processedScrollToFileId = useRef<string | null>(null);

  const tree = useTree<Item>({
    dataLoader: {
      getChildren: (itemId) => items[itemId]?.children ?? [],
      getItem: (itemId) => items[itemId],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature, searchFeature, expandAllFeature],
    getItemName: (item) => item.getItemData().name,
    indent,
    initialState: { expandedItems: initialExpandedItems, selectedItems: [] },
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    rootItemId,
    setState,
    state,
  });

  const searchInputProps = tree.getSearchInputElementProps();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      searchInputProps.onChange?.(e);
      const value = e.target.value;
      if (value.length > 0) {
        tree.expandAll();
      } else {
        setState((prev) => ({ ...prev, expandedItems: initialExpandedItems }));
      }
    },
    [searchInputProps, tree, initialExpandedItems]
  );

  const treeItems = tree.getItems();

  // Get all parent folder paths for a given file path
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

  // Handle expanding parent folders, scrolling, and selecting
  useEffect(() => {
    if (!scrollToFileId) return;

    // Reset the processed flag when scrollToFileId changes to allow re-expansion
    if (processedScrollToFileId.current !== scrollToFileId) {
      processedScrollToFileId.current = null;
    }

    if (processedScrollToFileId.current === scrollToFileId) return;

    const parentPaths = getParentPaths(scrollToFileId);
    const allParentsExpanded = parentPaths.every((parent) => (state.expandedItems || []).includes(parent));

    if (!allParentsExpanded) {
      // Need to expand parent folders first
      const currentExpanded = new Set(state.expandedItems || []);
      parentPaths.forEach((parent) => currentExpanded.add(parent));
      setState((prev) => ({ ...prev, expandedItems: Array.from(currentExpanded) }));
      return;
    }

    // All parents expanded, now scroll and select
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
    // Note: state.expandedItems is intentionally omitted from dependencies to prevent
    // the effect from re-running when user manually expands/collapses folders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToFileId, getParentPaths, onScrollToFile]);

  // Separate effect to handle selection when scrollToFileId changes
  useEffect(() => {
    if (scrollToFileId) {
      setState((prev) => ({ ...prev, selectedItems: [scrollToFileId] }));
    }
  }, [scrollToFileId]);

  return (
    <div className="flex h-full flex-col gap-2 *:nth-2:grow">
      <div className="relative">
        <Input
          className="peer ps-9"
          {...searchInputProps}
          onChange={handleSearchChange}
          placeholder="Quick search..."
          type="search"
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <SearchIcon aria-hidden="true" className="size-4" />
        </div>
      </div>

      <Tree indent={indent} tree={tree} ref={treeRef}>
        {treeItems.map((item) => (
          <TreeItem item={item} key={item.getId()}>
            <TreeItemLabel
              className="py-1"
              {...(!item.isFolder()
                ? {
                    onClick: () => {
                      onSelectFileFromTree(item.getId());
                      setState((prev) => ({ ...prev, selectedItems: [item.getId()] }));
                    },
                  }
                : {})}
            >
              <span className="flex items-center gap-2">
                {getItemIcon(item)}
                {item.getItemName()}
              </span>
            </TreeItemLabel>
          </TreeItem>
        ))}
      </Tree>
    </div>
  );
};
