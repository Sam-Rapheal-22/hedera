"use client";

const SCENARIOS = [
  { id: "high_volatility", label: "⚡ High Volatility", desc: "Spike + range exit" },
  { id: "bearish", label: "📉 Bearish Crash", desc: "Negative sentiment + dump" },
  { id: "bullish", label: "🚀 Bullish Rally", desc: "Positive momentum" },
  { id: "low_volatility", label: "😴 Low Volatility", desc: "Stable market, tighten range" },
];

export default function SimulationBar({ runSimulation, simulating }: any) {
  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0ff", marginBottom: 2 }}>
            🎯 Market Simulator
          </div>
          <div style={{ fontSize: 11, color: "#8892b0" }}>
            Inject a market scenario — watch the AI agent respond in real time
          </div>
        </div>
        <div className="sim-bar">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className={`sim-btn scenario-${s.id}`}
              onClick={() => runSimulation(s.id)}
              disabled={simulating}
              title={s.desc}
              id={`sim-${s.id}`}
            >
              {simulating ? <span className="spinner" style={{ width: 12, height: 12, display: "inline-block" }} /> : s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
