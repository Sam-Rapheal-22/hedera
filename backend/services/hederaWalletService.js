// Hedera Wallet Service - fetches real on-chain data via Hedera Mirror Node REST API
// Docs: https://docs.hedera.com/hedera/sdks-and-apis/rest-api
import axios from 'axios';

const MIRROR_BASE = 'https://mainnet.mirrornode.hedera.com/api/v1';
const TESTNET_MIRROR_BASE = 'https://testnet.mirrornode.hedera.com/api/v1';

function getMirrorBase() {
  return (process.env.HEDERA_NETWORK || 'testnet') === 'mainnet'
    ? MIRROR_BASE
    : TESTNET_MIRROR_BASE;
}

/**
 * Convert an EVM 0x address to a Hedera 0.0.XXXXX account ID via Mirror Node.
 */
async function resolveAccountId(addressOrId) {
  if (!addressOrId) return null;
  // Already in 0.0.XXXX form
  if (/^\d+\.\d+\.\d+$/.test(addressOrId)) return addressOrId;

  try {
    const base = getMirrorBase();
    const res = await axios.get(`${base}/accounts/${addressOrId}`, { timeout: 8000 });
    return res.data?.account || null;
  } catch {
    return null;
  }
}

/**
 * Fetch the HBAR balance and token balances for a connected wallet account.
 * accountId: can be "0.0.XXXXX" (Hedera native) or "0x..." (EVM address from MetaMask)
 */
export async function fetchWalletData(accountId) {
  const base = getMirrorBase();

  const resolvedId = await resolveAccountId(accountId);
  if (!resolvedId) {
    return { error: 'Could not resolve account ID', accountId };
  }

  try {
    const [accountRes, tokenRes] = await Promise.all([
      axios.get(`${base}/accounts/${resolvedId}`, { timeout: 8000 }),
      axios.get(`${base}/accounts/${resolvedId}/tokens`, {
        params: { limit: 50 },
        timeout: 8000,
      }),
    ]);

    const acc = accountRes.data;
    const hbarBalance = acc.balance?.balance ?? 0; // in tinybars
    const hbarHuman = hbarBalance / 1e8; // convert to HBAR

    const tokens = (tokenRes.data?.tokens || []).map((t) => ({
      tokenId: t.token_id,
      balance: t.balance,
      decimals: t.decimals ?? 0,
      symbol: t.symbol || t.token_id,
      name: t.name || t.token_id,
      humanBalance: t.balance / Math.pow(10, t.decimals ?? 0),
    }));

    return {
      accountId: resolvedId,
      hbar: hbarHuman,
      hbarTinybars: hbarBalance,
      tokens,
      evmAddress: acc.evm_address || null,
      createdTimestamp: acc.created_timestamp || null,
      memo: acc.memo || '',
    };
  } catch (err) {
    console.error('[HederaWallet] Failed to fetch account data:', err.message);
    throw new Error(`Mirror Node error: ${err.message}`);
  }
}

/**
 * Fetch the recent transaction history for a wallet from the Mirror Node.
 */
export async function fetchWalletTransactions(accountId, limit = 25) {
  const base = getMirrorBase();

  const resolvedId = await resolveAccountId(accountId);
  if (!resolvedId) return [];

  try {
    const res = await axios.get(`${base}/transactions`, {
      params: {
        'account.id': resolvedId,
        limit,
        order: 'desc',
      },
      timeout: 10000,
    });

    const txns = res.data?.transactions || [];
    return txns.map((tx) => {
      const network = (process.env.HEDERA_NETWORK || 'testnet');
      return {
        id: tx.transaction_id,
        type: tx.name || tx.transaction_type || 'TRANSFER',
        status: tx.result === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        timestamp: new Date(parseFloat(tx.consensus_timestamp) * 1000).toISOString(),
        network: `Hedera ${network.charAt(0).toUpperCase() + network.slice(1)}`,
        explorerUrl: `https://hashscan.io/${network}/transaction/${tx.transaction_id}`,
        chargedFee: tx.charged_tx_fee ? (tx.charged_tx_fee / 1e8).toFixed(6) : '0',
        memo: tx.memo_base64
          ? Buffer.from(tx.memo_base64, 'base64').toString('utf8')
          : '',
        transfers: (tx.transfers || []).map((t) => ({
          account: t.account,
          amount: t.amount / 1e8,
          isApproval: t.is_approval || false,
        })),
      };
    });
  } catch (err) {
    console.error('[HederaWallet] Failed to fetch transactions:', err.message);
    return [];
  }
}

/**
 * Build vault-like position objects from the wallet's real token + HBAR balances.
 * This represents the user's actual holdings rather than fabricated DeFi vault data.
 */
export async function fetchWalletVaultPositions(accountId, hbarPrice = null) {
  const walletData = await fetchWalletData(accountId);
  if (walletData.error) return { vaults: [], walletData };

  const positions = [];
  const hbar = walletData.hbar;

  // HBAR position
  if (hbar > 0) {
    const usdValue = hbarPrice ? hbar * hbarPrice : null;
    positions.push({
      id: 'hbar-wallet',
      name: 'HBAR',
      protocol: 'Native Hedera Wallet',
      asset: 'HBAR',
      tokenId: null,
      balance: hbar,
      decimals: 8,
      humanBalance: hbar,
      tvl: usdValue,
      usdValue,
      apy: null,
      pendingRewards: 0,
      liquidityRange: null,
      inRange: true,
      utilizationRate: null,
      totalHarvested: 0,
      isNative: true,
    });
  }

  // Token positions
  for (const token of walletData.tokens) {
    if (token.humanBalance <= 0) continue;
    positions.push({
      id: token.tokenId,
      name: token.name || token.symbol,
      protocol: 'HTS (Hedera Token Service)',
      asset: token.symbol,
      tokenId: token.tokenId,
      balance: token.balance,
      decimals: token.decimals,
      humanBalance: token.humanBalance,
      tvl: null, // No USD price available without an oracle
      usdValue: null,
      apy: null,
      pendingRewards: 0,
      liquidityRange: null,
      inRange: true,
      utilizationRate: null,
      totalHarvested: 0,
      isNative: false,
    });
  }

  return {
    vaults: positions,
    walletData: {
      accountId: walletData.accountId,
      evmAddress: walletData.evmAddress,
      hbar,
      tokenCount: walletData.tokens.length,
    },
  };
}
