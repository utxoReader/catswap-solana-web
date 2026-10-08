import { useCallback, useEffect, useRef, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { CandleData } from "../types";

/**
 * Fetches real on-chain kline (OHLCV) data for a Catswap spot pool by
 * reconstructing swap execution prices from transaction history.
 *
 * Price extraction approach (方案②):
 * The program IDL has NO SwapEvent (checked all 30 events: PerpOpened,
 * FundingSettled, ... — no swap event), so we cannot decode prices from
 * "Program data:" logs. Instead we infer each swap's marginal price from
 * the pre/post token balance deltas of the two pool vaults in tx meta:
 *
 *   price = (|Δvault1_raw| / 10^6) / (|Δvault0_raw| / 10^8)   // USDC per meme
 *
 * Caveats of this approximation:
 * - The fee (base + penalty) is embedded in the vault deltas, so the ratio
 *   is the fee-inclusive marginal price. Good enough for demo precision.
 * - Any instruction moving both vaults with opposite-sign deltas matches
 *   the heuristic (a same-sign delta pair = liquidity add/remove and is
 *   skipped). For the rehearsal pool, which is swap-dominated, this is fine.
 */

export type KlineInterval = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W";

const INTERVAL_SECONDS: Record<KlineInterval, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1H": 3600,
  "4H": 14400,
  "1D": 86400,
  "1W": 604800,
};

// Rehearsal validator (agave 4.1.1) pool + vaults, used as defaults.
export const DEFAULT_REHEARSAL_POOL = "8HYaopnNGVQmVaTC4znqefKg1MydcVK3VbESwokKR4rt";
const DEFAULT_TOKEN0_VAULT = "HegeJhcTDxTX3Z124WTF4bsUq3arARy7tNBbrBBdj46V";
const DEFAULT_TOKEN1_VAULT = "Y6i7BeYB72g72M4ReD9FDyZdfdXYsUp672EMFQoSUE2";
const TOKEN0_DECIMALS = 8; // meme mint
const TOKEN1_DECIMALS = 6; // USDC

const SIGNATURE_PAGE_LIMIT = 1000;
const MAX_INITIAL_PAGES = 10; // initial backfill cap: 10k signatures
const PARSED_TX_BATCH = 10; // parallel getTransaction fan-out per batch
const POLL_INTERVAL_MS = 10_000;

interface SwapTick {
  time: number; // ms
  price: number; // USDC per token0
  volume: number; // USDC
}

interface KlineCache {
  processedSigs: Set<string>;
  ticks: SwapTick[]; // ascending by time
}

// Module-level cache: key = pool+interval+rpcUrl. Keeps processed signature
// set + extracted ticks so refresh only fetches incremental signatures.
const klineCache = new Map<string, KlineCache>();
const connectionCache = new Map<string, Connection>();

function getConnection(rpcUrl: string): Connection {
  let conn = connectionCache.get(rpcUrl);
  if (!conn) {
    conn = new Connection(rpcUrl, "confirmed");
    connectionCache.set(rpcUrl, conn);
  }
  return conn;
}

function getCache(key: string): KlineCache {
  let cache = klineCache.get(key);
  if (!cache) {
    cache = { processedSigs: new Set(), ticks: [] };
    klineCache.set(key, cache);
  }
  return cache;
}

/**
 * Extract a swap tick from a parsed transaction by diffing the two vaults'
 * raw token balances. Returns null when the tx is not a pool swap.
 */
function extractSwapTick(
  tx: any,
  vault0Index: number,
  vault1Index: number
): SwapTick | null {
  const meta = tx?.meta;
  if (!meta || meta.err || !tx.blockTime) return null;

  const rawDelta = (balances: any[] | null | undefined, accountIndex: number): bigint => {
    const entry = (balances ?? []).find((b: any) => b.accountIndex === accountIndex);
    return entry ? BigInt(entry.uiTokenAmount.amount) : 0n;
  };

  const d0 =
    rawDelta(meta.postTokenBalances, vault0Index) - rawDelta(meta.preTokenBalances, vault0Index);
  const d1 =
    rawDelta(meta.postTokenBalances, vault1Index) - rawDelta(meta.preTokenBalances, vault1Index);

  // A swap moves the two vaults in opposite directions; same-sign deltas
  // (both in or both out) are liquidity add/remove, not a price print.
  if (d0 === 0n || d1 === 0n) return null;
  if (d0 > 0n === d1 > 0n) return null;

  const abs0 = d0 < 0n ? -d0 : d0;
  const abs1 = d1 < 0n ? -d1 : d1;
  const amount0 = Number(abs0) / 10 ** TOKEN0_DECIMALS;
  const amount1 = Number(abs1) / 10 ** TOKEN1_DECIMALS;
  if (amount0 <= 0 || amount1 <= 0) return null;

  return {
    time: tx.blockTime * 1000,
    price: amount1 / amount0, // USDC per meme
    volume: amount1,
  };
}

/**
 * Aggregate ticks into OHLCV candles. Empty buckets are NOT backfilled —
 * on-chain data is sparse and we render it as-is.
 */
function aggregateCandles(ticks: SwapTick[], intervalSec: number): CandleData[] {
  const buckets = new Map<number, CandleData>();
  for (const tick of ticks) {
    const bucketStart = Math.floor(tick.time / 1000 / intervalSec) * intervalSec * 1000;
    const existing = buckets.get(bucketStart);
    if (existing) {
      existing.high = Math.max(existing.high, tick.price);
      existing.low = Math.min(existing.low, tick.price);
      existing.close = tick.price;
      existing.volume += tick.volume;
    } else {
      buckets.set(bucketStart, {
        time: bucketStart,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
      });
    }
  }
  return [...buckets.values()].sort((a, b) => a.time - b.time);
}

export interface UseKlineOptions {
  poolAddress?: string;
  rpcUrl?: string;
  interval: KlineInterval;
  token0Vault?: string;
  token1Vault?: string;
}

export interface UseKlineResult {
  candles: CandleData[];
  loading: boolean;
  /** true after the first fetch completed — mock fallback only when settled && !isLive */
  settled: boolean;
  error: string | null;
  /** true when at least one real on-chain swap was reconstructed */
  isLive: boolean;
  currentPrice: number | null;
  refresh: () => Promise<void>;
}

export function useKline({
  poolAddress,
  rpcUrl,
  interval,
  token0Vault = import.meta.env.VITE_TOKEN0_VAULT || DEFAULT_TOKEN0_VAULT,
  token1Vault = import.meta.env.VITE_TOKEN1_VAULT || DEFAULT_TOKEN1_VAULT,
}: UseKlineOptions): UseKlineResult {
  const pool = poolAddress || import.meta.env.VITE_POOL_ADDRESS || DEFAULT_REHEARSAL_POOL;
  // Same fallback chain as main.tsx. A relative "/rpc" hits the vite dev
  // proxy (vite.config.ts) so the page's connect-src 'self' CSP is satisfied
  // when developing against a local validator.
  const rawEndpoint = rpcUrl || import.meta.env.VITE_RPC_URL || clusterApiUrl("devnet");
  const endpoint =
    rawEndpoint.startsWith("/") && typeof window !== "undefined"
      ? `${window.location.origin}${rawEndpoint}`
      : rawEndpoint;

  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True after the first fetch completes (success or failure). Until then the
  // caller must NOT fall back to mock data — that causes the mock flash on
  // hard refresh.
  const [settled, setSettled] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);

    const cacheKey = `${pool}|${interval}|${endpoint}`;
    const cache = getCache(cacheKey);

    try {
      const connection = getConnection(endpoint);
      const poolKey = new PublicKey(pool);
      const vault0Key = new PublicKey(token0Vault);
      const vault1Key = new PublicKey(token1Vault);

      // Page signatures newest→oldest. On refresh we stop as soon as we hit
      // an already-processed signature; on the initial backfill we stop at
      // MAX_INITIAL_PAGES to bound the work.
      const isBackfill = cache.processedSigs.size === 0;
      const newSigs: { signature: string; blockTime?: number | null }[] = [];
      let before: string | undefined;
      let hitKnown = false;

      for (let page = 0; page < (isBackfill ? MAX_INITIAL_PAGES : 100); page++) {
        const sigInfos = await connection.getSignaturesForAddress(poolKey, {
          limit: SIGNATURE_PAGE_LIMIT,
          before,
        });
        if (sigInfos.length === 0) break;

        for (const info of sigInfos) {
          if (info.err) continue; // failed txs print no price
          if (cache.processedSigs.has(info.signature)) {
            hitKnown = true;
            break;
          }
          newSigs.push({ signature: info.signature, blockTime: info.blockTime });
        }
        if (hitKnown || sigInfos.length < SIGNATURE_PAGE_LIMIT) break;
        before = sigInfos[sigInfos.length - 1].signature;
      }

      // Fetch txs and extract swap ticks. NOTE: agave ≥4 removed the
      // getParsedTransaction(s) RPC methods (-32601 Method not found), so we
      // call getTransaction per signature; its default "json" encoding still
      // carries meta.pre/postTokenBalances, and accountKeys are plain base58
      // strings. Fanned out in small parallel batches.
      for (let i = 0; i < newSigs.length; i += PARSED_TX_BATCH) {
        const batch = newSigs.slice(i, i + PARSED_TX_BATCH);
        const txs = await Promise.all(
          batch.map((s) =>
            connection
              .getTransaction(s.signature, { maxSupportedTransactionVersion: 0 })
              .catch(() => null)
          )
        );

        for (const tx of txs) {
          if (!tx) continue;
          const accountKeys = (tx.transaction.message as any).accountKeys as any[];
          const vault0Index = accountKeys.findIndex((k: any) =>
            new PublicKey(k.pubkey ?? k).equals(vault0Key)
          );
          const vault1Index = accountKeys.findIndex((k: any) =>
            new PublicKey(k.pubkey ?? k).equals(vault1Key)
          );
          if (vault0Index < 0 || vault1Index < 0) continue;

          const tick = extractSwapTick(tx, vault0Index, vault1Index);
          if (tick) cache.ticks.push(tick);
        }
        for (const s of batch) cache.processedSigs.add(s.signature);
      }

      cache.ticks.sort((a, b) => a.time - b.time);
      setCandles(aggregateCandles(cache.ticks, INTERVAL_SECONDS[interval]));
    } catch (e: any) {
      // RPC unreachable etc. — don't throw; caller decides on mock fallback.
      setError(e?.message ?? String(e));
      setCandles([]);
    } finally {
      inFlight.current = false;
      setLoading(false);
      setSettled(true);
    }
  }, [pool, endpoint, interval, token0Vault, token1Vault]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const isLive = candles.length > 0;
  const lastCandle = candles[candles.length - 1];
  const currentPrice = lastCandle ? lastCandle.close : null;

  return { candles, loading, settled, error, isLive, currentPrice, refresh };
}
