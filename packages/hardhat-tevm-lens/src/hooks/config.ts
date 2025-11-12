import type { ConfigHooks, HardhatUserConfigValidationError } from 'hardhat/types/hooks';
import type { HardhatConfig } from 'hardhat/types/config';
import { ArtifactsAugmentUserConfigSchema } from '../types.js';

export default async (): Promise<Partial<ConfigHooks>> => {
  return {
    async validateUserConfig(userConfig: any): Promise<HardhatUserConfigValidationError[]> {
      const result = ArtifactsAugmentUserConfigSchema.safeParse(userConfig.artifactsAugment);
      if (!result.success) {
        return [{ path: [], message: JSON.stringify(result.error) }];
      }
      return [];
    },

    async resolveUserConfig(userConfig, resolveConfigurationVariable, next): Promise<HardhatConfig> {
      const partiallyResolvedConfig = await next(userConfig, resolveConfigurationVariable);

      return {
        ...partiallyResolvedConfig,
        artifactsAugment: userConfig.artifactsAugment,
      };
    },
  };
};
