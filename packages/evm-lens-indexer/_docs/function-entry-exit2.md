## Detect internal function call

```solidity
function add(uint256 a, uint256 b) internal pure returns (uint256) { return a + b; }
function compute() public pure returns (uint256) { return add(3, 7); }
```

```
Offset  Opcode    Operand   Stack BEFORE opcode (top → bottom)           Notes
──────────────────────────────────────────────────────────────────────────────────────────────
──── CALL SITE inside compute() ──────────────────────────────────────────────────────────────
0x10    JUMPDEST            [...]                              entry of compute(); valid jump landing
0x11    PUSH1     0x25      [...]                             ① pushes RETURN ADDRESS 0x25 — no consume
0x13    PUSH1     0x03      [0x25, ...]                       ② pushes argument a=3 — no consume
0x15    PUSH1     0x07      [0x03, 0x25, ...]                 ③ pushes argument b=7 — no consume
0x17    PUSH1     0x30      [0x07, 0x03, 0x25, ...]           ④ pushes FUNCTION ENTRY 0x30 — no consume
0x19    JUMP                [<0x30>, 0x07, 0x03, 0x25, ...]   ⑤ JUMP-IN: consumes <0x30>, PC → 0x30; ret_addr buried safely under args

──── FUNCTION BODY add(a, b) at 0x30 ─────────────────────────────────────────────────────────
0x30    JUMPDEST            [0x07, 0x03, 0x25, ...]           valid landing pad — function entry; top=b=7, next=a=3, bottom=ret_addr
0x31    ADD                 [<0x07>, <0x03>, 0x25, ...]       pops <b=7> and <a=3>, pushes result 0x0A(10)
0x32    SWAP1               [0x0A, 0x25, ...]                 swaps top two: ret_addr 0x25 floats up, result 0x0A sinks below
0x33    JUMP                [<0x25>, 0x0A, ...]               ⑥ JUMP-OUT: consumes <ret_addr=0x25>, PC → 0x25; result=10 left on top for caller

──── RETURN LANDING PAD back in compute() at 0x25 ────────────────────────────────────────────
0x25    JUMPDEST            [0x0A, ...]                       ⑦ landed back in compute(); result=10 on top, ready to use
0x26    PUSH1     0x40      [0x0A, ...]                       pushes memory offset 0x40 — no consume
0x28    MSTORE              [<0x40>, <0x0A>, ...]             consumes <offset=0x40> and <value=10>; stores 10 at mem[0x40]
0x29    PUSH1     0x20      [...]                             pushes return size = 32 bytes — no consume
0x2B    PUSH1     0x40      [0x20, ...]                       pushes memory offset 0x40 — no consume
0x2D    RETURN              [<0x40>, <0x20>, ...]             consumes <offset=0x40> and <size=0x20>; returns mem[0x40..0x60] → result = 10 ✓
```