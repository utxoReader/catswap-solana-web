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

export interface CreateConditionalOrderParams {
  kind: number; // 0=TP_long, 1=SL_long, 2=TP_short, 3=SL_short
  triggerPrice: number; // human-readable price
  keeperFeeBps?: number; // default 10 = 0.1%
  expiresAt?: number; // unix timestamp, 0 = no expiry
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

      // Convert trigger price to E32 fixed-point
      const triggerPriceE32 = new BN(Math.floor(params.triggerPrice * Math.pow(2, 32)));
      const keeperFeeBps = params.keeperFeeBps ?? 10;
      const expiresAt = params.expiresAt ?? 0;

      const tx = await (program.methods as any)
        .createConditionalOrder(params.kind, triggerPriceE32, keeperFeeBps, expiresAt)
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
