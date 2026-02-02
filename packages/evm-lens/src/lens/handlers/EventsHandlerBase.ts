import { DebugMetadata } from '../indexes/DebugMetadata.ts';
import { AddressLabeler } from '../indexes/AddressLabeler.ts';

export abstract class EventsHandlerBase {
  constructor(
    protected readonly debugMetadata: DebugMetadata,
    protected readonly addressLabeler: AddressLabeler
  ) {}
}
