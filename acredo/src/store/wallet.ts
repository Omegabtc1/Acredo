export type ReputationTier = "A" | "B" | "C" | "D";

export type WalletState = {
  address: string | null;
  bnsName: string | null;
  isConnected: boolean;
  reputationScore: number;
  reputationTier: ReputationTier;
};

type WalletActions = {
  setWallet: (patch: Partial<WalletState>) => void;
  reset: () => void;
};

export const initialWalletState: WalletState = {
  address: null,
  bnsName: null,
  isConnected: false,
  reputationScore: 0,
  reputationTier: "D",
};
