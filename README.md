<img src="artwork.png" width="100%" alt="DeFi Notes Artwork" />

---

<h1 align="center">DeFi Notes</h1>

<p align="center">
    <b>A platform for analyzing EVM DeFi protocols written in Solidity.</b>
    </br>
    <b>Protocol interaction call traces, source code, whitepaper concepts. </b>
</p>

---

## Project Structure

This is a PNPM monorepo with the following packages:

| Package | Description |
|---------|-------------|
| [`@defi-notes/notes`](apps/notes/) | DeFi protocol analysis app |
| [`@defi-notes/evm-lens`](packages/evm-lens/) | EVM transaction call tracer (browser-native) |
| [`@defi-notes/evm-lens-indexer`](packages/evm-lens-indexer/) | Hardhat plugin for building trace indexes |
| [`@defi-notes/evm-lens-ui`](packages/evm-lens-ui/) | React UI components for call trace visualization |
| [`@defi-notes/protocols`](packages/protocols/) | DeFi protocol source code and pre-built indexes |
| [`@defi-notes/workflows`](packages/workflows/) | Workflow logic and UI components for DeFi analysis |
| [`@defi-notes/config`](packages/config/) | Shared ESLint, Prettier, and TSConfig |


## Prerequisites

- Node.js 18+
- PNPM 10.28.2+

## Installation

```bash
git submodule update --init --recursive
pnpm install
pnpm --filter @defi-notes/notes dev
```

## Development

```bash
pnpm run check:types    # Type check all packages
pnpm run lint:fix       # Auto-fix lint issues

# Run tests (evm-lens)
pnpm --filter @defi-notes/evm-lens test
```

## Tech Stack

TypeScript, PNPM workspaces, React, Tailwind CSS, shadcn/ui, Astro Starlight, tevm, viem, Hardhat
