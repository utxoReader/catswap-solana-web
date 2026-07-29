import { useCallback, useEffect, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { useAnchorProgram } from "../hooks/useAnchorProgram";
import { deriveUserAccount, deriveReferralConfig, deriveAggregate, deriveRegistry } from "../lib/pda";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "./ui";

// Pool address — set via env or override at deploy time
const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

interface ReferralPageProps {
  connected: boolean;
}

export const ReferralPage: React.FC<ReferralPageProps> = ({ connected }) => {
  const { program, programId } = useAnchorProgram();
  const { publicKey } = useWallet();

  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Account data
  const [referrer, setReferrer] = useState<string | null>(null);
  const [accruedUsdc, setAccruedUsdc] = useState<number>(0);
  const [discountAccrued, setDiscountAccrued] = useState<number>(0);
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [referralBps, setReferralBps] = useState(0);
  const [discountBps, setDiscountBps] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [referrerInput, setReferrerInput] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [adminReferralBps, setAdminReferralBps] = useState("0");
  const [adminDiscountBps, setAdminDiscountBps] = useState("0");
  const [adminEnabled, setAdminEnabled] = useState(false);

  const pool = POOL_ADDRESS;
  const progId = new PublicKey(programId);

  // Load on-chain data
  const refreshData = useCallback(async () => {
    if (!program || !pool || !publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const rcPda = deriveReferralConfig(progId, pool);

      const accounts = (program as any).account;
      const registryPda = deriveRegistry(progId);

      const [ua, rc, registry] = await Promise.all([
        accounts.userAccount.fetchNullable(uaPda),
        accounts.referralConfig.fetchNullable(rcPda),
        accounts.poolRegistry.fetchNullable(registryPda),
      ]);

      // Check if connected wallet is the registry admin
      if (registry) {
        setIsAdmin((registry as any).admin?.equals(publicKey) ?? false);
      } else {
        setIsAdmin(false);
      }

      if (ua) {
        const uaData = ua as any;
        const refPubkey = uaData.referrer as PublicKey;
        setReferrer(refPubkey.equals(PublicKey.default) ? null : refPubkey.toBase58());
        const accrued = uaData.referralAccruedUsdc as BN;
        const discount = uaData.referralDiscountAccruedUsdc as BN;
        setAccruedUsdc(accrued.toNumber() / 1e6);
        setDiscountAccrued(discount.toNumber() / 1e6);
      } else {
        setReferrer(null);
        setAccruedUsdc(0);
        setDiscountAccrued(0);
      }

      if (rc) {
        const rcData = rc as any;
        setReferralEnabled(rcData.enabled as boolean);
        setReferralBps((rcData.referralBps as number) ?? 0);
        setDiscountBps((rcData.refereeDiscountBps as number) ?? 0);
        setAdminReferralBps(String(rcData.referralBps ?? 0));
        setAdminDiscountBps(String(rcData.refereeDiscountBps ?? 0));
        setAdminEnabled(rcData.enabled as boolean);
      }
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [program, pool, publicKey, progId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Actions
  const handleBind = async () => {
    if (!program || !pool || !publicKey) return;
    setError(null);
    setTxSig(null);
    setLoading(true);
    try {
      const referrerPk = new PublicKey(referrerInput.trim());
      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const referrerUaPda = deriveUserAccount(progId, pool, referrerPk);

      // P2 fix: pre-check referrer UserAccount exists (bindReferrer loads it
      // as a required account; if the referrer never interacted with this
      // pool, the on-chain instruction fails with AccountNotInitialized).
      const referrerUa = await (program as any).account.userAccount.fetchNullable(referrerUaPda);
      if (!referrerUa) {
        setError(
          "该地址在本池还没有账户。请对方先完成任意一笔交互（存款/swap）后再绑定。",
        );
        return;
      }

      const tx = await program.methods
        .bindReferrer()
        .accounts({
          owner: publicKey,
          pool,
          userAccount: uaPda,
          referrerUserAccount: referrerUaPda,
          referrer: referrerPk,
        })
        .rpc();
      setTxSig(tx);
      setReferrerInput("");
      await refreshData();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!program || !pool || !publicKey) return;
    setError(null);
    setTxSig(null);
    setLoading(true);
    try {
      const amount = parseFloat(claimAmount);
      if (isNaN(amount) || amount <= 0) {
        setError("Invalid claim amount");
        return;
      }
      const usdcAtoms = new BN(Math.floor(amount * 1e6));

      const uaPda = deriveUserAccount(progId, pool, publicKey);
      const aggPda = deriveAggregate(progId, pool);

      // Fetch pool for vault + mint info
      const poolData = (await (program as any).account.pool.fetch(pool)) as any;
      const token1Vault = poolData.token1Vault as PublicKey;
      const token1Mint = poolData.token1Mint as PublicKey;
      const referrerToken1 = getAssociatedTokenAddressSync(token1Mint, publicKey);

      const tx = await program.methods
        .claimReferralEarnings(usdcAtoms)
        .accounts({
          referrer: publicKey,
          pool,
          userAccount: uaPda,
          aggregate: aggPda,
          token1Vault,
          referrerToken1,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      setTxSig(tx);
      setClaimAmount("");
      await refreshData();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleInitConfig = async () => {
    if (!program || !pool || !publicKey) return;
    setError(null);
    setTxSig(null);
    setLoading(true);
    try {
      const registryPda = deriveRegistry(progId);
      const rcPda = deriveReferralConfig(progId, pool);
      const tx = await program.methods
        .initReferralConfig()
        .accounts({
          admin: publicKey,
          registry: registryPda,
          pool,
          referralConfig: rcPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setTxSig(tx);
      await refreshData();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!program || !pool || !publicKey) return;
    setError(null);
    setTxSig(null);
    setLoading(true);
    try {
      const registryPda = deriveRegistry(progId);
      const rcPda = deriveReferralConfig(progId, pool);
      const rb = parseInt(adminReferralBps) || 0;
      const db = parseInt(adminDiscountBps) || 0;
      if (rb + db > 1000) {
        setError("referral_bps + discount_bps must be <= 1000");
        return;
      }
      const tx = await program.methods
        .updateReferralConfig(rb, db, adminEnabled)
        .accounts({
          admin: publicKey,
          registry: registryPda,
          pool,
          referralConfig: rcPda,
        })
        .rpc();
      setTxSig(tx);
      await refreshData();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              Connect your wallet to use the referral program.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-[var(--text-secondary)] text-sm">
              Pool address not configured. Set{" "}
              <code className="text-[var(--okx-primary)]">VITE_POOL_ADDRESS</code>{" "}
              in your environment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      {/* Status messages */}
      {txSig && (
        <div className="rounded-md bg-[var(--success)]/10 border border-[var(--success)]/30 px-4 py-3 text-sm text-[var(--success)]">
          Transaction confirmed:{" "}
          <a
            href={`https://solscan.io/tx/${txSig}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {txSig.slice(0, 8)}...{txSig.slice(-4)}
          </a>
        </div>
      )}
      {error && (
        <div className="rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Referrer binding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referrer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {referrer ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Bound referrer</p>
                <p className="text-sm font-mono text-[var(--text-primary)]">
                  {referrer.slice(0, 4)}...{referrer.slice(-4)}
                </p>
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">Immutable</span>
            </div>
          ) : (
            <>
              <Input
                label="Referrer wallet address"
                placeholder="Enter referrer's Solana address"
                value={referrerInput}
                onChange={(e) => setReferrerInput(e.target.value)}
                helperText="Bind once — cannot be changed afterwards."
              />
              <Button
                onClick={handleBind}
                disabled={loading || !referrerInput.trim()}
                className="w-full"
              >
                {loading ? "Binding..." : "Bind Referrer"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referral Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Accrued commission</p>
              <p className="text-lg font-semibold text-[var(--success)]">
                {accruedUsdc.toFixed(4)} USDC
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Discount received</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {discountAccrued.toFixed(4)} USDC
              </p>
            </div>
          </div>

          {accruedUsdc > 0 && (
            <>
              <Input
                label="Claim amount (USDC)"
                type="number"
                placeholder={accruedUsdc.toFixed(4)}
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setClaimAmount(accruedUsdc.toFixed(4))}
                  className="flex-1"
                >
                  Max
                </Button>
                <Button
                  onClick={handleClaim}
                  disabled={loading || !claimAmount}
                  className="flex-[2]"
                >
                  {loading ? "Claiming..." : "Claim"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Current config display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pool Referral Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Status</p>
              <p className={referralEnabled ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"}>
                {referralEnabled ? "Active" : "Inactive"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Commission</p>
              <p className="text-[var(--text-primary)]">{(referralBps / 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Discount</p>
              <p className="text-[var(--text-primary)]">{(discountBps / 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin panel (only visible to registry admin) */}
      {isAdmin && (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin: Referral Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Commission rate (bps)"
              type="number"
              value={adminReferralBps}
              onChange={(e) => setAdminReferralBps(e.target.value)}
              helperText="0–1000 (= 0–10%)"
            />
            <Input
              label="Discount rate (bps)"
              type="number"
              value={adminDiscountBps}
              onChange={(e) => setAdminDiscountBps(e.target.value)}
              helperText="0–1000 (= 0–10%)"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={adminEnabled}
              onChange={(e) => setAdminEnabled(e.target.checked)}
              className="w-4 h-4 accent-[var(--okx-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">Enabled</span>
          </label>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleInitConfig}
              disabled={loading}
              className="flex-1"
            >
              Init Config
            </Button>
            <Button
              onClick={handleUpdateConfig}
              disabled={loading}
              className="flex-[2]"
            >
              {loading ? "Updating..." : "Update Config"}
            </Button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            Constraint: referral_bps + discount_bps ≤ 1000. Only the registry admin can call these.
          </p>
        </CardContent>
      </Card>
      )}
    </div>
  );
};
