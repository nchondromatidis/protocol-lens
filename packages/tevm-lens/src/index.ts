import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { buildClient } from './adapters/client.ts';
import { ArtifactsProvider } from './lens/indexes/ArtifactsProvider.ts';
import { FunctionIndexesRegistry } from './lens/indexes/FunctionIndexesRegistry.ts';
import { DebugMetadata } from './lens/indexes/DebugMetadata.ts';
import { AddressLabeler } from './lens/indexes/AddressLabeler.ts';
import { ExternalCallHandler } from './lens/handlers/call-trace-event-handlers/ExternalCallHandler.ts';
import { ExternalCallResultHandler } from './lens/handlers/call-trace-event-handlers/ExternalCallResultHandler.ts';
import { FunctionEntryHandler } from './lens/handlers/call-trace-event-handlers/FunctionEntryHandler.ts';
import { FunctionExitHandler } from './lens/handlers/call-trace-event-handlers/FunctionExitHandler.ts';
import { CallTracer } from './lens/CallTracer.ts';
import { LensClient } from './adapters/LensClient.ts';
import type { LensArtifactsMap } from './lens/types.ts';
import { PcLocationIndexesRegistry } from './lens/indexes/PcLocationIndexesRegistry.ts';
import { OpcodeMatcher } from './lens/handlers/evm-events-handlers/OpcodeMatcher.ts';
import { EvmEventsHandler } from './lens/handlers/EvmEventsHandler.ts';
import { EventStore } from './lens/handlers/evm-events-handlers/EventStore.ts';
import { CallTraceEventHandler } from './lens/handlers/CallTraceEventHandler.ts';

export async function buildCallTracer<
  ArtifactMapT extends object,
  LensArtifactsMapT extends LensArtifactsMap<ArtifactMapT> = LensArtifactsMap<ArtifactMapT>,
>() {
  const deployerAccount = privateKeyToAccount(generatePrivateKey());
  const client = await buildClient(deployerAccount);

  const artifactsProvider = new ArtifactsProvider();
  const functionIndexesRegistry = new FunctionIndexesRegistry();
  const pcLocationIndexesRegistry = new PcLocationIndexesRegistry();
  const debugMetadata = new DebugMetadata(artifactsProvider, functionIndexesRegistry, pcLocationIndexesRegistry);

  const addressLabeler = new AddressLabeler();
  // call trace event handlers
  const externalCallHandler = new ExternalCallHandler(debugMetadata, addressLabeler);
  const externalCallResultHandler = new ExternalCallResultHandler(debugMetadata, addressLabeler);
  const functionEntryHandler = new FunctionEntryHandler(debugMetadata, addressLabeler);
  const functionExitHandler = new FunctionExitHandler(debugMetadata, addressLabeler);
  const callTraceEventHandler = new CallTraceEventHandler(
    externalCallHandler,
    externalCallResultHandler,
    functionEntryHandler,
    functionExitHandler
  );
  // evm events handlers
  const eventStore = new EventStore(debugMetadata, addressLabeler);
  const opcodeMatcher = new OpcodeMatcher(debugMetadata, addressLabeler);
  const evmEventsHandler = new EvmEventsHandler(eventStore, opcodeMatcher);

  const tracer = new CallTracer(evmEventsHandler, callTraceEventHandler);

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
