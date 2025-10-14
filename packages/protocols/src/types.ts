import type {ArtifactMap} from "hardhat/types/artifacts";

export type { ArtifactMap, LinkReferences, ImmutableReferences } from 'hardhat/types/artifacts';

export type ProtocolArtifact = ArtifactMap[keyof ArtifactMap];

