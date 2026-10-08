import { useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import { useKline, KlineInterval, UseKlineResult } from './useKline';
import { DEMO_POOLS } from '../lib/demoPools';
import { TradingPair } from '../types';
import { PairRow } from '../components/spot/TradingPairDropdown';

/**
 * Shared on-chain data source for the spot & perps pages: one useKline per
 * demo pool + a real TradingPair list (price/change reconstructed from each
 * pool's on-chain swaps, rolling window). Returns livePairs=null when no pool
 * has live data (callers fall back to the mock list).
 */
export function useDemoPoolKlines(interval: KlineInterval): {
  poolKlines: UseKlineResult[];
  livePairs: PairRow[] | null;
} {
  const rpcEndpoint = import.meta.env.VITE_RPC_URL || clusterApiUrl('devnet');
  const klineMeme = useKline({
    poolAddress: DEMO_POOLS[0].pool,
    rpcUrl: rpcEndpoint,
    interval,
    token0Vault: DEMO_POOLS[0].token0Vault,
    token1Vault: DEMO_POOLS[0].token1Vault,
  });
  const klineStock = useKline({
    poolAddress: DEMO_POOLS[1].pool,
    rpcUrl: rpcEndpoint,
    interval,
    token0Vault: DEMO_POOLS[1].token0Vault,
    token1Vault: DEMO_POOLS[1].token1Vault,
  });
  const klineChop = useKline({
    poolAddress: DEMO_POOLS[2].pool,
    rpcUrl: rpcEndpoint,
    interval,
    token0Vault: DEMO_POOLS[2].token0Vault,
    token1Vault: DEMO_POOLS[2].token1Vault,
  });
  const poolKlines = [klineMeme, klineStock, klineChop];

  const livePairs = useMemo((): PairRow[] | null => {
    if (!poolKlines.some(k => k.isLive)) return null;
    return DEMO_POOLS.map((cfg, i) => {
      const cs = poolKlines[i].candles;
      const first = cs[0];
      const last = cs[cs.length - 1];
      return {
        id: cfg.key,
        symbol: cfg.symbol,
        name: cfg.name,
        price: last?.close ?? 0,
        change24h: first && last && first.open > 0 ? ((last.close - first.open) / first.open) * 100 : 0,
        volume24h: cs.reduce((s, c) => s + c.volume, 0),
        high24h: cs.length ? Math.max(...cs.map(c => c.high)) : 0,
        low24h: cs.length ? Math.min(...cs.map(c => c.low)) : 0,
        perpEligible: cfg.perpEligible,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klineMeme.candles, klineStock.candles, klineChop.candles]);

  return { poolKlines, livePairs };
}

export type { TradingPair };
