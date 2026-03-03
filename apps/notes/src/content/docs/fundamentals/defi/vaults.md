---
title: Vaults
sidebar:
  order: 2011
---

[ERC4626](https://eips.ethereum.org/EIPS/eip-4626) is the implementation of a standard API for tokenized Vaults representing shares of a single underlying EIP-20 token.


## Inflation Attack

Even though the latest Open Zeppelin ERC4626 implementation has taken some precautions about inflation attack, 
it is important to analyze because it is a critical aspect of security for tokenized vaults.

### Attack principle

What the attack really needs is a large change in $totalAssets/totalShares$ relative to the vault’s current size;
that’s easier when the vault is empty, but “empty” here just means “low liquidity,” not strictly zero.

If the vault has modest liquidity (e.g., early stages), the attacker can still front‑run a victim by:
- acquiring some shares (possibly with a non‑trivial deposit),
- making a donation large compared to existing assets,
- then letting the victim deposit at the inflated price so the victim receives fewer shares and the attacker exits later at a profit

### Attack example

```solidity
function convertToShares(uint256 assets) public view returns (uint256) {
    if (totalAssets() == 0) return assets;
    return totalSupply() * assets / totalAssets();
}

function convertToAssets(uint256 shares) public view returns (uint256) {
    return totalAssets() * shares / totalSupply();
}
```

| Step | Action                                                | Total Assets | Total Shares | Notes                                                                |
|:-----|:------------------------------------------------------|:-------------|:-------------|:---------------------------------------------------------------------|
| 1.   | Vault is empty.                                       | 0            | 0            | Vulnerable new vault.                                                |
| 2.   | Attacker deposits 0.1 token.                          | 0.1 token    | 1 share      | Attacker owns 100% of shares.                                        |
| 3.   | Frontrun: Donates 100 tokens (no shares minted).      | 100.1 tokens | 1 share      | **Inflates asset value per share.**                                  |
| 4.   | Victim deposits 100 tokens                            | 200.1 tokens | 1 share      | shares = 100/100.1 → 0.99 (rounds down). Victim gets 0 shares.       |
| 5.   | Attacker redeems 1 share, takes entire vault balance. | 0            | 0            | Attacker gets 200.1 tokens. Steals victim's 100 tokens (100% steal). |

### Defence 1: No Zero Shares

**Vault** adds a condition that will deny zero shares.

It makes the attack harder and less profitable.

```solidity
function deposit(uint256 assets) public {
    require(convertToShares(assets) != 0);
    //...
}
```

| Step | Action                                             | Total Assets  | Total Shares | Notes                                                                |
|:-----|:---------------------------------------------------|:--------------|:-------------|:---------------------------------------------------------------------|
| 1.   | Vault is empty.                                    | 0             | 0            | Vulnerable new vault.                                                |
| 2.   | Attacker deposits 0.1 token.                       | 0.1 tokens    | 1 share      | Attacker owns 100% of shares.                                        |
| 3.   | Frontrun: Donates 500 tokens (no shares minted).   | 500.1 tokens  | 1 share      | **Inflates asset value per share.**                                  |
| 4.   | Victim deposits 1000 tokens                        | 1500.1 tokens | 2 shares     | shares = 1000/500.1 → 1.99 (rounds down). Victim gets 1 share.       |
| 5.   | Attacker redeems 1 share, takes 50% vault balance. | 750.05 tokens | 1 share      | Attacker gets 750.05 tokens. Steals victim's 250 tokens (25% steal). |

### Defence 2: Burn Initial Shares

**Vault** adds a condition that will burn X number of shares from the first deposit.

It makes attack even harder, plus hacker can no longer steal funds.

The initial deposit should be big enough to mitigate for this loss.

```solidity
uint constant NUMBER_OF_DEAD_SHARES = 100;

function deposit(uint256 assets) public {
    asset.transferFrom(msg.sender, address(this), assets);
    uint shares = convertToShares(assets);
    
    if (totalShares() == 0) {
        _mint(address(0), NUMBER_OF_DEAD_SHARES);
        shares -= NUMBER_OF_DEAD_SHARES;
    }
    
    _mint(msg.sender, shares);
}
```

| Step | Action                                            | Total Assets | Total Shares | Notes                                                          |
|:-----|:--------------------------------------------------|:-------------|:-------------|:---------------------------------------------------------------|
| 1.   | Vault is empty.                                   | 0            | 0            | Vulnerable new vault.                                          |
| 2.   | Attacker deposits 100 token.                      | 100 tokens   | 0 share      | Attacker owns 100-100=0. 0% of shares.                         |
| 3.   | Frontrun: Donates 2000 tokens (no shares minted). | 2100 tokens  | 0 share      | Attacker burns 2000 tokens.                                    |
| 4.   | Victim deposits 2000 tokens                       | 2100 tokens  | 0 shares     | shares = 2000/2100 → 0.95 (rounds down). Victim gets 0 shares. |
| 5.   | Attacker cannot reddeem.                          | 2100 tokens  | 0 share      | Attacker burns 100% of victim's deposit and looses 2000 tokes. |

### Defence 3: Increase Share Accuracy

**Vault** in increases the shares accuracy by multiplying with a big number.

This is the implementation that [OZ ERC4626](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.6.1/contracts/token/ERC20/extensions/ERC4626.sol) 
currently uses, but you must manually override the `_decimalsOffset` function to increase the precision.

```solidity
function _convertToShares(uint256 assets, Math.Rounding rounding) internal view virtual returns (uint256) {
    return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
}


function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view virtual returns (uint256) {
    return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
}

// YOU MUST OVERRIDE THIS FUNCTION TO INCREASE PRECISION
function _decimalsOffset() internal view virtual returns (uint8) {
    return 6;
}
```

| Step | Action                                                | Total Assets   | Total Shares | Notes                                                                           |
|:-----|:------------------------------------------------------|:---------------|:-------------|:--------------------------------------------------------------------------------|
| 1.   | Vault is empty.                                       | 0              | 0            | Vulnerable new vault.                                                           |
| 2.   | Attacker deposits 1 token.                            | 1 token        | 1 share      | Attacker owns 100% of shares.                                                   |
| 3.   | Frontrun: Donates 1000000 tokens (no shares minted).  | 1000001 tokens | 1 share      | **Inflates asset value per share.**                                             |
| 4.   | Victim deposits 1 tokens                              | 1000002 tokens | 1 share      | shares = 1/1000001 → 0.999999 (rounds down). Victim gets 0 shares.              |
| 5.   | Attacker redeems 1 share, takes entire vault balance. | 0              | 0            | Attacker gets 1000002 tokens. Steals victim's 1 tokens and uses 1000001 tokens. |


The more you increase the decimal offset, the more expensive it is for the attacker.

## Precautions

- **Client** should revert if the amount received is not within a slippage tolerance regardless.


