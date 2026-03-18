"use client";

import * as React from "react";

import { TierBadge } from "@/components/defi/TierBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loanHistory, vaultPosition, walletData } from "@/lib/mockData";
import { useWallet } from "@/hooks/useWallet";

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString(undefined, opts);
}

export default function ProfilePage() {
  const { address, bnsName, isConnected, reputationScore, reputationTier } = useWallet();

  const history = React.useMemo(() => {
    const source = loanHistory ?? [];
    return [...source].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }, []);

  const totalBorrowedSBTC = history
    .filter((h) => h.symbol === "SBTC")
    .reduce((sum, h) => sum + h.amount, 0);

  const totalBorrowedUSDCX = history
    .filter((h) => h.symbol === "USDCX")
    .reduce((sum, h) => sum + h.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted">
          Identity, reputation and historical activity across vaults and pools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-3">
            <div>
              <CardDescription>BNS name</CardDescription>
              <CardTitle className="text-base">
                {isConnected ? bnsName ?? "—" : walletData.bnsName}
              </CardTitle>
            </div>
            <div>
              <CardDescription>Address</CardDescription>
              <div className="mt-1 font-mono text-xs text-muted break-all">
                {isConnected && address ? address : walletData.address}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Reputation</CardDescription>
              <CardTitle className="text-xl tabular-nums">
                {fmt(reputationScore, { maximumFractionDigits: 0 })}
              </CardTitle>
            </div>
            <TierBadge tier={reputationTier} />
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs text-muted">
            <div className="flex items-center justify-between">
              <span>Wallet age</span>
              <span className="font-mono">
                {fmt(walletData.walletAgeDays)} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Loans repaid</span>
              <span className="font-mono">
                {fmt(walletData.loansRepaid)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Defaults</span>
              <span className="font-mono">
                {fmt(walletData.loansDefaulted)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Positions overview</CardDescription>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted">
            <div className="flex items-center justify-between">
              <span>Total borrowed (SBTC)</span>
              <span className="font-mono">
                {fmt(totalBorrowedSBTC, { maximumFractionDigits: 4 })} SBTC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total borrowed (USDCX)</span>
              <span className="font-mono">
                {fmt(totalBorrowedUSDCX, { maximumFractionDigits: 2 })} USDCX
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vault deposit (USDCX)</span>
              <span className="font-mono">
                {fmt(vaultPosition.depositUSDCX, { maximumFractionDigits: 2 })} USDCX
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Loan history</CardTitle>
              <CardDescription>Reputation, NFT, and yield loans over time.</CardDescription>
            </div>
            <Badge variant="default">{history.length} records</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Token</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Rate</th>
                    <th className="py-2 pr-3 font-medium">Duration</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-border/60">
                      <td className="py-3 pr-3 capitalize">{h.type}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{h.symbol}</td>
                      <td className="py-3 pr-3 font-mono text-xs tabular-nums">
                        {fmt(h.amount, {
                          maximumFractionDigits: h.symbol === "SBTC" ? 6 : 2,
                        })}{" "}
                        {h.symbol}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">
                        {fmt(h.rateApr * 100, { maximumFractionDigits: 2 })}%
                      </td>
                      <td className="py-3 pr-3">{h.durationDays}d</td>
                      <td className="py-3 pr-3">
                        <Badge
                          variant={
                            h.status === "repaid"
                              ? "success"
                              : h.status === "defaulted"
                              ? "danger"
                              : "accent"
                          }
                          className="capitalize"
                        >
                          {h.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-muted">
                        No loan history yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vault &amp; pool history</CardTitle>
            <CardDescription>
              High level view of your vault and pool interactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <div className="flex items-center justify-between">
              <span>First vault deposit</span>
              <span className="font-mono text-xs">
                {new Date(vaultPosition.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vault APY</span>
              <span className="font-mono text-xs">
                {fmt(vaultPosition.apy * 100, { maximumFractionDigits: 2 })}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Loans repaid</span>
              <span className="font-mono text-xs">
                {fmt(
                  history.filter((h) => h.status === "repaid").length
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Defaults</span>
              <span className="font-mono text-xs">
                {fmt(
                  history.filter((h) => h.status === "defaulted").length
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

