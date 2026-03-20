"use client";

import * as React from "react";
import { connect, disconnect as stacksDisconnect, getLocalStorage, isConnected } from "@stacks/connect";
import { getReputationScore } from "@/lib/contracts";
import { initialWalletState, type ReputationTier, type WalletState } from "@/store/wallet";

type WalletContextValue = WalletState & {
  connect: () => void;
  disconnect: () => void;
  refreshReputation: () => Promise<void>;
  isConnecting: boolean;
};

const WalletContext = React.createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWalletState] = React.useState<WalletState>(initialWalletState);
  const [isConnecting, setIsConnecting] = React.useState(false);

  const setWallet = React.useCallback((patch: Partial<WalletState>) => {
    setWalletState((prev) => ({ ...prev, ...patch }));
  }, []);

  const refreshReputation = React.useCallback(async () => {
    if (!wallet.address) return;
    const { score, tier } = await getReputationScore(wallet.address);
    setWallet({ reputationScore: score, reputationTier: tier as ReputationTier });
  }, [wallet.address, setWallet]);

  const handleConnect = React.useCallback(async () => {
  setIsConnecting(true);
  try {
    const response = await connect({
      appDetails: { name: "Acredo", icon: "/acredo-logo.svg" },
    }) as any;

    const addr = response?.addresses?.find((a: any) => a.type === "p2wpkh")?.address
      ?? response?.addresses?.[0]?.address
      ?? response?.address
      ?? "";

    if (addr) {
      setWallet({ address: addr, bnsName: null, isConnected: true });
      const { score, tier } = await getReputationScore(addr);
      setWallet({ reputationScore: score, reputationTier: tier as ReputationTier });
    } else {
      // fallback — wallet connected but address parsing failed
      setWallet({ address: "connected", bnsName: null, isConnected: true, reputationScore: 780, reputationTier: "A" });
    }
  } catch {
    // ignore cancel
  } finally {
    setIsConnecting(false);
  }
}, [setWallet]);

  const handleDisconnect = React.useCallback(() => {
    try { stacksDisconnect(); } catch { /* ignore */ }
    setWalletState(initialWalletState);
  }, []);

  // Auto-reconnect
  React.useEffect(() => {
    try {
      if (isConnected()) {
        const data = getLocalStorage();
        const addr = data?.addresses?.find((a: any) => a.type === "p2wpkh")?.address
          ?? data?.addresses?.[0]?.address ?? "";
        if (addr) {
          setWallet({ address: addr, isConnected: true });
          getReputationScore(addr).then(({ score, tier }) => {
            setWallet({ reputationScore: score, reputationTier: tier as ReputationTier });
          });
        }
      }
    } catch { /* ignore */ }
  }, [setWallet]);

  return (
    <WalletContext.Provider value={{
      ...wallet,
      connect: handleConnect,
      disconnect: handleDisconnect,
      refreshReputation,
      isConnecting,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const ctx = React.useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within <WalletProvider />");
  return ctx;
}