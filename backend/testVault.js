import { matchVault, generateReason } from './services/vaultService.js';

const mockIntents = [
  { intent_summary: "Wants safe yield on HBAR", risk_level: "low", asset: "HBAR", action_type: "deposit" },
  { intent_summary: "Maximize returns without caring about risk", risk_level: "high", asset: null, action_type: "deposit" },
  { intent_summary: "Deposit USDC safely", risk_level: "low", asset: "USDC", action_type: "deposit" },
  { intent_summary: "Wants balanced exposure with some risk", risk_level: "medium", asset: null, action_type: "deposit" }
];

console.log("🧪 Testing Vault Matching Strategy...\n");

for (const intent of mockIntents) {
  const vault = matchVault(intent);
  const reason = generateReason(intent, vault);
  console.log(`Intent: "${intent.intent_summary}"`);
  console.log(`Asset: ${intent.asset || 'None'} | Risk: ${intent.risk_level}`);
  console.log(`Matched Vault: ${vault.name} (${vault.apy} APY)`);
  console.log(`Reason: ${reason}\n`);
}
