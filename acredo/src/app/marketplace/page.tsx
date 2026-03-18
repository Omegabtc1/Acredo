"use client";

import * as React from "react";

import { TierBadge } from "@/components/defi/TierBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fundLoan } from "@/lib/contracts";
import { loanRequests, type LoanRequest } from "@/lib/mockData";
import { useTxToasts } from "@/components/defi/TransactionToast";
import { useWallet } from "@/hooks/useWallet";

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString(undefined, opts);
}

export default function MarketplacePage() {
  const { isConnected } = useWallet();
  const { pushTxToast } = useTxToasts();

  const [selected, setSelected] = React.useState<LoanRequest | null>(null);
  const [open, setOpen] = React.useState(false);
  const [funding, setFunding] = React.useState(false);

  const sorted = React.useMemo(() => {
    const source = loanRequests ?? [];
    return [...source].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }, []);

  async function onFund() {
    if (!selected || funding || !isConnected) return;
    setFunding(true);
    try {
      const { txid } = await fundLoan(selected.id);
      pushTxToast(`Fund loan ${selected.id}`, txid);
      setOpen(false);
      setSelected(null);
    } finally {
      setFunding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Marketplace</h1>
          <p className="text-sm text-muted">
            Fund reputation-backed loan requests. Token:{" "}
            <span className="font-mono">SBTC</span>.
          </p>
        </div>
        <Badge variant="default">{sorted.length} requests</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Requests</CardTitle>
          <CardDescription>
            Select a request to view details and fund.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pr-3 font-medium">Tier</th>
                  <th className="py-2 pr-3 font-medium">Borrower</th>
                  <th className="py-2 pr-3 font-medium">Amount (SBTC)</th>
                  <th className="py-2 pr-3 font-medium">Rate (APR)</th>
                  <th className="py-2 pr-3 font-medium">Duration</th>
                  <th className="py-2 pr-3 font-medium">Created</th>
                  <th className="py-2 pr-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-3 pr-3">
                      <TierBadge tier={r.tier} />
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-muted">
                      {r.borrower}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs tabular-nums">
                      {fmt(r.amountSBTC, { maximumFractionDigits: 6 })} SBTC
                    </td>
                    <td className="py-3 pr-3 tabular-nums">
                      {fmt(r.rateApr * 100, { maximumFractionDigits: 2 })}%
                    </td>
                    <td className="py-3 pr-3">{r.durationDays} days</td>
                    <td className="py-3 pr-3">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isConnected}
                        onClick={() => {
                          setSelected(r);
                          setOpen(true);
                        }}
                      >
                        Fund
                      </Button>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-muted">
                      No loan requests available.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {!isConnected ? (
            <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3 text-sm text-muted">
              Connect your wallet to fund loans.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Loan</DialogTitle>
            <DialogDescription>
              Confirm funding this request. Token:{" "}
              <span className="font-mono">SBTC</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 space-y-4">
            {selected ? (
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{selected.id}</div>
                  <TierBadge tier={selected.tier} />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted">Amount</div>
                    <div className="mt-1 font-mono text-sm tabular-nums">
                      {fmt(selected.amountSBTC, { maximumFractionDigits: 6 })} SBTC
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">APR</div>
                    <div className="mt-1 font-mono text-sm tabular-nums">
                      {fmt(selected.rateApr * 100, { maximumFractionDigits: 2 })}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Duration</div>
                    <div className="mt-1 text-sm tabular-nums">
                      {selected.durationDays} days
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted font-mono">
                  Borrower: {selected.borrower}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline" disabled={funding}>
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={onFund} disabled={!isConnected || !selected || funding}>
                {funding ? "Funding…" : "Fund loan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

