import { fakeTxid } from "@/lib/format";

export type TxResult = { txid: string };

async function mockTx(delayMs = 650): Promise<TxResult> {
  await new Promise((r) => setTimeout(r, delayMs));
  return { txid: fakeTxid() };
}

// ALL blockchain calls go here (Phase 4). All return mock txid.

export async function getReputationScore(_address: string) {
  await new Promise((r) => setTimeout(r, 200));
  // mock score is deterministic-ish per address length
  const score = Math.max(0, Math.min(1000, 520 + (_address.length % 481)));
  return { score };
}

export async function createLoan(_params: {
  amount: number;
  symbol: "SBTC" | "USDCX";
  durationDays: number;
  rateApr: number;
}) {
  return await mockTx();
}

export async function fundLoan(_loanRequestId: string) {
  return await mockTx();
}

export async function repayLoan(_loanId: string) {
  return await mockTx();
}

export async function lockNFT(_params: { nftId: string; maxBorrowSBTC: number }) {
  return await mockTx();
}

export async function releaseNFT(_nftId: string) {
  return await mockTx();
}

export async function depositToVault(_amountUSDCX: number) {
  return await mockTx();
}

export async function borrowAgainstYield(_amountUSDCX: number) {
  return await mockTx();
}

export async function depositToPool(_params: { symbol: "SBTC" | "USDCX"; amount: number }) {
  return await mockTx();
}

export async function withdrawFromPool(_params: { symbol: "SBTC" | "USDCX"; amount: number }) {
  return await mockTx();
}

