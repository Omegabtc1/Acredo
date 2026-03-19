"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { ConnectWalletPrompt } from "@/components/defi/ConnectWalletPrompt";
import { HealthFactor } from "@/components/defi/HealthFactor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { borrowAgainstYield, depositToVault } from "@/lib/contracts";
import { clamp } from "@/lib/format";
import { vaultPosition, walletData } from "@/lib/mockData";
import { useTxToasts } from "@/components/defi/TransactionToast";
import { useWallet } from "@/hooks/useWallet";

function parseAmount(v: string) {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString(undefined, opts);
}

function projectedYield(deposit: number, apy: number, durationDays: number) {
  // STRICT: deposit × APY × (duration / 365)
  return deposit * apy * (durationDays / 365);
}

export default function VaultPage() {
  const { isConnected } = useWallet();
  const { pushTxToast } = useTxToasts();

  // local mock position state
  const [balance, setBalance] = React.useState(walletData.balances.USDCX);
  const [deposit, setDeposit] = React.useState(vaultPosition.depositUSDCX);
  const apy = vaultPosition.apy;

  const [duration, setDuration] = React.useState(30);

  const [depositAmount, setDepositAmount] = React.useState("");
  const [depositing, setDepositing] = React.useState(false);

  const [debt, setDebt] = React.useState("");
  const [borrowing, setBorrowing] = React.useState(false);

  const depositAmountNum = parseAmount(depositAmount);
  const canDeposit =
    isConnected && depositAmountNum > 0 && depositAmountNum <= balance && !depositing;

  const projYield = projectedYield(deposit, apy, duration);
  const borrowLimit = projYield * 0.5; // STRICT: projected yield × 0.5

  const debtNum = parseAmount(debt);
  const hf =
    debtNum <= 0 ? Number.POSITIVE_INFINITY : (projYield * 0.5) / debtNum; // STRICT
  const hfClamped = clamp(Number.isFinite(hf) ? hf : 2.5, 0, 2.5);
  const liquidation = debtNum > 0 && hf < 1.0; // STRICT trigger

  const canBorrow =
    isConnected &&
    deposit > 0 &&
    debtNum > 0 &&
    debtNum <= borrowLimit &&
    !borrowing;

  async function onDeposit() {
    if (!canDeposit) return;
    setDepositing(true);
    try {
      const { txid } = await depositToVault(depositAmountNum);
      pushTxToast("Deposit to vault", txid);
      setDeposit((d) => d + depositAmountNum);
      setBalance((b) => Math.max(0, b - depositAmountNum));
      setDepositAmount("");
    } finally {
      setDepositing(false);
    }
  }

  async function onBorrow() {
    if (!canBorrow) return;
    setBorrowing(true);
    try {
      const { txid } = await borrowAgainstYield(debtNum);
      pushTxToast("Borrow against yield", txid);
      setDebt("");
    } finally {
      setBorrowing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vault</h1>
          <p className="text-sm text-muted">
            Deposit <span className="font-mono">USDCX</span> to earn yield. Borrowing is limited by projected yield.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/borrow">Borrow</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pool">Pools</Link>
          </Button>
        </div>
      </div>

      {!isConnected ? <ConnectWalletPrompt /> : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>USDCX Vault</CardTitle>
            <CardDescription>
              APY updates live; projected yield depends on duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <div className="text-xs text-muted">Vault balance</div>
                <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
                  <div className="font-mono text-sm tabular-nums">
                    {fmt(deposit, { maximumFractionDigits: 2 })} USDCX
                  </div>
                  <div className="text-xs text-muted">Current deposit</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted">APY</div>
                <div className="h-10 rounded-md border border-border bg-surface-2 px-3 text-sm leading-10 tabular-nums">
                  {fmt(apy * 100, { maximumFractionDigits: 2 })}%
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted">Duration</div>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={!isConnected}
                  className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Projected Yield</div>
                <Badge variant="accent">USDCX</Badge>
              </div>
              <div className="mt-2 font-mono text-lg tabular-nums">
                {fmt(projYield, { maximumFractionDigits: 2 })} USDCX
              </div>
              <div className="mt-1 text-xs text-muted">
                deposit × APY × (duration / 365)
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="bg-surface-2">
                <CardHeader className="p-4">
                  <CardDescription>Your wallet balance</CardDescription>
                  <CardTitle className="font-mono text-lg tabular-nums">
                    {fmt(balance, { maximumFractionDigits: 2 })} USDCX
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-surface-2">
                <CardHeader className="p-4">
                  <CardDescription>Borrow limit</CardDescription>
                  <CardTitle className="font-mono text-lg tabular-nums">
                    {fmt(borrowLimit, { maximumFractionDigits: 2 })} USDCX
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2 text-sm font-semibold">Deposit USDCX</div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <div className="text-xs text-muted">Amount</div>
                  <input
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={!isConnected}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                  {isConnected && depositAmountNum > balance ? (
                    <div className="text-xs text-danger">Amount exceeds balance.</div>
                  ) : null}
                </div>
                <Button onClick={onDeposit} disabled={!canDeposit}>
                  {depositing ? "Depositing…" : "Deposit"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <HealthFactor value={hfClamped} />
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle>Borrow Against Yield</CardTitle>
              <CardDescription>
                Borrow limit = projected yield × 0.5. Liquidation if HF &lt; 1.0.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs text-muted">Borrow amount (USDCX)</div>
                <input
                  value={debt}
                  onChange={(e) => setDebt(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={!isConnected || deposit <= 0}
                  className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                />
                <div className="text-xs text-muted">
                  Limit:{" "}
                  <span className="font-mono">
                    {fmt(borrowLimit, { maximumFractionDigits: 2 })} USDCX
                  </span>
                </div>
                {isConnected && debtNum > borrowLimit ? (
                  <div className="text-xs text-danger">Amount exceeds borrow limit.</div>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Liquidation</div>
                  {liquidation ? (
                    <Badge variant="danger">At risk</Badge>
                  ) : (
                    <Badge variant="success">Safe</Badge>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted">
                  Trigger when HF &lt; <span className="font-mono">1.0</span>.
                </div>
                <div className="mt-2 text-xs text-muted">
                  Health factor = (projected yield × 0.5) / debt
                </div>
              </div>

              <Button onClick={onBorrow} disabled={!canBorrow}>
                {borrowing ? "Borrowing…" : "Borrow USDCX"}
              </Button>
              {deposit <= 0 ? (
                <div className="text-xs text-warning">
                  Deposit to the vault before borrowing.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

