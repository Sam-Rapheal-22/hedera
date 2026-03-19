import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { extractIntent } from './services/intentService.js';
import { matchVault, generateReason } from './services/vaultService.js';

const app = express();

app.use(cors());
app.use(express.json());

// ─── REST Endpoints ────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Chat endpoint integrating full Agent Logic
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message required' });
    
    // 1. Natural Language extraction via OpenAI
    const intent = await extractIntent(message);

    // 2. Vault Match Routing Logic
    const selectedVault = matchVault(intent);
    const reason = generateReason(intent, selectedVault);

    // 3. Action construction based on intent variables
    const action = {
      type: intent.action_type || "deposit",
      status: "ready", // Indicates the frontend can execute this
      message: `Ready to execute ${intent.action_type || 'deposit'} of ${intent.amount ? intent.amount + ' ' : ''}${selectedVault.asset} into the ${selectedVault.name}`
    };

    if (intent.action_type === 'query') {
      action.status = 'simulated';
      action.message = `Checking balance for ${selectedVault.name}. It currently yields ${selectedVault.apy}.`;
    } else if (intent.action_type === 'withdraw') {
      action.message = `Ready to withdraw your ${selectedVault.asset} from the ${selectedVault.name}`;
    }

    // 4. Follow-up handling for ambiguous requests
    let follow_up = undefined;
    if (!intent.asset && message.toLowerCase().includes('earn something')) {
      follow_up = "What asset are you holding — HBAR, USDC, or something else?";
    }

    // 5. Final structured response matching specifications exactly
    res.json({
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
    });

  } catch (err) {
    if (err.message.includes('401') || err.message.includes('API key')) {
        res.status(401).json({ 
            success: false, 
            error: "Invalid OpenAI API Key. Please provide a real key in backend/.env" 
        });
    } else {
        res.status(500).json({ success: false, error: err.message });
    }
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🤖 Intent-Based DeFi Agent Backend running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat\n`);
});
