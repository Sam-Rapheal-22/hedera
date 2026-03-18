import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cron from 'node-cron';

import { fetchHBARData, fetchSentimentData, generateVaultData } from './services/marketService.js';
import { analyzeAndDecide, chat, getAgentState, setAgentRunning } from './agent/vaultAgent.js';
import { getTransactionLog } from './services/hederaService.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// In-memory state
let latestMarketData = null;
let latestSentimentData = null;
let latestVaultData = null;

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

// Vault data
app.get('/api/vaults', (_, res) => {
  latestVaultData = generateVaultData();
  res.json({ success: true, data: latestVaultData });
});

// Transaction history
app.get('/api/transactions', (_, res) => {
  res.json({ success: true, data: getTransactionLog() });
});

// Agent state
app.get('/api/agent/state', (_, res) => {
  res.json({ success: true, data: getAgentState() });
});

// Trigger manual AI analysis
app.post('/api/agent/analyze', async (_, res) => {
  try {
    const [market, sentiment] = await Promise.all([fetchHBARData(), fetchSentimentData()]);
    const vaults = generateVaultData();
    latestMarketData = market;
    latestSentimentData = sentiment;
    latestVaultData = vaults;

    const decision = await analyzeAndDecide(market, sentiment, vaults);
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

// Simulate market scenario
app.post('/api/simulate', async (req, res) => {
  try {
    const { scenario } = req.body; // 'high_volatility', 'bearish', 'bullish', 'low_volatility'
    const market = buildSimulatedMarket(scenario);
    const sentiment = buildSimulatedSentiment(scenario);
    const vaults = generateVaultData();
    latestMarketData = market;
    latestSentimentData = sentiment;
    latestVaultData = vaults;

    const decision = await analyzeAndDecide(market, sentiment, vaults);
    broadcast('DECISION', decision);
    broadcast('MARKET_UPDATE', market);
    broadcast('SIMULATION', { scenario, active: true });
    res.json({ success: true, data: { decision, market, sentiment } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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
  // Send initial state
  if (latestMarketData) ws.send(JSON.stringify({ type: 'MARKET_UPDATE', data: latestMarketData }));
  if (latestVaultData) ws.send(JSON.stringify({ type: 'VAULT_UPDATE', data: latestVaultData }));
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
    const vaults = generateVaultData();
    const decision = await analyzeAndDecide(market, sentiment, vaults);
    broadcast('DECISION', decision);
    console.log('[Agent] Auto-analysis complete:', decision.actionType);
  } catch (err) {
    console.error('[Agent] Auto-analysis failed:', err.message);
  }
});

// ─── Simulation Helpers ────────────────────────────────────────────────────────
function buildSimulatedMarket(scenario) {
  const base = { price: 0.089, change24h: 0, volume24h: 45000000, marketCap: 3200000000 };
  const history = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    price: 0,
  }));

  switch (scenario) {
    case 'high_volatility':
      history.forEach((h, i) => { h.price = parseFloat((0.089 + Math.sin(i) * 0.015).toFixed(5)); });
      return { ...base, price: 0.082, change24h: -8.5, volatility: 7.2, volatilityLevel: 'HIGH', priceHistory: history, simulated: true };
    case 'bearish':
      history.forEach((h, i) => { h.price = parseFloat((0.095 - i * 0.0004).toFixed(5)); });
      return { ...base, price: 0.076, change24h: -14.2, volatility: 6.8, volatilityLevel: 'HIGH', priceHistory: history, simulated: true };
    case 'bullish':
      history.forEach((h, i) => { h.price = parseFloat((0.079 + i * 0.0005).toFixed(5)); });
      return { ...base, price: 0.109, change24h: 22.4, volatility: 3.1, volatilityLevel: 'MEDIUM', priceHistory: history, simulated: true };
    case 'low_volatility':
    default:
      history.forEach((h, i) => { h.price = parseFloat((0.089 + (Math.random() - 0.5) * 0.001).toFixed(5)); });
      return { ...base, price: 0.089, change24h: 0.4, volatility: 0.8, volatilityLevel: 'LOW', priceHistory: history, simulated: true };
  }
}

function buildSimulatedSentiment(scenario) {
  switch (scenario) {
    case 'bearish': return { score: -0.72, label: 'BEARISH', positive: 2, negative: 18, neutral: 4, simulated: true };
    case 'bullish': return { score: 0.68, label: 'BULLISH', positive: 17, negative: 2, neutral: 5, simulated: true };
    case 'high_volatility': return { score: -0.3, label: 'BEARISH', positive: 5, negative: 12, neutral: 7, simulated: true };
    default: return { score: 0.05, label: 'NEUTRAL', positive: 8, negative: 6, neutral: 10, simulated: true };
  }
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🤖 AI Vault Guardian Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API: http://localhost:${PORT}/api\n`);
  // Initial data fetch
  fetchHBARData().then((d) => { latestMarketData = d; broadcast('MARKET_UPDATE', d); }).catch(() => {});
  fetchSentimentData().then((d) => { latestSentimentData = d; }).catch(() => {});
});
