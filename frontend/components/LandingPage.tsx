"use client";
import { motion } from "framer-motion";
import { Shield, Activity, Zap, ArrowRight, BrainCircuit, Wallet } from "lucide-react";

import PrismaticBurst from './PrismaticBurst';

export default function LandingPage({ onEnter, handleConnect, connecting }: { onEnter: () => void, handleConnect: () => Promise<boolean>, connecting: boolean }) {
  // Common button styles
  const primaryBtnStyle = {
    background: "linear-gradient(135deg, var(--accent-primary), #8b5cf6)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(108,99,255,0.4)",
    padding: "16px 32px",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    border: "none",
    fontWeight: "700"
  };

  const secondaryBtnStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid var(--border-card)",
    color: "var(--text-secondary)",
    padding: "16px 32px",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    fontWeight: "700"
  };

  const onConnectClick = async () => {
    const success = await handleConnect();
    if (success) {
      onEnter();
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", overflow: "hidden", fontFamily: "var(--font-sans)" }}>
      {/* Background WebGL Prismatic Burst */}
      <PrismaticBurst colors={['#6c63ff', '#00d68f', '#52489c', '#8b5cf6']} intensity={1.5} blendMode="screen" animationType="rotate3d" />

      {/* Navigation */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px", borderBottom: "1px solid var(--border-card)", background: "rgba(10, 14, 26, 0.8)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, var(--accent-primary), var(--accent-green))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(108,99,255,0.4)" }}>
            <Shield color="#fff" size={24} />
          </div>
          <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            AI Vault Guardian
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 20px 80px" }}>
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "rgba(108, 99, 255, 0.1)", border: "1px solid rgba(108, 99, 255, 0.3)", borderRadius: "99px", color: "var(--accent-primary)", fontSize: "14px", fontWeight: "600", marginBottom: "32px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-primary)", boxShadow: "0 0 10px rgba(108,99,255,0.6)" }} />
          Powered by Gemini AI & Hedera
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontSize: "64px", fontWeight: "900", letterSpacing: "-1.5px", maxWidth: "800px", lineHeight: "1.1", marginBottom: "24px" }}>
          Autonomous <span style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-green))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DeFi Yield</span> Management
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          style={{ fontSize: "20px", color: "var(--text-secondary)", maxWidth: "600px", marginBottom: "48px", lineHeight: 1.6 }}>
          Your intelligent keeper agent. Real-time market analysis, automated harvesting, and impermanent loss protection for Bonzo Finance vaults on Hedera.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
          style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={onConnectClick} style={primaryBtnStyle} disabled={connecting}>
            {connecting ? "Connecting..." : <><Wallet size={20} /> Connect Wallet</>}
          </button>
        </motion.div>

        {/* Feature Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", maxWidth: "1100px", width: "100%", marginTop: "120px", padding: "0 20px" }}>
          <FeatureCard icon={<BrainCircuit size={32} color="var(--accent-primary)" />} title="AI-Driven Strategy" description="Gemini LLM analyzes real-time volatility and sentiment to make precise execution decisions." delay={0.6} />
          <FeatureCard icon={<Zap size={32} color="var(--accent-green)" />} title="Auto-Harvesting" description="Automatically claims pending yield rewards at optimal timing based on dynamic thresholds." delay={0.7} />
          <FeatureCard icon={<Activity size={32} color="var(--accent-red)" />} title="Risk Mitigation" description="Actively rebalances liquidity ranges and executes defensive withdrawals during high volatility." delay={0.8} />
        </div>

        {/* How It Works Section */}
        <div style={{ marginTop: "160px", padding: "0 20px", width: "100%", maxWidth: "1100px" }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: "64px" }}
          >
            <h2 style={{ fontSize: "42px", fontWeight: "800", marginBottom: "16px", background: "linear-gradient(135deg, #fff, var(--text-secondary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              How the Guardian Works
            </h2>
            <p style={{ fontSize: "18px", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              A fully autonomous pipeline that secures your yields 24/7.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "32px", position: "relative" }}>
            <StepCard number="01" title="Data Ingestion" description="Pulls live on-chain Hedera data and crypto sentiment from global news sources continuously." delay={0.1} />
            <StepCard number="02" title="AI Processing" description="Feeds context to Gemini AI to determine optimal liquidity ranges and harvest timings." delay={0.2} />
            <StepCard number="03" title="Execution" description="Triggers secure smart contract interactions on Bonzo Finance vaults via Hedera Agent Kit." delay={0.3} />
          </div>
        </div>

        {/* Bottom CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          style={{ marginTop: "160px", marginBottom: "80px", padding: "64px 32px", background: "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,214,143,0.05))", border: "1px solid var(--border-glow)", borderRadius: "24px", maxWidth: "900px", width: "100%", boxShadow: "var(--glow-purple)" }}
        >
          <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "20px" }}>Ready to automate your DeFi?</h2>
          <p style={{ fontSize: "18px", color: "var(--text-secondary)", marginBottom: "32px" }}>Stop manually managing your Hedera liquidity positions.</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={onConnectClick} style={primaryBtnStyle} disabled={connecting}>
              {connecting ? "Connecting..." : <><Wallet size={20} /> Connect Wallet to Start</>}
            </button>
          </div>
        </motion.div>
      </main>

      <footer style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "32px", borderTop: "1px solid var(--border-card)", color: "var(--text-muted)", fontSize: "14px" }}>
        &copy; {new Date().getFullYear()} AI Vault Guardian. Built for the Hedera Ecosystem.
      </footer>
    </div>
  );
}

function StepCard({ number, title, description, delay }: { number: string, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="card" style={{ padding: "32px", textAlign: "left", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: "-10px", right: "-10px", fontSize: "120px", fontWeight: "900", color: "rgba(255,255,255,0.02)", zIndex: 0, lineHeight: 1 }}>
        {number}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <h3 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px", color: "var(--accent-primary)" }}>{title}</h3>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{description}</p>
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }}
      className="card" style={{ textAlign: "left", padding: "32px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
        {icon}
      </div>
      <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>{title}</h3>
      <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>{description}</p>
    </motion.div>
  );
}
