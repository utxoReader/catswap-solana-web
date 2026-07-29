import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import {
  deriveAggregate,
  derivePerpPoolState,
  deriveUserAccount,
} from "../lib/pda";

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

export interface OpenPerpParams {
  isLong: boolean;
  marginIn: number; // USDC amount (human-readable)
  leverageX100: number; // e.g. 10 = 10x
}

export interface ClosePerpParams {
  isLong: boolean;
  size: number; // position size to close
}

/**
 * Open and close perp positions via `openPerp` / `closePerp`.
 * Uses internal ema2m price (oracle accounts passed as null).
 */
export function usePerp() {
  const { program, programId } = useAnchorProgram();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  const openPerp = useCallback(async (params: OpenPerpParams) => {
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
      const perpStatePda = derivePerpPoolState(progId, pool);
      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const aggPda = deriveAggregate(progId, pool);

      // Fetch pool for vault addresses
      const poolData = (await (program as any).account.pool.fetch(pool)) as any;
      const token1Vault = poolData.token1Vault as PublicKey;

      // Fetch PerpPoolState (needed for perpState account validation)
      await (program as any).account.perpPoolState.fetch(perpStatePda);

      // Fetch PerpMarketRisk to get shard + inventory
      const [marketRiskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("perp_risk"), pool.toBuffer()],
        progId,
      );
      const marketRiskData = (await (program as any).account.perpMarketRisk.fetchNullable(marketRiskPda)) as any;
      if (!marketRiskData) throw new Error("PerpMarketRisk not found");

      const shardId = marketRiskData.ifShardId as number;
      const shardIdBuf = Buffer.alloc(4);
      shardIdBuf.writeUInt32LE(shardId);
      const [shardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("if_shard"), shardIdBuf],
        progId,
      );

      // Convert amounts
      const marginAtoms = new BN(Math.floor(params.marginIn * 1e6)); // USDC E6
      const leverage = new BN(params.leverageX100);

      const tx = await (program.methods as any)
        .openPerp(params.isLong, marginAtoms, leverage)
        .accounts({
          owner: publicKey,
          pool,
          perpState: perpStatePda,
          userAccount: uaPda,
          userMargin: publicKey, // owner pays margin from their token account
          token1Vault,
          aggregate: aggPda,
          oracleConfig: null,
          oracleState: null,
          pythPriceUpdate: null,
          marketRisk: marketRiskPda,
          shard: shardPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          // Option accounts — pass null for direct-owner mode
          authority: null,
          session: null,
          marketMaturityState: null,
          marketMaturityConfig: null,
          referralConfig: null,
          referrerUserAccount: null,
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

  const closePerp = useCallback(async (params: ClosePerpParams) => {
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

      const perpStatePda = derivePerpPoolState(progId, pool);
      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const aggPda = deriveAggregate(progId, pool);

      // Fetch pool + perp state
      const poolData = (await (program as any).account.pool.fetch(pool)) as any;
      const token1Vault = poolData.token1Vault as PublicKey;

      const [marketRiskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("perp_risk"), pool.toBuffer()],
        progId,
      );
      const marketRiskData = (await (program as any).account.perpMarketRisk.fetchNullable(marketRiskPda)) as any;
      if (!marketRiskData) throw new Error("PerpMarketRisk not found");

      const shardId = marketRiskData.ifShardId as number;
      const shardIdBuf = Buffer.alloc(4);
      shardIdBuf.writeUInt32LE(shardId);
      const [shardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("if_shard"), shardIdBuf],
        progId,
      );

      // Get shard vault + inventory
      const shardData = (await (program as any).account.ifShard.fetchNullable(shardPda)) as any;
      if (!shardData) throw new Error("IfShard not found");
      const shardVault = shardData.vault as PublicKey;

      const [inventoryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("if_fee_inv", ), pool.toBuffer()],
        progId,
      );

      const sizeAtoms = new BN(Math.floor(params.size * 1e6));

      const tx = await (program.methods as any)
        .closePerp(params.isLong, sizeAtoms)
        .accounts({
          owner: publicKey,
          pool,
          perpState: perpStatePda,
          userAccount: uaPda,
          aggregate: aggPda,
          marketRisk: marketRiskPda,
          shard: shardPda,
          shardVault,
          inventory: inventoryPda,
          token1Vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          authority: null,
          session: null,
          referralConfig: null,
          referrerUserAccount: null,
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

  return { openPerp, closePerp, loading, error, txSig };
}
