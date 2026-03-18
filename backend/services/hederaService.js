// Hedera Mock Service - simulates Hedera Agent Kit interactions
// In production, replace with real @hashgraphonline/hedera-agent-kit calls

const transactionLog = [];

export function getTransactionLog() {
  return transactionLog;
}

export async function executeHarvest(vaultId, amount) {
  await delay(1200);
  const tx = {
    id: generateTxId(),
    type: 'HARVEST',
    vaultId,
    amount,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    network: 'Hedera Testnet',
    explorerUrl: `https://hashscan.io/testnet/transaction/${generateTxId()}`,
    gasUsed: (0.001 + Math.random() * 0.002).toFixed(4),
  };
  transactionLog.unshift(tx);
  return tx;
}

export async function executeRebalance(vaultId, newRange) {
  await delay(1500);
  const tx = {
    id: generateTxId(),
    type: 'REBALANCE',
    vaultId,
    newRange,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    network: 'Hedera Testnet',
    explorerUrl: `https://hashscan.io/testnet/transaction/${generateTxId()}`,
    gasUsed: (0.002 + Math.random() * 0.003).toFixed(4),
  };
  transactionLog.unshift(tx);
  return tx;
}

export async function executeWithdraw(vaultId, percentage) {
  await delay(2000);
  const tx = {
    id: generateTxId(),
    type: 'WITHDRAW',
    vaultId,
    percentage,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    network: 'Hedera Testnet',
    explorerUrl: `https://hashscan.io/testnet/transaction/${generateTxId()}`,
    gasUsed: (0.003 + Math.random() * 0.004).toFixed(4),
  };
  transactionLog.unshift(tx);
  return tx;
}

export async function executeDeposit(vaultId, amount) {
  await delay(1200);
  const tx = {
    id: generateTxId(),
    type: 'DEPOSIT',
    vaultId,
    amount,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    network: 'Hedera Testnet',
    explorerUrl: `https://hashscan.io/testnet/transaction/${generateTxId()}`,
    gasUsed: (0.001 + Math.random() * 0.002).toFixed(4),
  };
  transactionLog.unshift(tx);
  return tx;
}

function generateTxId() {
  return `0.0.${Math.floor(Math.random() * 9000000 + 1000000)}@${Date.now()}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
