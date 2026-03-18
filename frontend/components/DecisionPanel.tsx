"use client";

const ACTION_COLOR: Record<string, string> = {
  HARVEST: "var(--accent-green)",
  REBALANCE: "var(--accent-secondary)",
  WITHDRAW: "var(--accent-red)",
  DEPOSIT: "var(--accent-yellow)",
  MONITOR: "var(--text-muted)",
};

const ACTION_ICON: Record<string, string> = {
  HARVEST: "🌾",
  REBALANCE: "⚖️",
  WITHDRAW: "📤",
  DEPOSIT: "📥",
  MONITOR: "👁️",
};

function DecisionItem({ decision, isLatest }: any) {
  const color = ACTION_COLOR[decision.actionType] || "var(--text-muted)";
  return (
    <div style={{
      padding: "16px",
      borderRadius: 10,
      background: isLatest ? "rgba(108,99,255,0.08)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${isLatest ? "rgba(108,99,255,0.25)" : "rgba(255,255,255,0.05)"}`,
      marginBottom: 10,
      position: "relative",
      overflow: "hidden",
    }}>
      {isLatest && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
        }} />
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16 }}>{ACTION_ICON[decision.actionType] || "🤖"}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            color, textTransform: "uppercase",
            padding: "2px 8px", borderRadius: 99,
            background: `${color}20`,
            border: `1px solid ${color}40`,
          }}>
            {decision.actionType}
          </span>
          {decision.status === "EXECUTED" && (
            <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Executed</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#4a5580" }}>
          {new Date(decision.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 8, lineHeight: 1.5 }}>
        <div className="flex gap-2 flex-wrap" style={{ marginBottom: 6 }}>
          <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-mono)" }}>
            HBAR ${decision.marketContext?.price?.toFixed(5) || "—"}
          </span>
          <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 4, fontSize: 11 }}>
            {decision.marketContext?.volatilityLevel || "—"} VOL
          </span>
          <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 4, fontSize: 11 }}>
            {decision.marketContext?.sentimentLabel || "—"}
          </span>
        </div>
        <div style={{ color: "#d0d6f0", fontWeight: 500, fontSize: 12.5 }}>{decision.action}</div>
      </div>

      {decision.reasoning && isLatest && (
        <div style={{
          fontSize: 12, color: "#8892b0", lineHeight: 1.65,
          background: "rgba(255,255,255,0.02)", borderRadius: 6,
          padding: "10px 12px", marginTop: 8,
          whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto",
        }}>
          {decision.reasoning}
        </div>
      )}

      {decision.transaction && (
        <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(0,214,143,0.05)", borderRadius: 6, border: "1px solid rgba(0,214,143,0.15)" }}>
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 11, color: "#4a5580" }}>Tx ID</span>
            <span className="tx-hash">{decision.transaction.id?.slice(0, 30)}…</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span style={{ fontSize: 11, color: "#4a5580" }}>Gas</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#8892b0" }}>{decision.transaction.gasUsed} ℏ</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionPanel({ agentState, isAnalyzing, triggerAnalysis, fullHistory }: any) {
  const history = agentState?.decisionHistory || [];
  const items = fullHistory ? history : history.slice(0, 3);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">🧠</span>
          AI Decision Log
        </div>
        <button className="btn btn-secondary btn-sm" onClick={triggerAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Running…</> : "+ Analyze Now"}
        </button>
      </div>

      {isAnalyzing && (
        <div style={{
          padding: "16px", borderRadius: 10, background: "rgba(108,99,255,0.08)",
          border: "1px solid rgba(108,99,255,0.25)", marginBottom: 12,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span className="spinner" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0ff" }}>AI Agent thinking…</div>
            <div style={{ fontSize: 11, color: "#8892b0", marginTop: 2 }}>Analyzing market conditions and vault health</div>
          </div>
        </div>
      )}

      {items.length === 0 && !isAnalyzing ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 14, color: "#8892b0", marginBottom: 8 }}>No decisions yet</div>
          <div style={{ fontSize: 12, color: "#4a5580", marginBottom: 16 }}>Run an analysis to see AI reasoning in action</div>
          <button className="btn btn-primary btn-sm" onClick={triggerAnalysis}>Run First Analysis</button>
        </div>
      ) : (
        <div style={{ maxHeight: fullHistory ? "none" : 380, overflowY: fullHistory ? "visible" : "auto" }}>
          {items.map((d: any, i: number) => (
            <DecisionItem key={d.id || i} decision={d} isLatest={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
