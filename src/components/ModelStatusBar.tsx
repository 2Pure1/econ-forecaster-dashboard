"use client";

const MODELS = [
    { id: "gdp-v3", status: "active", latency: "12ms" },
    { id: "unemployment-v2", status: "active", latency: "18ms" },
    { id: "fed-funds-v4", status: "standby", latency: "45ms" },
];

export default function ModelStatusBar() {
    return (
        <div className="flex items-center gap-8 px-6 py-2 bg-[#0d1117] border-t border-border mt-auto">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Loaded Models:</span>
            <div className="flex gap-6">
                {MODELS.map((model) => (
                    <div key={model.id} className="flex items-center gap-2 group cursor-help">
                        <div className={`w-1.5 h-1.5 rounded-full ${model.status === "active" ? "bg-accent-green" : "bg-slate-600"
                            }`} />
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-white transition-colors uppercase">
                            {model.id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 tabular-nums lowercase">
                            {model.latency}
                        </span>
                    </div>
                ))}
            </div>
            <div className="ml-auto flex items-center gap-2 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-slate-500 capitalize">Pipeline:</span>
                <span className="text-[10px] font-mono text-accent-cyan font-bold">STABLE</span>
            </div>
        </div>
    );
}
