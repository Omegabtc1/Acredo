import Link from "next/link";
import { APP_NAV } from "./nav";
import { cn } from "@/lib/utils";

export function Sidebar({
  pathname,
  className,
  onNavigate,
}: {
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        "h-full w-full bg-background text-foreground",
        "border-r border-border",
        className
      )}
    >
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/acredo-icon.jpg"
            alt="Acredo"
            width={32}
            height={32}
            className="rounded-lg"
            style={{ objectFit: "cover" }}
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold">Acredo</div>
            <div className="text-xs text-muted">DeFi Console</div>
          </div>
        </div>
      </div>

      <nav className="px-2 py-2">
        {(APP_NAV ?? []).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/8 text-foreground"
                  : "text-muted hover:bg-white/6 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

