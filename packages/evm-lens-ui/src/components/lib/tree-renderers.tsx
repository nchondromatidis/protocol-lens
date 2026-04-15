import React from 'react';
import type { ItemInstance } from '@headless-tree/core';
import { cn } from './utils.ts';
import { MaterialIcon } from './MaterialIcon.tsx';
import type { ProjectFileItem } from '../types/ProjectFileItem.ts';

type TreeNodeProps = Readonly<{
  item: ItemInstance<ProjectFileItem>;
  children: React.ReactNode;
}>;

export const TreeNode: React.FC<TreeNodeProps> = ({ item, children }) => {
  const isFolder = item.isFolder();

  return (
    <div
      data-item-id={item.getId()}
      className={cn(
        'flex items-center gap-2 py-1 px-2 cursor-pointer group',
        isFolder ? 'hover:bg-muted' : 'hover:bg-muted'
      )}
    >
      {children}
    </div>
  );
};

type TreeNodeLabelProps = Readonly<{
  item: ItemInstance<ProjectFileItem>;
  onClick?: () => void;
  isSelected?: boolean;
}>;

export const TreeNodeLabel: React.FC<TreeNodeLabelProps> = ({ item, onClick, isSelected }) => {
  const isFolder = item.isFolder();
  const isExpanded = isFolder && item.isExpanded();

  if (isFolder) {
    return (
      <div
        className="flex items-center gap-2 w-full"
        onClick={() => {
          if (isExpanded) {
            item.collapse();
          } else {
            item.expand();
          }
        }}
      >
        <MaterialIcon
          name={isExpanded ? 'expand_more' : 'chevron_right'}
          className="text-muted-foreground group-hover:text-foreground"
          size={16}
          weight={400}
        />
        <MaterialIcon name="folder" className="text-muted-foreground" size={16} />
        <span className="text-foreground truncate">{item.getItemName()}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 w-full py-1 pl-2',
        isSelected
          ? 'bg-violet-500/5 text-violet-500 dark:text-violet-400 border-r-2 border-violet-500/50'
          : 'hover:bg-muted'
      )}
      onClick={onClick}
    >
      <MaterialIcon name="description" className={isSelected ? 'text-violet-500' : 'text-muted-foreground'} size={16} />
      <span className={isSelected ? 'text-violet-500 dark:text-violet-400' : 'text-muted-foreground'}>
        {item.getItemName()}
      </span>
    </div>
  );
};
