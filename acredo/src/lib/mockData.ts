export type TokenSymbol = "SBTC" | "USDCX";

export type ReputationTier = "A" | "B" | "C" | "D";

export type WalletData = {
  address: string;
  bnsName: string;
  walletAgeDays: number;
  isConnected: boolean;
  balances: Record<TokenSymbol, number>;
  reputationScore: number; // 0–1000
  reputationTier: ReputationTier;
  loansRepaid: number;
  loansDefaulted: number;
};

export type LoanRequest = {
  id: string;
  borrower: string;
  tier: ReputationTier;
  amountSBTC: number;
  rateApr: number; // e.g. 0.14 for 14%
  durationDays: number;
  createdAt: string; // ISO
};

export type ActiveLoan = {
  id: string;
  type: "reputation" | "nft" | "yield";
  principal: { symbol: TokenSymbol; amount: number };
  rateApr: number;
  startDate: string; // ISO
  dueDate: string; // ISO
  status: "active" | "repaid" | "defaulted";
};

export type NFTItem = {
  id: string;
  collection: string;
  name: string;
  image: string;
  floorPriceSBTC: number;
  liquiditySBTC: number;
};

export type PoolMetrics = {
  tvlUSDCX: number;
  apy: number;
  utilization: number; // 0..1
};

export type VaultPosition = {
  depositUSDCX: number;
  apy: number;
  startDate: string; // ISO
};

export type LoanHistoryItem = {
  id: string;
  type: ActiveLoan["type"];
  symbol: TokenSymbol;
  amount: number;
  rateApr: number;
  durationDays: number;
  status: ActiveLoan["status"];
  createdAt: string; // ISO
  closedAt?: string; // ISO
};

export const walletData: WalletData = {
  address: "SP2C2W7Y0V0K2K7W8Q4B3V1C8R9WQ2D3E4F5G6H7",
  bnsName: "acredo.bns",
  walletAgeDays: 412,
  isConnected: false,
  balances: {
    SBTC: 1.284,
    USDCX: 12450,
  },
  reputationScore: 742,
  reputationTier: "B",
  loansRepaid: 18,
  loansDefaulted: 1,
};

export const loanRequests: LoanRequest[] = [
  {
    id: "lr_001",
    borrower: "SP3A…N9Q2",
    tier: "A",
    amountSBTC: 0.18,
    rateApr: 0.11,
    durationDays: 30,
    createdAt: "2026-03-16T12:10:00.000Z",
  },
  {
    id: "lr_002",
    borrower: "SP1B…Q7K4",
    tier: "B",
    amountSBTC: 0.32,
    rateApr: 0.14,
    durationDays: 45,
    createdAt: "2026-03-16T18:45:00.000Z",
  },
  {
    id: "lr_003",
    borrower: "SP4F…8T1M",
    tier: "C",
    amountSBTC: 0.12,
    rateApr: 0.19,
    durationDays: 21,
    createdAt: "2026-03-17T07:20:00.000Z",
  },
  {
    id: "lr_004",
    borrower: "SP2D…2P0X",
    tier: "B",
    amountSBTC: 0.55,
    rateApr: 0.16,
    durationDays: 60,
    createdAt: "2026-03-17T10:05:00.000Z",
  },
  {
    id: "lr_005",
    borrower: "SP5J…K1A8",
    tier: "D",
    amountSBTC: 0.09,
    rateApr: 0.26,
    durationDays: 14,
    createdAt: "2026-03-17T13:40:00.000Z",
  },
  {
    id: "lr_006",
    borrower: "SP6Q…M7H2",
    tier: "A",
    amountSBTC: 0.75,
    rateApr: 0.10,
    durationDays: 90,
    createdAt: "2026-03-17T21:10:00.000Z",
  },
  {
    id: "lr_007",
    borrower: "SP7P…W3Z9",
    tier: "C",
    amountSBTC: 0.24,
    rateApr: 0.20,
    durationDays: 35,
    createdAt: "2026-03-18T01:15:00.000Z",
  },
  {
    id: "lr_008",
    borrower: "SP8R…V6B4",
    tier: "B",
    amountSBTC: 0.41,
    rateApr: 0.15,
    durationDays: 28,
    createdAt: "2026-03-18T03:55:00.000Z",
  },
];

export const activeLoans: ActiveLoan[] = [
  {
    id: "al_101",
    type: "reputation",
    principal: { symbol: "SBTC", amount: 0.28 },
    rateApr: 0.14,
    startDate: "2026-02-28T10:00:00.000Z",
    dueDate: "2026-04-14T10:00:00.000Z",
    status: "active",
  },
  {
    id: "al_102",
    type: "nft",
    principal: { symbol: "SBTC", amount: 0.16 },
    rateApr: 0.18,
    startDate: "2026-03-05T10:00:00.000Z",
    dueDate: "2026-04-04T10:00:00.000Z",
    status: "active",
  },
  {
    id: "al_103",
    type: "yield",
    principal: { symbol: "USDCX", amount: 600 },
    rateApr: 0.12,
    startDate: "2026-03-12T10:00:00.000Z",
    dueDate: "2026-06-10T10:00:00.000Z",
    status: "active",
  },
];

export const nftCollection: NFTItem[] = [
  {
    id: "nft_001",
    collection: "Acredo Genesis",
    name: "Genesis #021",
    image: "/nfts/genesis-021.png",
    floorPriceSBTC: 1.12,
    liquiditySBTC: 42.6,
  },
  {
    id: "nft_002",
    collection: "Acredo Genesis",
    name: "Genesis #144",
    image: "/nfts/genesis-144.png",
    floorPriceSBTC: 0.86,
    liquiditySBTC: 28.3,
  },
  {
    id: "nft_003",
    collection: "Cyber Relics",
    name: "Relic #009",
    image: "/nfts/relic-009.png",
    floorPriceSBTC: 0.54,
    liquiditySBTC: 19.1,
  },
];

export const poolMetrics: PoolMetrics = {
  tvlUSDCX: 8_420_000,
  apy: 0.083,
  utilization: 0.62,
};

export const vaultPosition: VaultPosition = {
  depositUSDCX: 9_500,
  apy: 0.092,
  startDate: "2026-01-20T10:00:00.000Z",
};

export const loanHistory: LoanHistoryItem[] = [
  {
    id: "lh_201",
    type: "reputation",
    symbol: "SBTC",
    amount: 0.12,
    rateApr: 0.15,
    durationDays: 30,
    status: "repaid",
    createdAt: "2025-12-08T10:00:00.000Z",
    closedAt: "2026-01-07T10:00:00.000Z",
  },
  {
    id: "lh_202",
    type: "nft",
    symbol: "SBTC",
    amount: 0.18,
    rateApr: 0.20,
    durationDays: 21,
    status: "repaid",
    createdAt: "2026-01-25T10:00:00.000Z",
    closedAt: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "lh_203",
    type: "reputation",
    symbol: "SBTC",
    amount: 0.08,
    rateApr: 0.22,
    durationDays: 14,
    status: "defaulted",
    createdAt: "2025-10-03T10:00:00.000Z",
    closedAt: "2025-10-20T10:00:00.000Z",
  },
  {
    id: "lh_204",
    type: "yield",
    symbol: "USDCX",
    amount: 500,
    rateApr: 0.12,
    durationDays: 60,
    status: "repaid",
    createdAt: "2025-11-12T10:00:00.000Z",
    closedAt: "2026-01-11T10:00:00.000Z",
  },
];

