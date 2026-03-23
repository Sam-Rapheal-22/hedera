"use client";

function fmt(n: number, prefix = "$") {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

export default function StatCards({ market, vaults, agentState, walletInfo }: any) {
  const decisions = agentState?.decisionHistory?.length || 0;
  const change = market?.change24h ?? 0;

  const volBars = [1, 2, 3, 4, 5, 6, 7];
  const volLevel = market?.volatilityLevel || "LOW";
  const activeCount = volLevel === "HIGH" ? 7 : volLevel === "MEDIUM" ? 4 : 2;

  // Real wallet totals
  const hbarBalance = walletInfo?.hbar ?? null;
  const tokenCount = walletInfo?.tokenCount ?? null;
  // USD value of HBAR holdings
  const hbarUsd = hbarBalance != null && market?.price ? hbarBalance * market.price : null;

  return (
    <div className="stat-grid" style={{ marginBottom: 20 }}>
      {/* HBAR Price */}
      <div className="stat-card animate-fade-up" style={{ animationDelay: "0s" }}>
        <div className="stat-label">HBAR Price</div>
        <div className="stat-value" style={{ fontSize: 22 }}>
          {market?.price ? `$${market.price.toFixed(5)}` : "—"}
        </div>
        <div className={`stat-change ${change >= 0 ? "positive" : "negative"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% 24h
        </div>
      </div>

      {/* HBAR Balance */}
      <div className="stat-card animate-fade-up" style={{ animationDelay: "0.08s" }}>
        <div className="stat-label">HBAR Balance</div>
        <div className="stat-value" style={{ fontSize: 22 }}>
          {hbarBalance != null
            ? `${hbarBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ℏ`
            : "—"}
        </div>
        <div className="stat-change neutral">
          {hbarUsd != null
            ? `≈ ${fmt(hbarUsd)} USD`
            : walletInfo
              ? "No HBAR"
              : "Connect wallet"}
        </div>
      </div>

      {/* Token Holdings */}
      <div className="stat-card animate-fade-up" style={{ animationDelay: "0.16s" }}>
        <div className="stat-label">Token Holdings</div>
        <div className="stat-value" style={{ fontSize: 22, color: "var(--accent-green)" }}>
          {tokenCount != null ? tokenCount : "—"}
        </div>
        <div className="stat-change neutral">
          {vaults?.length ? `${vaults.length} asset${vaults.length !== 1 ? "s" : ""} on-chain` : "Connect wallet"}
        </div>
      </div>

      {/* Volatility */}
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
