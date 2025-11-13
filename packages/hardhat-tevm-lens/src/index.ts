import { task } from 'hardhat/config';
import type { HardhatPlugin } from 'hardhat/types/plugins';

import './type-extensions.js';
import { TaskDefinitionType } from 'hardhat/types/tasks';

const plugin: HardhatPlugin = {
  id: 'hardhat-tevm-lens',
  hookHandlers: {
    config: () => import('./hooks/config.js'),
  },
  tasks: [
    task('augment-artifacts', 'Augments contract artifacts from build info.')
      .setAction(() => import('./tasks/augment-artifacts/augment-artifacts.js'))
      .build(),
    task('index-functions', 'Creates indexes for all functions.')
      .setAction(() => import('./tasks/index-functions/index-functions.js'))
      .build(),
    task('list-contracts-per-protocol', 'Creates a list of all contracts per protocol.')
      .setAction(() => import('./tasks/list-contracts-per-protocol/list-contracts-per-protocol.js'))
      .build(),
    task('list-protocols', 'Creates a list of all protocols.')
      .setAction(() => import('./tasks/list-protocols.js'))
      .build(),
    task('type-barrel', 'Creates an artifacts index.d.ts for artifacts folder.')
      .setAction(() => import('./tasks/type-barrel.js'))
      .build(),
    {
      type: TaskDefinitionType.TASK_OVERRIDE,
      id: ['build'],
      description: 'Compile contracts and run post-processing',
      action: () => import('./tasks/compile-override.js'),
      options: {},
    },
  ],
};

export default plugin;
