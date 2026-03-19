import 'dotenv/config';
import { extractIntent } from './services/intentService.js';

async function runTests() {
  const testMessages = [
    "I want safe yield on my 500 HBAR",
    "How can I maximize my returns? I don't care about the risk",
    "I have 1000 USDC, what do I do with it?",
    "I want to withdraw my funds",
    "I want to earn something on Hedera"
  ];

  console.log("🧪 Testing Intent Extraction Service...\n");
  for (const msg of testMessages) {
    console.log(`user: "${msg}"`);
    try {
      const intent = await extractIntent(msg);
      console.log(`agent: ${JSON.stringify(intent, null, 2)}\n`);
    } catch (e) {
      console.error(`agent: Error -> ${e.message}\n`);
    }
  }
  process.exit(0);
}

runTests();
