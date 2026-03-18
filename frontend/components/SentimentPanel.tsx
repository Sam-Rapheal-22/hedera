"use client";

const SENTIMENT_COLOR: Record<string, string> = {
  BULLISH: "var(--accent-green)",
  BEARISH: "var(--accent-red)",
  NEUTRAL: "var(--accent-yellow)",
};

const SENTIMENT_EMOJI: Record<string, string> = {
  BULLISH: "🟢",
  BEARISH: "🔴",
  NEUTRAL: "🟡",
};

export default function SentimentPanel({ sentiment, expanded }: any) {
  const label = sentiment?.label || "NEUTRAL";
  const score = sentiment?.score ?? 0;
  const total = (sentiment?.positive || 0) + (sentiment?.negative || 0) + (sentiment?.neutral || 0);
  const posW = total ? ((sentiment?.positive || 0) / total) * 100 : 33;
  const negW = total ? ((sentiment?.negative || 0) / total) * 100 : 33;
  const neuW = total ? ((sentiment?.neutral || 0) / total) * 100 : 34;

  // Score bar: -1 to +1 → 0–100%
  const scorePct = ((score + 1) / 2) * 100;

  return (
    <div className="card" style={{ height: "100%" }}>
      <div className="section-title mb-4">
        <span className="icon">🔍</span>
        Market Sentiment
      </div>

      {/* Big sentiment label */}
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{SENTIMENT_EMOJI[label]}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: SENTIMENT_COLOR[label], letterSpacing: "0.05em" }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: "#8892b0", marginTop: 4 }}>
          Score: <span style={{ fontFamily: "var(--font-mono)", color: "#f0f0ff" }}>
            {score >= 0 ? "+" : ""}{score.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Sentiment score bar */}
      <div style={{ margin: "16px 0" }}>
        <div style={{ fontSize: 11, color: "#4a5580", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
          <span>BEARISH</span><span>NEUTRAL</span><span>BULLISH</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: 0, height: "100%", width: 4, borderRadius: 2,
            background: SENTIMENT_COLOR[label],
            left: `calc(${scorePct}% - 2px)`,
            boxShadow: `0 0 12px ${SENTIMENT_COLOR[label]}`,
            transition: "left 0.8s ease",
          }} />
          <div style={{
            height: "100%",
            background: `linear-gradient(90deg, var(--accent-red), var(--accent-yellow), var(--accent-green))`,
            opacity: 0.2,
          }} />
        </div>
      </div>

      {/* Vote breakdown */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: "#4a5580", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          News Signal Breakdown
        </div>
        <div className="flex" style={{ gap: 4, height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ width: `${posW}%`, background: "var(--accent-green)", transition: "width 0.8s ease" }} />
          <div style={{ width: `${neuW}%`, background: "rgba(255,255,255,0.1)", transition: "width 0.8s ease" }} />
          <div style={{ width: `${negW}%`, background: "var(--accent-red)", transition: "width 0.8s ease" }} />
        </div>
        <div className="flex justify-between">
          <span style={{ fontSize: 12, color: "var(--accent-green)" }}>
            ▲ {sentiment?.positive || 0} positive
          </span>
          <span style={{ fontSize: 12, color: "#8892b0" }}>
            — {sentiment?.neutral || 0} neutral
          </span>
          <span style={{ fontSize: 12, color: "var(--accent-red)" }}>
            ▼ {sentiment?.negative || 0} negative
          </span>
        </div>
      </div>

      {/* Top articles */}
      {expanded && sentiment?.articles?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Top News
          </div>
          {sentiment.articles.slice(0, 4).map((a: any, i: number) => (
            <div key={i} style={{
              padding: "10px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              fontSize: 12,
              color: "#8892b0",
              lineHeight: 1.5,
            }}>
              <a href={a.url} target="_blank" rel="noopener noreferrer"
                style={{ color: "#d0d6f0", textDecoration: "none", fontWeight: 500 }}>
                {a.title}
              </a>
              <div style={{ fontSize: 11, color: "#4a5580", marginTop: 4 }}>
                {a.source} · {a.published ? new Date(a.published).toLocaleDateString() : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {sentiment?.simulated && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#4a5580", textAlign: "center" }}>
          ⚡ Simulated data
        </div>
      )}
    </div>
  );
}
