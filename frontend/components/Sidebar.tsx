"use client";

const NAV = [
  { id: "dashboard", icon: "⬛", label: "Dashboard" },
  { id: "vaults", icon: "🏦", label: "Vaults" },
  { id: "agent", icon: "🤖", label: "AI Agent" },
  { id: "chat", icon: "💬", label: "Chat" },
  { id: "analytics", icon: "📈", label: "Analytics" },
];

export default function Sidebar({ activeTab, setActiveTab, agentState, toggleAgent }: any) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🛡️</div>
        <div>
          <div className="sidebar-logo-text">Vault Guardian</div>
          <div className="sidebar-logo-sub">AI DeFi Keeper</div>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>
      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
            style={{ background: "none", fontFamily: "inherit" }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-section-label" style={{ padding: "0 0 8px" }}>Agent Status</div>
        <div className={`agent-status-pill ${agentState?.isRunning ? "running" : ""}`}>
          <div className={`status-dot ${agentState?.isRunning ? "running" : ""}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: agentState?.isRunning ? "#00d68f" : "#8892b0" }}>
              {agentState?.isRunning ? "AUTONOMOUS" : "STANDBY"}
            </div>
            <div style={{ fontSize: 10, color: "#4a5580", marginTop: 2 }}>
              {agentState?.isRunning ? "Agent active" : "Manual mode"}
            </div>
          </div>
          <button
            onClick={toggleAgent}
            style={{
              width: 28, height: 16, borderRadius: 8, border: "none", cursor: "pointer",
              background: agentState?.isRunning ? "linear-gradient(135deg, #00d68f, #00b377)" : "rgba(255,255,255,0.1)",
              position: "relative", transition: "all 0.3s ease",
            }}
          >
            <span style={{
              position: "absolute", top: 2, width: 12, height: 12, borderRadius: "50%",
              background: "#fff", transition: "all 0.3s ease",
              left: agentState?.isRunning ? "calc(100% - 14px)" : 2,
            }} />
          </button>
        </div>

        <div style={{ marginTop: 12, padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#4a5580" }}>⛓</span>
            <span style={{ fontSize: 11, color: "#4a5580" }}>Hedera Testnet</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, color: "#4a5580" }}>🏛</span>
            <span style={{ fontSize: 11, color: "#4a5580" }}>Bonzo Finance</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
