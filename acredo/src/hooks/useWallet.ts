"use client";

import * as React from "react";
import { useWalletContext } from "@/contexts/WalletContext";

export function useWallet() {
  const ctx = useWalletContext();
  return React.useMemo(() => ctx, [ctx]);
}

