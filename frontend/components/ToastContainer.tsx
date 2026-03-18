"use client";

const ICONS: Record<string, string> = { success: "✅", error: "❌", info: "🔵" };
const BORDER: Record<string, string> = {
  success: "rgba(0,214,143,0.3)",
  error: "rgba(255,77,109,0.3)",
  info: "rgba(108,99,255,0.3)",
};

export default function ToastContainer({ toasts }: any) {
  return (
    <div className="toast-container">
      {toasts.map((t: any) => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          style={{ borderColor: BORDER[t.type] }}
        >
          <span style={{ fontSize: 16 }}>{ICONS[t.type]}</span>
          <span style={{ fontSize: 13 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
