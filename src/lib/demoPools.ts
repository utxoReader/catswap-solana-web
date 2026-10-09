// Demo pools launched on the local rehearsal validator (scripts/devnet
// bootstrap). On devnet these get replaced by the deployed equivalents —
// same shape, different addresses.
// Addresses = .state.json v4 (2026-10-09): agave 4.1.1 binary re-downloaded
// after disk cleanup, validator rebuilt (1M-shred cap), program = main
// 279183d4 (#251 exec legs + ema45s anchor LIVE in demo data).
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
export const DEMO_USDC_MINT = '9SoVAK1E3Ba7cJ3U4NQFDyi49rrQgRgeXsfhRhc1GA4H';

export const DEMO_POOLS: DemoPoolConfig[] = [
  {
    key: 'meme',
    symbol: 'MEME/USDC',
    name: 'Demo Meme (fair launch)',
    pool: 'Fqzc4A2b5NgPdSwfohRcEdnWkTSEMpZzfJcN5rLJdpSP',
    token0Vault: '823FuR86QtB36TQsyjSCVX6H3NQeDCGigAUzHTT4Nfsg',
    token1Vault: 'Fdc6qwmMSqntidih2BpCXFRJtxudiQoDEU2dhPVJSkzZ',
    token0Mint: 'HCZrYcGgKBo85rra3mMsjhnWuWqab5VZb6QT88BswPzb',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: false, // launch pool — perp off by design
  },
  {
    key: 'stock',
    symbol: 'STOCK/USDC',
    name: 'Demo Stock Token',
    pool: 'HQypihWfVyYq82Y3yRZdyXZ16Bm6BAJN4pDYyXXYTzZ',
    token0Vault: '66MUHbmfHscG92L8Q7u3aEpu5ZaLukKeMrpnFCZh4v46',
    token1Vault: '2cHW7b9m4EcGW29T1CVfApd7wM6KiQyEUsqDCW5yJa8Z',
    token0Mint: '9yrAChUgYqVom37f68nJxvhR3DyyY6B6zGYcEW8jVcpA',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
  {
    key: 'chop',
    symbol: 'CHOP/USDC',
    name: 'Demo Sideways',
    pool: '1128jCREpsvMdRFqwtBmQBLxxNrP4ZuRqkAgjafCrmH',
    token0Vault: '4f5Pv4ceSY6vqFLyw1f7DL4Za4PnzctX7BuhQ7gUzTxk',
    token1Vault: '3856RGaofodAxMpMXPfYPhSrMCfEhzQExpWvL8wdgXDr',
    token0Mint: '7s1ZNZjuhy3xY11o6SW5JxdUagGad9BogheRT2DioUmy',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
];
