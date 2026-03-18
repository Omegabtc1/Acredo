"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { poolMetrics } from "@/lib/mockData";
import { depositToPool, withdrawFromPool } from "@/lib/contracts";
import { useTxToasts } from "@/components/defi/TransactionToast";
import { useWallet } from "@/hooks/useWallet";

type TabKey = "lending" | "yield";

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString(undefined, opts);
}

function parseAmount(v: string) {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function PoolPage() {
  const { isConnected } = useWallet();
  const { pushTxToast } = useTxToasts();

  const [tab, setTab] = React.useState<TabKey>("lending");

  // simple local balances to show interaction
  const [lendingBalanceSBTC, setLendingBalanceSBTC] = React.useState(0);
  const [yieldBalanceUSDCX, setYieldBalanceUSDCX] = React.useState(0);

  const [lendAmount, setLendAmount] = React.useState("");
  const [lendWithdrawing, setLendWithdrawing] = React.useState("");
  const [lendLoading, setLendLoading] = React.useState(false);

  const [yieldAmount, setYieldAmount] = React.useState("");
  const [yieldWithdrawing, setYieldWithdrawing] = React.useState("");
  const [yieldLoading, setYieldLoading] = React.useState(false);

  const lendDepositNum = parseAmount(lendAmount);
  const lendWithdrawNum = parseAmount(lendWithdrawing);
  const yieldDepositNum = parseAmount(yieldAmount);
  const yieldWithdrawNum = parseAmount(yieldWithdrawing);

  const tvl = poolMetrics.tvlUSDCX;
  const apy = poolMetrics.apy;
  const util = poolMetrics.utilization;

  async function handleLendDeposit() {
    if (!isConnected || lendDepositNum <= 0 || lendLoading) return;
    setLendLoading(true);
    try {
      const { txid } = await depositToPool({ symbol: "SBTC", amount: lendDepositNum });
      pushTxToast("Deposit to SBTC lending pool", txid);
      setLendingBalanceSBTC((b) => b + lendDepositNum);
      setLendAmount("");
    } finally {
      setLendLoading(false);
    }
  }

  async function handleLendWithdraw() {
    if (
      !isConnected ||
      lendWithdrawNum <= 0 ||
      lendWithdrawNum > lendingBalanceSBTC ||
      lendLoading
    )
      return;
    setLendLoading(true);
    try {
      const { txid } = await withdrawFromPool({
        symbol: "SBTC",
        amount: lendWithdrawNum,
      });
      pushTxToast("Withdraw from SBTC lending pool", txid);
      setLendingBalanceSBTC((b) => Math.max(0, b - lendWithdrawNum));
      setLendWithdrawing("");
    } finally {
      setLendLoading(false);
    }
  }

  async function handleYieldDeposit() {
    if (!isConnected || yieldDepositNum <= 0 || yieldLoading) return;
    setYieldLoading(true);
    try {
      const { txid } = await depositToPool({ symbol: "USDCX", amount: yieldDepositNum });
      pushTxToast("Deposit to USDCX yield pool", txid);
      setYieldBalanceUSDCX((b) => b + yieldDepositNum);
      setYieldAmount("");
    } finally {
      setYieldLoading(false);
    }
  }

  async function handleYieldWithdraw() {
    if (
      !isConnected ||
      yieldWithdrawNum <= 0 ||
      yieldWithdrawNum > yieldBalanceUSDCX ||
      yieldLoading
    )
      return;
    setYieldLoading(true);
    try {
      const { txid } = await withdrawFromPool({
        symbol: "USDCX",
        amount: yieldWithdrawNum,
      });
      pushTxToast("Withdraw from USDCX yield pool", txid);
      setYieldBalanceUSDCX((b) => Math.max(0, b - yieldWithdrawNum));
      setYieldWithdrawing("");
    } finally {
      setYieldLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pools</h1>
          <p className="text-sm text-muted">
            TVL, APY, and utilization across SBTC lending and USDCX yield pools.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/borrow">Borrow</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vault">Vault</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Pool Metrics</CardTitle>
            <CardDescription>Network-wide liquidity across Acredo pools.</CardDescription>
          </div>
          <div className="grid gap-3 text-sm sm:grid-flow-col sm:auto-cols-[minmax(0,1fr)]">
            <div>
              <div className="text-xs text-muted">TVL (USDCX)</div>
              <div className="mt-1 font-mono text-base tabular-nums">
                {fmt(tvl, { maximumFractionDigits: 0 })} USDCX
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">APY</div>
              <div className="mt-1 font-mono text-base tabular-nums">
                {fmt(apy * 100, { maximumFractionDigits: 2 })}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Utilization</div>
              <div className="mt-1 font-mono text-base tabular-nums">
                {fmt(util * 100, { maximumFractionDigits: 1 })}%
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === "lending" ? "secondary" : "outline"}
          onClick={() => setTab("lending")}
        >
          Lending Pool (SBTC)
        </Button>
        <Button
          variant={tab === "yield" ? "secondary" : "outline"}
          onClick={() => setTab("yield")}
        >
          Yield Pool (USDCX)
        </Button>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {tab === "lending" ? (
          <Card>
            <CardHeader>
              <CardTitle>Lending Pool (SBTC)</CardTitle>
              <CardDescription>
                Provide <span className="font-mono">SBTC</span> liquidity to earn interest from borrowers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs text-muted">Your pool balance</div>
                  <div className="mt-1 rounded-md border border-border bg-surface-2 px-3 py-2">
                    <div className="font-mono text-sm tabular-nums">
                      {fmt(lendingBalanceSBTC, { maximumFractionDigits: 6 })} SBTC
                    </div>
                    <div className="text-xs text-muted">in lending pool</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Global APY (reference)</div>
                  <div className="mt-1 h-10 rounded-md border border-border bg-surface-2 px-3 text-sm leading-10 tabular-nums">
                    {fmt((apy + 0.02) * 100, { maximumFractionDigits: 2 })}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Utilization</div>
                  <div className="mt-1 h-10 rounded-md border border-border bg-surface-2 px-3 text-sm leading-10 tabular-nums">
                    {fmt(util * 100, { maximumFractionDigits: 1 })}%
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
                  <div className="mb-1 text-sm font-semibold">Deposit SBTC</div>
                  <input
                    value={lendAmount}
                    onChange={(e) => setLendAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={!isConnected}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                  <Button
                    className="mt-2"
                    onClick={handleLendDeposit}
                    disabled={!isConnected || lendDepositNum <= 0 || lendLoading}
                  >
                    {lendLoading ? "Processing…" : "Deposit"}
                  </Button>
                  {!isConnected ? (
                    <div className="mt-1 text-xs text-muted">
                      Connect your wallet to deposit.
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
                  <div className="mb-1 text-sm font-semibold">Withdraw SBTC</div>
                  <input
                    value={lendWithdrawing}
                    onChange={(e) => setLendWithdrawing(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={!isConnected}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                  <Button
                    className="mt-2"
                    variant="secondary"
                    onClick={handleLendWithdraw}
                    disabled={
                      !isConnected ||
                      lendWithdrawNum <= 0 ||
                      lendWithdrawNum > lendingBalanceSBTC ||
                      lendLoading
                    }
                  >
                    {lendLoading ? "Processing…" : "Withdraw"}
                  </Button>
                  {isConnected && lendWithdrawNum > lendingBalanceSBTC ? (
                    <div className="mt-1 text-xs text-danger">
                      Amount exceeds pool balance.
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {tab === "yield" ? (
          <Card>
            <CardHeader>
              <CardTitle>Yield Pool (USDCX)</CardTitle>
              <CardDescription>
                Provide <span className="font-mono">USDCX</span> liquidity alongside the vault strategy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs text-muted">Your pool balance</div>
                  <div className="mt-1 rounded-md border border-border bg-surface-2 px-3 py-2">
                    <div className="font-mono text-sm tabular-nums">
                      {fmt(yieldBalanceUSDCX, { maximumFractionDigits: 2 })} USDCX
                    </div>
                    <div className="text-xs text-muted">in yield pool</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Reference APY</div>
                  <div className="mt-1 h-10 rounded-md border border-border bg-surface-2 px-3 text-sm leading-10 tabular-nums">
                    {fmt(apy * 100, { maximumFractionDigits: 2 })}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Utilization</div>
                  <div className="mt-1 h-10 rounded-md border border-border bg-surface-2 px-3 text-sm leading-10 tabular-nums">
                    {fmt(util * 100, { maximumFractionDigits: 1 })}%
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
                  <div className="mb-1 text-sm font-semibold">Deposit USDCX</div>
                  <input
                    value={yieldAmount}
                    onChange={(e) => setYieldAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={!isConnected}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                  <Button
                    className="mt-2"
                    onClick={handleYieldDeposit}
                    disabled={!isConnected || yieldDepositNum <= 0 || yieldLoading}
                  >
                    {yieldLoading ? "Processing…" : "Deposit"}
                  </Button>
                  {!isConnected ? (
                    <div className="mt-1 text-xs text-muted">
                      Connect your wallet to deposit.
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
                  <div className="mb-1 text-sm font-semibold">Withdraw USDCX</div>
                  <input
                    value={yieldWithdrawing}
                    onChange={(e) => setYieldWithdrawing(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={!isConnected}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                  <Button
                    className="mt-2"
                    variant="secondary"
                    onClick={handleYieldWithdraw}
                    disabled={
                      !isConnected ||
                      yieldWithdrawNum <= 0 ||
                      yieldWithdrawNum > yieldBalanceUSDCX ||
                      yieldLoading
                    }
                  >
                    {yieldLoading ? "Processing…" : "Withdraw"}
                  </Button>
                  {isConnected && yieldWithdrawNum > yieldBalanceUSDCX ? (
                    <div className="mt-1 text-xs text-danger">
                      Amount exceeds pool balance.
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </motion.div>
    </div>
  );
}

