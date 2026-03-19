import { matchVault, generateReason } from './services/vaultService.js';

const mockIntents = [
  { intent_summary: "Wants safe yield on HBAR", risk_level: "low", asset: "HBAR", action_type: "deposit", amount: 500 },
  { intent_summary: "Maximize returns without caring about risk", risk_level: "high", asset: null, action_type: "deposit" },
  { intent_summary: "I want to earn something on Hedera", risk_level: "low", asset: null, action_type: "deposit" }
];

console.log("🧪 Simulating Final API Chat Responses (E2E format test)...\n");

const messages = [
  "I want safe yield on my 500 HBAR", 
  "I want to maximize my returns, I don't care about the risk", 
  "I want to earn something on Hedera"
];

for (let i = 0; i < mockIntents.length; i++) {
  const intent = mockIntents[i];
  const message = messages[i];

  const selectedVault = matchVault(intent);
  const reason = generateReason(intent, selectedVault);

  const action = {
    type: intent.action_type || "deposit",
    status: "ready", 
    message: `Ready to execute ${intent.action_type || 'deposit'} of ${intent.amount ? intent.amount + ' ' : ''}${selectedVault.asset} into the ${selectedVault.name}`
  };

  if (intent.action_type === 'query') {
    action.status = 'simulated';
    action.message = `Checking balance for ${selectedVault.name}. It currently yields ${selectedVault.apy}.`;
  }

  let follow_up = undefined;
  if (!intent.asset && message.toLowerCase().includes('earn something')) {
    follow_up = "What asset are you holding — HBAR, USDC, or something else?";
  }

  const finalResponse = {
    intent_summary: intent.intent_summary,
    risk_level: intent.risk_level,
    selected_vault: {
      name: selectedVault.name,
      asset: selectedVault.asset,
      apy: selectedVault.apy,
      risk: selectedVault.risk,
      reason: reason
    },
    action,
    ...(follow_up && { follow_up })
  };

  console.log(`User: "${message}"`);
  console.log(JSON.stringify(finalResponse, null, 2));
  console.log("-------------\n");
}
