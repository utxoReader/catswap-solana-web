import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "./useAnchorProgram";
import { deriveUserAccount } from "../lib/pda";

/**
 * Reads the on-chain UserAccount PDA for the connected wallet.
 * Returns null when not connected or the account doesn't exist.
 */
export interface UserAccountData {
  pool: PublicKey;
  owner: PublicKey;
  balance0: BN;
  balance1: BN;
  margin: BN;
  referrer: PublicKey;
  referralAccruedUsdc: BN;
  referralDiscountAccruedUsdc: BN;
  perp?: { size: BN; side: number } | null;
}

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

export function useUserAccount() {
  const { program, programId } = useAnchorProgram();
  const { publicKey } = useWallet();
  const [userAccount, setUserAccount] = useState<UserAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pool = POOL_ADDRESS;
  const progId = new PublicKey(programId);

  const refresh = useCallback(async () => {
    if (!program || !pool || !publicKey) {
      setUserAccount(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const acc = (await (program as any).account.userAccount.fetchNullable(uaPda)) as any;
      if (!acc) {
        setUserAccount(null);
        return;
      }
      setUserAccount({
        pool: acc.pool as PublicKey,
        owner: acc.owner as PublicKey,
        balance0: new BN(acc.balance0.toString()),
        balance1: new BN(acc.balance1.toString()),
        margin: new BN(acc.margin.toString()),
        referrer: acc.referrer as PublicKey,
        referralAccruedUsdc: new BN(acc.referralAccruedUsdc.toString()),
        referralDiscountAccruedUsdc: new BN(acc.referralDiscountAccruedUsdc.toString()),
      });
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [program, pool, publicKey, progId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { userAccount, loading, error, refresh };
}
