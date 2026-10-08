import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { DEMO_POOLS } from '../lib/demoPools';

export interface PoolVaultAmounts {
  /** token0 vault uiAmount (null while unloaded / on error) */
  amount0: number | null;
  /** token1 vault uiAmount */
  amount1: number | null;
}

/**
 * Polls the on-chain vault token balances of every demo pool. Raw amounts —
 * callers combine with a price to compute TVL. Polls every 15s; keeps the
 * last good values on RPC errors.
 */
export function usePoolVaults(): PoolVaultAmounts[] {
  const [vaults, setVaults] = useState<PoolVaultAmounts[]>(
    DEMO_POOLS.map(() => ({ amount0: null, amount1: null }))
  );

  useEffect(() => {
    const raw = import.meta.env.VITE_RPC_URL || clusterApiUrl('devnet');
    const endpoint =
      raw.startsWith('/') && typeof window !== 'undefined'
        ? `${window.location.origin}${raw}`
        : raw;
    const conn = new Connection(endpoint, 'confirmed');
    let stopped = false;

    const fetchAll = async () => {
      try {
        const res = await Promise.all(
          DEMO_POOLS.map(async (cfg): Promise<PoolVaultAmounts> => {
            const [b0, b1] = await Promise.all([
              conn.getTokenAccountBalance(new PublicKey(cfg.token0Vault)),
              conn.getTokenAccountBalance(new PublicKey(cfg.token1Vault)),
            ]);
            return { amount0: b0.value.uiAmount ?? 0, amount1: b1.value.uiAmount ?? 0 };
          })
        );
        if (!stopped) setVaults(res);
      } catch {
        // keep last good values
      }
    };

    fetchAll();
    const timer = setInterval(fetchAll, 15_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  return vaults;
}
