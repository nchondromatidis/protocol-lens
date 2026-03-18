import type { OpcodeStoreEntry } from '../store/evm-store-entry.ts';
import { SourceMapper } from '../../../source-map/SourceMapper.ts';

export function sourceMapOpcodes(entries: OpcodeStoreEntry[], sourceMapper: SourceMapper) {
  for (const entry of entries) {
    sourceMapper.findContainingFunction(entry.pcLocationIndex);
  }
}
