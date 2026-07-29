import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import { deriveAggregate } from "../lib/pda";

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

export interface SwapParams {
  zeroForOne: boolean;
  amountIn: number;
  minOut: number;
  decimalsIn: number;
}

/**
 * Execute a spot swap via `swapExactIn`.
 * Returns the transaction signature or throws.
 */
export function useSwap() {
  const { program, programId } = useAnchorProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const swap = useCallback(async (params: SwapParams) => {
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

      // Fetch pool data for vaults + mints
      const poolData = (await (program as any).account.pool.fetch(pool)) as any;
      const token0Mint = poolData.token0Mint as PublicKey;
      const token1Mint = poolData.token1Mint as PublicKey;
      const token0Vault = poolData.token0Vault as PublicKey;
      const token1Vault = poolData.token1Vault as PublicKey;

      // Determine direction (token0=base, token1=quote/USDC)
      const inMint = params.zeroForOne ? token0Mint : token1Mint;
      const outMint = params.zeroForOne ? token1Mint : token0Mint;

      // Get the trader's token accounts
      const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
      const userIn = getAssociatedTokenAddressSync(inMint, publicKey);
      const userOut = getAssociatedTokenAddressSync(outMint, publicKey);

      // Derive aggregate PDA
      const aggPda = deriveAggregate(progId, pool);

      // Convert amounts to atoms
      const amountInAtoms = new BN(Math.floor(params.amountIn * Math.pow(10, params.decimalsIn)));
      const minOutAtoms = new BN(Math.floor(params.minOut * Math.pow(10, params.decimalsIn)));

      const tx = await (program.methods as any)
        .swapExactIn(params.zeroForOne, amountInAtoms, minOutAtoms)
        .accounts({
          trader: publicKey,
          pool,
          token0Vault,
          token1Vault,
          userIn,
          userOut,
          aggregate: aggPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts([])
        .rpc();

      setTxSig(tx);
      return tx;
    } catch (e: any) {
      setError(e.message ?? String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, programId]);

  return { swap, loading, error, txSig };
}
