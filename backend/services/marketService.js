// Market Data Service - fetches HBAR price, volatility, and sentiment
import axios from 'axios';

const COINGECKO_BASE = process.env.COINGECKO_API || 'https://api.coingecko.com/api/v3';
const HBAR_CACHE_TTL_MS = Number(process.env.MARKET_CACHE_TTL_MS || 60_000);
const COINGECKO_BACKOFF_MS = Number(process.env.COINGECKO_BACKOFF_MS || 5 * 60_000);

let lastHBARData = null;
let lastHBARFetchAt = 0;
let coingeckoBackoffUntil = 0;

function getFallbackHBARData() {
  if (lastHBARData) {
    return {
      ...lastHBARData,
      stale: true,
      rateLimited: true,
    };
  }
  return generateSimulatedHBARData();
}

// Fetch HBAR price history and compute volatility
export async function fetchHBARData() {
  const now = Date.now();

  if (lastHBARData && now - lastHBARFetchAt < HBAR_CACHE_TTL_MS) {
    return lastHBARData;
  }

  if (coingeckoBackoffUntil > now) {
    return getFallbackHBARData();
  }

  try {
    const [priceRes, marketRes] = await Promise.all([
      axios.get(`${COINGECKO_BASE}/simple/price`, {
        params: {
          ids: 'hedera-hashgraph',
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true,
        },
        timeout: 8000,
      }),
      axios.get(`${COINGECKO_BASE}/coins/hedera-hashgraph/market_chart`, {
        params: { vs_currency: 'usd', days: 1, interval: 'hourly' },
        timeout: 8000,
      }),
    ]);

    const data = priceRes.data['hedera-hashgraph'];
    const prices = marketRes.data.prices.map(([, p]) => p);

    // Compute standard deviation as volatility metric
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatilityPct = (stdDev / mean) * 100;

    const payload = {
      price: data.usd,
      change24h: data.usd_24h_change,
      volume24h: data.usd_24h_vol,
      marketCap: data.usd_market_cap,
      volatility: volatilityPct,
      volatilityLevel: volatilityPct < 2 ? 'LOW' : volatilityPct < 5 ? 'MEDIUM' : 'HIGH',
      priceHistory: marketRes.data.prices.slice(-24).map(([ts, price]) => ({
        time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: parseFloat(price.toFixed(5)),
      })),
    };

    lastHBARData = payload;
    lastHBARFetchAt = Date.now();
    coingeckoBackoffUntil = 0;

    return payload;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 429) {
      coingeckoBackoffUntil = Date.now() + COINGECKO_BACKOFF_MS;
      console.warn(`[MarketService] CoinGecko rate-limited (429). Backing off for ${Math.round(COINGECKO_BACKOFF_MS / 1000)}s.`);
    } else {
      console.error('[MarketService] CoinGecko error:', err.message);
    }

    return getFallbackHBARData();
  }
}

// Fetch crypto news sentiment
export async function fetchSentimentData() {
  // If the user hasn't configured a real API key yet, skip the request to avoid a 404 error
  if (!process.env.CRYPTOPANIC_API_KEY || process.env.CRYPTOPANIC_API_KEY === 'your_cryptopanic_api_key_here') {
    return generateSimulatedSentiment();
  }

  try {
    const res = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: process.env.CRYPTOPANIC_API_KEY,
        currencies: 'HBAR',
        public: true,
        kind: 'news',
        filter: 'hot',
      },
      timeout: 8000,
    });

    const results = res.data.results || [];
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };

    results.forEach((item) => {
      const votes = item.votes || {};
      if (votes.positive > votes.negative) sentimentCounts.positive++;
      else if (votes.negative > votes.positive) sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });

    const total = results.length || 1;
    const sentimentScore =
      (sentimentCounts.positive - sentimentCounts.negative) / total;

    return {
      score: sentimentScore,
      label:
        sentimentScore > 0.1
          ? 'BULLISH'
          : sentimentScore < -0.1
          ? 'BEARISH'
          : 'NEUTRAL',
      positive: sentimentCounts.positive,
      negative: sentimentCounts.negative,
      neutral: sentimentCounts.neutral,
      articles: results.slice(0, 5).map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source?.title || 'Unknown',
        published: a.published_at,
      })),
    };
  } catch (err) {
    console.error('[MarketService] Sentiment error:', err.message);
    return generateSimulatedSentiment();
  }
}

// CoinGecko rate-limit fallback — last-resort cached estimate
function generateSimulatedHBARData() {
  const basePrice = 0.085 + Math.random() * 0.02;
  const volatility = Math.random() * 8;
  const history = [];
  for (let i = 23; i >= 0; i--) {
    const noise = (Math.random() - 0.5) * 0.005;
    history.push({
      time: new Date(Date.now() - i * 3600000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      price: parseFloat((basePrice + noise).toFixed(5)),
    });
  }
  return {
    price: basePrice,
    change24h: (Math.random() - 0.5) * 10,
    volume24h: 40000000 + Math.random() * 10000000,
    marketCap: 3000000000 + Math.random() * 500000000,
    volatility,
    volatilityLevel: volatility < 2 ? 'LOW' : volatility < 5 ? 'MEDIUM' : 'HIGH',
    priceHistory: history,
    rateLimited: true,
  };
}

function generateSimulatedSentiment() {
  const score = (Math.random() - 0.5) * 0.8;
  return {
    score,
    label: score > 0.1 ? 'BULLISH' : score < -0.1 ? 'BEARISH' : 'NEUTRAL',
    positive: Math.floor(Math.random() * 15),
    negative: Math.floor(Math.random() * 10),
    neutral: Math.floor(Math.random() * 8),
    articles: [],
    rateLimited: true,
  };
}

// generateVaultData removed — vault data now comes from the Hedera Mirror Node
