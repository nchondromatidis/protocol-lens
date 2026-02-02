import { TEST_RESOURCES_PATH, HardhatEvmLensFileRL } from './HardhatEvmLensFileRL.ts';
import { ETHER_1 } from './utils/constants.ts';
import type { LensArtifact, LensArtifactsMap } from '../../src/lens/types.ts';
import { buildCallTracer } from '../../src/lens';

export type LensArtifactsMapSlice<MapT extends LensArtifactsMap<any>, RootT extends string, ProjectT extends string> = {
  [K in keyof MapT as MapT[K] extends LensArtifact
    ? MapT[K]['sourceName'] extends `${RootT}/${ProjectT}/${string}`
      ? K
      : never
    : never]: MapT[K];
};

type ExtractRoot<MapT extends LensArtifactsMap<any>> = {
  [K in keyof MapT]: MapT[K] extends LensArtifact
    ? MapT[K]['sourceName'] extends `${infer R}/${string}`
      ? R
      : never
    : never;
}[keyof MapT];

type ExtractProject<MapT extends LensArtifactsMap<any>, RootT extends string> = {
  [K in keyof MapT]: MapT[K] extends LensArtifact
    ? MapT[K]['sourceName'] extends `${RootT}/${infer P}/${any}`
      ? P
      : never
    : never;
}[keyof MapT];

export function createLensTracerTestSetup<MapT extends LensArtifactsMap<any>>(
  resourcesPath: string = TEST_RESOURCES_PATH
) {
  return async function lensTracerTestSetup<
    RootT extends ExtractRoot<MapT>,
    ProjectNameT extends ExtractProject<MapT, RootT>,
  >(root: RootT, projectName: ProjectNameT) {
    const resourceLoader = new HardhatEvmLensFileRL(resourcesPath, root);
    const { lensClient, deployerAccount, client } =
      await buildCallTracer<LensArtifactsMapSlice<MapT, RootT, ProjectNameT>>();

    await lensClient.registerIndexes(resourceLoader, projectName);

    await lensClient.fundAccount(deployerAccount.address, ETHER_1);

    return { lensClient, resourceLoader, client };
  };
}
