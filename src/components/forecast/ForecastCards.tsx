// src/components/forecast/ForecastCards.tsx
"use client";

import clsx from "clsx";
import type { GDPForecast, UnemploymentForecast, FedFundsForecast } from "@/lib/api";

type ChartTarget = "gdp_growth" | "unemployment_rate" | "fed_funds_direction";

interface Props {
  gdp:          GDPForecast | null;
  unemployment: UnemploymentForecast | null;
  fedFunds:     FedFundsForecast | null;
  loading:      boolean;
  onSelectChart: (t: ChartTarget) => void;
  activeChart:   ChartTarget;
}

export function ForecastCards({ gdp, unemployment, fedFunds, loading, onSelectChart, activeChart }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GDPCard       data={gdp}          loading={loading} active={activeChart === "gdp_growth"}          onClick={() => onSelectChart("gdp_growth")} />
      <UnemployCard  data={unemployment} loading={loading} active={activeChart === "unemployment_rate"}    onClick={() => onSelectChart("unemployment_rate")} />
      <FedFundsCard  data={fedFunds}     loading={loading} active={activeChart === "fed_funds_direction"}  onClick={() => onSelectChart("fed_funds_direction")} />
    </div>
  );
}

// ── Shared card shell ──────────────────────────────────────────────────────────
function Card({
  title, subtitle, children, active, onClick, accentColor,
}: {
  title: string; subtitle: string; children: React.ReactNode;
  active: boolean; onClick: () => void; accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left rounded-lg border p-5 transition-all duration-200 cursor-pointer",
        "hover:border-opacity-80 hover:bg-surface-2",
        active
          ? "border-opacity-80 bg-surface-2 ring-1"
          : "border-border bg-surface-1",
        active && accentColor === "cyan"   && "border-accent-cyan/50 ring-accent-cyan/20",
        active && accentColor === "green"  && "border-accent-green/50 ring-accent-green/20",
        active && accentColor === "amber"  && "border-accent-amber/50 ring-accent-amber/20",
        active && accentColor === "purple" && "border-accent-purple/50 ring-accent-purple/20",
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-mono text-xs text-text-muted tracking-widest">{title}</p>
          <p className="font-mono text-[10px] text-text-dim mt-0.5">{subtitle}</p>
        </div>
        {active && (
          <span className={clsx(
            "font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border",
            accentColor === "cyan"   && "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10",
            accentColor === "green"  && "text-accent-green border-accent-green/30 bg-accent-green/10",
            accentColor === "amber"  && "text-accent-amber border-accent-amber/30 bg-accent-amber/10",
            accentColor === "purple" && "text-accent-purple border-accent-purple/30 bg-accent-purple/10",
          )}>ACTIVE</span>
        )}
      </div>
      {children}
    </button>
  );
}

function Skeleton({ w = "w-20", h = "h-9" }: { w?: string; h?: string }) {
  return <div className={clsx("rounded bg-surface-3 animate-pulse", w, h)} />;
}

// ── GDP card ───────────────────────────────────────────────────────────────────
function GDPCard({ data, loading, active, onClick }: { data: GDPForecast | null; loading: boolean; active: boolean; onClick: () => void }) {
  const positive = (data?.forecast_qoq_pct ?? 0) >= 0;
  return (
    <Card title="GDP GROWTH" subtitle="QoQ % · 1 QUARTER AHEAD" active={active} onClick={onClick} accentColor="green">
      {loading || !data ? (
        <div className="space-y-2"><Skeleton /><Skeleton w="w-32" h="h-3" /><Skeleton w="w-24" h="h-3" /></div>
      ) : (
        <>
          <div className={clsx("font-display text-4xl font-bold tabular-nums", positive ? "text-accent-green" : "text-accent-red")}>
            {positive ? "+" : ""}{data.forecast_qoq_pct.toFixed(2)}
            <span className="text-lg ml-1 font-mono font-normal text-text-muted">%</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <ConfidenceBand low={data.confidence_lower} high={data.confidence_upper} value={data.forecast_qoq_pct} color="green" />
            <div className="flex items-center justify-between font-mono text-xs text-text-dim mt-2">
              <span>{data.model_type ?? data.model_name}</span>
              <span className="text-text-muted">v{data.model_version}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ── Unemployment card ──────────────────────────────────────────────────────────
function UnemployCard({ data, loading, active, onClick }: { data: UnemploymentForecast | null; loading: boolean; active: boolean; onClick: () => void }) {
  const change = data?.change_from_current ?? 0;
  return (
    <Card title="UNEMPLOYMENT" subtitle="RATE % · 1 MONTH AHEAD" active={active} onClick={onClick} accentColor="cyan">
      {loading || !data ? (
        <div className="space-y-2"><Skeleton /><Skeleton w="w-32" h="h-3" /><Skeleton w="w-24" h="h-3" /></div>
      ) : (
        <>
          <div className="font-display text-4xl font-bold tabular-nums text-accent-cyan">
            {data.forecast_rate_pct.toFixed(1)}
            <span className="text-lg ml-1 font-mono font-normal text-text-muted">%</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className={clsx("px-1.5 py-0.5 rounded", change > 0 ? "bg-accent-red/15 text-accent-red" : change < 0 ? "bg-accent-green/15 text-accent-green" : "bg-surface-3 text-text-muted")}>
                {change > 0 ? "▲" : change < 0 ? "▼" : "—"} {Math.abs(change).toFixed(2)} pp
              </span>
              <span className="text-text-dim">vs current</span>
            </div>
            <ConfidenceBand low={data.confidence_lower} high={data.confidence_upper} value={data.forecast_rate_pct} color="cyan" />
            <div className="flex items-center justify-between font-mono text-xs text-text-dim mt-2">
              <span>{data.model_name.replace("best_", "")}</span>
              <span className="text-text-muted">v{data.model_version}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ── Fed Funds card ─────────────────────────────────────────────────────────────
const DIR_CONFIG = {
  UP:   { label: "HIKE",  color: "text-accent-red",    bg: "bg-accent-red/10",    bar: "bg-accent-red" },
  FLAT: { label: "HOLD",  color: "text-accent-amber",  bg: "bg-accent-amber/10",  bar: "bg-accent-amber" },
  DOWN: { label: "CUT",   color: "text-accent-green",  bg: "bg-accent-green/10",  bar: "bg-accent-green" },
};

function FedFundsCard({ data, loading, active, onClick }: { data: FedFundsForecast | null; loading: boolean; active: boolean; onClick: () => void }) {
  const cfg = data ? DIR_CONFIG[data.direction] : null;
  return (
    <Card title="FED FUNDS RATE" subtitle="DIRECTION · 2 MONTHS AHEAD" active={active} onClick={onClick} accentColor="amber">
      {loading || !data ? (
        <div className="space-y-2"><Skeleton /><Skeleton w="w-32" h="h-3" /><Skeleton w="w-24" h="h-3" /></div>
      ) : (
        <>
          <div className={clsx("font-display text-4xl font-bold", cfg?.color)}>
            {cfg?.label}
            {data.implied_next_rate != null && (
              <span className="text-lg ml-2 font-mono font-normal text-text-muted">
                → {data.implied_next_rate.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {/* Probability bars */}
            {(["UP", "FLAT", "DOWN"] as const).map(dir => {
              const prob = data.probabilities[dir] ?? 0;
              const dc   = DIR_CONFIG[dir];
              return (
                <div key={dir} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-text-dim w-8">{dir}</span>
                  <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className={clsx("h-full rounded-full transition-all duration-700", dc.bar)} style={{ width: `${(prob * 100).toFixed(0)}%` }} />
                  </div>
                  <span className={clsx("font-mono text-xs w-8 text-right tabular-nums", dir === data.direction ? dc.color : "text-text-dim")}>
                    {(prob * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

// ── Confidence band visualisation ──────────────────────────────────────────────
function ConfidenceBand({ low, high, value, color }: { low: number; high: number; value: number; color: string }) {
  const range   = high - low || 1;
  const pos     = ((value - low) / range) * 100;
  const colorCls = color === "green" ? "bg-accent-green" : color === "cyan" ? "bg-accent-cyan" : "bg-accent-amber";
  const trackCls = color === "green" ? "bg-accent-green/20" : color === "cyan" ? "bg-accent-cyan/20" : "bg-accent-amber/20";

  return (
    <div className="space-y-1">
      <div className={clsx("relative h-1.5 rounded-full overflow-visible", trackCls)}>
        <div
          className={clsx("absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full -translate-x-1/2 shadow", colorCls)}
          style={{ left: `${Math.max(4, Math.min(96, pos))}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-text-dim">
        <span>{low.toFixed(2)}</span>
        <span className="text-text-muted">80% CI</span>
        <span>{high.toFixed(2)}</span>
      </div>
    </div>
  );
}
