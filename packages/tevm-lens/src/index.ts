import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { buildClient } from './lens/client.ts';
import { ArtifactsProvider } from './lens/indexes/ArtifactsProvider.ts';
import { FunctionIndexesRegistry } from './lens/indexes/FunctionIndexesRegistry.ts';
import { DebugMetadata } from './lens/indexes/DebugMetadata.ts';
import { AddressLabeler } from './lens/indexes/AddressLabeler.ts';
import { ExternalCallHandler } from './lens/opcode-handlers/ExternalCallHandler.ts';
import { ExternalCallResultHandler } from './lens/opcode-handlers/ExternalCallResultHandler.ts';
import { FunctionEntryHandler } from './lens/opcode-handlers/FunctionEntryHandler.ts';
import { FunctionExitHandler } from './lens/opcode-handlers/FunctionExitHandler.ts';
import { TxTracer } from './lens/tx-tracer/TxTracer.ts';
import { LensClient } from './lens/LensClient.ts';
import type { LensArtifactsMap } from './lens/types/artifact.ts';

export async function buildTracer<
  ArtifactMapT extends object,
  LensArtifactsMapT extends LensArtifactsMap<ArtifactMapT> = LensArtifactsMap<ArtifactMapT>,
>() {
  const deployerAccount = privateKeyToAccount(generatePrivateKey());
  const client = await buildClient(deployerAccount);

  const artifactsProvider = new ArtifactsProvider();
  const functionIndexesRegistry = new FunctionIndexesRegistry();
  const debugMetadata = new DebugMetadata(artifactsProvider, functionIndexesRegistry);

  const addressLabeler = new AddressLabeler();
  const externalCallHandler = new ExternalCallHandler(debugMetadata, addressLabeler);
  const externalCallResultHandler = new ExternalCallResultHandler(debugMetadata, addressLabeler);
  const functionEntryHandler = new FunctionEntryHandler(debugMetadata, addressLabeler);
  const functionExitHandler = new FunctionExitHandler(debugMetadata, addressLabeler);

  const tracer = new TxTracer(
    externalCallHandler,
    externalCallResultHandler,
    functionEntryHandler,
    functionExitHandler
  );

  const lensClient = new LensClient<LensArtifactsMapT>(client, debugMetadata, addressLabeler, tracer);

  return {
    deployerAccount,
    client,
    artifactsProvider,
    functionIndexesRegistry,
    debugMetadata,
    addressLabeler,
    externalCallHandler,
    externalCallResultHandler,
    functionEntryHandler,
    functionExitHandler,
    tracer,
    lensClient,
  };
}
