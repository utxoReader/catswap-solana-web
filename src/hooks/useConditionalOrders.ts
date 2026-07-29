import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

/** Conditional order kinds (matches on-chain enum) */
export const COND_KIND = {
  TP_LONG: 0,
  SL_LONG: 1,
  TP_SHORT: 2,
  SL_SHORT: 3,
} as const;

/** Convert a decimal price string to chain E32 (10^32 fixed-point), all-BN, no f64. */
export function decimalToE32(s: string): BN {
  const trimmed = s.trim();
  if (!trimmed || trimmed === ".") return new BN(0);
  const [intPart, fracRaw = ""] = trimmed.split(".");
  // Pad / truncate fractional part to exactly 32 decimal places.
  const frac = (fracRaw + "0".repeat(32)).slice(0, 32);
  return new BN(intPart || "0")
    .mul(new BN(10).pow(new BN(32)))
    .add(new BN(frac || "0"));
}

export interface CreateConditionalOrderParams {
  kind: number; // 0=TP_long, 1=SL_long, 2=TP_short, 3=SL_short
  triggerPrice: string; // human-readable price (decimal string, exact conversion to E32)
  expiresAt?: number; // unix timestamp, 0 = no expiry
}

/** Flat keeper fee from CondOrderConfig (protocol-fixed, governance-set). */
export async function fetchKeeperFlatFee(program: any, programId: string): Promise<number | null> {
  try {
    const [cfgPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cond_order_cfg")],
      new PublicKey(programId),
    );
    const cfg = await (program as any).account.condOrderConfig.fetchNullable(cfgPda);
    return cfg ? (cfg.keeperRewardFlatUsdc as number) : null;
  } catch {
    return null;
  }
}

/**
 * Conditional orders (TP/SL) for PM perp positions.
 * Seeds: [b"cond_order", position, kind.to_le_bytes()]
 */
export function useConditionalOrders() {
  const { program, programId } = useAnchorProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const deriveOrderPda = useCallback(
    (position: PublicKey, kind: number, progId: PublicKey) => {
      const kindBuf = Buffer.from([kind]);
      return PublicKey.findProgramAddressSync(
        [Buffer.from("cond_order"), position.toBuffer(), kindBuf],
        progId,
      )[0];
    },
    [],
  );

  const createOrder = useCallback(async (params: CreateConditionalOrderParams) => {
    if (!program || !publicKey || !POOL_ADDRESS) {
      setError("Wallet not connected or pool not configured");
      return null;
    }
    setLoading(true);
    setError(null);
    setTxSig(null);
    try {
      const pool = POOL_ADDRESS;
      const progId = new PublicKey(programId);

      // Derive UserPortfolio PDA
      const [userPortfolio] = PublicKey.findProgramAddressSync(
        [Buffer.from("portfolio"), publicKey.toBuffer()],
        progId,
      );

      // Derive PortfolioPosition PDA
      const [position] = PublicKey.findProgramAddressSync(
        [Buffer.from("pm_position"), userPortfolio.toBuffer(), pool.toBuffer()],
        progId,
      );

      // Derive ConditionalOrder PDA
      const orderPda = deriveOrderPda(position, params.kind, progId);

      // Convert trigger price to chain E32 (10^32 decimal fixed-point, all-BN, no f64).
      const triggerPriceE32 = decimalToE32(params.triggerPrice);
      const expiresAt = params.expiresAt ?? 0;

      const tx = await (program.methods as any)
        .createConditionalOrder(params.kind, triggerPriceE32, expiresAt)
        .accounts({
          owner: publicKey,
          userPortfolio,
          position,
          pool,
          order: orderPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSig(tx);
      return tx;
    } catch (e: any) {
      setError(e.message ?? String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, programId, deriveOrderPda]);

  const cancelOrder = useCallback(async (kind: number) => {
    if (!program || !publicKey || !POOL_ADDRESS) {
      setError("Wallet not connected or pool not configured");
      return null;
    }
    setLoading(true);
    setError(null);
    setTxSig(null);
    try {
      const pool = POOL_ADDRESS;
      const progId = new PublicKey(programId);

      const [userPortfolio] = PublicKey.findProgramAddressSync(
        [Buffer.from("portfolio"), publicKey.toBuffer()],
        progId,
      );
      const [position] = PublicKey.findProgramAddressSync(
        [Buffer.from("pm_position"), userPortfolio.toBuffer(), pool.toBuffer()],
        progId,
      );
      const orderPda = deriveOrderPda(position, kind, progId);

      const tx = await (program.methods as any)
        .cancelConditionalOrder()
        .accounts({
          owner: publicKey,
          order: orderPda,
        })
        .rpc();

      setTxSig(tx);
      return tx;
    } catch (e: any) {
      setError(e.message ?? String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, programId, deriveOrderPda]);

  /** Read existing conditional orders for the current position */
  const fetchOrders = useCallback(async () => {
    if (!program || !publicKey || !POOL_ADDRESS) return [];
    const pool = POOL_ADDRESS;
    const progId = new PublicKey(programId);

    const [userPortfolio] = PublicKey.findProgramAddressSync(
      [Buffer.from("portfolio"), publicKey.toBuffer()],
      progId,
    );
    const [position] = PublicKey.findProgramAddressSync(
      [Buffer.from("pm_position"), userPortfolio.toBuffer(), pool.toBuffer()],
      progId,
    );

    const results: { kind: number; pda: PublicKey; data: any }[] = [];
    for (const kind of [0, 1, 2, 3]) {
      const orderPda = deriveOrderPda(position, kind, progId);
      const acc = await (program as any).account.conditionalOrder.fetchNullable(orderPda);
      if (acc) {
        results.push({ kind, pda: orderPda, data: acc });
      }
    }
    return results;
  }, [program, publicKey, programId, deriveOrderPda]);

  return { createOrder, cancelOrder, fetchOrders, loading, error, txSig };
}
