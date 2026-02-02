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
import React, { useCallback, useState } from 'react';

import { Input } from '@/components/ui/input.tsx';
import { Tree, TreeItem, TreeItemLabel } from '@/components/ui/tree.tsx';

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
}) => {
  const [state, setState] = useState<Partial<TreeState<Item>>>({});

  const tree = useTree<Item>({
    dataLoader: {
      getChildren: (itemId) => items[itemId]?.children ?? [],
      getItem: (itemId) => items[itemId],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature, selectionFeature, searchFeature, expandAllFeature],
    getItemName: (item) => item.getItemData().name,
    indent,
    initialState: { expandedItems: initialExpandedItems },
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

      <Tree indent={indent} tree={tree}>
        {treeItems.map((item) => (
          <TreeItem item={item} key={item.getId()}>
            <TreeItemLabel
              className="py-1"
              {...(!item.isFolder() ? { onClick: () => onSelectFileFromTree(item.getId()) } : {})}
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
