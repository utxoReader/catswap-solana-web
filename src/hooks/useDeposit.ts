import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import { deriveAggregate, deriveUserAccount } from "../lib/pda";

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

export interface DepositParams {
  amount0: number; // token0 amount (human-readable)
  amount1: number; // token1/USDC amount (human-readable)
  decimals0: number; // typically 8
  decimals1: number; // typically 6
}

/**
 * Deposit and withdraw tokens to/from the UserAccount.
 * Auto-creates UserAccount PDA on first deposit if it doesn't exist.
 */
export function useDeposit() {
  const { program, programId } = useAnchorProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const deposit = useCallback(async (params: DepositParams) => {
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

      // Derive PDAs
      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const aggPda = deriveAggregate(progId, pool);

      // Fetch pool for vault + mint info
      const poolData = (await (program as any).account.pool.fetch(pool)) as any;
      const token0Mint = poolData.token0Mint as PublicKey;
      const token1Mint = poolData.token1Mint as PublicKey;
      const token0Vault = poolData.token0Vault as PublicKey;
      const token1Vault = poolData.token1Vault as PublicKey;

      // Trader token accounts
      const userToken0 = getAssociatedTokenAddressSync(token0Mint, publicKey);
      const userToken1 = getAssociatedTokenAddressSync(token1Mint, publicKey);

      // Check if UserAccount exists; init if not
      const existingUa = await (program as any).account.userAccount.fetchNullable(uaPda);
      if (!existingUa) {
        const initTx = await (program.methods as any)
          .initUserAccount()
          .accounts({
            owner: publicKey,
            pool,
            userAccount: uaPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        setTxSig(initTx);
      }

      // Convert amounts to atoms
      const amount0Atoms = new BN(Math.floor(params.amount0 * Math.pow(10, params.decimals0)));
      const amount1Atoms = new BN(Math.floor(params.amount1 * Math.pow(10, params.decimals1)));

      const tx = await (program.methods as any)
        .deposit(amount0Atoms, amount1Atoms)
        .accounts({
          owner: publicKey,
          pool,
          userToken0,
          userToken1,
          token0Vault,
          token1Vault,
          userAccount: uaPda,
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
  }, [program, publicKey, programId]);

  const withdraw = useCallback(async (params: DepositParams) => {
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

      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const aggPda = deriveAggregate(progId, pool);

      const poolData = (await (program as any).account.pool.fetch(pool)) as any;
      const token0Mint = poolData.token0Mint as PublicKey;
      const token1Mint = poolData.token1Mint as PublicKey;
      const token0Vault = poolData.token0Vault as PublicKey;
      const token1Vault = poolData.token1Vault as PublicKey;

      const userToken0 = getAssociatedTokenAddressSync(token0Mint, publicKey);
      const userToken1 = getAssociatedTokenAddressSync(token1Mint, publicKey);

      const amount0Atoms = new BN(Math.floor(params.amount0 * Math.pow(10, params.decimals0)));
      const amount1Atoms = new BN(Math.floor(params.amount1 * Math.pow(10, params.decimals1)));

      const tx = await (program.methods as any)
        .withdraw(amount0Atoms, amount1Atoms)
        .accounts({
          owner: publicKey,
          pool,
          userToken0,
          userToken1,
          token0Vault,
          token1Vault,
          userAccount: uaPda,
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
  }, [program, publicKey, programId]);

  return { deposit, withdraw, loading, error, txSig };
}
