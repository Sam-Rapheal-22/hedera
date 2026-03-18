"use client";

function fmt(n: number, prefix = "$") {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

function Stat({ label, value, sub, subClass }: any) {
  return (
    <div className="stat-card animate-fade-up">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? "—"}</div>
      {sub && <div className={`stat-change ${subClass || "neutral"}`}>{sub}</div>}
    </div>
  );
}

export default function StatCards({ market, vaults, agentState }: any) {
  const totalTVL = vaults?.reduce((s: number, v: any) => s + (v.tvl || 0), 0) || 0;
  const totalRewards = vaults?.reduce((s: number, v: any) => s + (v.pendingRewards || 0), 0) || 0;
  const decisions = agentState?.decisionHistory?.length || 0;
  const change = market?.change24h ?? 0;

  const volBars = [1, 2, 3, 4, 5, 6, 7];
  const volLevel = market?.volatilityLevel || "LOW";
  const activeCount = volLevel === "HIGH" ? 7 : volLevel === "MEDIUM" ? 4 : 2;

  return (
    <div className="stat-grid" style={{ marginBottom: 20 }}>
      <div className="stat-card animate-fade-up" style={{ animationDelay: "0s" }}>
        <div className="stat-label">HBAR Price</div>
        <div className="stat-value" style={{ fontSize: 22 }}>
          {market?.price ? `$${market.price.toFixed(5)}` : "—"}
        </div>
        <div className={`stat-change ${change >= 0 ? "positive" : "negative"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% 24h
        </div>
      </div>

      <div className="stat-card animate-fade-up" style={{ animationDelay: "0.08s" }}>
        <div className="stat-label">Total TVL</div>
        <div className="stat-value" style={{ fontSize: 22 }}>{fmt(totalTVL)}</div>
        <div className="stat-change neutral">Across {vaults?.length || 0} vaults</div>
      </div>

      <div className="stat-card animate-fade-up" style={{ animationDelay: "0.16s" }}>
        <div className="stat-label">Pending Rewards</div>
        <div className="stat-value" style={{ fontSize: 22, color: "var(--accent-green)" }}>
          {fmt(totalRewards)}
        </div>
        <div className="stat-change positive">Ready to harvest</div>
      </div>

      <div className="stat-card animate-fade-up" style={{ animationDelay: "0.24s" }}>
        <div className="stat-label">Volatility</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginTop: 8 }}>
          <div className="volatility-meter">
            {volBars.map((b, i) => (
              <div
                key={b}
                className={`volatility-bar ${i < activeCount ? `active-${volLevel.toLowerCase()}` : ""}`}
                style={{ height: `${(i + 1) * 4}px` }}
              />
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, marginLeft: 8, color: volLevel === "HIGH" ? "var(--accent-red)" : volLevel === "MEDIUM" ? "var(--accent-yellow)" : "var(--accent-green)" }}>
            {market?.volatility?.toFixed(1) ?? "—"}%
          </span>
        </div>
        <div className="stat-change neutral">{volLevel} · {decisions} AI decisions</div>
      </div>
    </div>
  );
}
