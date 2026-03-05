// src/lib/api.ts
// Typed fetch wrappers for econ-ml-platform API and streaming PostgreSQL views.
// All functions return typed results or throw on error.

const ML_API   = process.env.NEXT_PUBLIC_ML_API_URL   ?? "http://localhost:8000";
const PG_API   = process.env.NEXT_PUBLIC_PG_API_URL   ?? "http://localhost:3001"; // Next.js API routes proxy
const WS_URL   = process.env.NEXT_PUBLIC_WS_URL       ?? "ws://localhost:3001/ws/releases";

// ── Types ──────────────────────────────────────────────────────────────────────
export type Regime = "EXPANSION" | "RECOVERY" | "SLOWDOWN" | "CONTRACTION" | "UNKNOWN";
export type FedDirection = "UP" | "FLAT" | "DOWN";

export interface MacroFeatures {
  unemployment_rate?:           number;
  fed_funds_rate?:              number;
  cpi_yoy_pct?:                 number;
  core_pce_yoy_pct?:            number;
  gdp_billions_usd?:            number;
  nonfarm_payrolls_mom_change?: number;
  observation_month?:           string;
}

export interface GDPForecast {
  target:            "gdp_growth";
  horizon_quarters:  number;
  forecast_qoq_pct:  number;
  confidence_lower:  number;
  confidence_upper:  number;
  regime:            Regime;
  model_name:        string;
  model_version:     string;
  prediction_id:     string;
  predicted_at:      string;
  latency_ms:        number;
}

export interface UnemploymentForecast {
  target:               "unemployment_rate";
  horizon_months:       number;
  forecast_rate_pct:    number;
  change_from_current:  number | null;
  confidence_lower:     number;
  confidence_upper:     number;
  model_name:           string;
  model_version:        string;
  prediction_id:        string;
  predicted_at:         string;
  latency_ms:           number;
}

export interface FedFundsForecast {
  target:            "fed_funds_direction";
  horizon_months:    number;
  direction:         FedDirection;
  probabilities:     Record<FedDirection, number>;
  current_rate:      number | null;
  implied_next_rate: number | null;
  model_name:        string;
  model_version:     string;
  prediction_id:     string;
  predicted_at:      string;
  latency_ms:        number;
}

export interface ModelInfo {
  target:        string;
  model_name:    string;
  model_version: string;
  model_type:    string;
  loaded_at:     string;
  metrics:       Record<string, number>;
}

export interface ReleaseEvent {
  id:              number;
  source:          string;
  release_name:    string;
  indicator:       string;
  period:          string;
  value:           number;
  prior_value:     number | null;
  surprise_pct:    number | null;
  market_impact:   "HIGH" | "MEDIUM" | "LOW";
  value_direction: "UP" | "DOWN" | "FLAT" | "UNKNOWN";
  is_anomaly:      boolean;
  anomaly_reason:  string | null;
  processed_ts:    string;
}

export interface HistoricalPoint {
  period:     string;
  actual:     number | null;
  predicted:  number | null;
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────
async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    next:    { revalidate: 0 },   // no caching for predictions
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function get<T>(url: string, revalidate = 60): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

// ── Forecast API calls ─────────────────────────────────────────────────────────
export async function fetchGDPForecast(features: MacroFeatures): Promise<GDPForecast> {
  return post(`${ML_API}/predict/gdp_growth`, { features, horizon: 1 });
}

export async function fetchUnemploymentForecast(features: MacroFeatures): Promise<UnemploymentForecast> {
  return post(`${ML_API}/predict/unemployment`, { features, horizon: 1 });
}

export async function fetchFedFundsForecast(features: MacroFeatures): Promise<FedFundsForecast> {
  return post(`${ML_API}/predict/fed_funds`, { features, horizon: 2 });
}

export async function fetchModelInfo(): Promise<{ models: ModelInfo[] }> {
  return get(`${ML_API}/models/info`, 300);
}

export async function fetchApiHealth(): Promise<{ status: string }> {
  return get(`${ML_API}/health`, 30);
}

// ── Streaming data (via Next.js API routes proxying PostgreSQL) ─────────────
export async function fetchRecentReleases(limit = 20): Promise<ReleaseEvent[]> {
  return get(`${PG_API}/api/releases?limit=${limit}`, 0);
}

export async function fetchHistoricalData(target: string, months = 36): Promise<HistoricalPoint[]> {
  return get(`${PG_API}/api/historical?target=${target}&months=${months}`, 60);
}

// ── WebSocket for live release events ─────────────────────────────────────────
export function createReleaseSocket(
  onMessage: (event: ReleaseEvent) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
): WebSocket {
  const ws = new WebSocket(WS_URL);
  ws.onopen    = () => onConnect?.();
  ws.onclose   = () => onDisconnect?.();
  ws.onerror   = (e) => console.warn("WebSocket error", e);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); }
    catch { console.warn("Bad WS message", e.data); }
  };
  return ws;
}

export { WS_URL };
