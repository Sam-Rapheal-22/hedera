"use client";
import { useState, useRef, useEffect } from "react";

const API = "http://localhost:4000";

const QUICK_PROMPTS = [
  "What's the best strategy for low risk yield?",
  "Should I harvest my rewards now?",
  "How do I protect against impermanent loss?",
  "Explain the current market conditions",
  "When should I rebalance my vault?",
];

// Simple markdown renderer for chat
function ChatMarkdown({ content }: { content: string }) {
  // Convert **text** to bold, *text* to italic inline
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} style={{ color: "var(--accent-secondary)" }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i} style={{ color: "var(--accent-yellow)" }}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function ChatInterface({ market, sentiment }: any) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: `Hey! I'm your **AI Vault Guardian** 🛡️\n\nI'm monitoring your Bonzo Finance vaults on Hedera in real time. I can help you with:\n\n• 📊 Market analysis & volatility assessment\n• 🌾 Optimal harvest timing strategies\n• ⚖️ Liquidity rebalancing recommendations\n• 🛡️ Impermanent loss risk management\n\nWhat would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (msg: string) => {
    if (!msg.trim() || loading) return;
    const userMsg = msg.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { role: "ai", content: data.data.message }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Sorry, I couldn't process that. Please try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Backend not reachable. Please ensure the server is running." }]);
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Market context bar */}
      <div style={{
        padding: "12px 20px",
        background: "rgba(108,99,255,0.06)",
        borderBottom: "1px solid rgba(108,99,255,0.15)",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 11, color: "#4a5580", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Context
        </span>
        {market?.price && (
          <span style={{ fontSize: 12, color: "#8892b0" }}>
            HBAR <span style={{ color: "#f0f0ff", fontFamily: "var(--font-mono)" }}>${market.price.toFixed(5)}</span>
          </span>
        )}
        {market?.volatilityLevel && (
          <span className={`badge ${market.volatilityLevel === "HIGH" ? "badge-red" : market.volatilityLevel === "MEDIUM" ? "badge-yellow" : "badge-green"}`}>
            {market.volatilityLevel} VOL
          </span>
        )}
        {sentiment?.label && (
          <span className={`badge ${sentiment.label === "BULLISH" ? "badge-green" : sentiment.label === "BEARISH" ? "badge-red" : "badge-yellow"}`}>
            {sentiment.label}
          </span>
        )}
      </div>

      {/* Quick prompts */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 6, overflowX: "auto", flexWrap: "wrap" }}>
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => send(p)}
            disabled={loading}
            style={{
              padding: "4px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
              background: "rgba(108,99,255,0.1)", color: "var(--accent-primary)",
              border: "1px solid rgba(108,99,255,0.2)", whiteSpace: "nowrap",
              transition: "all 0.2s", fontFamily: "inherit",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(108,99,255,0.2)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(108,99,255,0.1)")}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ maxHeight: 420, minHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.role === "ai" ? (
              <div style={{ lineHeight: 1.65 }}>
                {m.content.split("\n").map((line, li) => (
                  <div key={li} style={{ marginBottom: line === "" ? 6 : 0 }}>
                    <ChatMarkdown content={line} />
                  </div>
                ))}
              </div>
            ) : (
              m.content
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble ai" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="spinner" style={{ width: 14, height: 14 }} />
            <span style={{ color: "#4a5580", fontSize: 12 }}>AI is thinking…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <input
          id="chat-input"
          className="chat-input"
          placeholder="Ask about yield, risk, rebalancing, or market conditions…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          id="send-chat-btn"
        >
          {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Send ↑"}
        </button>
      </div>
    </div>
  );
}
