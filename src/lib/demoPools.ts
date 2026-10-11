// Demo pools launched on the local rehearsal validator (scripts/devnet
// bootstrap). On devnet these get replaced by the deployed equivalents —
// same shape, different addresses.
// Addresses = .state.json v5 (2026-10-11): validator rebuilt 5th time after
// /tmp cleanup (agave now at ~/tools/agave-4.1.1). NOTE: local .so is a
// c4-era build (pre-c6 fee form) — data-plane backup only; the final fee
// demo comes from the devnet deploy (fresh main build).
export interface DemoPoolConfig {
  key: string; // 'meme' | 'stock' | 'chop'
  symbol: string; // display pair
  name: string;
  pool: string;
  token0Vault: string;
  token1Vault: string;
  token0Mint: string;
  token1Mint: string; // shared demo USDC
  /** Launch pools are born with perp disabled; standard pools are eligible. */
  perpEligible: boolean;
}

/** Demo USDC mint (faucet — we hold mint authority on the rehearsal validator). */
export const DEMO_USDC_MINT = 'GcpsysHMzyZQvYtYWojAVxwPjN8bGWZpieA5JGnY4AHC';

export const DEMO_POOLS: DemoPoolConfig[] = [
  {
    key: 'meme',
    symbol: 'MEME/USDC',
    name: 'Demo Meme (fair launch)',
    pool: '7xKoKmVfxCYJr7Ti1MZa1Uam3Z1d8L4SfaYuzC7Vy1LJ',
    token0Vault: '83WR6SRXmS9GBkrpSjicEtad1WchSxqVADdkPFQVJSaV',
    token1Vault: 'CsMhU3dA1c2VYtukhiKP5tu9yXBpQVSpxa4psBzkbc7F',
    token0Mint: 'HTEgavFz9nBdYonspxhKdMrHUkfmceYxHeMt8LRMd1Rw',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: false, // launch pool — perp off by design
  },
  {
    key: 'stock',
    symbol: 'STOCK/USDC',
    name: 'Demo Stock Token',
    pool: '683PxXZqhhNVF8LNJjeDHivoLna6cCLywCZ2Jo4jPADw',
    token0Vault: '3YFBQ7428Xzz7wyNvPMWPvqKXE8ZkQLFW4LFXsoqgSYN',
    token1Vault: 'B6BV2pjtYaj2T6nX5sVMm9VwRRb3EP6NjJ91QkZuCeEo',
    token0Mint: '4pgdy45qesgbd5KseSsdqYaUCChuaz97XUyHWdpsqw2h',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
  {
    key: 'chop',
    symbol: 'CHOP/USDC',
    name: 'Demo Sideways',
    pool: '87xmTfxY7oAMehhCa49UYUp2TV1Kci2Q9TH4ur4TPNoV',
    token0Vault: '5K5bCPKTHSiEcJmwUbcTfqXPCAiW4RwniH4h18SZLGdM',
    token1Vault: '6VPzvCWfzEz2ofvzsXfR7NB3AHN9mSSbMurENmthA8XP',
    token0Mint: '5Dq7QZRVToEchz2nZ2xRMaoaMYexEn6GUW8QiAfLmzbM',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
];
