import createDebug from 'debug';
import { DEBUG_PREFIX } from '../../../../_common/debug.ts';
import { isJumpDestOpcode, isJumpOpcode } from '../../../opcodes';
import { NestedMap } from '../../../../_common/NestedMap.ts';
import type { OpcodeStoreEntry } from '../store/evm-store-entry.ts';

const debug = createDebug(`${DEBUG_PREFIX}:matchJumpOpcodes`);

export type FunctionEntry = { jumpDest: OpcodeStoreEntry; jumpIn: OpcodeStoreEntry; jumpOut: OpcodeStoreEntry };

export function matchJumpOpcodes(entries: OpcodeStoreEntry[]): FunctionEntry[] {
  const jumpDestEntryPointsPerDepth: FunctionEntry[] = [];

  // context ids
  let nextContextId = 0;
  let callContextId = 0;
  const contextStack: number[] = [];
  const callContextIds: number[] = [];

  for (let i = 0; i < entries.length; i++) {
    const depth = entries[i].evmEvent.depth;
    const nextDepth = entries[i + 1]?.evmEvent.depth ?? depth;

    callContextIds[i] = callContextId;

    if (nextDepth > depth) {
      for (let d = depth; d < nextDepth; d++) {
        contextStack.push(callContextId);
        callContextId = ++nextContextId;
      }
    } else if (nextDepth < depth) {
      for (let d = depth; d > nextDepth; d--) {
        callContextId = contextStack.pop()!;
      }
    }
  }

  // index
  const jumpInJumpDestCandidates = new NestedMap<
    [depth: number, ctxId: number, jumpDestCandidatePc: number],
    { entry: OpcodeStoreEntry; matched: boolean }[]
  >();
  const jumpOutJumpDestCandidates = new NestedMap<
    [depth: number, ctxId: number, jumpDestCandidatePc: number],
    { entry: OpcodeStoreEntry; matched: boolean }[]
  >();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const depth = entry.evmEvent.depth;
    const ctxId = callContextIds[i];

    if (isJumpOpcode(entry.evmEvent.name) && entry.pcLocationIndex.jumpType === 'i') {
      const jumpInJumpDestCandidatePc = parseInt(entry.evmEvent.stack[entry.evmEvent.stack.length - 1]);
      jumpInJumpDestCandidates.push(depth, ctxId, jumpInJumpDestCandidatePc, { entry, matched: false });
    }
    if (isJumpOpcode(entry.evmEvent.name) && entry.pcLocationIndex.jumpType === 'o') {
      const jumpOutJumpDestCandidatePc = parseInt(entry.evmEvent.stack[entry.evmEvent.stack.length - 1]);
      jumpOutJumpDestCandidates.push(depth, ctxId, jumpOutJumpDestCandidatePc, { entry, matched: false });
    }
  }

  // jump-i -> jumpDest -> jump-o, opcode sequence pattern detection
  for (let i = 0; i < entries.length; i++) {
    const jumpDest = entries[i];
    if (!isJumpDestOpcode(jumpDest.evmEvent.name)) continue;

    const jumpDestCtxId = callContextIds[i];

    const candidateJumpInEntries = jumpInJumpDestCandidates.get(
      jumpDest.evmEvent.depth,
      jumpDestCtxId,
      jumpDest.evmEvent.pc
    );
    const candidateJumpOutEntries = jumpOutJumpDestCandidates.get(
      jumpDest.evmEvent.depth,
      jumpDestCtxId,
      parseInt(jumpDest.evmEvent.stack[jumpDest.evmEvent.stack.length - 1 - jumpDest.functionIndex.parameterSlots])
    );

    if (!candidateJumpInEntries || !candidateJumpOutEntries) continue;

    // match one JUMP-i candidate with one JUMP-o candidate - based on JUMP return address match
    const match = candidateJumpInEntries
      .filter((e) => !e.matched)
      .map((jumpIn) => {
        const jumpInJumpOutPcStackValue = parseInt(
          jumpIn.entry.evmEvent.stack.at(-jumpDest.functionIndex.parameterSlots - 2)!
        );
        const jumpOut = candidateJumpOutEntries?.find(
          (e) => !e.matched && parseInt(e.entry.evmEvent.stack.at(-1)!) === jumpInJumpOutPcStackValue
        );
        return jumpOut ? { jumpIn, jumpOut } : undefined;
      })
      .find(Boolean);

    // JUMPDEST matched with one JUMP-i and one JUMP-o
    if (match) {
      match.jumpIn.matched = true;
      match.jumpOut.matched = true;
      jumpDestEntryPointsPerDepth.push({
        jumpDest,
        jumpIn: match.jumpIn.entry,
        jumpOut: match.jumpOut.entry,
      });
      debug('jumpDestEntryPointsPerDepth', {
        depth: jumpDest.evmEvent.depth,
        jumpDestPc: jumpDest.evmEvent.pc,
        jumpIn: match.jumpIn.entry.evmEvent.pc,
        jumpOut: match.jumpOut.entry.evmEvent.pc,
      });
    }
  }

  return jumpDestEntryPointsPerDepth;
}
