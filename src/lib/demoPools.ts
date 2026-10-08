// Demo pools launched on the local rehearsal validator (scripts/devnet
// bootstrap). On devnet these get replaced by the deployed equivalents —
// same shape, different addresses.
// Addresses = .state.json v3 (2026-10-09): validator rebuilt with a 1M-shred
// cap and the program redeployed from main=279183d4 (#251 exec legs + ema45s
// anchor are LIVE in the demo data).
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
export const DEMO_USDC_MINT = 'A4sbXoBhEPNDXZ3YsETqdni7ZtQWGcJCTBj7Jap2UP4H';

export const DEMO_POOLS: DemoPoolConfig[] = [
  {
    key: 'meme',
    symbol: 'MEME/USDC',
    name: 'Demo Meme (fair launch)',
    pool: 'H8SEEyEvLPb2H2YLU25x8MoJFDgTyNik2KoRdkG9Po1q',
    token0Vault: 'DBHqE5K1EvZFL9ZnUchp81dQUFG4bHVyDmpe9D6SAxu9',
    token1Vault: '5EGZ2CNk7AczGujxAPkbA91S9ZHDKh29AnRR8gGh5t4C',
    token0Mint: 'CTcFAkVxJxhGav3sLJDpqVtpVF3ZavTwpdGebZnAewDE',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: false, // launch pool — perp off by design
  },
  {
    key: 'stock',
    symbol: 'STOCK/USDC',
    name: 'Demo Stock Token',
    pool: 'Fubgdc6HTB43SCDpg3t1yh69TrEREGMnUz2yCBe1x9U7',
    token0Vault: 'G5CF1Kq56FKCN4HksA17jDBmSd5LR7sHJPqQe1b1xNQk',
    token1Vault: 'EUKtD3tvBBZZgQcCEC6BiwXZ7Cj7ferFRgETGXngZTdA',
    token0Mint: '5Rw9obyYcKLyuihda6J63idWhkcdvA5DVMA8pVmW2EzT',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
  {
    key: 'chop',
    symbol: 'CHOP/USDC',
    name: 'Demo Sideways',
    pool: 'AueGx6LUaVqeiHaHoYWvV1eWaMfC4rfULYn9REswUUhx',
    token0Vault: '99DeGEt5bbFc2FQ7a3PFvb7EtQ1ppfhF51HfKDQse95F',
    token1Vault: 'G8xJDbpdmMTkHbKi4oTzwtknN74tZG2g88W5zMBRbsZC',
    token0Mint: 'BKk2o6q82JSrgrtYZnytNoWNvib916Hwjm7xoXEDoJGU',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
];
