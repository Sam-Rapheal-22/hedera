"use client";

const TYPE_COLOR: Record<string, string> = {
  HARVEST: "badge-green",
  REBALANCE: "badge-blue",
  WITHDRAW: "badge-red",
  DEPOSIT: "badge-yellow",
};

export default function TransactionLog({ transactions }: any) {
  if (!transactions?.length) {
    return (
      <div className="card">
        <div className="section-title mb-3">
          <span className="icon">⛓</span>
          Transaction History
        </div>
        <div style={{ textAlign: "center", padding: "32px 20px", color: "#4a5580" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⛓</div>
          <div>No transactions yet — run an analysis to execute vault actions</div>
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
              <th>Vault</th>
              <th>Tx ID</th>
              <th>Gas</th>
              <th>Status</th>
              <th>Time</th>
              <th>Explorer</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 15).map((tx: any, i: number) => (
              <tr key={i}>
                <td><span className={`badge ${TYPE_COLOR[tx.type] || "badge-purple"}`}>{tx.type}</span></td>
                <td style={{ color: "#f0f0ff", fontWeight: 500 }}>{tx.vaultId || "—"}</td>
                <td className="tx-hash">{tx.id?.slice(0, 24) || "—"}…</td>
                <td style={{ fontFamily: "var(--font-mono)", color: "#8892b0" }}>{tx.gasUsed} ℏ</td>
                <td>
                  <span className={`badge ${tx.status === "SUCCESS" ? "badge-green" : "badge-red"}`}>
                    {tx.status === "SUCCESS" ? "✓" : "✗"} {tx.status}
                  </span>
                </td>
                <td style={{ color: "#4a5580", fontSize: 12 }}>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                <td>
                  <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "var(--accent-secondary)", textDecoration: "none" }}>
                    View ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
