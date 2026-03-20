<div align="center">

```
█████╗  ██████╗██████╗ ███████╗██████╗  ██████╗ 
██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗██╔═══██╗
███████║██║     ██████╔╝█████╗  ██║  ██║██║   ██║
██╔══██║██║     ██╔══██╗██╔══╝  ██║  ██║██║   ██║
██║  ██║╚██████╗██║  ██║███████╗██████╔╝╚██████╔╝
╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝ 
```

**Structured Credit & Yield Protocol on Stacks**

*Reputation-based lending · NFT-backed loans · Yield-secured borrowing*

---

[![Built on Stacks](https://img.shields.io/badge/Built%20on-Stacks-5546FF?style=flat-square&logo=bitcoin)](https://stacks.co)
[![Language](https://img.shields.io/badge/Contracts-Clarity-orange?style=flat-square)](https://docs.stacks.co/clarity)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Assets](https://img.shields.io/badge/Assets-sBTC%20%7C%20USDCx-yellow?style=flat-square)](https://bitcoin.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Hackathon](https://img.shields.io/badge/DoraHacks-MVP%20Submission-red?style=flat-square)](https://dorahacks.io)

</div>

---

## What is Acredo?

Bitcoin DeFi has no credit layer. Every existing protocol requires you to lock up more collateral than you borrow — 150%, 200%, sometimes more. That's not credit. That's a pawn shop.

Acredo changes that.

We built a structured on-chain lending protocol on Stacks that evaluates **who you are** on-chain, not just what you can lock up. By combining BNS identity, wallet history, NFT collateral, and yield-backed positions into a unified protocol, Acredo enables three distinct borrowing models that don't exist anywhere else on Bitcoin.

> **The thesis:** Your on-chain reputation is collateral. Your future yield is collateral. Your NFTs are collateral. You shouldn't have to choose between your assets and your liquidity.

---

## The Three Borrowing Models

### 🏛️ Reputation-Based Lending
Borrow against your on-chain credibility. If you have a BNS name, a history of DeFi activity, and clean repayment behavior — you can access capital without locking up 150% collateral. Your reputation score (0–1000) determines your tier and borrowing limit.

### 🖼️ NFT-Backed Lending  
Unlock liquidity from illiquid NFTs without selling them. Deposit your NFT into an escrow contract, borrow up to 40% of its floor price in sBTC, repay to get it back. Clean, non-custodial, on-chain.

### 📈 Yield-Backed Borrowing
Deposit USDCx into the Acredo Yield Vault, earn 12%+ APY, and borrow against your **projected future yield** — not your principal. A 10,000 USDCx deposit over 90 days projects ~296 USDCx in yield. Borrow up to 148 USDCx (50% haircut) while your capital keeps earning.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ACREDO PROTOCOL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │  Reputation  │    │   P2P Loan   │    │  NFT Escrow  │     │
│   │   Engine     │───▶│  Marketplace │    │    Vault     │     │
│   │              │    │              │    │              │     │
│   │ score 0-1000 │    │ Create/Fund  │    │ Lock/Release │     │
│   │ Tier A-D     │    │ Repay/Default│    │  Liquidate   │     │
│   └──────────────┘    └──────┬───────┘    └──────┬───────┘     │
│           │                  │                   │             │
│           └──────────────────┼───────────────────┘             │
│                              ▼                                  │
│                   ┌──────────────────┐                          │
│                   │  Liquidity Pool  │                          │
│                   │                 │                          │
│                   │  LP Deposits ──▶│◀── Borrowers Draw        │
│                   │  Earn Interest  │    Repay + Interest       │
│                   └────────┬─────────┘                          │
│                            │                                    │
│                   ┌────────▼─────────┐                          │
│                   │   Yield Vault    │                          │
│                   │                 │                          │
│                   │  Deposit USDCx  │                          │
│                   │  Earn APY       │                          │
│                   │  Borrow Yield   │                          │
│                   └──────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

| Contract | File | Purpose |
|----------|------|---------|
| Reputation | `reputation.clar` | Stores scores, tiers, and default history |
| Loan Factory | `loan-factory.clar` | Creates and indexes loan instances |
| Loan | `loan.clar` | Full lifecycle: fund → repay → default |
| NFT Escrow | `nft-escrow.clar` | Locks NFT collateral, handles release/liquidation |
| Yield Vault | `yield-vault.clar` | Deposits, yield calculation, borrow limit |
| Liquidity Pool | `liquidity-pool.clar` | LP capital management, borrower disbursement |

All contracts are written in **Clarity** and deployed on the **Stacks testnet**.

---

## Reputation System

Scores are computed off-chain from verifiable on-chain signals, then written to `reputation.clar`:

```
Score Inputs:
  ├── Wallet age (days since first tx)
  ├── BNS name ownership + name age
  ├── Transaction volume and recency
  ├── DeFi protocol interactions on Stacks
  └── Historical loan repayment / default record on Acredo

Score → Tier:
  Tier A │ 750 – 1000 │ Highest limits, lowest interest
  Tier B │ 500 – 749  │ Moderate limits and rates
  Tier C │ 250 – 499  │ Lower limits, higher rates
  Tier D │ < 250      │ Borrowing restricted
```

Defaults are recorded permanently on-chain and reduce the score immediately.

---

## Yield Vault Math

```
Projected Yield  =  Deposit × APY × (Duration ÷ 365)
Borrow Limit     =  Projected Yield × 0.50  (50% haircut)
Health Factor    =  (Projected Yield × 0.50) ÷ Current Debt

Example:
  Deposit:          10,000 USDCx
  APY:              12%
  Duration:         90 days
  Projected Yield:  ≈ 296 USDCx
  Borrow Limit:     148 USDCx
  
Health Factor Thresholds:
  ≥ 1.5   🟢  Safe
  1.0–1.5 🟡  Warning — approach repayment
  < 1.0   🔴  Liquidation risk
```

---

## Tech Stack

```
Contracts   Clarity (Stacks smart contract language)
Frontend    Next.js + TypeScript
Web3        Stacks.js + @stacks/connect
Wallet      Hiro Wallet
Assets      sBTC (Bitcoin-backed) · USDCx (stablecoin)
Identity    BNS (Bitcoin Name System)
Testnet     Stacks Nakamoto Testnet
```

---

## Project Structure

```
acredo/
├── contracts/
│   ├── reputation.clar
│   ├── loan-factory.clar
│   ├── loan.clar
│   ├── nft-escrow.clar
│   ├── yield-vault.clar
│   └── liquidity-pool.clar
├── tests/
│   ├── reputation.test.ts
│   ├── loan.test.ts
│   ├── nft-escrow.test.ts
│   ├── yield-vault.test.ts
│   └── liquidity-pool.test.ts
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── borrow/
│   │   ├── marketplace/
│   │   ├── vault/
│   │   ├── pool/
│   │   └── profile/
│   ├── components/
│   │   ├── ReputationWidget/
│   │   ├── HealthFactor/
│   │   ├── LoanCard/
│   │   └── NFTSelector/
│   └── lib/
│       ├── contracts.ts       ← Contract call helpers
│       ├── reputation.ts      ← Score calculation logic
│       └── stacks.ts          ← Stacks.js config
├── Clarinet.toml
├── settings/
│   └── Devnet.toml
└── README.md
```

---

## Getting Started

### Prerequisites

```bash
# Install Clarinet (Stacks contract development tool)
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
sudo mv clarinet /usr/local/bin

# Verify
clarinet --version
```

### Run Contracts Locally

```bash
# Clone the repo
git clone https://github.com/yourusername/acredo
cd acredo

# Start a local Stacks devnet
clarinet integrate

# Run unit tests
clarinet test

# Check a specific contract
clarinet check contracts/reputation.clar
```

### Run the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# → 
## Contract Addresses (Testnet)

| Contract | Address |
|----------|---------|
| `reputation.clar` | `STZXEZTPKZQ9RA55K45MM7YFQQ5D1AKTQ5X62NK4.reputation` |
| `loan-factory.clar` | `STZXEZTPKZQ9RA55K45MM7YFQQ5D1AKTQ5X62NK4.loan-factory` |
| `loan.clar` | `STZXEZTPKZQ9RA55K45MM7YFQQ5D1AKTQ5X62NK4.loan` |
| `nft-escrow.clar` | `STZXEZTPKZQ9RA55K45MM7YFQQ5D1AKTQ5X62NK4.nft-escrow` |
| `yield-vault.clar` | `STZXEZTPKZQ9RA55K45MM7YFQQ5D1AKTQ5X62NK4.yield-vault` |
| `liquidity-pool.clar` | `STZXEZTPKZQ9RA55K45MM7YFQQ5D1AKTQ5X62NK4.liquidity-pool` |

# Start dev server
npm run dev
```

### Deploy to Testnet

```bash
# Deploy all contracts to Stacks testnet
clarinet deployments apply --testnet

# Or deploy individually
clarinet deployments apply --testnet --filter reputation
```

---

## Demo Flow

The full demo walks through all three borrowing models in order:

```
1.  Connect Hiro Wallet
2.  BNS name verified automatically
3.  Reputation score loaded from chain → Tier A displayed
4.  Create reputation-based loan request (0.5 sBTC, 8%, 30d)
5.  Loan appears on marketplace
6.  Switch to lender wallet → fund the loan
7.  Borrower dashboard updates → loan active
8.  Repay loan → score maintained
9.  Select NFT → floor price + max borrow displayed
10. Create NFT loan → NFT transferred to escrow contract
11. Repay NFT loan → NFT returned
12. Deposit 10,000 USDCx into Yield Vault
13. Projected yield + borrow limit calculated
14. Borrow 100 USDCx → health factor shown in green
15. LP wallet deposits into Liquidity Pool → metrics update
```

---

## Revenue Model

| Stream | Mechanism | Rate |
|--------|-----------|------|
| Origination Fee | Charged on loan creation | ~1% of loan amount |
| Interest Spread | Spread between borrower rate and LP yield | Variable |
| Liquidation Fee | Applied when collateral is seized | ~5% of collateral value |
| Vault Yield Spread | Protocol cut of vault APY | ~10% of yield |

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Score, active positions, quick actions |
| Borrow | `/borrow` | 3 tabs: reputation / NFT / yield borrowing |
| Marketplace | `/marketplace` | Browse and fund open loan requests |
| Yield Vault | `/vault` | Deposit, track yield, borrow against it |
| Liquidity Pool | `/pool` | LP deposit, pool metrics, withdraw |
| Profile | `/profile` | Loan history, reputation history |

---

## Contract Addresses (Testnet)

| Contract | Address |
|----------|---------|
| `reputation.clar` | `ST...` *(deploy and update)* |
| `loan-factory.clar` | `ST...` |
| `loan.clar` | `ST...` |
| `nft-escrow.clar` | `ST...` |
| `yield-vault.clar` | `ST...` |
| `liquidity-pool.clar` | `ST...` |

---

## Roadmap

```
NOW          Hackathon MVP
             ├── All 6 contracts on testnet ✓
             ├── Full 3-model borrow flow ✓
             └── End-to-end demo working ✓

NEXT         Post-Hackathon v1
             ├── Mainnet deployment
             ├── Real external yield routing
             ├── Liquidation bot (automated)
             └── Mobile-responsive frontend

LATER        Protocol v2
             ├── Governance module + token
             ├── Cross-chain asset support
             ├── Credit delegation
             └── Credit scoring API (public)
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

*Acredo — Credit infrastructure for Bitcoin DeFi*

**[Demo Video](#) · [Live Testnet](#) · [DoraHacks Submission](#)**

</div>
