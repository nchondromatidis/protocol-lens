import type { EvmStoreEntry } from '../EvmEventStore.ts';
import type { OpcodeStepEvent } from '../events/evm-events.ts';
import type {
  InternalFunctionCallEvent,
  InternalFunctionCallResultEvent,
} from '../../function-call-events/events/function-call-events.ts';

export type OpcodeStepEventEntry = Extract<EvmStoreEntry, { evmEvent: OpcodeStepEvent }>;

export type InternalFunctionCallTraceEvent = InternalFunctionCallEvent | InternalFunctionCallResultEvent;

type Depth = number;
type PC = number;

export function matchJumpOpcodes(entries: OpcodeStepEventEntry[]) {
  const matchedJumpsPerDepth: Map<Depth, Set<PC>> = new Map();
  const jumpInsPerDepth: Map<Depth, { index: number; returnPc: number; matched: boolean }[]> = new Map();

  // Pass 1: Find valid JUMP i/o pairs per depth
  for (let i = 0; i < entries.length; i++) {
    const jumpEntry = entries[i];
    if (jumpEntry.evmEvent.name !== 'JUMP') continue;

    const depth = jumpEntry.evmEvent.depth;

    // init
    if (!matchedJumpsPerDepth.get(depth)) matchedJumpsPerDepth.set(depth, new Set());
    if (!jumpInsPerDepth.get(depth)) jumpInsPerDepth.set(depth, []);

    const matchingJumpIns = matchedJumpsPerDepth.get(depth)!;
    const jumpIns = jumpInsPerDepth.get(depth)!;

    if (
      jumpEntry.pcLocationIndex.jumpType === 'i' &&
      i + 1 < entries.length &&
      entries[i + 1].evmEvent.name === 'JUMPDEST' &&
      jumpEntry.evmEvent.opcodeSequenceNum + 1 == entries[i + 1].evmEvent.opcodeSequenceNum
    ) {
      const jumpEntryInStack = jumpEntry.evmEvent.stack;
      const returnPc = parseInt(jumpEntryInStack[0]);
      jumpIns.push({ index: i, returnPc, matched: false });
    }

    if (jumpEntry.pcLocationIndex.jumpType === 'o') {
      const jumpOutStack = jumpEntry.evmEvent.stack;
      const jumpOutRet = parseInt(jumpOutStack[0]);
      for (let j = jumpIns.length - 1; j >= 0; j--) {
        if (jumpIns[j].returnPc === jumpOutRet && !jumpIns[j].matched) {
          matchingJumpIns.add(jumpIns[j].index);
          jumpIns[j].matched = true;
          break;
        }
      }
    }
  }

  return matchedJumpsPerDepth;
}

// TODO: fix, emit ExternalFunctionCallEvents, ExternalFunctionCallResultEvents when depth changes
export function generateFunctionCallEventsFromMatchedJumpOpcodes(
  entries: OpcodeStepEventEntry[],
  matchedJumpsPerDepth: Map<Depth, Set<PC>>
): InternalFunctionCallTraceEvent[] {
  // Pass 2: Emit enter + result events into one list
  const events: InternalFunctionCallTraceEvent[] = [];
  let nextFunctionCallId = 1;

  const functionCallIdStack: number[] = [];
  const metaById = new Map<number, { contractFQN: string; functionName: string }>();

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.evmEvent.name !== 'JUMP') continue;

    const depth = e.evmEvent.depth;
    const validJumpIns = matchedJumpsPerDepth.get(depth)!;

    // Enter (JUMP i)
    if (e.pcLocationIndex.jumpType === 'i' && validJumpIns.has(i)) {
      const jumpDest = entries[i + 1]; // guaranteed by pass1 conditions
      const contractFQN = jumpDest.functionIndex.contractFQN;
      const functionName = jumpDest.functionIndex.name;
      const parameterSlots = jumpDest.functionIndex.parameterSlots;

      const stack = jumpDest.evmEvent.stack;
      const functionCallId = nextFunctionCallId++;

      const internalFunctionCallEvent: InternalFunctionCallEvent = {
        _type: 'InternalFunctionCallEvent',
        functionCallId,
        contractFQN,
        functionName,
        opcodeStepEvent: jumpDest.evmEvent,
        entryPc: parseInt(stack[stack.length - 1], 10),
        opcodeSequenceNum: e.evmEvent.opcodeSequenceNum,
        parameterSlots,
        argumentData: Array.from({ length: parameterSlots }, (_, j) => stack[stack.length - 2 - j]),
      };
      events.push(internalFunctionCallEvent);

      functionCallIdStack.push(functionCallId);
      metaById.set(functionCallId, { contractFQN, functionName });
      continue;
    }

    // Exit (JUMP o)
    if (e.pcLocationIndex.jumpType === 'o' && functionCallIdStack.length > 0) {
      const functionCallId = functionCallIdStack.pop()!;
      const meta = metaById.get(functionCallId);
      if (!meta) continue;

      const returnSlots = e.functionIndex.returnSlots;
      const returnData = returnSlots > 0 ? e.evmEvent.stack.slice(-(returnSlots + 1), -1).reverse() : [];

      const internalFunctionCallResultEvent: InternalFunctionCallResultEvent = {
        _type: 'InternalFunctionCallResultEvent',
        functionCallId,
        contractFQN: meta.contractFQN,
        functionName: meta.functionName,
        opcodeStepEvent: e.evmEvent,
        exitPc: e.evmEvent.pc,
        opcodeSequenceNum: e.evmEvent.opcodeSequenceNum,
        returnSlots,
        returnData,
      };
      events.push(internalFunctionCallResultEvent);
    }
  }

  return events;
}
