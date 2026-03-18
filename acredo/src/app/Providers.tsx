"use client";

import { TxToastProvider } from "@/components/defi/TransactionToast";
import { WalletProvider } from "@/contexts/WalletContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <TxToastProvider>{children}</TxToastProvider>
    </WalletProvider>
  );
}

