"use client";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar-track" style={{ marginTop: 6 }}>
      <div className="progress-bar-fill" style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

function VaultCard({ vault, expanded }: any) {
  const inRange = vault.inRange;
  return (
    <div className="vault-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>🏦</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{vault.name}</span>
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginTop: 2 }}>{vault.protocol}</div>
        </div>
        <div className="flex flex-col" style={{ alignItems: "flex-end", gap: 4 }}>
          <span className={`badge ${inRange ? "badge-green" : "badge-red"}`}>
            {inRange ? "✓ In Range" : "⚠ Out of Range"}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 800, color: "var(--accent-green)" }}>
            {vault.apy?.toFixed(1)}%
          </span>
          <span style={{ fontSize: 10, color: "#4a5580" }}>APY</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.08em" }}>TVL</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            ${vault.tvl?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pending Rewards</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--accent-green)", marginTop: 2 }}>
            ${vault.pendingRewards?.toFixed(2) || "—"}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="flex justify-between mb-1">
          <span style={{ fontSize: 11, color: "#4a5580" }}>Utilization Rate</span>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#8892b0" }}>
            {(vault.utilizationRate * 100)?.toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={vault.utilizationRate} />
      </div>

      <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 11, color: "#4a5580", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Liquidity Range
        </div>
        <div className="flex justify-between">
          <div>
            <div style={{ fontSize: 10, color: "#4a5580" }}>Lower</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#f0f0ff" }}>${vault.liquidityRange?.lower?.toFixed(6)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#4a5580" }}>Current</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: inRange ? "var(--accent-green)" : "var(--accent-red)" }}>
              {inRange ? "●" : "○"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#4a5580" }}>Upper</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#f0f0ff" }}>${vault.liquidityRange?.upper?.toFixed(6)}</div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="flex gap-2 mt-3">
          <button className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: "center" }}>🌾 Harvest</button>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>⚖️ Rebalance</button>
        </div>
      )}
    </div>
  );
}

export default function VaultCards({ vaults, expanded }: any) {
  if (!vaults?.length) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
        <div style={{ color: "#8892b0" }}>Loading vault data…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-title mb-3">
        <span className="icon">🏦</span>
        Active Vaults
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {vaults.map((v: any) => <VaultCard key={v.id} vault={v} expanded={expanded} />)}
      </div>
    </div>
  );
}
