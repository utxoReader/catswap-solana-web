// Demo pools launched on the local rehearsal validator (scripts/devnet
// bootstrap). On devnet these get replaced by the deployed equivalents —
// same shape, different addresses.
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
export const DEMO_USDC_MINT = 'Gf7axM4ZKbC5Nxba53ezPyyrajv3dCzpCm2jRNTvhR3W';

export const DEMO_POOLS: DemoPoolConfig[] = [
  {
    key: 'meme',
    symbol: 'MEME/USDC',
    name: 'Demo Meme (fair launch)',
    pool: '8HYaopnNGVQmVaTC4znqefKg1MydcVK3VbESwokKR4rt',
    token0Vault: 'HegeJhcTDxTX3Z124WTF4bsUq3arARy7tNBbrBBdj46V',
    token1Vault: 'Y6i7BeYB72g72M4ReD9FDyZdfdXYsUp672EMFQoSUE2',
    token0Mint: 'BWhK1SDwAcFw3JoGYXj7bxEmfMki7potb4ViEA6AgFkX',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: false, // launch pool — perp off by design
  },
  {
    key: 'stock',
    symbol: 'STOCK/USDC',
    name: 'Demo Stock Token',
    pool: 'Fmpx5W8xNDHWKzNd9cMizgk2HMq6GPVhn5jnk2Hc8Fra',
    token0Vault: '2w8DGkjtxneyXhB4Ndho4EaS8uMqD4Q6XvU2CjqkNqdS',
    token1Vault: 'CM8kP4F7Rw7zGsnzDmTdox59hvtSYKTDzJcrnpeEKffz',
    token0Mint: '5fN21gAhG6fLvVL3etm6wBy5tm3XT4GUxNJW72eqXf9C',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
  {
    key: 'chop',
    symbol: 'CHOP/USDC',
    name: 'Demo Sideways',
    pool: 'AAcF8FZi7rM9ucignh3K4JUuixR3hN8SBFBwQUW8pr2D',
    token0Vault: 'GwvjNUNz6G4Dg5aJKXKUtm7qKBEJxLpde8HF5ob43coc',
    token1Vault: '5tRr2wcf3hmsLTNf4RX7kxPsRBfzFcyUavnkrMQ9pG9f',
    token0Mint: 'AXGFCJTfLpmWHQaGEAFZoXiBDLChFdw18wxF7QCBtn5A',
    token1Mint: DEMO_USDC_MINT,
    perpEligible: true,
  },
];
