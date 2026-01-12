import type { LensFunctionIndex } from '../types/artifact.ts';
import { NestedMap } from '../../common/NestedMap.ts';

export const QueryBy = {
  contractFqnAndPC: (contractFQN: string, pc: number) => ({ type: 'index1', contractFQN, pc }) as const,
  contractAndNameOrKind: (contractFQN: string, name: string, orKind: string) =>
    ({ type: 'index2', contractFQN, name, orKind }) as const,
  contractAndSelector: (contractFQN: string, functionSelector: string) =>
    ({ type: 'index3', contractFQN, functionSelector }) as const,
};
type Query = ReturnType<(typeof QueryBy)[keyof typeof QueryBy]>;

export class FunctionIndexesRegistry {
  protected index1 = new NestedMap<[contractFQN: string, pc: number], LensFunctionIndex>();
  protected index2 = new NestedMap<[contractFQN: string, functionNameOrKind: string], LensFunctionIndex>();
  protected index3 = new NestedMap<[contractFQN: string, functionSelector: string], LensFunctionIndex>();

  public async registerFunctionIndexes(functionIndexes: LensFunctionIndex[]) {
    for (const fnIndex of functionIndexes) {
      // create index1
      // TODO: removing it in favor of dynamic function call tracing

      // create index2
      this.index2.setNotDuplicate(fnIndex.contractFQN, fnIndex.nameOrKind, fnIndex);

      // create index3
      if (fnIndex.selector) {
        this.index3.setNotDuplicate(fnIndex.contractFQN, fnIndex.selector, fnIndex);
      }
    }
  }

  public getBy(query: ReturnType<typeof QueryBy.contractFqnAndPC>): LensFunctionIndex | undefined;
  public getBy(query: ReturnType<typeof QueryBy.contractAndSelector>): LensFunctionIndex | undefined;
  public getBy(query: ReturnType<typeof QueryBy.contractAndNameOrKind>): LensFunctionIndex | undefined;
  public getBy(query: Query): LensFunctionIndex | LensFunctionIndex[] | undefined {
    if (query.type === 'index1') {
      return this.index1.get(query.contractFQN, query.pc);
    }
    if (query.type === 'index2') {
      const functionNameOrKind = query.name != '' ? query.name : query.orKind;
      return this.index2.get(query.contractFQN, functionNameOrKind);
    }
    if (query.type === 'index3') {
      return this.index3.get(query.contractFQN, query.functionSelector);
    }
    return undefined;
  }
}
