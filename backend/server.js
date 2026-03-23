import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cron from 'node-cron';

import { fetchHBARData, fetchSentimentData } from './services/marketService.js';
import { fetchWalletVaultPositions, fetchWalletTransactions } from './services/hederaWalletService.js';
import { analyzeAndDecide, chat, getAgentState, setAgentRunning } from './agent/vaultAgent.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// In-memory state
let latestMarketData = null;
let latestSentimentData = null;

// Per-wallet vault cache: { [accountId]: { data, ts } }
const walletVaultCache = new Map();
const VAULT_CACHE_TTL_MS = 30_000; // 30 seconds

// Broadcast to all WebSocket clients
function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, ts: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ─── REST Endpoints ────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Market data
app.get('/api/market', async (_, res) => {
  try {
    if (!latestMarketData) latestMarketData = await fetchHBARData();
    res.json({ success: true, data: latestMarketData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sentiment data
app.get('/api/sentiment', async (_, res) => {
  try {
    if (!latestSentimentData) latestSentimentData = await fetchSentimentData();
    res.json({ success: true, data: latestSentimentData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vault / wallet positions — requires ?wallet=<accountIdOrEvmAddress>
app.get('/api/vaults', async (req, res) => {
  const { wallet } = req.query;

  if (!wallet) {
    return res.json({ success: true, data: { vaults: [], walletData: null, message: 'No wallet connected' } });
  }

  // Serve from cache if fresh
  const cached = walletVaultCache.get(wallet);
  if (cached && Date.now() - cached.ts < VAULT_CACHE_TTL_MS) {
    return res.json({ success: true, data: cached.data, cached: true });
  }

  try {
    const data = await fetchWalletVaultPositions(wallet, latestMarketData?.price ?? null);
    walletVaultCache.set(wallet, { data, ts: Date.now() });
    res.json({ success: true, data });
  } catch (err) {
    console.error('[API] /api/vaults error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Transaction history — requires ?wallet=<accountIdOrEvmAddress>
app.get('/api/transactions', async (req, res) => {
  const { wallet } = req.query;

  if (!wallet) {
    return res.json({ success: true, data: [] });
  }

  try {
    const txns = await fetchWalletTransactions(wallet, 25);
    res.json({ success: true, data: txns });
  } catch (err) {
    console.error('[API] /api/transactions error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Agent state
app.get('/api/agent/state', (_, res) => {
  res.json({ success: true, data: getAgentState() });
});

// Trigger manual AI analysis — requires ?wallet=<accountIdOrEvmAddress>
app.post('/api/agent/analyze', async (req, res) => {
  const wallet = req.query.wallet || req.body.wallet;
  try {
    const [market, sentiment] = await Promise.all([fetchHBARData(), fetchSentimentData()]);
    latestMarketData = market;
    latestSentimentData = sentiment;

    // Get real vault data for the connected wallet  
    let vaultData = { vaults: [] };
    if (wallet) {
      vaultData = await fetchWalletVaultPositions(wallet, market.price);
      walletVaultCache.set(wallet, { data: vaultData, ts: Date.now() });
    }

    const decision = await analyzeAndDecide(market, sentiment, vaultData);
    broadcast('DECISION', decision);
    broadcast('MARKET_UPDATE', market);
    res.json({ success: true, data: decision });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle auto-agent
app.post('/api/agent/toggle', (req, res) => {
  const { running } = req.body;
  setAgentRunning(running);
  broadcast('AGENT_STATUS', { isRunning: running });
  res.json({ success: true, isRunning: running });
});

// Chat with AI agent
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message required' });
    const response = await chat(message, latestMarketData, latestSentimentData);
    res.json({ success: true, data: { message: response } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  if (latestMarketData) ws.send(JSON.stringify({ type: 'MARKET_UPDATE', data: latestMarketData }));
  ws.send(JSON.stringify({ type: 'AGENT_STATUS', data: getAgentState() }));
  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────
// Update market data every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  try {
    latestMarketData = await fetchHBARData();
    broadcast('MARKET_UPDATE', latestMarketData);
    console.log('[Cron] Market data updated');
  } catch (err) {
    console.error('[Cron] Market update failed:', err.message);
  }
});

// Auto-agent: run analysis every 5 minutes if enabled
cron.schedule('*/5 * * * *', async () => {
  if (!getAgentState().isRunning) return;
  try {
    const market = latestMarketData || (await fetchHBARData());
    const sentiment = latestSentimentData || (await fetchSentimentData());
    // Auto-agent uses empty vault data if no wallet is known to server
    const decision = await analyzeAndDecide(market, sentiment, { vaults: [] });
    broadcast('DECISION', decision);
    console.log('[Agent] Auto-analysis complete:', decision.actionType);
  } catch (err) {
    console.error('[Agent] Auto-analysis failed:', err.message);
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🤖 AI Vault Guardian Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API: http://localhost:${PORT}/api\n`);
  fetchHBARData().then((d) => { latestMarketData = d; broadcast('MARKET_UPDATE', d); }).catch(() => {});
  fetchSentimentData().then((d) => { latestSentimentData = d; }).catch(() => {});
});
