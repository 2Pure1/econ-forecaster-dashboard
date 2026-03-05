// src/components/regime/RegimeIndicator.tsx
"use client";

import clsx from "clsx";
import type { Regime } from "@/lib/api";

const REGIME_CONFIG: Record<
  NonNullable<Regime>,
  { label: string; color: string; bg: string; border: string; description: string; dot: string }
> = {
  EXPANSION:   { label: "EXPANSION",   color: "text-accent-green",  bg: "bg-accent-green/10",  border: "border-accent-green/30",  description: "GDP growth ≥ 3% — economy running above trend",             dot: "bg-accent-green" },
  RECOVERY:    { label: "RECOVERY",    color: "text-accent-cyan",   bg: "bg-accent-cyan/10",   border: "border-accent-cyan/30",   description: "GDP growth 1–3% — moderate expansion, slack remaining",    dot: "bg-accent-cyan" },
  SLOWDOWN:    { label: "SLOWDOWN",    color: "text-accent-amber",  bg: "bg-accent-amber/10",  border: "border-accent-amber/30",  description: "GDP growth 0–1% — below-trend, risk of contraction",       dot: "bg-accent-amber" },
  CONTRACTION: { label: "CONTRACTION", color: "text-accent-red",    bg: "bg-accent-red/10",    border: "border-accent-red/30",    description: "GDP growth < 0% — recession territory",                    dot: "bg-accent-red" },
  UNKNOWN:     { label: "UNKNOWN",     color: "text-text-muted",    bg: "bg-surface-2",        border: "border-border",           description: "Awaiting forecast data",                                   dot: "bg-text-dim" },
};

const REGIME_ORDER: NonNullable<Regime>[] = ["CONTRACTION", "SLOWDOWN", "RECOVERY", "EXPANSION"];

interface Props {
  regime:  Regime | null;
  loading: boolean;
}

export function RegimeIndicator({ regime, loading }: Props) {
  const current = regime ?? "UNKNOWN";
  const cfg     = REGIME_CONFIG[current];

  return (
    <div className={clsx("rounded-lg border p-4 flex items-center gap-6", cfg.border, cfg.bg)}>

      {/* Label block */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <div className={clsx("w-3 h-3 rounded-full", cfg.dot)} />
          {!loading && current !== "UNKNOWN" && (
            <div className={clsx("absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-40", cfg.dot)} />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted">MACRO REGIME</span>
          </div>
          <div className={clsx("font-display text-2xl font-bold tracking-wider", cfg.color)}>
            {loading ? (
              <span className="inline-block w-32 h-7 bg-surface-3 rounded animate-pulse" />
            ) : current}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="hidden md:block font-mono text-xs text-text-muted flex-1 leading-relaxed">
        {loading ? "Loading..." : cfg.description}
      </p>

      {/* Regime scale */}
      <div className="hidden lg:flex items-center gap-1">
        {REGIME_ORDER.map((r) => {
          const c  = REGIME_CONFIG[r];
          const active = r === current;
          return (
            <div key={r} className="flex flex-col items-center gap-1">
              <div className={clsx(
                "w-16 h-1.5 rounded-full transition-all",
                active ? c.dot : "bg-surface-3",
              )} />
              <span className={clsx("font-mono text-[9px] tracking-widest", active ? c.color : "text-text-dim")}>
                {r.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
