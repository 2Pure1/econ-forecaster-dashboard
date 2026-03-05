// src/app/page.tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { RegimeIndicator } from "@/components/regime/RegimeIndicator";
import { ForecastCards } from "@/components/forecast/ForecastCards";
import { HistoricalChart } from "@/components/charts/HistoricalChart";
import { EventFeed } from "@/components/feed/EventFeed";
import { ModelStatusBar } from "@/components/ModelStatusBar";
import { useForecasts, useReleaseEvents, useHistoricalData } from "@/lib/hooks";
import type { MacroFeatures } from "@/lib/api";

// Current macro snapshot — in production this would come from the DB
const CURRENT_FEATURES: MacroFeatures = {
  unemployment_rate:            4.1,
  fed_funds_rate:               4.50,
  cpi_yoy_pct:                  2.89,
  core_pce_yoy_pct:             2.63,
  gdp_billions_usd:             28269.0,
  nonfarm_payrolls_mom_change:  216.0,
  observation_month:            "2024-12-01",
};

type ChartTarget = "gdp_growth" | "unemployment_rate" | "fed_funds_direction";

export default function DashboardPage() {
  const [activeChart, setActiveChart] = useState<ChartTarget>("unemployment_rate");

  const { gdp, unemployment, fedFunds, loading: forecastLoading, lastUpdated } =
    useForecasts(CURRENT_FEATURES);

  const { events, connected } = useReleaseEvents(40);

  const { data: histData, loading: histLoading } =
    useHistoricalData(activeChart, 36);

  return (
    <div className="min-h-screen flex flex-col">
      <Header lastUpdated={lastUpdated} />

      <main className="flex-1 px-4 pb-8 max-w-[1600px] mx-auto w-full">

        {/* ── Regime + model status row ── */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
          <RegimeIndicator regime={gdp?.regime ?? null} loading={forecastLoading} />
          <ModelStatusBar gdp={gdp} unemployment={unemployment} fedFunds={fedFunds} />
        </div>

        {/* ── Forecast cards ── */}
        <div className="mt-6">
          <ForecastCards
            gdp={gdp}
            unemployment={unemployment}
            fedFunds={fedFunds}
            loading={forecastLoading}
            onSelectChart={setActiveChart}
            activeChart={activeChart}
          />
        </div>

        {/* ── Chart + Feed ── */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
          <HistoricalChart
            target={activeChart}
            data={histData ?? []}
            loading={histLoading}
          />
          <EventFeed events={events} connected={connected} />
        </div>

      </main>
    </div>
  );
}
