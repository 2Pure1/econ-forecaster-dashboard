# 📊 Econ Forecaster Dashboard

> **Next.js live dashboard** for US macroeconomic forecasting — displays real-time GDP growth, unemployment, and Fed Funds Rate direction forecasts from the ML platform, with a live economic release event feed and historical actuals vs predictions charts.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Recharts](https://img.shields.io/badge/Recharts-2.10-22d3ee)

---

## 🖥️ Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  ECONCAST  US MACRO · ML FORECASTING                    UTC 14:32:01 ▮│
├─────────────────────────────────────────────────────────────────────┤
│  ● RECOVERY  GDP growth 1-3% — moderate expansion     MODELS v3 v2 v4│
├───────────────────┬───────────────────┬─────────────────────────────┤
│  GDP GROWTH       │  UNEMPLOYMENT     │  FED FUNDS RATE             │
│  QoQ % · 1Q AHEAD│  RATE · 1M AHEAD  │  DIRECTION · 2M AHEAD       │
│                   │                   │                             │
│     +2.31%        │      4.1%         │     HOLD → 4.50%            │
│  CI [0.77, 3.85]  │   ▼ -0.10 pp      │  UP  ████░░░░░░  08%        │
│  ▓▓▓▓░░░░░░░░ 80% │  CI [3.8, 4.4]   │  FLAT████████░░  71%        │
│                   │                   │  DOWN████░░░░░░  21%        │
├───────────────────┴───────────────────┴──────────────┬──────────────┤
│  UNEMPLOYMENT RATE (%) — ACTUALS vs PREDICTED         │ RELEASE FEED│
│  36 months   ──── Actual  - - - Predicted             │             │
│                                                       │ BLS JOBS    │
│  ████                                                 │ 256k  ▲ +18%│
│  ████                          ████                   │ 2 min ago   │
│       ████████████████████████                        │ FRED FOMC   │
│                                                       │ 4.50% ▼ CUT │
│  MAE 0.14%  RMSE 0.19%  R² 0.91  N=36                │ 18 hrs ago  │
└───────────────────────────────────────────────────────┴─────────────┘
```

---

## 🏗️ Architecture

```
econ-ml-platform API          PostgreSQL streaming views
  /predict/gdp_growth         streaming.latest_by_indicator
  /predict/unemployment    ←  streaming.releases_enriched      ← REST poll
  /predict/fed_funds                                              every 5 min
         │                            │
         │ REST poll                  │ Next.js API routes
         │ every 5 min                │ /api/releases
         ▼                            │ /api/historical
┌──────────────────────────────────────────────────────────┐
│              Next.js App (port 3001)                     │
│                                                          │
│  page.tsx                                                │
│    ├─ useForecasts()      → ForecastCards                │
│    ├─ useReleaseEvents()  → EventFeed (WS + REST)        │
│    ├─ useHistoricalData() → HistoricalChart (Recharts)   │
│    └─ RegimeIndicator     (from GDP forecast)            │
│                                                          │
│  server.ts (custom)                                      │
│    └─ WebSocket /ws/releases → Kafka consumer relay      │
└──────────────────────────────────────────────────────────┘
         ▲
         │ WebSocket ws://localhost:3001/ws/releases
         │ (falls back to REST polling every 30s if disconnected)
Kafka econ.releases.enriched ← econ-streaming-pipeline
```

---

## 📁 Project Structure

```
econ-forecaster-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx              Global layout, fonts (Syne + JetBrains Mono)
│   │   ├── page.tsx                Main dashboard page
│   │   ├── globals.css             Tailwind base + custom animations
│   │   └── api/
│   │       ├── releases/route.ts   GET /api/releases  → PostgreSQL proxy
│   │       └── historical/route.ts GET /api/historical → mart + mock fallback
│   │
│   ├── components/
│   │   ├── Header.tsx              Live UTC clock, model update badge
│   │   ├── ModelStatusBar.tsx      Loaded model versions
│   │   ├── regime/
│   │   │   └── RegimeIndicator.tsx Expansion/Recovery/Slowdown/Contraction
│   │   ├── forecast/
│   │   │   └── ForecastCards.tsx   GDP, Unemployment, Fed Funds cards
│   │   ├── charts/
│   │   │   └── HistoricalChart.tsx Recharts area chart with CI band + stats
│   │   └── feed/
│   │       └── EventFeed.tsx       Live release event list
│   │
│   └── lib/
│       ├── api.ts                  Typed fetch wrappers + WebSocket factory
│       └── hooks.ts                useForecasts, useReleaseEvents, useHistoricalData
│
├── server.ts                       Custom server: Next.js + WebSocket
├── tailwind.config.ts              Dark terminal theme + custom animations
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

---

## 🎨 Design

**Aesthetic:** Dark terminal / Bloomberg terminal-inspired. Deep navy grid background, monospace data displays, minimal chrome. Recharts area charts with gradient fills and dashed prediction lines.

**Fonts:** Syne (display, geometric/editorial) + JetBrains Mono (data/labels/code)

**Colour palette:**
- Background: `#0a0d12` with grid overlay
- Accent green `#00e5a0` — positive, expansion, beats
- Accent cyan `#00d4ff` — unemployment, neutral
- Accent amber `#ffb547` — Fed Funds, caution
- Accent red `#ff4757` — negative, contraction, misses

---

## 🚀 Quick Start

### Prerequisites
- `econ-ml-platform` running at http://localhost:8000 (Project 4)
- Optional: `econ-streaming-pipeline` for live Kafka events (Project 3)

### 1. Install and run

```bash
cd econ-forecaster-dashboard
npm install
npm run dev
# → http://localhost:3000
```

### 2. With custom server (WebSocket support)

```bash
npm install ws kafkajs
npx ts-node server.ts
# → http://localhost:3001
# → ws://localhost:3001/ws/releases
```

### 3. Configure environment

```bash
# .env.local
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
NEXT_PUBLIC_PG_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws/releases
POSTGRES_URL=postgresql://econ_user:password@localhost:5432/econ_warehouse
USE_KAFKA=false   # set true when streaming pipeline is running
```

### 4. Docker

```bash
set -a && source ../.env && set +a
docker compose -f docker/docker-compose.yml up -d
# → http://localhost:3001
```

---

## 🔌 Data Sources

| Component | Source | Update cadence |
|-----------|--------|---------------|
| Forecast cards | `econ-ml-platform` REST | Every 5 minutes |
| Historical chart | `fct_macro_indicators_monthly` | Every 10 minutes |
| Release feed | `streaming.releases_enriched` | WebSocket live / REST 30s fallback |
| Regime indicator | Derived from GDP forecast | Same as forecast cards |

**Offline / mock mode:** All data sources fall back gracefully. When the ML API is unreachable, forecast cards show a loading skeleton. When PostgreSQL is unavailable, API routes return realistic mock data so the UI is always functional.

---

## 📈 Upstream Projects

| Project | Role |
|---------|------|
| `econ-ml-platform` | Serves forecast predictions via REST API |
| `econ-streaming-pipeline` | Publishes release events via Kafka → WebSocket relay |
| `econ-data-pipeline` | Provides historical data via PostgreSQL mart |

---

## 📄 License

MIT
