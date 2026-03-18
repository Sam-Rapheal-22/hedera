"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(10,14,30,0.95)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 8, padding: "8px 12px" }}>
        <div style={{ fontSize: 11, color: "#8892b0", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0ff", fontFamily: "var(--font-mono)" }}>
          ${payload[0]?.value?.toFixed(5)}
        </div>
      </div>
    );
  }
  return null;
};

export default function PriceChart({ market, expanded }: any) {
  const data = market?.priceHistory || [];
  const prices = data.map((d: any) => d.price).filter(Boolean);
  const min = prices.length ? Math.min(...prices) * 0.998 : 0;
  const max = prices.length ? Math.max(...prices) * 1.002 : 1;
  const avg = prices.length ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">📈</span>
          HBAR Price (24h)
        </div>
        <div className="flex items-center gap-2">
          {market?.simulated && <span className="badge badge-purple">Simulated</span>}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#8892b0" }}>
            avg ${avg.toFixed(5)}
          </span>
        </div>
      </div>

      <div className="chart-wrapper" style={{ height: expanded ? 320 : 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#4a5580" }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              domain={[min, max]}
              tick={{ fontSize: 10, fill: "#4a5580", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v.toFixed(4)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {avg > 0 && (
              <ReferenceLine y={avg} stroke="rgba(108,99,255,0.4)" strokeDasharray="4 4" />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#6c63ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6c63ff", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3" style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 12, color: "#8892b0" }}>
          Vol: <span style={{ color: "#f0f0ff", fontFamily: "var(--font-mono)" }}>
            {market?.volume24h ? `$${(market.volume24h / 1_000_000).toFixed(2)}M` : "—"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#8892b0" }}>
          MCap: <span style={{ color: "#f0f0ff", fontFamily: "var(--font-mono)" }}>
            {market?.marketCap ? `$${(market.marketCap / 1_000_000_000).toFixed(2)}B` : "—"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#8892b0" }}>
          Range: <span style={{ color: "#f0f0ff", fontFamily: "var(--font-mono)", fontSize: 11 }}>
            ${min.toFixed(5)} – ${max.toFixed(5)}
          </span>
        </div>
      </div>
    </div>
  );
}
