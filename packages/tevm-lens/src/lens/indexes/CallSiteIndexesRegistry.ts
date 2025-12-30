import { NestedMap } from '../../common/NestedMap.ts';
import type { LensCallSiteIndex } from '../types/artifact.ts';

export class CallSiteIndexesRegistry {
  protected callSitesIndex = new NestedMap<[contractFQN: string, callSitePc: number], LensCallSiteIndex>();

  public async registerCallSiteIndexes(indexes: Array<LensCallSiteIndex>) {
    for (const index of indexes) {
      this.callSitesIndex.setNotDuplicate(index.contractFQN, index.callSitePc, index);
    }
  }

  public getCallSiteIndexBy(contractFQN: string, callSitePc: number): LensCallSiteIndex | undefined {
    return this.callSitesIndex.get(contractFQN, callSitePc);
  }
}
