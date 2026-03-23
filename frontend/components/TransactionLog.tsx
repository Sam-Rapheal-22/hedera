"use client";
import { RefreshCw } from "lucide-react";

export default function TransactionLog({ transactions, loadingWalletData }: any) {
  if (loadingWalletData) {
    return (
      <div className="card">
        <div className="section-title mb-3">
          <span className="icon">⛓</span>
          Transaction History
        </div>
        <div style={{ textAlign: "center", padding: "32px 20px", color: "#4a5580" }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <div>Fetching on-chain transactions…</div>
        </div>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="card">
        <div className="section-title mb-3">
          <span className="icon">⛓</span>
          Transaction History
        </div>
        <div style={{ textAlign: "center", padding: "32px 20px", color: "#4a5580" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⛓</div>
          <div>No transactions found. Connect your wallet to see your on-chain history.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">⛓</span>
          Transaction History
        </div>
        <span className="badge badge-purple">{transactions.length} txns</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="tx-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Tx ID</th>
              <th>Fee (ℏ)</th>
              <th>Status</th>
              <th>Time</th>
              <th>Explorer</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 20).map((tx: any, i: number) => {
              const txType = (tx.type || "CRYPTOTRANSFER").replace("CRYPTO", "").replace("TOKEN", "TKN ");
              return (
                <tr key={tx.id || i}>
                  <td>
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>
                      {txType.slice(0, 14)}
                    </span>
                  </td>
                  <td className="tx-hash" title={tx.id}>
                    {tx.id ? `${tx.id.slice(0, 20)}…` : "—"}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#8892b0" }}>
                    {tx.chargedFee ?? tx.gasUsed ?? "—"}
                  </td>
                  <td>
                    <span className={`badge ${tx.status === "SUCCESS" ? "badge-green" : "badge-red"}`}>
                      {tx.status === "SUCCESS" ? "✓" : "✗"} {tx.status}
                    </span>
                  </td>
                  <td style={{ color: "#4a5580", fontSize: 12 }}>
                    {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : "—"}
                  </td>
                  <td>
                    {tx.explorerUrl ? (
                      <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "var(--accent-secondary)", textDecoration: "none" }}>
                        View ↗
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
