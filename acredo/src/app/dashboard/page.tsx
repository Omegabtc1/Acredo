"use client";

import { ConnectWalletPrompt } from "@/components/defi/ConnectWalletPrompt";
import { ReputationRing } from "@/components/defi/ReputationRing";
import { TierBadge } from "@/components/defi/TierBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { repayLoan } from "@/lib/contracts";
import { activeLoans, vaultPosition, walletData } from "@/lib/mockData";
import { useTxToasts } from "@/components/defi/TransactionToast";
import { useWallet } from "@/hooks/useWallet";
import Link from "next/link";
import * as React from "react";

export default function DashboardPage() {
  const { pushTxToast } = useTxToasts();
  const { isConnected, isConnecting, reputationScore, reputationTier } = useWallet();
  const [repaying, setRepaying] = React.useState<Record<string, boolean>>({});

  const active = React.useMemo(
    () => (activeLoans ?? []).filter((l) => l.status === "active"),
    []
  );

  const borrowLimitSBTC = React.useMemo(() => {
    // Not specified in product spec; derived from score only (0..0.75 SBTC).
    const pct = Math.max(0, Math.min(1, reputationScore / 1000));
    return pct * 0.75;
  }, [reputationScore]);

  const totalDepositedUSDCX = vaultPosition.depositUSDCX;

  async function onRepay(loanId: string) {
    setRepaying((p) => ({ ...p, [loanId]: true }));
    try {
      const { txid } = await repayLoan(loanId);
      pushTxToast("Repay loan", txid);
    } finally {
      setRepaying((p) => ({ ...p, [loanId]: false }));
    }
  }

  function fmt(n: number, opts?: Intl.NumberFormatOptions) {
    return n.toLocaleString(undefined, opts);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted">Overview of your positions and limits.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/borrow">Borrow</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vault">Deposit to Vault</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pool">Provide Liquidity</Link>
          </Button>
        </div>
      </div>

      {!isConnected && <ConnectWalletPrompt />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Reputation Score</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isConnected ? fmt(reputationScore) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Borrow Limit (SBTC)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isConnected ? fmt(borrowLimitSBTC, { maximumFractionDigits: 4 }) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Loans</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isConnected ? fmt(active.length) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Deposited (USDCX)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isConnected ? fmt(totalDepositedUSDCX, { maximumFractionDigits: 2 }) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Reputation</CardTitle>
              <CardDescription>Signal-driven credit access.</CardDescription>
            </div>
            <TierBadge tier={reputationTier} />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <ReputationRing score={reputationScore} className={isConnected ? "" : "opacity-60"} />
            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted">Wallet age</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {fmt(walletData.walletAgeDays)} days
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Tier</div>
                  <div className="mt-1">
                    <TierBadge tier={reputationTier} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Loans repaid</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {fmt(walletData.loansRepaid)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Defaults</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {fmt(walletData.loansDefaulted)}
                  </div>
                </div>
              </div>

              {!isConnected ? (
                <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm text-muted">
                  Connect your wallet to unlock live limits and actions.
                </div>
              ) : null}
              {isConnecting ? (
                <div className="text-xs text-muted">Loading wallet state…</div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Active Loans</CardTitle>
              <CardDescription>Manage outstanding positions.</CardDescription>
            </div>
            <Badge variant="default">{active.length} active</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Principal</th>
                    <th className="py-2 pr-3 font-medium">APR</th>
                    <th className="py-2 pr-3 font-medium">Due</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((l) => {
                    const principal =
                      l.principal.symbol === "SBTC"
                        ? `${fmt(l.principal.amount, { maximumFractionDigits: 4 })} SBTC`
                        : `${fmt(l.principal.amount, { maximumFractionDigits: 2 })} USDCX`;
                    const due = new Date(l.dueDate).toLocaleDateString("en-US");
                    const statusVariant =
                      l.status === "active" ? "accent" : l.status === "repaid" ? "success" : "danger";

                    return (
                      <tr key={l.id} className="border-b border-border/60">
                        <td className="py-3 pr-3 capitalize">{l.type}</td>
                        <td className="py-3 pr-3 font-mono text-xs">{principal}</td>
                        <td className="py-3 pr-3 tabular-nums">{fmt(l.rateApr * 100, { maximumFractionDigits: 2 })}%</td>
                        <td className="py-3 pr-3">{due}</td>
                        <td className="py-3 pr-3">
                          <Badge variant={statusVariant as never} className="capitalize">
                            {l.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!isConnected || repaying[l.id]}
                            onClick={() => onRepay(l.id)}
                          >
                            {repaying[l.id] ? "Repaying…" : "Repay"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {active.length === 0 ? (
                    <tr>
                      <td className="py-6 text-muted" colSpan={6}>
                        No active loans.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-muted">
              Transactions call `contracts.ts` and surface via `TransactionToast`.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
