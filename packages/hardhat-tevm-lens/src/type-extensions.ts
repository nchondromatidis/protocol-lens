import 'hardhat/types/config';
import type { ArtifactsAugmentConfig, ArtifactsAugmentUserConfig } from './types.js';

declare module 'hardhat/types/config' {
  interface HardhatUserConfig {
    artifactsAugment: ArtifactsAugmentUserConfig;
  }

  interface HardhatConfig {
    artifactsAugment: ArtifactsAugmentConfig;
  }
}
