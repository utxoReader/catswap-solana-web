import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import { deriveAggregate } from "../lib/pda";

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

export interface MintLiquidityParams {
  delta0: number; // token0 amount
  delta1: number; // token1/USDC amount
  decimals0: number;
  decimals1: number;
}

/**
 * LP operations: mint liquidity, burn liquidity, claim LP fees.
 */
export function useLiquidity() {
  const { program, programId } = useAnchorProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const fetchPoolAndLpInfo = useCallback(async () => {
    if (!program || !publicKey || !POOL_ADDRESS) return null;
    const pool = POOL_ADDRESS;
    const progId = new PublicKey(programId);

    const poolData = (await (program as any).account.pool.fetch(pool)) as any;
    const token0Mint = poolData.token0Mint as PublicKey;
    const token1Mint = poolData.token1Mint as PublicKey;
    const token0Vault = poolData.token0Vault as PublicKey;
    const token1Vault = poolData.token1Vault as PublicKey;

    const userToken0 = getAssociatedTokenAddressSync(token0Mint, publicKey);
    const userToken1 = getAssociatedTokenAddressSync(token1Mint, publicKey);

    // LP position PDA: seeds = [b"lp", pool, owner]
    const [lpPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), pool.toBuffer(), publicKey.toBuffer()],
      progId,
    );

    // MarketMaturity (optional — pass null if not enabled)
    let maturityState: PublicKey | null = null;
    let maturityConfig: PublicKey | null = null;
    try {
      const [msPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mat_state"), pool.toBuffer()],
        progId,
      );
      const msAcc = await (program as any).account.marketMaturityState.fetchNullable(msPda);
      if (msAcc) {
        maturityState = msPda;
        const [mcPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("mat_cfg"), pool.toBuffer()],
          progId,
        );
        maturityConfig = mcPda;
      }
    } catch {
      // Maturity not enabled — leave null
    }

    return { pool, token0Vault, token1Vault, userToken0, userToken1, lpPosition, maturityState, maturityConfig };
  }, [program, publicKey, programId]);

  const mintLiquidity = useCallback(async (params: MintLiquidityParams) => {
    if (!program || !publicKey || !POOL_ADDRESS) {
      setError("Wallet not connected or pool not configured");
      return null;
    }
    setLoading(true);
    setError(null);
    setTxSig(null);
    try {
      const info = await fetchPoolAndLpInfo();
      if (!info) throw new Error("Failed to fetch pool info");

      const delta0 = new BN(Math.floor(params.delta0 * Math.pow(10, params.decimals0)));
      const delta1 = new BN(Math.floor(params.delta1 * Math.pow(10, params.decimals1)));

      const accounts: Record<string, any> = {
        owner: publicKey,
        pool: info.pool,
        token0Vault: info.token0Vault,
        token1Vault: info.token1Vault,
        userToken0: info.userToken0,
        userToken1: info.userToken1,
        lpPosition: info.lpPosition,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        marketMaturityState: info.maturityState,
        marketMaturityConfig: info.maturityConfig,
      };

      const tx = await (program.methods as any)
        .mintLiquidity(delta0, delta1)
        .accounts(accounts)
        .rpc();

      setTxSig(tx);
      return tx;
    } catch (e: any) {
      setError(e.message ?? String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, fetchPoolAndLpInfo]);

  const burnLiquidity = useCallback(async (share: number) => {
    if (!program || !publicKey || !POOL_ADDRESS) {
      setError("Wallet not connected or pool not configured");
      return null;
    }
    setLoading(true);
    setError(null);
    setTxSig(null);
    try {
      const info = await fetchPoolAndLpInfo();
      if (!info) throw new Error("Failed to fetch pool info");

      const shareBn = new BN(Math.floor(share));

      const accounts: Record<string, any> = {
        owner: publicKey,
        pool: info.pool,
        token0Vault: info.token0Vault,
        token1Vault: info.token1Vault,
        userToken0: info.userToken0,
        userToken1: info.userToken1,
        lpPosition: info.lpPosition,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        marketMaturityState: info.maturityState,
        marketMaturityConfig: info.maturityConfig,
      };

      const tx = await (program.methods as any)
        .burnLiquidity(shareBn)
        .accounts(accounts)
        .rpc();

      setTxSig(tx);
      return tx;
    } catch (e: any) {
      setError(e.message ?? String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, fetchPoolAndLpInfo]);

  const claimLpFees = useCallback(async () => {
    if (!program || !publicKey || !POOL_ADDRESS) {
      setError("Wallet not connected or pool not configured");
      return null;
    }
    setLoading(true);
    setError(null);
    setTxSig(null);
    try {
      const info = await fetchPoolAndLpInfo();
      if (!info) throw new Error("Failed to fetch pool info");

      const aggPda = deriveAggregate(new PublicKey(programId), info.pool);

      const tx = await (program.methods as any)
        .claimLpFees()
        .accounts({
          owner: publicKey,
          pool: info.pool,
          token0Vault: info.token0Vault,
          token1Vault: info.token1Vault,
          userToken0: info.userToken0,
          userToken1: info.userToken1,
          lpPosition: info.lpPosition,
          aggregate: aggPda,
          tokenProgram: TOKEN_PROGRAM_ID,
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
  }, [program, publicKey, fetchPoolAndLpInfo, programId]);

  return { mintLiquidity, burnLiquidity, claimLpFees, loading, error, txSig };
}
