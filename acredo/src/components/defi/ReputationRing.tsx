"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { clamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReputationRing({
  score,
  size = 140,
  stroke = 12,
  className,
}: {
  score: number; // 0–1000
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const normalized = clamp(score, 0, 1000);
  const pct = normalized / 1000;

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  const id = React.useId();
  const center = size / 2;

  return (
    <div className={cn("relative grid place-items-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />

        <motion.circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={`url(#${id}-grad)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${center} ${center})`}
          filter={`url(#${id}-glow)`}
          initial={prefersReducedMotion ? false : { strokeDasharray: `0 ${c}` }}
          animate={prefersReducedMotion ? undefined : { strokeDasharray: `${dash} ${c - dash}` }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tabular-nums">{Math.round(normalized)}</div>
          <div className="text-xs text-muted">Reputation</div>
        </div>
      </div>
    </div>
  );
}

