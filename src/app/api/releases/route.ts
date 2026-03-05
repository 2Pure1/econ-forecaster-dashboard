import { NextResponse } from "next/server";

// Mock data generator for releases
const generateMockReleases = () => [
    {
        id: Date.now() - 120000,
        source: "BLS",
        release_name: "BLS_JOBS_REPORT",
        indicator: "nonfarm_payrolls_thousands",
        value: 256,
        prior_value: 210,
        surprise_pct: 18.2,
        market_impact: "HIGH",
        processed_ts: new Date(Date.now() - 120000).toISOString(),
    },
    {
        id: Date.now() - 64800000,
        source: "FRED",
        release_name: "FOMC_RATE_DECISION",
        indicator: "fed_funds_rate",
        value: 4.5,
        prior_value: 4.75,
        surprise_pct: -5.3,
        market_impact: "HIGH",
        processed_ts: new Date(Date.now() - 64800000).toISOString(),
    },
];

export async function GET() {
    try {
        // In a real app, this would query PostgreSQL
        // For now, return mock data as a fallback
        return NextResponse.json(generateMockReleases());
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch releases" }, { status: 500 });
    }
}
