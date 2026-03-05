import { NextResponse } from "next/server";

// Mock historical data (last 12 months)
const generateHistoricalData = () => {
    const data = [];
    const baseValue = 4.0;
    for (let i = 12; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toISOString().slice(0, 7);
        const actual = baseValue + (Math.random() - 0.5) * 0.5;
        const predicted = actual + (Math.random() - 0.5) * 0.2;
        data.push({
            month,
            actual: parseFloat(actual.toFixed(2)),
            predicted: parseFloat(predicted.toFixed(2)),
            ci_low: parseFloat((predicted - 0.3).toFixed(2)),
            ci_high: parseFloat((predicted + 0.3).toFixed(2)),
        });
    }
    return data;
};

export async function GET() {
    try {
        // Proxy for historical data from PG mart
        return NextResponse.json(generateHistoricalData());
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 });
    }
}
