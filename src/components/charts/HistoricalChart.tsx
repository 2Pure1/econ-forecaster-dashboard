// src/components/charts/HistoricalChart.tsx
"use client";

import clsx from "clsx";
import { format, parseISO } from "date-fns";
import {
  Area, AreaChart, CartesianGrid, Legend, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { HistoricalPoint } from "@/lib/api";

type Target = "gdp_growth" | "unemployment_rate" | "fed_funds_direction";

const TARGET_META: Record<Target, {
  label: string; unit: string; actualColor: string; predictColor: string;
  actualFill: string; predictFill: string; refLine?: number;
}> = {
  gdp_growth: {
    label: "GDP Growth (QoQ %)", unit: "%",
    actualColor: "#00e5a0", predictColor: "#00d4ff",
    actualFill: "rgba(0,229,160,0.08)", predictFill: "rgba(0,212,255,0.06)",
    refLine: 0,
  },
  unemployment_rate: {
    label: "Unemployment Rate (%)", unit: "%",
    actualColor: "#00d4ff", predictColor: "#a855f7",
    actualFill: "rgba(0,212,255,0.08)", predictFill: "rgba(168,85,247,0.06)",
  },
  fed_funds_direction: {
    label: "Fed Funds Rate (%)", unit: "%",
    actualColor: "#ffb547", predictColor: "#ff4757",
    actualFill: "rgba(255,181,71,0.08)", predictFill: "rgba(255,71,87,0.06)",
  },
};

interface Props {
  target:  Target;
  data:    HistoricalPoint[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-lg p-3 shadow-xl font-mono text-xs min-w-[140px]">
      <p className="text-text-muted mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-text-primary tabular-nums">
            {p.value != null ? `${p.value.toFixed(2)}${unit}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
};

export function HistoricalChart({ target, data, loading }: Props) {
  const meta = TARGET_META[target];

  // Format dates for x-axis
  const chartData = data.map(d => ({
    ...d,
    label: d.period ? format(parseISO(d.period), "MMM yy") : d.period,
  }));

  return (
    <div className="bg-surface-1 border border-border rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">{meta.label}</h2>
          <p className="font-mono text-xs text-text-muted mt-0.5">
            ACTUALS vs MODEL PREDICTIONS · 36 MONTHS
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LegendItem color={meta.actualColor}  label="Actual" />
          <LegendItem color={meta.predictColor} label="Predicted" dashed />
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="space-y-2 w-full">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-1.5 bg-surface-3 rounded animate-pulse"
                  style={{ width: `${60 + Math.random() * 40}%`, animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id={`actual-${target}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={meta.actualColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={meta.actualColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`predict-${target}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={meta.predictColor} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={meta.predictColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,61,0.8)" vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#6b8299", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={{ stroke: "#1e2d3d" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b8299", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}${meta.unit}`}
              />

              {meta.refLine !== undefined && (
                <ReferenceLine y={meta.refLine} stroke="rgba(107,130,153,0.3)" strokeDasharray="4 4" />
              )}

              <Tooltip content={<CustomTooltip unit={meta.unit} />} />

              <Area
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke={meta.actualColor}
                strokeWidth={2}
                fill={`url(#actual-${target})`}
                dot={false}
                activeDot={{ r: 4, fill: meta.actualColor, stroke: "#0a0d12", strokeWidth: 2 }}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke={meta.predictColor}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill={`url(#predict-${target})`}
                dot={false}
                activeDot={{ r: 4, fill: meta.predictColor, stroke: "#0a0d12", strokeWidth: 2 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats row */}
      {!loading && data.length > 0 && (
        <ChartStats data={data} meta={meta} />
      )}
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="20" height="8">
        <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth={dashed ? 1.5 : 2}
          strokeDasharray={dashed ? "4 2" : undefined} />
      </svg>
      <span className="font-mono text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

function ChartStats({ data, meta }: { data: HistoricalPoint[]; meta: typeof TARGET_META[Target] }) {
  const paired = data.filter(d => d.actual != null && d.predicted != null);
  if (paired.length === 0) return null;

  const mae  = paired.reduce((s, d) => s + Math.abs(d.actual! - d.predicted!), 0) / paired.length;
  const rmse = Math.sqrt(paired.reduce((s, d) => s + (d.actual! - d.predicted!) ** 2, 0) / paired.length);
  const actuals = paired.map(d => d.actual!);
  const meanA   = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  const ss_res  = paired.reduce((s, d) => s + (d.actual! - d.predicted!) ** 2, 0);
  const ss_tot  = paired.reduce((s, d) => s + (d.actual! - meanA) ** 2, 0);
  const r2      = ss_tot > 0 ? 1 - ss_res / ss_tot : 0;

  return (
    <div className="mt-4 pt-4 border-t border-border flex items-center gap-6">
      <Stat label="MAE"   value={`${mae.toFixed(3)}${meta.unit}`}  color={meta.actualColor} />
      <Stat label="RMSE"  value={`${rmse.toFixed(3)}${meta.unit}`} color={meta.predictColor} />
      <Stat label="R²"    value={r2.toFixed(3)}                    color="text-text-primary" />
      <Stat label="N OBS" value={paired.length.toString()}         color="text-text-muted" />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-text-dim">{label}</p>
      <p className={clsx("font-mono text-sm font-semibold tabular-nums", color.startsWith("text-") ? color : `text-[${color}]`)}>
        {value}
      </p>
    </div>
  );
}
