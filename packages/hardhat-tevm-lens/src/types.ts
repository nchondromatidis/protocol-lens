import { z } from 'zod';

// The user's Hardhat configuration, as exported in their config file.
export const ArtifactsAugmentUserConfigSchema = z.object({
  runOnBuild: z.boolean().optional(),
  contracts: z.object({
    path: z.string(),
  }),
  typeBarrel: z.object({
    tsConfig: z.string(),
    includeFolders: z.array(z.string()),
    excludeFolders: z.array(z.string()),
  }),
});

export type ArtifactsAugmentUserConfig = {
  runOnBuild: boolean;
  contracts: {
    path: string;
  };
  typeBarrel: {
    tsConfig: string;
    includeFolders: string[];
    excludeFolders: string[];
  };
};

// The resolved Hardhat configuration.
export type ArtifactsAugmentConfig = ArtifactsAugmentUserConfig;
