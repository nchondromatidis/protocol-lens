# Scope

This project is about analyzing DeFi protocols written in Solidity and run in the EVM.

For each category of DeFi protocol (eg lending, liquid staking, dex) selected protocols are chosen.

The goal is to understand each protocol by showcasing:

- all white-paper topics
- user flows interaction
- source code

So the learning path for each protocol is interaction first.

Readers will be able to interact with the protocol deployed on an evm node running in the browser.

The interactions will gradually build understanding of white-paper topics. When the necessary diagrams, charts and
tables will be added.

For each interaction readers can see the call trace and the storage variables changed in the contracts.

# Technology

This app uses `Astro` with the `Starlight`.

All the interactive areas in the docs use Astro's `Islands architecture`.
