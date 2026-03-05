"use client";

import { useEffect, useState } from "react";

export default function Header() {
    const [time, setTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(now.toISOString().split("T")[1].split(".")[0]);
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-display font-bold tracking-tighter text-white">
                    <span className="text-accent-green">ECON</span>CAST
                </h1>
                <div className="h-4 w-[1px] bg-border mx-2" />
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    US Macro • ML Forecasting
                </span>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20">
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse-fast" />
                    <span className="text-[10px] font-mono font-bold text-accent-green uppercase">
                        Live Feed
                    </span>
                </div>
                <div className="text-sm font-mono text-slate-400 tabular-nums">
                    UTC {time}
                </div>
            </div>
        </header>
    );
}
