// Demo pools launched on the local rehearsal validator (scripts/devnet
// bootstrap). On devnet these get replaced by the deployed equivalents —
// same shape, different addresses.
// Addresses = .state.json after the 2026-10-09 validator rebuild (114GB
// shred-cap surgery — old ledger discarded, all pools re-launched).
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
export const DEMO_USDC_MINT = '29S2niwzojDGTNSfRTAyu6xbsXPK5Nn45kMQd5AYpVY7';

export const DEMO_POOLS: DemoPoolConfig[] = [
  {
    key: 'meme',
    symbol: 'MEME/USDC',
    name: 'Demo Meme (fair launch)',
    pool: '7Lhrisns2A55Fv2YmaVxEH9hxNLU52CgJn2hcwRXmzjx',
    token0Vault: '5f1KtCWWAUbD6P8SWFFbtd3TAJaWdXfjZmTwXCb7nunG',
    token1Vault: '4r9KAknvgWpBCnK8tgUqa9FUHouzotLRaQ8QN4kaShV2',
    token0Mint: 'EUNYyaspkFRpJ9KVc2ytZRQJXhaNr4g8nE9ZdL5RQeTy',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: false, // launch pool — perp off by design
  },
  {
    key: 'stock',
    symbol: 'STOCK/USDC',
    name: 'Demo Stock Token',
    pool: 'DHy9bAuZFfmHkZjQfzdKgCECpe9tg6X8UHRNQHKFDUwL',
    token0Vault: '2cagrzfWEREG7pkFmTjkYfCzMhMu9Ydr2NVdy3qDEei1',
    token1Vault: '2vGhenHrxnTT3iT1FGTMeQHCPNZxRqCk6NdX32dFucWJ',
    token0Mint: '2Rk6bWvZ5UApT55EojBq4yfG2iUD357xLGqgBmrRAm69',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
  {
    key: 'chop',
    symbol: 'CHOP/USDC',
    name: 'Demo Sideways',
    pool: '5uz8znRK2jRx83LrFi4KwtH9Yr36akfrmFf79CgjmVgH',
    token0Vault: '2ESspxpbV3S4p8YEwz56KFp9vPDXJ4CpyYXunyZPCSjm',
    token1Vault: 'G5vtK32mGa6gwpZeaJNevn5VHboW3fS88QrdfWkXaDvG',
    token0Mint: 'Btg6meVshdeAWsCDhFehEZxTgUriCdQsqZNgPkxL1YYK',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
];
