"use client";

import { WalletProvider } from "@/contexts/WalletContext";
import { TxToastProvider } from "@/components/defi/TransactionToast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <TxToastProvider>{children}</TxToastProvider>
    </WalletProvider>
  );
}

