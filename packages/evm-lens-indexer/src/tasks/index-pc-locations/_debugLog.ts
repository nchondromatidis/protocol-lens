import type { PcLocationIndex } from './types';
import type { FunctionIndex } from '../index-functions/types';
import createDebug from 'debug';
import { RangeLookup } from '../../_utils/RangeLookup';

export function debugLog(
  pcLocationsIndexes: PcLocationIndex[],
  functionIndexes: FunctionIndex[],
  debug: ReturnType<typeof createDebug>
): void {
  if (!debug.enabled) return;

  // Group functions by (contractFQN, source) key
  const funcGroups = new Map<string, { start: number; end: number; data: FunctionIndex }[]>();

  for (const func of functionIndexes) {
    const key = `${func.contractFQN}:${func.source}`;
    if (!funcGroups.has(key)) {
      funcGroups.set(key, []);
    }
    funcGroups.get(key)!.push({
      start: func.functionLineStart,
      end: func.functionLineEnd,
      data: func,
    });
  }

  // Build RangeLookup for each group
  const lookupMap = new Map<string, RangeLookup<FunctionIndex>>();
  for (const [key, ranges] of funcGroups) {
    lookupMap.set(key, new RangeLookup<FunctionIndex>(ranges));
  }

  // Process PC locations
  for (const pcLoc of pcLocationsIndexes) {
    for (const [_pc, _jumpType, location, _opcodeName] of pcLoc.pcLocations) {
      const [startLine, endLine, sourceIndex] = location;
      const source = pcLoc.locationSources[sourceIndex];
      const key = `${pcLoc.contractFQN}:${source}`;

      const lookup = lookupMap.get(key);

      const sourceLog = `${_pc} ${source}:${startLine}:${endLine}`;
      const opcodeLog = `${_opcodeName}:${_jumpType}`;

      if (lookup) {
        const range = lookup.findContaining(startLine, endLine);

        if (range) {
          const func = range.data;
          debug(`${sourceLog} -> ${func.name} (${func.selector || 'no selector'}) ${opcodeLog}`);
        } else {
          debug(`${sourceLog} -> [no function] ${opcodeLog}`);
        }
      } else {
        debug(`${sourceLog} -> [no lookup for source] ${opcodeLog}`);
      }
    }
  }
}
