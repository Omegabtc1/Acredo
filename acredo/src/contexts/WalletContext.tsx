"use client";

import * as React from "react";

import { getReputationScore } from "@/lib/contracts";
import {
  initialWalletState,
  type ReputationTier,
  type WalletState,
} from "@/store/wallet";

type WalletContextValue = WalletState & {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshReputation: () => Promise<void>;
  isConnecting: boolean;
};

const WalletContext = React.createContext<WalletContextValue | null>(null);

function tierFromScore(score: number): ReputationTier {
  if (score >= 800) return "A";
  if (score >= 650) return "B";
  if (score >= 450) return "C";
  return "D";
}

function mockAddress() {
  return "SP2C2W7Y0V0K2K7W8Q4B3V1C8R9WQ2D3E4F5G6H7";
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWalletState] = React.useState<WalletState>(initialWalletState);
  const [isConnecting, setIsConnecting] = React.useState(false);

  const setWallet = React.useCallback(
    (patch: Partial<WalletState>) => {
      setWalletState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const reset = React.useCallback(() => {
    setWalletState(initialWalletState);
  }, []);

  const refreshReputation = React.useCallback(async () => {
    const addr = wallet.address;
    if (!addr) return;
    const { score } = await getReputationScore(addr);
    setWallet({ reputationScore: score, reputationTier: tierFromScore(score) });
  }, [setWallet, wallet.address]);

  const connect = React.useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const addr = mockAddress();
      setWallet({
        address: addr,
        bnsName: "acredo.bns",
        isConnected: true,
      });
      const { score } = await getReputationScore(addr);
      setWallet({ reputationScore: score, reputationTier: tierFromScore(score) });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, setWallet]);

  const disconnect = React.useCallback(() => {
    reset();
  }, [reset]);

  React.useEffect(() => {
    // Ensure derived tier stays in sync if score is set elsewhere.
    if (!wallet.address) return;
    void refreshReputation();
  }, [wallet.address, refreshReputation]);

  return (
    <WalletContext.Provider
      value={{
        ...wallet,
        connect,
        disconnect,
        refreshReputation,
        isConnecting,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const ctx = React.useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within <WalletProvider />");
  return ctx;
}

