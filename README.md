# Acredo Protocol

Acredo is a structured credit protocol built on Stacks that enables reputation-based lending, NFT-backed loans, and yield-backed borrowing using BNS identity and on-chain activity.

The protocol introduces a credit layer to Bitcoin DeFi by allowing users to access liquidity in multiple ways while enabling liquidity providers to earn yield through decentralized lending markets.

## Core Lending Models

Acredo supports three borrowing mechanisms designed to improve capital efficiency in the Stacks ecosystem.

### Reputation-Based Lending (P2P)

Borrowers with a BNS identity and on-chain history can request loans without full collateral.

Key features

• Reputation score derived from wallet activity and BNS ownership  
• Borrow limits determined by reputation tier  
• Loans funded directly by individual lenders  
• Default events recorded on chain and affect reputation

### NFT-Backed Lending (P2P)

Users can borrow against NFTs without selling them.

Key features

• NFTs locked in escrow during the loan period  
• Borrow limits based on NFT floor price and LTV ratio  
• Repayment releases NFT back to borrower  
• Default transfers NFT to lender

### Yield-Backed Borrowing

Users depositing assets into a yield vault can borrow against projected future yield.

Key features

• Deposit assets to earn APY  
• Borrow against projected yield with a risk haircut  
• Health factor determines liquidation risk  
• Borrowed funds sourced from liquidity pool

## Liquidity Providers

Liquidity providers deposit assets into the protocol to fund borrowers.

LPs earn yield generated from borrower interest and protocol activity.

Liquidity pools currently support

• Yield-backed borrowing pool

Reputation loans and NFT loans are funded through peer-to-peer lenders.

## MVP Scope

The initial Acredo MVP focuses on demonstrating the full lending flow across all three borrowing models.

MVP includes

• Reputation engine and score storage  
• P2P lending marketplace  
• NFT escrow lending  
• Yield vault deposits  
• Borrowing against projected yield  
• Liquidity pool for yield loans  
• Web interface for borrowers and lenders

## Long-Term Vision

Acredo aims to become the credit infrastructure layer for Bitcoin DeFi, enabling more capital-efficient lending markets on Stacks.

Future development may include

• additional collateral types  
• more advanced reputation models  
• deeper DeFi integrations  
• governance and protocol incentives

## License

MIT License
