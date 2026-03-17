# PC vs. Source-Map Opcode Index Example

## Bytecode Overview
```

Bytecode: 0x6001600201  (PUSH1 1, PUSH1 2, ADD)
Bytes:    60 01 60 02 01
          ^    ^    ^
          |    |    ADD (1 byte)
          |    PUSH1 0x02 (2 bytes)
          PUSH1 0x01 (2 bytes)

```

## Opcode Index

Opcode index is the instruction number (0, 1, 2), counting complete instructions regardless of their byte size.

Source-map opcode indexes are static positions (like 0, 1, 2) in the compiler-generated source map metadata, 
each linking a specific instruction to its original Solidity source line for debugging

| Opcode Index | Instruction  | Maps to Source Line |
|--------------|--------------|---------------------|
| 0            | first PUSH1  | Line X              |
| 1            | second PUSH1 | Line Y              |
| 2            | ADD          | Line Z              |

## PC


PC (Program Counter) tracks the current byte offset in the deployed bytecode during runtime execution.

| Step | PC (byte offset) | Instruction | Bytes Used | Source-Map Index | Next PC |
|------|------------------|-------------|------------|------------------|---------|
| 1    | 0 → 2            | PUSH1 0x01  | 0-1        | 0                | 2       |
| 2    | 2 → 4            | PUSH1 0x02  | 2-3        | 1                | 4       |
| 3    | 4 → 5            | ADD         | 4          | 2                | 5 (end) |