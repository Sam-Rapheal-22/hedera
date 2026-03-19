export const BONZO_VAULTS = [
  {
    name: "HBAR Stable Vault",
    asset: "HBAR",
    risk: "low",
    apy: "6-9%",
    description: "Lending HBAR to blue-chip borrowers. Safe, liquid, minimal IL."
  },
  {
    name: "USDC Yield Vault",
    asset: "USDC",
    risk: "low",
    apy: "5-8%",
    description: "Stablecoin lending. Zero price volatility."
  },
  {
    name: "HBARX Vault",
    asset: "HBARX",
    risk: "medium",
    apy: "10-14%",
    description: "Liquid staked HBAR + lending yield stacked."
  },
  {
    name: "SAUCE/HBAR LP Vault",
    asset: "SAUCE",
    risk: "high",
    apy: "20-35%",
    description: "LP provisioning with higher IL risk."
  },
  {
    name: "KARATE Vault",
    asset: "KARATE",
    risk: "high",
    apy: "25-40%",
    description: "Speculative yield on emerging Hedera tokens."
  }
];

/**
 * Matches a structured intent to the optimal Bonzo Finance Vault
 * @param {Object} intent - The extracted intent object
 * @returns {Object} The matched vault object
 */
export function matchVault(intent) {
  const { risk_level, asset } = intent;
  
  let candidates = BONZO_VAULTS;
  
  // 1. If asset is defined, prioritize exact or partial match
  if (asset && asset.trim() !== '') {
    const assetUpper = asset.toUpperCase();
    const assetMatched = BONZO_VAULTS.filter(v => v.asset === assetUpper || v.name.includes(assetUpper));
    if (assetMatched.length > 0) candidates = assetMatched;
  }

  // 2. Filter by risk level
  const targetRisk = (risk_level || 'low').toLowerCase();
  const riskMatched = candidates.filter(v => v.risk === targetRisk);
  
  if (riskMatched.length > 0) {
    // If multiple match, default to HBAR if asset wasn't specifically passed
    const hbarPreferred = riskMatched.find(v => v.asset === 'HBAR');
    return hbarPreferred || riskMatched[0];
  }

  // Fallback defaults
  if (candidates.length > 0) {
     const hbarPreferred = candidates.find(v => v.asset === 'HBAR');
     return hbarPreferred || candidates[0];
  }

  return BONZO_VAULTS[0]; // Absolute fallback is HBAR Stable Vault
}

/**
 * Generates a human-friendly reason for why the vault was selected
 * @param {Object} intent - The intent extracted from the user
 * @param {Object} selectedVault - The vault chosen by the matching logic
 * @returns {string} Reason summary
 */
export function generateReason(intent, selectedVault) {
    const defaultRisk = intent.risk_level || 'low';
    if (intent.asset && intent.asset.toUpperCase() === selectedVault.asset) {
       return `Selected the ${selectedVault.name} because you explicitly hold ${selectedVault.asset} and wanted a ${defaultRisk} risk profile.`;
    }
    return `Selected the ${selectedVault.name} as the best match for your ${defaultRisk} risk preference.`;
}
