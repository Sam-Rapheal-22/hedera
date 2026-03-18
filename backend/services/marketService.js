// Market Data Service - fetches HBAR price, volatility, and sentiment
import axios from 'axios';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Fetch HBAR price history and compute volatility
export async function fetchHBARData() {
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

    return {
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
  } catch (err) {
    console.error('[MarketService] CoinGecko error:', err.message);
    // Return simulated data if API is rate-limited
    return generateSimulatedHBARData();
  }
}

// Fetch crypto news sentiment
export async function fetchSentimentData() {
  try {
    const res = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: process.env.CRYPTOPANIC_API_KEY || 'demo',
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

// Simulated data fallback (for demo when APIs are rate-limited)
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
    simulated: true,
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
    simulated: true,
  };
}

// Simulate DeFi vault data
export function generateVaultData() {
  const apy = 12 + Math.random() * 8;
  const tvl = 500000 + Math.random() * 200000;
  const pendingRewards = 1200 + Math.random() * 800;
  return {
    vaults: [
      {
        id: 'hbar-usdc',
        name: 'HBAR/USDC',
        protocol: 'Bonzo Finance',
        tvl,
        apy,
        pendingRewards,
        liquidityRange: { lower: 0.072, upper: 0.11 },
        inRange: Math.random() > 0.3,
        utilizationRate: 0.6 + Math.random() * 0.3,
        totalHarvested: 8450 + Math.random() * 1000,
      },
      {
        id: 'hbar-eth',
        name: 'HBAR/ETH',
        protocol: 'Bonzo Finance',
        tvl: tvl * 0.6,
        apy: apy * 0.9,
        pendingRewards: pendingRewards * 0.7,
        liquidityRange: { lower: 0.000031, upper: 0.000048 },
        inRange: Math.random() > 0.4,
        utilizationRate: 0.5 + Math.random() * 0.3,
        totalHarvested: 5200 + Math.random() * 500,
      },
    ],
  };
}
