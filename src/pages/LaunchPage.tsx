import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Check, X, Loader2, Minus, Rocket, Lock, Clock } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  fetchPoolExists,
  LAUNCH_QUOTE_SEED_USDC,
  LaunchPreflight,
  buildLaunchTransaction,
  ensureIfFeeInventory,
  fetchLaunchQuote,
  formatTokenAmount,
  getLaunchProgram,
  inspectLaunchMint,
  FeeInventoryStatus,
} from "../lib/launch";

type CheckState = "pass" | "fail" | "pending" | "unknown";

interface LaunchQuoteInfo {
  usdcMint: PublicKey;
  tokenProgram: PublicKey;
}

interface LaunchResult {
  signature: string;
  pool: PublicKey;
  launchState: PublicKey;
  launchUntil: number | null;
  feeInventory: FeeInventoryStatus | null;
}

const shortKey = (pk: PublicKey | null | undefined) =>
  pk ? `${pk.toBase58().slice(0, 4)}…${pk.toBase58().slice(-4)}` : "—";

function CheckRow({ state, label, detail }: { state: CheckState; label: string; detail?: string }) {
  const icon =
    state === "pass" ? (
      <Check className="w-4 h-4 text-[var(--color-buy)]" />
    ) : state === "fail" ? (
      <X className="w-4 h-4 text-[var(--color-sell)]" />
    ) : state === "pending" ? (
      <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
    ) : (
      <Minus className="w-4 h-4 text-[var(--text-tertiary)]" />
    );
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      </div>
      {detail && <span className="text-xs text-[var(--text-secondary)]">{detail}</span>}
    </div>
  );
}

export function LaunchPage() {
  usePageMeta("launch");
  const { t } = useLang();
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();

  const [mintInput, setMintInput] = useState("");
  const [mintError, setMintError] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<LaunchPreflight | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [quoteInfo, setQuoteInfo] = useState<LaunchQuoteInfo | null>(null);
  const [quoteError, setQuoteError] = useState(false);
  const [creatorBalance, setCreatorBalance] = useState<bigint | null>(null);
  const [quoteBalance, setQuoteBalance] = useState<bigint | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);

  // Registry quote (canonical USDC) — launch whitelist is pinned to it.
  useEffect(() => {
    let cancelled = false;
    setQuoteError(false);
    fetchLaunchQuote(connection)
      .then((info) => {
        if (!cancelled) setQuoteInfo(info);
      })
      .catch(() => {
        if (!cancelled) {
          setQuoteInfo(null);
          setQuoteError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [connection]);

  // Mint preflight inspection (debounced on input).
  useEffect(() => {
    setPreflight(null);
    setCreatorBalance(null);
    setMintError(null);
    const trimmed = mintInput.trim();
    if (!trimmed) return;
    let mint: PublicKey;
    try {
      mint = new PublicKey(trimmed);
    } catch {
      setMintError(t("launch.error.badAddress"));
      return;
    }
    let cancelled = false;
    setInspecting(true);
    const id = setTimeout(async () => {
      try {
        const pf = await inspectLaunchMint(connection, mint);
        if (cancelled) return;
        setPreflight(pf);
        if (connected && publicKey) {
          try {
            const ata = getAssociatedTokenAddressSync(mint, publicKey, false, pf.tokenProgram);
            const acc = await getAccount(connection, ata, "confirmed", pf.tokenProgram);
            if (!cancelled) setCreatorBalance(acc.amount);
          } catch {
            if (!cancelled) setCreatorBalance(null);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setPreflight(null);
          setMintError(
            e?.message === "mint_not_found"
              ? t("launch.error.mintNotFound")
              : e?.message === "not_a_token_mint"
                ? t("launch.error.notMint")
                : t("launch.error.rpc"),
          );
        }
      } finally {
        if (!cancelled) setInspecting(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setInspecting(false);
    };
  }, [mintInput, connection, connected, publicKey, t]);

  // Creator quote (USDC) balance — must be EXACTLY the dust seed on-chain.
  useEffect(() => {
    setQuoteBalance(null);
    if (!connected || !publicKey || !quoteInfo) return;
    let cancelled = false;
    const ata = getAssociatedTokenAddressSync(
      quoteInfo.usdcMint,
      publicKey,
      false,
      quoteInfo.tokenProgram,
    );
    getAccount(connection, ata, "confirmed", quoteInfo.tokenProgram)
      .then((acc) => {
        if (!cancelled) setQuoteBalance(acc.amount);
      })
      .catch(() => {
        if (!cancelled) setQuoteBalance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [connection, connected, publicKey, quoteInfo]);

  // Pool-existence check — duplicate pools must be refused (boss 10/07).
  const [poolExists, setPoolExists] = useState<boolean | null>(null);
  useEffect(() => {
    setPoolExists(null);
    if (!preflight || !quoteInfo) return;
    let cancelled = false;
    fetchPoolExists(connection, preflight.mint, quoteInfo.usdcMint)
      .then((exists) => {
        if (!cancelled) setPoolExists(exists);
      })
      .catch(() => {
        if (!cancelled) setPoolExists(null);
      });
    return () => {
      cancelled = true;
    };
  }, [connection, preflight, quoteInfo]);

  const checks = useMemo((): { state: CheckState; label: string; detail?: string }[] => {
    const pending: CheckState = inspecting ? "pending" : "unknown";
    return [
      {
        state:
          preflight && quoteInfo
            ? poolExists === null
              ? "pending"
              : poolExists
                ? "fail"
                : "pass"
            : pending,
        label: t("launch.check.poolNew"),
        detail:
          preflight && quoteInfo && poolExists ? t("launch.check.poolExists") : undefined,
      },
      {
        state: preflight ? (preflight.mintAuthorityRevoked ? "pass" : "fail") : pending,
        label: t("launch.check.mintAuthority"),
        detail: preflight
          ? preflight.mintAuthorityRevoked
            ? t("launch.check.revoked")
            : t("launch.check.alive")
          : undefined,
      },
      {
        state: preflight ? (preflight.freezeAuthorityRevoked ? "pass" : "fail") : pending,
        label: t("launch.check.freezeAuthority"),
        detail: preflight
          ? preflight.freezeAuthorityRevoked
            ? t("launch.check.revoked")
            : t("launch.check.alive")
          : undefined,
      },
      {
        state: preflight ? (preflight.taxOk ? "pass" : "fail") : pending,
        label: t("launch.check.tax"),
        detail: preflight ? preflight.taxDetail : undefined,
      },
      {
        state: quoteInfo ? "pass" : quoteError ? "fail" : "unknown",
        label: t("launch.check.quote"),
        detail: quoteInfo ? `USDC ${shortKey(quoteInfo.usdcMint)}` : undefined,
      },
      {
        state:
          preflight && quoteInfo
            ? preflight.tokenProgram.equals(quoteInfo.tokenProgram)
              ? "pass"
              : "fail"
            : pending,
        label: t("launch.check.family"),
        detail: preflight
          ? preflight.tokenProgram.toBase58() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
            ? "SPL"
            : "Token-2022"
          : undefined,
      },
      {
        state: !connected
          ? "unknown"
          : preflight && creatorBalance !== null
            ? creatorBalance === preflight.supply
              ? "pass"
              : "fail"
            : preflight
              ? "fail"
              : pending,
        label: t("launch.check.supply"),
        detail:
          preflight && connected
            ? creatorBalance !== null
              ? `${formatTokenAmount(creatorBalance, preflight.decimals)} / ${formatTokenAmount(preflight.supply, preflight.decimals)}`
              : t("launch.check.noBalance")
            : undefined,
      },
    ];
  }, [preflight, quoteInfo, quoteError, inspecting, connected, creatorBalance, poolExists, t]);

  const allChecksPass = checks.every((c) => c.state === "pass");
  const quoteSeedOk = quoteBalance !== null && quoteBalance === LAUNCH_QUOTE_SEED_USDC;
  const canLaunch = connected && allChecksPass && quoteSeedOk && !launching && !!preflight;

  const handleLaunch = useCallback(async () => {
    if (!preflight || !quoteInfo || !publicKey || !wallet.signTransaction) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      const program = getLaunchProgram(provider);
      const built = await buildLaunchTransaction(program, connection, {
        creator: publicKey,
        memeMint: preflight.mint,
        quoteMint: quoteInfo.usdcMint,
        tokenProgram: preflight.tokenProgram,
        supplySeed: preflight.supply,
        quoteSeed: LAUNCH_QUOTE_SEED_USDC,
      });
      const signature = await provider.sendAndConfirm(built.transaction, built.vaultKeypairs, {
        skipPreflight: false,
      });

      // Success evidence: protection window end from the launch-state PDA.
      let launchUntil: number | null = null;
      try {
        const ls = (await (program as any).account.poolLaunchState.fetchNullable(
          built.launchState,
        )) as any;
        if (ls?.launchUntil) launchUntil = Number(ls.launchUntil.toString());
      } catch {
        launchUntil = null;
      }

      // if_fee_inv self-heal: only fund.admin can init; surface the status.
      let feeInventory: FeeInventoryStatus | null = null;
      try {
        feeInventory = await ensureIfFeeInventory(program, built.pool);
      } catch {
        feeInventory = null;
      }

      setResult({ signature, pool: built.pool, launchState: built.launchState, launchUntil, feeInventory });
    } catch (e: any) {
      setLaunchError(e?.message ?? String(e));
    } finally {
      setLaunching(false);
    }
  }, [preflight, quoteInfo, publicKey, wallet, connection]);

  // ---- success state -------------------------------------------------------
  if (result) {
    const windowEnd = result.launchUntil
      ? new Date(result.launchUntil * 1000).toLocaleTimeString()
      : null;
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
              <Rocket className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {t("launch.success.title")}
            </h1>
          </div>

          <div className="space-y-3 mb-5">
            <div>
              <div className="text-xs text-[var(--text-secondary)] mb-1">
                {t("launch.success.pool")}
              </div>
              <div className="font-mono text-sm text-[var(--text-primary)] break-all">
                {result.pool.toBase58()}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)] mb-1">
                {t("launch.success.sig")}
              </div>
              <a
                className="font-mono text-sm text-[var(--text-primary)] underline break-all"
                href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                {result.signature}
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 rounded-md bg-[var(--bg-tertiary)] p-3">
              <Lock className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-secondary)]">{t("launch.success.lockNote")}</p>
            </div>
            <div className="flex gap-3 rounded-md bg-[var(--bg-tertiary)] p-3">
              <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-secondary)]">
                {t("launch.success.windowNote")}
                {windowEnd ? ` (${t("launch.success.windowEnd")} ${windowEnd})` : ""}
              </p>
            </div>
            {result.feeInventory?.kind === "needs_admin" && (
              <div className="rounded-md bg-[var(--bg-tertiary)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  {t("launch.success.feeInvPending")} ({shortKey(result.feeInventory.admin)})
                </p>
              </div>
            )}
            {(result.feeInventory?.kind === "initialized" ||
              result.feeInventory?.kind === "exists") && (
              <div className="rounded-md bg-[var(--bg-tertiary)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  {t("launch.success.feeInvReady")}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setResult(null);
              setMintInput("");
              setPreflight(null);
            }}
            className="mt-6 w-full h-10 rounded-lg bg-[var(--text-primary)] text-[var(--bg-secondary)] text-sm font-medium hover:opacity-90 transition-all"
          >
            {t("launch.success.again")}
          </button>
        </div>
      </div>
    );
  }

  // ---- form state ----------------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
            <Rocket className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">{t("launch.title")}</h1>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-6">{t("launch.subtitle")}</p>

        {/* Token mint input */}
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t("launch.mintLabel")}
        </label>
        <input
          value={mintInput}
          onChange={(e) => setMintInput(e.target.value)}
          placeholder={t("launch.mintPlaceholder")}
          spellCheck={false}
          className="w-full h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--text-tertiary)]"
        />
        {mintError && <p className="mt-1.5 text-xs text-[var(--color-sell)]">{mintError}</p>}

        {/* Supply (auto-filled after mint read) */}
        <div className="mt-4 flex items-center justify-between rounded-md bg-[var(--bg-tertiary)] px-3 py-2.5">
          <span className="text-sm text-[var(--text-secondary)]">{t("launch.supplyLabel")}</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {preflight ? formatTokenAmount(preflight.supply, preflight.decimals) : "—"}
          </span>
        </div>

        {/* Quote seed — fixed, not editable */}
        <div className="mt-3 flex items-center justify-between rounded-md bg-[var(--bg-tertiary)] px-3 py-2.5">
          <span className="text-sm text-[var(--text-secondary)]">{t("launch.quoteSeedLabel")}</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            0.01 USDC
            <span className="ml-2 text-xs text-[var(--text-tertiary)]">
              {t("launch.quoteSeedFixed")}
            </span>
          </span>
        </div>

        {/* Admission preflight checklist */}
        <div className="mt-5">
          <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {t("launch.checklistTitle")}
          </div>
          <div className="divide-y divide-[var(--border-primary)]">
            {checks.map((c) => (
              <CheckRow key={c.label} state={c.state} label={c.label} detail={c.detail} />
            ))}
          </div>
        </div>

        {/* Quote dust balance hint */}
        {connected && quoteInfo && (
          <p
            className={`mt-3 text-xs ${
              quoteSeedOk ? "text-[var(--text-secondary)]" : "text-[var(--color-sell)]"
            }`}
          >
            {t("launch.quoteBalance")}
            {": "}
            {quoteBalance !== null
              ? formatTokenAmount(quoteBalance, 6)
              : `0 (${t("launch.check.noBalance")})`}
            {" / 0.01 USDC — "}
            {t("launch.quoteBalanceExact")}
          </p>
        )}

        {launchError && (
          <p className="mt-3 text-xs text-[var(--color-sell)] break-all">{launchError}</p>
        )}

        {connected ? (
          <button
            onClick={handleLaunch}
            disabled={!canLaunch}
            className="mt-5 w-full h-10 rounded-lg bg-[var(--text-primary)] text-[var(--bg-secondary)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {launching && <Loader2 className="w-4 h-4 animate-spin" />}
            {launching ? t("launch.launching") : t("launch.button")}
          </button>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="mt-5 w-full h-10 rounded-lg bg-[var(--text-primary)] text-[var(--bg-secondary)] text-sm font-medium hover:opacity-90 transition-all"
          >
            {t("launch.connect")}
          </button>
        )}

        <p className="mt-4 text-xs text-[var(--text-tertiary)]">{t("launch.footer")}</p>
      </div>
    </div>
  );
}

export default LaunchPage;
