"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { ConnectWalletPrompt } from "@/components/defi/ConnectWalletPrompt";
import { HealthFactor } from "@/components/defi/HealthFactor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { borrowAgainstYield, createLoan, lockNFT } from "@/lib/contracts";
import { clamp } from "@/lib/format";
import { nftCollection, vaultPosition, walletData } from "@/lib/mockData";
import { useTxToasts } from "@/components/defi/TransactionToast";
import { useWallet } from "@/hooks/useWallet";

type TabKey = "reputation" | "nft" | "yield";

function parseAmount(v: string) {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function aprForTier(tier: "A" | "B" | "C" | "D") {
  if (tier === "A") return 0.1;
  if (tier === "B") return 0.14;
  if (tier === "C") return 0.19;
  return 0.26;
}

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString(undefined, opts);
}

function projectedYield(deposit: number, apy: number, durationDays: number) {
  // STRICT: deposit × APY × (duration / 365)
  return deposit * apy * (durationDays / 365);
}

export default function BorrowPage() {
  const { pushTxToast } = useTxToasts();
  const { isConnected, reputationScore, reputationTier } = useWallet();

  const [tab, setTab] = React.useState<TabKey>("reputation");

  // Reputation loan (SBTC)
  const [repAmount, setRepAmount] = React.useState("");
  const [repDuration, setRepDuration] = React.useState(30);
  const [repSubmitting, setRepSubmitting] = React.useState(false);

  // NFT loan (SBTC)
  const [selectedNftId, setSelectedNftId] = React.useState(nftCollection[0]?.id ?? "");
  const [nftAmount, setNftAmount] = React.useState("");
  const [nftLocked, setNftLocked] = React.useState(false);
  const [nftLocking, setNftLocking] = React.useState(false);
  const [nftSubmitting, setNftSubmitting] = React.useState(false);

  // Yield borrow (USDCX)
  const [yieldDuration, setYieldDuration] = React.useState(30);
  const [yieldDebt, setYieldDebt] = React.useState("");
  const [yieldSubmitting, setYieldSubmitting] = React.useState(false);

  const repApr = aprForTier(reputationTier);
  const repBorrowLimitSBTC = React.useMemo(() => {
    const pct = clamp(reputationScore / 1000, 0, 1);
    return pct * 0.75;
  }, [reputationScore]);

  const repAmountNum = parseAmount(repAmount);
  const repInterest = repAmountNum * repApr * (repDuration / 365);
  const repTotalOwed = repAmountNum + repInterest;
  const repValid =
    isConnected &&
    repAmountNum > 0 &&
    repAmountNum <= repBorrowLimitSBTC &&
    repDuration > 0 &&
    repDuration <= 365;

  const selectedNft = React.useMemo(() => {
    const collection = nftCollection ?? [];
    return collection.find((n) => n.id === selectedNftId) ?? collection[0] ?? null;
  }, [selectedNftId]);
  const nftAmountNum = parseAmount(nftAmount);
  const nftMaxBorrow = (selectedNft?.floorPriceSBTC ?? 0) * 0.4; // STRICT: floor × 0.4
  const nftValid = isConnected && nftLocked && nftAmountNum > 0 && nftAmountNum <= nftMaxBorrow;

  const depositUSDCX = vaultPosition.depositUSDCX; // USDCX ONLY
  const apy = vaultPosition.apy;
  const projYield = projectedYield(depositUSDCX, apy, yieldDuration);
  const yieldBorrowLimit = projYield * 0.5; // STRICT
  const yieldDebtNum = parseAmount(yieldDebt);
  const hf =
    yieldDebtNum <= 0 ? Number.POSITIVE_INFINITY : (projYield * 0.5) / yieldDebtNum; // STRICT
  const liquidation = yieldDebtNum > 0 && hf < 1.0; // STRICT
  const yieldValid =
    isConnected && depositUSDCX > 0 && yieldDebtNum > 0 && yieldDebtNum <= yieldBorrowLimit;

  async function submitReputationLoan() {
    if (!repValid || repSubmitting) return;
    setRepSubmitting(true);
    try {
      const { txid } = await createLoan({
        amount: repAmountNum,
        symbol: "SBTC",
        durationDays: repDuration,
        rateApr: repApr,
      });
      pushTxToast("Reputation loan submitted", txid);
      setRepAmount("");
    } finally {
      setRepSubmitting(false);
    }
  }

  async function doLockNft() {
    if (!isConnected || !selectedNft || nftLocking) return;
    setNftLocking(true);
    try {
      const { txid } = await lockNFT({ nftId: selectedNft.id, maxBorrowSBTC: nftMaxBorrow });
      pushTxToast("NFT locked", txid);
      setNftLocked(true);
    } finally {
      setNftLocking(false);
    }
  }

  async function submitNftLoan() {
    if (!nftValid || nftSubmitting) return;
    setNftSubmitting(true);
    try {
      const { txid } = await createLoan({
        amount: nftAmountNum,
        symbol: "SBTC",
        durationDays: 30,
        rateApr: 0.18,
      });
      pushTxToast("NFT loan submitted", txid);
      setNftAmount("");
    } finally {
      setNftSubmitting(false);
    }
  }

  async function submitYieldBorrow() {
    if (!yieldValid || yieldSubmitting) return;
    setYieldSubmitting(true);
    try {
      const { txid } = await borrowAgainstYield(yieldDebtNum);
      pushTxToast("Yield borrow submitted", txid);
      setYieldDebt("");
    } finally {
      setYieldSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Borrow</h1>
          <p className="text-sm text-muted">
            Loans use <span className="font-mono">SBTC</span>. Vault/yield borrowing uses{" "}
            <span className="font-mono">USDCX</span> only.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/marketplace">Marketplace</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vault">Vault</Link>
          </Button>
        </div>
      </div>

      {!isConnected ? <ConnectWalletPrompt /> : null}

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "reputation" ? "secondary" : "outline"} onClick={() => setTab("reputation")}>
          Reputation Loan (SBTC)
        </Button>
        <Button variant={tab === "nft" ? "secondary" : "outline"} onClick={() => setTab("nft")}>
          NFT Loan (SBTC)
        </Button>
        <Button variant={tab === "yield" ? "secondary" : "outline"} onClick={() => setTab("yield")}>
          Yield Borrow (USDCX)
        </Button>
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        {tab === "reputation" ? (
          <Card>
            <CardHeader>
              <CardTitle>Reputation Loan</CardTitle>
              <CardDescription>
                Borrow against your reputation. Token: <span className="font-mono">SBTC</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <div className="text-xs text-muted">Amount (SBTC)</div>
                  <input
                    value={repAmount}
                    onChange={(e) => setRepAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                  <div className="text-xs text-muted">
                    Borrow limit: <span className="font-mono">{fmt(repBorrowLimitSBTC, { maximumFractionDigits: 4 })} SBTC</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-muted">Duration</div>
                  <select
                    value={repDuration}
                    onChange={(e) => setRepDuration(Number(e.target.value))}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs text-muted">Interest (APR)</div>
                  <div className="h-10 rounded-md border border-border bg-surface-2 px-3 text-sm leading-10 tabular-nums">
                    {fmt(repApr * 100, { maximumFractionDigits: 2 })}%
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">Loan summary</div>
                  <Badge variant="primary">SBTC</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted">Principal</div>
                    <div className="mt-1 font-mono text-sm tabular-nums">{fmt(repAmountNum, { maximumFractionDigits: 6 })} SBTC</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Estimated interest</div>
                    <div className="mt-1 font-mono text-sm tabular-nums">{fmt(repInterest, { maximumFractionDigits: 6 })} SBTC</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Estimated total owed</div>
                    <div className="mt-1 font-mono text-sm tabular-nums">{fmt(repTotalOwed, { maximumFractionDigits: 6 })} SBTC</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted">
                  Balance: <span className="font-mono">{fmt(walletData.balances.SBTC, { maximumFractionDigits: 6 })} SBTC</span>
                </div>
                <Button onClick={submitReputationLoan} disabled={!repValid || repSubmitting}>
                  {repSubmitting ? "Submitting…" : "Submit loan"}
                </Button>
              </div>
              {isConnected && repAmountNum > repBorrowLimitSBTC ? (
                <div className="text-xs text-danger">Amount exceeds borrow limit.</div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {tab === "nft" ? (
          <Card>
            <CardHeader>
              <CardTitle>NFT Loan</CardTitle>
              <CardDescription>
                Borrow up to <span className="font-mono">floor × 0.4</span>. Token: <span className="font-mono">SBTC</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="text-xs text-muted">Select NFT</div>
                  <select
                    value={selectedNftId}
                    onChange={(e) => {
                      setSelectedNftId(e.target.value);
                      setNftLocked(false);
                      setNftAmount("");
                    }}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  >
                    {(nftCollection ?? []).map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.collection} — {n.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-muted">Amount to borrow (SBTC)</div>
                  <input
                    value={nftAmount}
                    onChange={(e) => setNftAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={!nftLocked}
                    className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                  <div className="text-xs text-muted">
                    Max borrow: <span className="font-mono">{fmt(nftMaxBorrow, { maximumFractionDigits: 6 })} SBTC</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-surface-2">
                  <CardHeader className="p-4">
                    <CardDescription>Floor price</CardDescription>
                    <CardTitle className="font-mono text-lg tabular-nums">{fmt(selectedNft?.floorPriceSBTC ?? 0, { maximumFractionDigits: 6 })} SBTC</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-surface-2">
                  <CardHeader className="p-4">
                    <CardDescription>Liquidity</CardDescription>
                    <CardTitle className="font-mono text-lg tabular-nums">{fmt(selectedNft?.liquiditySBTC ?? 0, { maximumFractionDigits: 2 })} SBTC</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-surface-2">
                  <CardHeader className="p-4">
                    <CardDescription>Max borrow</CardDescription>
                    <CardTitle className="font-mono text-lg tabular-nums">{fmt(nftMaxBorrow, { maximumFractionDigits: 6 })} SBTC</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={doLockNft} disabled={!isConnected || nftLocking}>
                    {nftLocking ? "Locking…" : nftLocked ? "NFT Locked" : "Lock NFT"}
                  </Button>
                  {nftLocked ? <Badge variant="success">Collateral locked</Badge> : <Badge variant="warning">Not locked</Badge>}
                </div>
                <Button onClick={submitNftLoan} disabled={!nftValid || nftSubmitting}>
                  {nftSubmitting ? "Submitting…" : "Create NFT loan"}
                </Button>
              </div>
              {isConnected && nftAmountNum > nftMaxBorrow ? (
                <div className="text-xs text-danger">Amount exceeds max borrow (floor × 0.4).</div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {tab === "yield" ? (
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Yield Borrow</CardTitle>
                <CardDescription>
                  Requires a vault deposit. Token: <span className="font-mono">USDCX</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted">Borrow amount (USDCX)</div>
                    <input
                      value={yieldDebt}
                      onChange={(e) => setYieldDebt(e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      disabled={!isConnected || depositUSDCX <= 0}
                      className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                    <div className="text-xs text-muted">
                      Borrow limit: <span className="font-mono">{fmt(yieldBorrowLimit, { maximumFractionDigits: 2 })} USDCX</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-muted">Duration</div>
                    <select
                      value={yieldDuration}
                      onChange={(e) => setYieldDuration(Number(e.target.value))}
                      disabled={!isConnected || depositUSDCX <= 0}
                      className="h-10 w-full rounded-md border border-border bg-surface-2 px-3 text-sm outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs text-muted">Vault APY</div>
                    <div className="h-10 rounded-md border border-border bg-surface-2 px-3 text-sm leading-10 tabular-nums">
                      {fmt(apy * 100, { maximumFractionDigits: 2 })}%
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold">Live calculations</div>
                    <Badge variant="accent">USDCX</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-muted">Vault deposit</div>
                      <div className="mt-1 font-mono text-sm tabular-nums">{fmt(depositUSDCX, { maximumFractionDigits: 2 })} USDCX</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Projected yield</div>
                      <div className="mt-1 font-mono text-sm tabular-nums">{fmt(projYield, { maximumFractionDigits: 2 })} USDCX</div>
                      <div className="text-[11px] text-muted">deposit × APY × (duration/365)</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Borrow limit</div>
                      <div className="mt-1 font-mono text-sm tabular-nums">{fmt(yieldBorrowLimit, { maximumFractionDigits: 2 })} USDCX</div>
                      <div className="text-[11px] text-muted">projected yield × 0.5</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted">
                    Balance: <span className="font-mono">{fmt(walletData.balances.USDCX, { maximumFractionDigits: 2 })} USDCX</span>
                  </div>
                  <Button onClick={submitYieldBorrow} disabled={!yieldValid || yieldSubmitting}>
                    {yieldSubmitting ? "Submitting…" : "Borrow against yield"}
                  </Button>
                </div>

                {depositUSDCX <= 0 ? (
                  <div className="text-xs text-warning">Requires a vault deposit before borrowing.</div>
                ) : null}
                {isConnected && yieldDebtNum > yieldBorrowLimit ? (
                  <div className="text-xs text-danger">Amount exceeds borrow limit.</div>
                ) : null}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <HealthFactor value={Math.min(Number.isFinite(hf) ? hf : 2.5, 2.5)} />
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Liquidation</div>
                  {liquidation ? <Badge variant="danger">At risk</Badge> : <Badge variant="success">Safe</Badge>}
                </div>
                <div className="mt-2 text-sm text-muted">
                  Trigger when health factor &lt; <span className="font-mono">1.0</span>.
                </div>
                <div className="mt-2 text-xs text-muted">Health factor = (projected yield × 0.5) / debt</div>
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

