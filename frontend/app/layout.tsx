import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Vault Guardian – Intelligent DeFi Keeper Agent",
  description: "Autonomous AI agent that monitors HBAR market conditions and manages Bonzo Finance vaults on Hedera Hashgraph.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
