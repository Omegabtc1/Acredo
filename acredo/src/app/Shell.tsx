"use client";

import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/dashboard";

  // Landing page manages its own full-page layout
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <div className="hidden w-72 flex-col lg:flex">
          <Sidebar pathname={pathname} className="w-72" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 py-6">
            <div className="mx-auto w-full max-w-[1120px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

