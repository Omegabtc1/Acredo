"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTxHash } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TxToastStatus = "submitting" | "submitted";

export function TransactionToast({
  title = "Transaction",
  txid,
  status,
  onClose,
  className,
}: {
  title?: string;
  txid: string;
  status: TxToastStatus;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("w-[360px] max-w-[92vw]", className)}
      role="status"
      aria-live="polite"
    >
      <Card className="border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {status === "submitting" ? (
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-success" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-semibold">{title}</div>
              <Button
                variant="ghost"
                className="h-8 px-2 text-muted hover:text-foreground"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="font-mono text-xs text-muted">{formatTxHash(txid)}</div>
              <a
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                View <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mt-2 text-xs text-muted">
              {status === "submitting" ? "Submitting transaction…" : "Transaction submitted."}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

type ToastItem = {
  id: string;
  title: string;
  txid: string;
  status: TxToastStatus;
};

type ToastContextValue = {
  pushTxToast: (title: string, txid: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useTxToasts() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useTxToasts must be used within <TxToastProvider />");
  return ctx;
}

export function TxToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const pushTxToast = React.useCallback((title: string, txid: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: ToastItem = { id, title, txid, status: "submitting" };
    setItems((prev) => [toast, ...prev].slice(0, 3));

    // Simulate "submitted" quickly, then auto-dismiss (guard for non-browser envs).
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setItems((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "submitted" } : t))
        );
      }, 700);

      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ pushTxToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2">
        {(items ?? []).map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <TransactionToast
              title={t.title}
              txid={t.txid}
              status={t.status}
              onClose={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

