"use client";
import { useState } from "react";

export default function Header({ market, agentState, isAnalyzing, triggerAnalysis, wallet, setWallet, connecting, handleConnect }: any) {
  const price = market?.price;
  const change = market?.change24h;

  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <div style={{ fontSize: 13, color: "#8892b0" }}>
          HBAR / USD
        </div>
        {price ? (
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "#f0f0ff" }}>
              ${price.toFixed(5)}
            </span>
            <span className={`badge ${(change ?? 0) >= 0 ? "badge-green" : "badge-red"}`}>
              {(change ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(change ?? 0).toFixed(2)}%
            </span>
          </div>
        ) : (
          <div style={{ width: 120, height: 20, background: "rgba(255,255,255,0.05)", borderRadius: 4, animation: "pulse-dot 1.5s infinite" }} />
        )}
        {market?.volatilityLevel && (
          <span className={`badge ${market.volatilityLevel === "HIGH" ? "badge-red" : market.volatilityLevel === "MEDIUM" ? "badge-yellow" : "badge-green"}`}>
            {market.volatilityLevel} VOL
          </span>
        )}
        {market?.simulated && (
          <span className="badge badge-purple">SIM</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div style={{ fontSize: 12, color: "#4a5580" }}>
          Last: {agentState?.lastDecision
            ? new Date(agentState.lastDecision.timestamp).toLocaleTimeString()
            : "—"}
        </div>
        <button
          className={`btn ${isAnalyzing ? "btn-secondary" : "btn-primary"} btn-sm`}
          onClick={triggerAnalysis}
          disabled={isAnalyzing}
          id="analyze-btn"
        >
          {isAnalyzing ? (
            <><span className="spinner" style={{ width: 14, height: 14 }} /> Analyzing…</>
          ) : (
            <><span>🧠</span> Run Analysis</>
          )}
        </button>
        
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

        {wallet ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2" style={{ padding: "6px 14px", background: "rgba(0, 214, 143, 0.1)", border: "1px solid rgba(0, 214, 143, 0.3)", borderRadius: 8 }}>
              <span style={{ fontSize: 12 }}>👛</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--accent-green)" }}>
                {wallet}
              </span>
            </div>
            <button 
              className="btn btn-sm" 
              onClick={() => setWallet(null)} 
              style={{ background: "rgba(255, 60, 60, 0.1)", color: "#ff4d4d", borderColor: "rgba(255, 60, 60, 0.3)", padding: "6px 10px" }}
              title="Disconnect Wallet"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleConnect}
            disabled={connecting}
            style={{ borderColor: "rgba(108, 99, 255, 0.4)" }}
          >
            {connecting ? (
              <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: "#fff" }} /> Connecting...</>
            ) : (
              <>👛 Connect Wallet</>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
