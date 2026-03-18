"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";

export function ConnectWalletPrompt({
  title = "Connect your wallet",
  subtitle = "Connect to view reputation, borrow limits, and manage positions.",
}: {
  title?: string;
  subtitle?: string;
}) {
  const { isConnected, connect, isConnecting } = useWallet();

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(800px circle at 20% 30%, rgba(79,70,229,0.35), transparent 55%), radial-gradient(800px circle at 80% 70%, rgba(34,211,238,0.25), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/6 ring-1 ring-white/10">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{title}</div>
                <div className="mt-0.5 text-sm text-muted">{subtitle}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isConnected ? (
              <Button
                onClick={connect}
                className="w-full sm:w-auto"
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            ) : (
              <Button variant="secondary" className="w-full sm:w-auto" disabled>
                Connected
              </Button>
            )}
            <Button variant="outline" className="w-full sm:w-auto">
              Learn more
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

