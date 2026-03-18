"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import PriceChart from "@/components/PriceChart";
import DecisionPanel from "@/components/DecisionPanel";
import VaultCards from "@/components/VaultCards";
import SimulationBar from "@/components/SimulationBar";
import TransactionLog from "@/components/TransactionLog";
import ChatInterface from "@/components/ChatInterface";
import SentimentPanel from "@/components/SentimentPanel";
import ToastContainer from "@/components/ToastContainer";

const API = "http://localhost:4000";
const WS_URL = "ws://localhost:4000";

function useStore() {
  const [market, setMarket] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [vaults, setVaults] = useState<any[]>([]);
  const [agentState, setAgentState] = useState<any>({ isRunning: false, decisionHistory: [] });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toasts, setToasts] = useState<any[]>([]);
  const [simulating, setSimulating] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const addToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Initial data fetch
  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, sRes, vRes, tRes, aRes] = await Promise.all([
          fetch(`${API}/api/market`),
          fetch(`${API}/api/sentiment`),
          fetch(`${API}/api/vaults`),
          fetch(`${API}/api/transactions`),
          fetch(`${API}/api/agent/state`),
        ]);
        const [m, s, v, t, a] = await Promise.all([mRes.json(), sRes.json(), vRes.json(), tRes.json(), aRes.json()]);
        if (m.success) setMarket(m.data);
        if (s.success) setSentiment(s.data);
        if (v.success) setVaults(v.data.vaults || []);
        if (t.success) setTransactions(t.data);
        if (a.success) setAgentState(a.data);
      } catch (e) {
        console.error("Initial fetch failed:", e);
        addToast("Backend not connected — using demo mode", "info");
      }
    };
    load();
  }, [addToast]);

  // WebSocket connection
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          if (type === "MARKET_UPDATE") setMarket(data);
          if (type === "VAULT_UPDATE") setVaults(data.vaults || []);
          if (type === "AGENT_STATUS") setAgentState((prev: any) => ({ ...prev, ...data }));
          if (type === "DECISION") {
            setAgentState((prev: any) => ({
              ...prev,
              lastDecision: data,
              decisionHistory: [data, ...(prev.decisionHistory || [])].slice(0, 20),
            }));
            setTransactions((prev) => data.transaction ? [data.transaction, ...prev] : prev);
            addToast(`🤖 AI: ${data.action || data.actionType}`, "success");
          }
          if (type === "SIMULATION") addToast(`⚡ Simulating: ${data.scenario}`, "info");
        } catch {}
      };
      ws.onclose = () => setTimeout(connect, 3000);
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { wsRef.current?.close(); };
  }, [addToast]);

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API}/api/agent/analyze`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        addToast("✅ AI analysis complete", "success");
        setMarket(data.data.marketContext ? market : data.data.market || market);
      } else addToast("Analysis failed", "error");
    } catch { addToast("Backend offline", "error"); }
    setIsAnalyzing(false);
  };

  const toggleAgent = async () => {
    const next = !agentState.isRunning;
    try {
      await fetch(`${API}/api/agent/toggle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ running: next }) });
      setAgentState((prev: any) => ({ ...prev, isRunning: next }));
      addToast(next ? "🤖 Agent activated — autonomous mode ON" : "⏸ Agent paused", next ? "success" : "info");
    } catch { addToast("Backend offline", "error"); }
  };

  const runSimulation = async (scenario: string) => {
    setSimulating(true);
    try {
      const res = await fetch(`${API}/api/simulate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario }) });
      const data = await res.json();
      if (data.success) {
        setMarket(data.data.market);
        setSentiment(data.data.sentiment);
        addToast(`🎯 Scenario loaded: ${scenario.replace("_", " ").toUpperCase()}`, "success");
      }
    } catch { addToast("Simulation failed", "error"); }
    setSimulating(false);
  };

  return { market, sentiment, vaults, agentState, transactions, isAnalyzing, activeTab, setActiveTab, toasts, simulating, triggerAnalysis, toggleAgent, runSimulation };
}

export default function App() {
  const store = useStore();
  const { market, sentiment, vaults, agentState, transactions, isAnalyzing, activeTab, setActiveTab, toasts, simulating, triggerAnalysis, toggleAgent, runSimulation } = store;

  return (
    <>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="app-layout" style={{ position: "relative", zIndex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} agentState={agentState} toggleAgent={toggleAgent} />
        <main className="app-main">
          <Header market={market} agentState={agentState} isAnalyzing={isAnalyzing} triggerAnalysis={triggerAnalysis} />
          <div className="page-container">

            {activeTab === "dashboard" && (
              <>
                <StatCards market={market} vaults={vaults} agentState={agentState} />
                <div style={{ marginBottom: 20 }}>
                  <SimulationBar runSimulation={runSimulation} simulating={simulating} />
                </div>
                <div className="grid-3-1" style={{ marginBottom: 20 }}>
                  <PriceChart market={market} />
                  <SentimentPanel sentiment={sentiment} />
                </div>
                <div className="grid-2" style={{ marginBottom: 20 }}>
                  <DecisionPanel agentState={agentState} isAnalyzing={isAnalyzing} triggerAnalysis={triggerAnalysis} />
                  <VaultCards vaults={vaults} />
                </div>
                <TransactionLog transactions={transactions} />
              </>
            )}

            {activeTab === "vaults" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Vault Positions</h1>
                  <p className="text-secondary text-sm">All Bonzo Finance vault positions managed by your AI Keeper Agent.</p>
                </div>
                <VaultCards vaults={vaults} expanded />
                <div style={{ marginTop: 20 }}>
                  <TransactionLog transactions={transactions} />
                </div>
              </>
            )}

            {activeTab === "agent" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>AI Keeper Agent</h1>
                  <p className="text-secondary text-sm">Real-time AI decision history and autonomous execution log.</p>
                </div>
                <DecisionPanel agentState={agentState} isAnalyzing={isAnalyzing} triggerAnalysis={triggerAnalysis} fullHistory />
              </>
            )}

            {activeTab === "chat" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Chat with Agent</h1>
                  <p className="text-secondary text-sm">Ask your AI Vault Guardian anything about yield strategies, risk, or DeFi.</p>
                </div>
                <ChatInterface market={market} sentiment={sentiment} />
              </>
            )}

            {activeTab === "analytics" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Market Analytics</h1>
                  <p className="text-secondary text-sm">HBAR price history, volatility metrics, and sentiment analysis.</p>
                </div>
                <div className="grid-2" style={{ marginBottom: 20 }}>
                  <PriceChart market={market} expanded />
                  <SentimentPanel sentiment={sentiment} expanded />
                </div>
                <StatCards market={market} vaults={vaults} agentState={agentState} />
              </>
            )}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}
