import createDebug from 'debug';
import { DEBUG_PREFIX } from '../../_common/debug.ts';
import { RangeLookup } from './RangeLookup.ts';
import type { LensFunctionIndex, PcLocationReadable } from '../types.ts';

const debug = createDebug(`${DEBUG_PREFIX}:SourceMapper`);

export class SourceMapper {
  private lookupMap = new Map<string, RangeLookup<LensFunctionIndex>>();

  async register(functionIndexes: LensFunctionIndex[]) {
    // Group functions by (contractFQN, source) key
    const funcGroups = new Map<string, { start: number; end: number; data: LensFunctionIndex }[]>();
    for (const func of functionIndexes) {
      const key = func.source;
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
    for (const [key, ranges] of funcGroups) {
      this.lookupMap.set(key, new RangeLookup<LensFunctionIndex>(ranges));
    }
  }

  reset() {
    this.lookupMap.clear();
  }

  findContainingFunction(pcLoc: PcLocationReadable): void {
    const { pc, startLine, endLine, sourceName, opcodeName, jumpType } = pcLoc;

    const lookup = this.lookupMap.get(sourceName);

    const sourceLog = `${pc} ${sourceName}:${startLine}:${endLine}`;
    const opcodeLog = `${opcodeName}:${jumpType}`;

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
