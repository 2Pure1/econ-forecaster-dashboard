// src/components/feed/EventFeed.tsx
"use client";

import clsx from "clsx";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { ReleaseEvent } from "@/lib/api";

interface Props {
  events:    ReleaseEvent[];
  connected: boolean;
}

const IMPACT_CONFIG = {
  HIGH:   { color: "text-accent-red",   bg: "bg-accent-red/10",   border: "border-accent-red/20",   dot: "bg-accent-red" },
  MEDIUM: { color: "text-accent-amber", bg: "bg-accent-amber/10", border: "border-accent-amber/20", dot: "bg-accent-amber" },
  LOW:    { color: "text-text-muted",   bg: "bg-surface-3",       border: "border-border",          dot: "bg-text-dim" },
};

const DIR_ICON: Record<string, string> = { UP: "▲", DOWN: "▼", FLAT: "—", UNKNOWN: "?" };
const DIR_COLOR: Record<string, string> = {
  UP:   "text-accent-red",
  DOWN: "text-accent-green",
  FLAT: "text-text-muted",
  UNKNOWN: "text-text-dim",
};

const SOURCE_COLOR: Record<string, string> = {
  BLS:  "text-accent-cyan",
  FRED: "text-accent-amber",
  BEA:  "text-accent-purple",
};

export function EventFeed({ events, connected }: Props) {
  return (
    <div className="bg-surface-1 border border-border rounded-lg flex flex-col h-full min-h-[400px]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">RELEASE FEED</h2>
          <p className="font-mono text-[10px] text-text-muted mt-0.5">
            BEA · FRED · BLS DATA RELEASES
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={clsx("w-2 h-2 rounded-full", connected ? "bg-accent-green animate-pulse-slow" : "bg-text-dim")} />
          <span className="font-mono text-xs text-text-muted">{connected ? "LIVE" : "POLLING"}</span>
        </div>
      </div>

      {/* Scan line effect (decorative) */}
      {connected && (
        <div className="relative h-px overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent animate-scan" />
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-dim font-mono text-xs">
            WAITING FOR RELEASES...
          </div>
        ) : (
          events.map((evt, i) => (
            <EventRow key={`${evt.id}-${i}`} event={evt} isNew={i === 0} />
          ))
        )}
      </div>
    </div>
  );
}

function EventRow({ event: e, isNew }: { event: ReleaseEvent; isNew: boolean }) {
  const imp = IMPACT_CONFIG[e.market_impact] ?? IMPACT_CONFIG.LOW;

  return (
    <div className={clsx(
      "px-4 py-3 transition-colors hover:bg-surface-2",
      isNew && "animate-fade-up",
      e.is_anomaly && "bg-accent-red/5",
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={clsx("font-mono text-[10px] font-bold flex-shrink-0", SOURCE_COLOR[e.source] ?? "text-text-muted")}>
            {e.source}
          </span>
          <span className="font-mono text-xs text-text-primary truncate">
            {e.release_name.replace(/_/g, " ")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {e.is_anomaly && (
            <span className="font-mono text-[9px] text-accent-red border border-accent-red/30 px-1 rounded">
              ANOMALY
            </span>
          )}
          <span className={clsx("font-mono text-[9px] border px-1 rounded", imp.color, imp.bg, imp.border)}>
            {e.market_impact}
          </span>
        </div>
      </div>

      {/* Value row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-bold text-text-primary tabular-nums">
            {e.value?.toFixed(2) ?? "—"}
          </span>
          <span className={clsx("font-mono text-sm font-bold", DIR_COLOR[e.value_direction])}>
            {DIR_ICON[e.value_direction]}
          </span>
          {e.surprise_pct != null && (
            <span className={clsx(
              "font-mono text-xs px-1.5 py-0.5 rounded",
              e.surprise_pct > 0 ? "text-accent-green bg-accent-green/10" : "text-accent-red bg-accent-red/10",
            )}>
              {e.surprise_pct > 0 ? "+" : ""}{e.surprise_pct.toFixed(1)}% surprise
            </span>
          )}
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] text-text-muted">{e.period}</p>
          <p className="font-mono text-[10px] text-text-dim">
            {formatDistanceToNow(parseISO(e.processed_ts), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Anomaly reason */}
      {e.anomaly_reason && (
        <p className="mt-1.5 font-mono text-[10px] text-accent-red/70 truncate">
          ⚠ {e.anomaly_reason}
        </p>
      )}
    </div>
  );
}
