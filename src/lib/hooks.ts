// src/lib/hooks.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createReleaseSocket,
  fetchFedFundsForecast,
  fetchGDPForecast,
  fetchHistoricalData,
  fetchModelInfo,
  fetchRecentReleases,
  fetchUnemploymentForecast,
  type FedFundsForecast,
  type GDPForecast,
  type HistoricalPoint,
  type MacroFeatures,
  type ModelInfo,
  type ReleaseEvent,
  type UnemploymentForecast,
} from "./api";

// ── usePolling — generic polling hook ─────────────────────────────────────────
function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled = true,
) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return;
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs, enabled]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}

// ── useForecasts — polls all three forecast endpoints every 5 min ─────────────
export interface AllForecasts {
  gdp:          GDPForecast | null;
  unemployment: UnemploymentForecast | null;
  fedFunds:     FedFundsForecast | null;
  loading:      boolean;
  error:        string | null;
  lastUpdated:  Date | null;
}

export function useForecasts(features: MacroFeatures): AllForecasts {
  const [gdp, setGdp]                   = useState<GDPForecast | null>(null);
  const [unemployment, setUnemployment] = useState<UnemploymentForecast | null>(null);
  const [fedFunds, setFedFunds]         = useState<FedFundsForecast | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [g, u, f] = await Promise.allSettled([
        fetchGDPForecast(features),
        fetchUnemploymentForecast(features),
        fetchFedFundsForecast(features),
      ]);
      if (g.status === "fulfilled") setGdp(g.value);
      if (u.status === "fulfilled") setUnemployment(u.value);
      if (f.status === "fulfilled") setFedFunds(f.value);
      const anyError = [g, u, f].find(r => r.status === "rejected");
      setError(anyError ? (anyError as PromiseRejectedResult).reason?.message : null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch forecasts");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(features)]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5 * 60 * 1000); // 5 min
    return () => clearInterval(id);
  }, [fetchAll]);

  return { gdp, unemployment, fedFunds, loading, error, lastUpdated };
}

// ── useReleaseEvents — WebSocket + REST polling fallback ──────────────────────
export function useReleaseEvents(maxEvents = 30) {
  const [events, setEvents]       = useState<ReleaseEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]     = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const addEvent = useCallback((evt: ReleaseEvent) => {
    setEvents(prev => [evt, ...prev].slice(0, maxEvents));
  }, [maxEvents]);

  // Initial REST load
  useEffect(() => {
    fetchRecentReleases(maxEvents)
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [maxEvents]);

  // WebSocket for live updates
  useEffect(() => {
    const ws = createReleaseSocket(
      addEvent,
      () => setConnected(true),
      () => { setConnected(false); wsRef.current = null; },
    );
    wsRef.current = ws;
    return () => ws.close();
  }, [addEvent]);

  // Fallback REST poll every 30s if WebSocket disconnected
  useEffect(() => {
    if (connected) return;
    const id = setInterval(async () => {
      try {
        const data = await fetchRecentReleases(maxEvents);
        setEvents(data);
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, [connected, maxEvents]);

  return { events, connected, loading };
}

// ── useHistoricalData ─────────────────────────────────────────────────────────
export function useHistoricalData(target: string, months = 36) {
  const fetcher = useCallback(() => fetchHistoricalData(target, months), [target, months]);
  return usePolling<HistoricalPoint[]>(fetcher, 10 * 60 * 1000); // refresh every 10 min
}

// ── useModelInfo ──────────────────────────────────────────────────────────────
export function useModelInfo() {
  const fetcher = useCallback(() => fetchModelInfo(), []);
  const { data, ...rest } = usePolling<{ models: ModelInfo[] }>(fetcher, 5 * 60 * 1000);
  return { models: data?.models ?? [], ...rest };
}
