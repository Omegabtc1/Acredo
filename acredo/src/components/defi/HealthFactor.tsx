"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { clamp } from "@/lib/format";
import { cn } from "@/lib/utils";

function zone(hf: number): "green" | "yellow" | "red" {
  if (hf >= 1.5) return "green";
  if (hf >= 1.0) return "yellow";
  return "red";
}

export function HealthFactor({
  value,
  min = 0,
  max = 2.5,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const v = clamp(value, min, max);
  const t = (v - min) / (max - min); // 0..1

  const width = 240;
  const height = 140;
  const stroke = 14;
  const cx = width / 2;
  const cy = 120;
  const r = 90;
  const c = Math.PI * r; // half circle

  const dash = c * t;
  const id = React.useId();

  // needle: -180deg (left) to 0deg (right) but we only want semicircle: -180..0
  const deg = -180 + t * 180;

  const z = zone(value);
  const color =
    z === "green"
      ? "var(--success)"
      : z === "yellow"
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold">Health Factor</div>
          <div className="text-xs text-muted">
            Green ≥ 1.5 • Yellow 1.0–1.5 • Red &lt; 1.0
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg tabular-nums">{value.toFixed(2)}</div>
          <div className="text-xs text-muted">HF</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-surface p-4">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--danger)" />
              <stop offset="60%" stopColor="var(--warning)" />
              <stop offset="100%" stopColor="var(--success)" />
            </linearGradient>
          </defs>

          {/* track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* progress (gradient) */}
          <motion.path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={`url(#${id}-grad)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            initial={prefersReducedMotion ? false : { strokeDasharray: `0 ${c}` }}
            animate={prefersReducedMotion ? undefined : { strokeDasharray: `${dash} ${c - dash}` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* needle */}
          <motion.g
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            initial={prefersReducedMotion ? false : { rotate: -180 }}
            animate={prefersReducedMotion ? { rotate: deg } : { rotate: deg }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - (r - 10)}
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={6} fill={color} />
            <circle cx={cx} cy={cy} r={10} fill="rgba(255,255,255,0.06)" />
          </motion.g>
        </svg>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">0.00</span>
          <span className="text-muted">1.00</span>
          <span className="text-muted">1.50</span>
          <span className="text-muted">{max.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

