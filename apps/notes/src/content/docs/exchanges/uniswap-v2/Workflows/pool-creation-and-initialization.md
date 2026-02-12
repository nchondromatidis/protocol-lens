---
title: Pool Creation and Initialization
description: Uniswap V2 workflows
sidebar:
  order: 3001
---

## Creating a Pair

A factory contract is used to instantiate new pair contracts for any two arbitrary ERC-20 tokens.

## Seeding Initial Liquidity

The first liquidity provider sets the initial price by depositing both tokens. They are incentivized to deposit an equal
value of both to avoid immediate arbitrage.

## Minting the First LP Tokens

For the initial deposit, the contract mints a number of liquidity tokens equal to $\sqrt{x \cdot y}$, where $x$ and $y$
are the amounts of each token provided.

## Locking Minimum Liquidity

To prevent the value of the smallest unit of liquidity from becoming too high, the protocol permanently burns the first
1,000 units ($10^{-15}$ shares) of liquidity tokens by sending them to the zero address.
