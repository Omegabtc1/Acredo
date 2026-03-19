"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { useWallet } from "@/hooks/useWallet";

export function Header() {
  const pathname = usePathname() ?? "/";
  const { isConnected, bnsName, address, connect, disconnect, isConnecting } =
    useWallet();

  const title =
    pathname === "/"
      ? "Dashboard"
      : pathname
          .split("/")
          .filter(Boolean)
          .slice(-1)[0]
          ?.replace(/^\w/, (c) => c.toUpperCase()) ?? "Dashboard";

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Open navigation">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader className="border-b border-border">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <Sidebar pathname={pathname} />
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/dashboard" className="text-sm font-semibold text-foreground">
              {title}
            </Link>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted">Production DeFi UI shell</span>
          </div>
          <div className="text-sm font-semibold text-foreground lg:hidden">{title}</div>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={disconnect}
              title={address ?? undefined}
            >
              {bnsName ?? "Connected"}
            </Button>
          )}
          <Button variant="ghost" className="hidden sm:inline-flex text-muted hover:text-foreground">
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
}

