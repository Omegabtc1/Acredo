"use client";

import { Badge } from "@/components/ui/badge";

type Tier = "A" | "B" | "C" | "D";

export function TierBadge({ tier }: { tier: Tier }) {
  if (tier === "A") return <Badge variant="success">Tier A</Badge>;
  if (tier === "B") return <Badge variant="accent">Tier B</Badge>;
  if (tier === "C") return <Badge variant="warning">Tier C</Badge>;
  return <Badge variant="danger">Tier D</Badge>;
}

