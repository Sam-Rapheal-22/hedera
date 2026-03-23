"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import PriceChart from "@/components/PriceChart";
import DecisionPanel from "@/components/DecisionPanel";
import VaultCards from "@/components/VaultCards";
import TransactionLog from "@/components/TransactionLog";
import ChatInterface from "@/components/ChatInterface";
import SentimentPanel from "@/components/SentimentPanel";
import ToastContainer from "@/components/ToastContainer";
import LandingPage from "@/components/LandingPage";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || API.replace(/^http/i, "ws")).replace(/\/$/, "");

const appMetadata = {
  name: "AI Vault Guardian",
  description: "Autonomous DeFi Yield Management",
  icons: ["https://www.hashpack.app/img/logo-box.svg"],
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
};

const HC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() || "";

let hcInstance: any = null; // using any since we don't have TS types at compile time without static imports
let hcInitialized = false;

function getConnectedAccountId(connector: any): string | null {
  const signer = connector?.signers?.[0];
  if (!signer) return null;

  if (typeof signer.getAccountId === "function") {
    const accountId = signer.getAccountId();
    return accountId ? accountId.toString() : null;
  }

  if (typeof signer.getAccountIdString === "function") {
    return signer.getAccountIdString();
  }

  const fallback = signer?.accountId || signer?.signerAccountId;
  if (typeof fallback === "string") {
    const parts = fallback.split(":");
    return parts[parts.length - 1] || null;
  }

  return null;
}

async function waitForConnectedAccount(connector: any, timeoutMs = 12000): Promise<string | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const accountId = getConnectedAccountId(connector);
    if (accountId) return accountId;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

function useStore() {
  const [market, setMarket] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [vaults, setVaults] = useState<any[]>([]);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [agentState, setAgentState] = useState<any>({ isRunning: false, decisionHistory: [] });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toasts, setToasts] = useState<any[]>([]);
  // walletDisplay: the short 0x1234...abcd shown in the UI
  const [walletDisplay, setWalletDisplay] = useState<string | null>(null);
  // walletAddress: the full EVM address used for API calls
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loadingWalletData, setLoadingWalletData] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const addToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const initHashConnect = useCallback(async () => {
    if (hcInitialized) return;
    try {
      if (!HC_PROJECT_ID) {
        throw new Error("NEXT_PUBLIC_WC_PROJECT_ID is missing");
      }

      // Dynamically import to bypass Next.js Turbopack issues
      const hwcModule = await import("@hashgraph/hedera-wallet-connect");
      const hgModule = await import("@hiero-ledger/sdk");
      const { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod, HederaChainId } = hwcModule;
      const { LedgerId } = hgModule;
      const isMainnet = process.env.NEXT_PUBLIC_HEDERA_NETWORK === "mainnet";

      // Support both enum styles depending on SDK version.
      const ledgerId = isMainnet ? LedgerId.MAINNET : LedgerId.TESTNET;
      const chainId = isMainnet
        ? (HederaChainId["Mainnet" as keyof typeof HederaChainId] ?? "hedera:mainnet")
        : (HederaChainId["Testnet" as keyof typeof HederaChainId] ?? "hedera:testnet");

      if (!hcInstance) {
        hcInstance = new DAppConnector(
          appMetadata,
          ledgerId,
          HC_PROJECT_ID,
          Object.values(HederaJsonRpcMethod),
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [chainId]
        );
      }

      await hcInstance.init({ logger: "error" });
      hcInitialized = true;

      // Handle active sessions if returning to app
      const accId = getConnectedAccountId(hcInstance);
      if (accId) {
        setWalletAddress(accId);
        setWalletDisplay(accId);
      }

      // Setup session deletion listener
      if (hcInstance.walletConnectClient) {
        hcInstance.walletConnectClient.on("session_delete", () => {
          setWalletAddress(null);
          setWalletDisplay(null);
          setWalletInfo(null);
          setVaults([]);
          setTransactions([]);
        });
      }
    } catch (e) {
      console.error("Hedera WalletConnect init error:", e);
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    let success = false;
    try {
      if (!HC_PROJECT_ID) {
        alert("WalletConnect is not configured.\nAdd NEXT_PUBLIC_WC_PROJECT_ID=your_id to frontend/.env.local and restart the frontend server.");
        return false;
      }

      if (!hcInitialized || !hcInstance) await initHashConnect();
      if (hcInstance) {
        // openModal may resolve without returning a session object; rely on signer state.
        await hcInstance.openModal();
        const accId = await waitForConnectedAccount(hcInstance);
        if (accId) {
          setWalletAddress(accId);
          setWalletDisplay(accId);
          success = true;
        } else {
          addToast("Wallet connected but no account signer was detected", "error");
        }
      }
    } catch (error: any) {
      console.error("HashPack connection failed:", error);
      if (error?.message?.includes("3000") || String(error).includes("3000") || error?.message?.includes("Project not found")) {
        alert("WalletConnect Error (3000): The Project ID is invalid.\nPlease go to cloud.walletconnect.com, generate a free Project ID, and add NEXT_PUBLIC_WC_PROJECT_ID=your_id to frontend/.env.local, then restart the server.");
      } else {
        alert(`HashPack connection error: ${error?.message || error}`);
      }
    } finally {
      setConnecting(false);
    }
    return success;
  };

  const disconnectWallet = useCallback(async () => {
    try {
      if (hcInstance) {
        await hcInstance.disconnectAll();
      }
    } catch (err: unknown) {
      console.error("HashPack disconnect error:", err);
    } finally {
      // Always clear app state regardless of whether disconnect succeeded
      setWalletAddress(null);
      setWalletDisplay(null);
      setWalletInfo(null);
      setVaults([]);
      setTransactions([]);
    }
  }, []);


  // Load wallet-specific data (vaults + transactions) whenever wallet changes
  const loadWalletData = useCallback(async (address: string) => {
    setLoadingWalletData(true);
    try {
      const walletParam = encodeURIComponent(address);
      const [vRes, tRes] = await Promise.all([
        fetch(`${API}/api/vaults?wallet=${walletParam}`),
        fetch(`${API}/api/transactions?wallet=${walletParam}`),
      ]);
      const [v, t] = await Promise.all([vRes.json(), tRes.json()]);
      if (v.success) {
        setVaults(v.data.vaults || []);
        setWalletInfo(v.data.walletData || null);
      }
      if (t.success) setTransactions(t.data);
    } catch (e) {
      console.error("Wallet data fetch failed:", e);
      addToast("Failed to load on-chain wallet data", "error");
    } finally {
      setLoadingWalletData(false);
    }
  }, [addToast]);

  // Whenever wallet address changes, re-fetch on-chain data
  useEffect(() => {
    if (walletAddress) {
      loadWalletData(walletAddress);
    }
  }, [walletAddress, loadWalletData]);

  // Initial data fetch (market + sentiment + agent state only — no mock vaults)
  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, sRes, aRes] = await Promise.all([
          fetch(`${API}/api/market`),
          fetch(`${API}/api/sentiment`),
          fetch(`${API}/api/agent/state`),
        ]);
        const [m, s, a] = await Promise.all([mRes.json(), sRes.json(), aRes.json()]);
        if (m.success) setMarket(m.data);
        if (s.success) setSentiment(s.data);
        if (a.success) setAgentState(a.data);
      } catch (e: any) {
        console.error("Initial fetch failed:", e);
        addToast(`Backend offline: ${e.message || ""}`, "error");
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
      const walletParam = walletAddress ? `?wallet=${encodeURIComponent(walletAddress)}` : "";
      const res = await fetch(`${API}/api/agent/analyze${walletParam}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        addToast("✅ AI analysis complete", "success");
        // Refresh wallet data after analysis
        if (walletAddress) loadWalletData(walletAddress);
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

  const refreshWalletData = useCallback(() => {
    if (walletAddress) loadWalletData(walletAddress);
  }, [walletAddress, loadWalletData]);

  return {
    market, sentiment, vaults, walletInfo, agentState, transactions,
    isAnalyzing, activeTab, setActiveTab, toasts,
    triggerAnalysis, toggleAgent,
    wallet: walletDisplay, walletAddress,
    setWallet: disconnectWallet,
    connecting, handleConnect, loadingWalletData, refreshWalletData,
  };
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const store = useStore();
  const {
    market, sentiment, vaults, walletInfo, agentState, transactions,
    isAnalyzing, activeTab, setActiveTab, toasts,
    triggerAnalysis, toggleAgent,
    wallet, walletAddress, setWallet,
    connecting, handleConnect,
    loadingWalletData, refreshWalletData,
  } = store;

  if (!entered) {
    return <LandingPage onEnter={() => setEntered(true)} handleConnect={handleConnect} connecting={connecting} />;
  }

  return (
    <>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="app-layout" style={{ position: "relative", zIndex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} agentState={agentState} toggleAgent={toggleAgent} />
        <main className="app-main">
          <Header
            market={market} agentState={agentState} isAnalyzing={isAnalyzing}
            triggerAnalysis={triggerAnalysis} wallet={wallet} setWallet={setWallet}
            connecting={connecting} handleConnect={handleConnect}
          />
          <div className="page-container">

            {activeTab === "dashboard" && (
              <>
                <StatCards market={market} vaults={vaults} agentState={agentState} walletInfo={walletInfo} />
                <div className="grid-3-1" style={{ marginBottom: 20 }}>
                  <PriceChart market={market} />
                  <SentimentPanel sentiment={sentiment} />
                </div>
                <div className="grid-2" style={{ marginBottom: 20 }}>
                  <DecisionPanel agentState={agentState} isAnalyzing={isAnalyzing} triggerAnalysis={triggerAnalysis} />
                  <VaultCards vaults={vaults} walletAddress={walletAddress} loadingWalletData={loadingWalletData} onRefresh={refreshWalletData} />
                </div>
                <TransactionLog transactions={transactions} loadingWalletData={loadingWalletData} />
              </>
            )}

            {activeTab === "vaults" && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Wallet Positions</h1>
                  <p className="text-secondary text-sm">
                    {walletAddress
                      ? `On-chain holdings for ${wallet} on Hedera ${process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet"}`
                      : "Connect your wallet to see your real on-chain positions."}
                  </p>
                </div>
                <VaultCards vaults={vaults} walletAddress={walletAddress} loadingWalletData={loadingWalletData} onRefresh={refreshWalletData} expanded />
                <div style={{ marginTop: 20 }}>
                  <TransactionLog transactions={transactions} loadingWalletData={loadingWalletData} />
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
                <StatCards market={market} vaults={vaults} agentState={agentState} walletInfo={walletInfo} />
              </>
            )}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}
