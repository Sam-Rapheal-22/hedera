"use client";
import { RefreshCw, Wallet, ExternalLink } from "lucide-react";

function fmt(n: number | null | undefined, prefix = "$") {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(2)}K`;
  return `${prefix}${n.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function HoldingCard({ vault, expanded }: any) {
  const isHbar = vault.isNative;
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";
  const explorerUrl = vault.tokenId
    ? `https://hashscan.io/${network}/token/${vault.tokenId}`
    : null;

  return (
    <div className="vault-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>{isHbar ? "⬡" : "🪙"}</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{vault.name}</span>
            {vault.asset && vault.asset !== vault.name && (
              <span style={{ fontSize: 12, color: "#4a5580" }}>{vault.asset}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginTop: 2 }}>{vault.protocol}</div>
          {vault.tokenId && (
            <div style={{ fontSize: 11, color: "#4a5580", fontFamily: "var(--font-mono)", marginTop: 2 }}>
              {vault.tokenId}
            </div>
          )}
        </div>
        <div className="flex flex-col" style={{ alignItems: "flex-end", gap: 4 }}>
          <span className="badge badge-green">✓ On-chain</span>
          {vault.usdValue != null && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 800, color: "var(--accent-green)" }}>
              {fmt(vault.usdValue)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Balance
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {vault.humanBalance?.toLocaleString(undefined, { maximumFractionDigits: 6 }) ?? "—"}
            {" "}
            <span style={{ fontSize: 12, color: "#4a5580" }}>{vault.asset || ""}</span>
          </div>
        </div>
        {isHbar && vault.usdValue != null && (
          <div>
            <div style={{ fontSize: 11, color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              USD Value
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--accent-green)", marginTop: 2 }}>
              {fmt(vault.usdValue)}
            </div>
          </div>
        )}
      </div>

      {expanded && explorerUrl && (
        <div className="flex gap-2 mt-3">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <ExternalLink size={14} /> View on HashScan
          </a>
        </div>
      )}
    </div>
  );
}

export default function VaultCards({ vaults, walletAddress, loadingWalletData, onRefresh, expanded }: any) {
  if (loadingWalletData) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", marginBottom: 12, color: "var(--accent-primary)" }} />
        <div style={{ color: "#8892b0" }}>Loading on-chain wallet data…</div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <Wallet size={36} style={{ marginBottom: 12, color: "#4a5580" }} />
        <div style={{ color: "#8892b0", marginBottom: 8 }}>Connect your wallet</div>
        <div style={{ fontSize: 13, color: "#4a5580" }}>
          Your real on-chain Hedera holdings will appear here after connecting HashPack.
        </div>
      </div>
    );
  }

  if (!vaults?.length) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
        <div style={{ color: "#8892b0", marginBottom: 16 }}>No holdings found for this account</div>
        {onRefresh && (
          <button className="btn btn-secondary btn-sm" onClick={onRefresh} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">⬡</span>
          Wallet Holdings
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="badge badge-green">{vaults.length} assets</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn btn-secondary btn-sm"
              title="Refresh holdings"
              style={{ padding: "4px 8px" }}
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {vaults.map((v: any) => <HoldingCard key={v.id} vault={v} expanded={expanded} />)}
      </div>
    </div>
  );
}
