import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useAnchorProgram } from "./useAnchorProgram";
import { derivePerpPoolState } from "../lib/pda";

/**
 * Reads the on-chain Pool account + PerpPoolState for a given pool address.
 * Returns null when the pool address is not configured or the account doesn't exist yet.
 *
 * E32 fixed-point helpers are included for display.
 */
export interface PoolData {
  token0Mint: PublicKey;
  token1Mint: PublicKey;
  token0Vault: PublicKey;
  token1Vault: PublicKey;
  balance0: BN;
  balance1: BN;
  sqrtPriceE16: BN;
  lpSupply: BN;
  protocolFee0: BN;
  protocolFee1: BN;
  feeMode: number;
  volWidthEnabled: boolean;
  bump: number;
  // Perp (may be null if perp not initialized)
  perpState: PerpStateData | null;
}

export interface PerpStateData {
  openInterestLongE32: BN;
  openInterestShortE32: BN;
  fundingRate: BN;
  markPriceE32: BN;
  // Add fields as needed for display
}

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

export function usePoolData() {
  const { program, programId } = useAnchorProgram();
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pool = POOL_ADDRESS;
  const progId = new PublicKey(programId);

  const refresh = useCallback(async () => {
    if (!program || !pool) return;
    setLoading(true);
    setError(null);
    try {
      const poolAcc = (await (program as any).account.pool.fetchNullable(pool)) as any;
      if (!poolAcc) {
        setPoolData(null);
        return;
      }

      // Try to fetch perp state (may not exist)
      let perpState: PerpStateData | null = null;
      try {
        const perpPda = derivePerpPoolState(progId, pool);
        const perpAcc = (await (program as any).account.perpPoolState.fetchNullable(perpPda)) as any;
        if (perpAcc) {
          perpState = {
            openInterestLongE32: perpAcc.openInterestLong ?? new BN(0),
            openInterestShortE32: perpAcc.openInterestShort ?? new BN(0),
            fundingRate: perpAcc.fundingRate ?? new BN(0),
            markPriceE32: perpAcc.markPrice ?? new BN(0),
          };
        }
      } catch {
        // Perp not initialized — leave null
      }

      setPoolData({
        token0Mint: poolAcc.token0Mint as PublicKey,
        token1Mint: poolAcc.token1Mint as PublicKey,
        token0Vault: poolAcc.token0Vault as PublicKey,
        token1Vault: poolAcc.token1Vault as PublicKey,
        balance0: new BN(poolAcc.balance0.toString()),
        balance1: new BN(poolAcc.balance1.toString()),
        sqrtPriceE16: new BN(poolAcc.sqrtPriceE16.toString()),
        lpSupply: new BN(poolAcc.lpSupply.toString()),
        protocolFee0: new BN(poolAcc.protocolFee0.toString()),
        protocolFee1: new BN(poolAcc.protocolFee1.toString()),
        feeMode: poolAcc.feeMode ?? 0,
        volWidthEnabled: poolAcc.volWidthEnabled ?? false,
        bump: poolAcc.bump ?? 0,
        perpState,
      });
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [program, pool, progId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { poolData, pool, loading, error, refresh };
}

/**
 * Convert E32 fixed-point to a display number (6 decimal USDC-precision).
 */
export function e32ToNumber(e32: BN, decimals = 6): number {
  // E32 means scaled by 2^32. Divide by 2^32 then by 10^decimals.
  // Use string manipulation to avoid floating-point precision loss for large values.
  const scaled = e32.div(new BN(2).pow(new BN(32)));
  const whole = scaled.div(new BN(10).pow(new BN(decimals)));
  const fraction = scaled.mod(new BN(10).pow(new BN(decimals)));
  return parseFloat(`${whole.toString()}.${fraction.toString().padStart(decimals, "0")}`);
}

/**
 * Convert E16 fixed-point sqrtPrice to a display price number.
 */
export function sqrtPriceE16ToPrice(sqrtPriceE16: BN): number {
  // price = (sqrtPrice / 2^16)^2
  const sqrtVal = sqrtPriceE16.toNumber() / 65536;
  return sqrtVal * sqrtVal;
}
