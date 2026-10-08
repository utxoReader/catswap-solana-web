/**
 * #238 (W2) meme launch — client-side builders for the atomic launch trio.
 *
 * Mirrors programs/catswap/src/instructions/launch.rs:
 *   1. launchPool          — admission + pool + full-supply seed + genesis LP
 *                            born permanent_lock=true
 *   2. launchPoolMaturity  — Track M template init (launch_maturity_template)
 *   3. launchPoolState     — meme label + protection window + seed audit
 * All three go in ONE transaction (same atomicity: any failure reverts all).
 *
 * The vendored src/idl/catswap.json predates #238, so the three launch
 * instructions are appended as a legacy-format fragment at runtime; the
 * shared IDL file stays untouched. Account order below matches the Rust
 * `#[derive(Accounts)]` struct field order exactly.
 */
import { AnchorProvider, BN, Idl, Program } from "@coral-xyz/anchor";
import {
  ACCOUNT_SIZE,
  createInitializeAccountInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  getTransferFeeConfig,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import idl from "../idl/catswap.json";
import { derivePool, deriveRegistry, resolveProgramId } from "./pda";

// ---------------------------------------------------------------------------
// On-chain constants (launch.rs / pool_launch.rs — do not "improve")
// ---------------------------------------------------------------------------

/** Unified launch quote seed: 0.01 USDC (6dp) — LAUNCH_QUOTE_SEED_USDC. */
export const LAUNCH_QUOTE_SEED_USDC = 10_000n;
/** Protection window — LAUNCH_PROTECTION_SECS (r3 §5 candidate 600s). */
export const LAUNCH_PROTECTION_SECS = 600;
/** Tax admission cap — LAUNCH_TAX_CAP_BPS (≤1%, hardcoded, no governance). */
export const LAUNCH_TAX_CAP_BPS = 100;
/** CU limit used by tests/launch-pool.ts for the trio transaction. */
export const LAUNCH_CU_LIMIT = 1_400_000;

export const LAUNCH_STATE_SEED = Buffer.from("pool_launch");
export const LAUNCH_BUCKET_SEED = Buffer.from("launch_bucket");
export const LP_SEED = Buffer.from("lp");
export const MAT_CFG_SEED = Buffer.from("mat_cfg");
export const MAT_STATE_SEED = Buffer.from("mat_state");
export const IF_FEE_INV_SEED = Buffer.from("if_fee_inv");
export const INSURANCE_FUND_SEED = Buffer.from("insurance_fund");

// ---------------------------------------------------------------------------
// PDAs (launch-specific; shared ones live in ./pda)
// ---------------------------------------------------------------------------

export function deriveLpPosition(
  programId: PublicKey,
  pool: PublicKey,
  creator: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [LP_SEED, pool.toBuffer(), creator.toBuffer()],
    programId,
  )[0];
}

export function deriveMaturityConfig(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([MAT_CFG_SEED, pool.toBuffer()], programId)[0];
}

export function deriveMaturityState(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([MAT_STATE_SEED, pool.toBuffer()], programId)[0];
}

export function derivePoolLaunchState(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([LAUNCH_STATE_SEED, pool.toBuffer()], programId)[0];
}

export function deriveLaunchBucket(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([LAUNCH_BUCKET_SEED, pool.toBuffer()], programId)[0];
}

export function deriveIfFeeInventory(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([IF_FEE_INV_SEED, pool.toBuffer()], programId)[0];
}

export function deriveInsuranceFund(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([INSURANCE_FUND_SEED], programId)[0];
}

// ---------------------------------------------------------------------------
// Runtime-merged IDL (legacy format, same shape as the vendored file)
// ---------------------------------------------------------------------------

const LAUNCH_IDL_FRAGMENT = {
  instructions: [
    {
      name: "launchPool",
      docs: [
        "#238 (W2): permissionless, atomic meme launch — admission (authorities",
        "renounced, frozen-low tax, whitelisted quote), pool creation,",
        "full-supply seed at the unified price (quote dust / supply), genesis",
        "LP born permanently locked.",
      ],
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "pool", isMut: true, isSigner: false },
        { name: "token0Mint", isMut: false, isSigner: false },
        { name: "token1Mint", isMut: false, isSigner: false },
        { name: "token0Vault", isMut: true, isSigner: false },
        { name: "token1Vault", isMut: true, isSigner: false },
        { name: "creatorToken0", isMut: true, isSigner: false },
        { name: "creatorToken1", isMut: true, isSigner: false },
        { name: "lpPosition", isMut: true, isSigner: false },
        { name: "registry", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "launchPoolMaturity",
      docs: [
        "#238 (W2): instruction 2 of the atomic launch trio — Track M template",
        "init. Same transaction as launchPool (SBF frame ceiling ~2 inits/ix).",
      ],
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "pool", isMut: true, isSigner: false },
        { name: "maturityConfig", isMut: true, isSigner: false },
        { name: "maturityState", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "launchPoolState",
      docs: [
        "#238 (W2): instruction 3 of the atomic launch trio — PoolLaunchState",
        "(meme label, protection window, seed audit) + LaunchBucket (empty).",
      ],
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "pool", isMut: false, isSigner: false },
        { name: "launchState", isMut: true, isSigner: false },
        { name: "launchBucket", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "supplySeed", type: "u64" },
        { name: "quoteSeed", type: "u64" },
      ],
    },
  ],
  accounts: [
    {
      name: "PoolLaunchState",
      docs: [
        "#238 (W2): per-pool launch state — meme label + protection window.",
        "Seeds [b\"pool_launch\", pool]. Absent = standard pool.",
      ],
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "publicKey" },
          { name: "bump", type: "u8" },
          { name: "label", type: "u8" },
          { name: "launchUntil", type: "i64" },
          { name: "creator", type: "publicKey" },
          { name: "supplySeed", type: "u64" },
          { name: "quoteSeed", type: "u64" },
          { name: "reserved", type: { array: ["u8", 64] } },
        ],
      },
    },
  ],
};

const fragmentInstructionNames = new Set(LAUNCH_IDL_FRAGMENT.instructions.map((i) => i.name));
const fragmentAccountNames = new Set(LAUNCH_IDL_FRAGMENT.accounts.map((a) => a.name));

/**
 * Launch IDL: the vendored IDL is now the fresh build (contains the #238
 * launch instructions natively). The legacy fragment merge is kept ONLY as a
 * fallback for older vendored files that lack them.
 */
const baseHasLaunch = ((idl as any).instructions ?? []).some((i: any) => i.name === "launchPool");
export const LAUNCH_IDL = baseHasLaunch
  ? (idl as any)
  : {
  ...(idl as any),
  instructions: [
    ...(idl as any).instructions.filter((i: any) => !fragmentInstructionNames.has(i.name)),
    ...LAUNCH_IDL_FRAGMENT.instructions,
  ],
  accounts: [
    ...((idl as any).accounts ?? []).filter((a: any) => !fragmentAccountNames.has(a.name)),
    ...LAUNCH_IDL_FRAGMENT.accounts,
  ],
};

export function getLaunchProgram(provider: AnchorProvider): Program {
  // The vendored IDL's program address is stale — always resolve the active
  // program id (VITE_PROGRAM_ID) explicitly instead of trusting the IDL.
  const resolved = {
    ...(LAUNCH_IDL as any),
    metadata: { ...(LAUNCH_IDL as any).metadata, address: resolveProgramId().toBase58() },
  };
  return new Program(resolved as unknown as Idl, resolveProgramId(), provider);
}

/** Fetch-only program (registry / launch-state reads need no signer). */
const READONLY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async (tx: any) => tx,
  signAllTransactions: async (txs: any[]) => txs,
};

export function getReadonlyLaunchProgram(connection: Connection): Program {
  const provider = new AnchorProvider(connection, READONLY_WALLET as any, {
    commitment: "confirmed",
  });
  return getLaunchProgram(provider);
}

// ---------------------------------------------------------------------------
// Admission preflight — client mirror of launch_admission.rs (A1–A5)
// ---------------------------------------------------------------------------

export interface LaunchPreflight {
  mint: PublicKey;
  /** Owning token program (classic SPL or Token-2022). */
  tokenProgram: PublicKey;
  decimals: number;
  /** Raw mint supply (atoms). */
  supply: bigint;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  /** A3: no TransferFeeConfig, or max(newer, older) ≤ cap with authority None. */
  taxOk: boolean;
  /** Human-readable tax state for the checklist row. */
  taxDetail: string;
}

export async function inspectLaunchMint(
  connection: Connection,
  mint: PublicKey,
): Promise<LaunchPreflight> {
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error("mint_not_found");
  const tokenProgram = info.owner;
  if (!tokenProgram.equals(TOKEN_PROGRAM_ID) && !tokenProgram.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new Error("not_a_token_mint");
  }
  const mintData = await getMint(connection, mint, "confirmed", tokenProgram);

  let taxOk = true;
  let taxDetail = "none";
  if (tokenProgram.equals(TOKEN_2022_PROGRAM_ID)) {
    const cfg = getTransferFeeConfig(mintData);
    if (cfg) {
      const bps = Math.max(
        cfg.newerTransferFee.transferFeeBasisPoints,
        cfg.olderTransferFee.transferFeeBasisPoints,
      );
      const authorityNone = cfg.transferFeeConfigAuthority === null;
      taxOk = authorityNone && bps <= LAUNCH_TAX_CAP_BPS;
      taxDetail = `${(bps / 100).toFixed(2)}%${authorityNone ? "" : " (authority alive)"}`;
    }
  }

  return {
    mint,
    tokenProgram,
    decimals: mintData.decimals,
    supply: mintData.supply,
    mintAuthorityRevoked: mintData.mintAuthority === null,
    freezeAuthorityRevoked: mintData.freezeAuthority === null,
    taxOk,
    taxDetail,
  };
}

/**
 * Pool-existence check (boss 10/07: New Pool must judge duplicates).
 * true = a pool for this meme+quote pair already exists on-chain.
 */
export async function fetchPoolExists(
  connection: Connection,
  memeMint: PublicKey,
  quoteMint: PublicKey,
): Promise<boolean> {
  const [pool] = derivePool(resolveProgramId(), memeMint, quoteMint);
  const info = await connection.getAccountInfo(pool, "confirmed");
  return info !== null;
}

/** Registry read: canonical USDC mint (launch quote whitelist, r3 §3.4). */
export async function fetchLaunchQuote(
  connection: Connection,
): Promise<{ usdcMint: PublicKey; tokenProgram: PublicKey }> {
  const program = getReadonlyLaunchProgram(connection) as any;
  const registryPda = deriveRegistry(resolveProgramId());
  const registry = await program.account.poolRegistry.fetchNullable(registryPda);
  if (!registry) throw new Error("registry_not_found");
  const usdcMint = registry.usdcMint as PublicKey;
  const info = await connection.getAccountInfo(usdcMint, "confirmed");
  if (!info) throw new Error("quote_mint_not_found");
  return { usdcMint, tokenProgram: info.owner };
}

// ---------------------------------------------------------------------------
// Atomic launch trio builder
// ---------------------------------------------------------------------------

export interface BuildLaunchTxParams {
  creator: PublicKey;
  memeMint: PublicKey;
  quoteMint: PublicKey;
  /** Token program of the meme mint (== quote's, enforced on-chain). */
  tokenProgram: PublicKey;
  /** Raw full supply (must equal mint.supply). */
  supplySeed: bigint;
  /** Raw quote dust (LAUNCH_QUOTE_SEED_USDC for USDC quotes). */
  quoteSeed: bigint;
}

export interface BuildLaunchTxResult {
  transaction: Transaction;
  /** Freshly generated vault keypairs — must sign the transaction. */
  vaultKeypairs: Keypair[];
  pool: PublicKey;
  launchState: PublicKey;
  creatorToken0: PublicKey;
  creatorToken1: PublicKey;
}

/**
 * One transaction: CU budget + create/init both vaults (client pre-created,
 * owner = pool PDA, same contract as initialize_pool) + the launch trio.
 */
export async function buildLaunchTransaction(
  program: Program,
  connection: Connection,
  params: BuildLaunchTxParams,
): Promise<BuildLaunchTxResult> {
  const programId = program.programId;
  const { creator, memeMint, quoteMint, tokenProgram, supplySeed, quoteSeed } = params;

  const [pool] = derivePool(programId, memeMint, quoteMint);
  const lpPosition = deriveLpPosition(programId, pool, creator);
  const maturityConfig = deriveMaturityConfig(programId, pool);
  const maturityState = deriveMaturityState(programId, pool);
  const launchState = derivePoolLaunchState(programId, pool);
  const launchBucket = deriveLaunchBucket(programId, pool);
  const registry = deriveRegistry(programId);

  const creatorToken0 = getAssociatedTokenAddressSync(memeMint, creator, false, tokenProgram);
  const creatorToken1 = getAssociatedTokenAddressSync(quoteMint, creator, false, tokenProgram);

  const vault0 = Keypair.generate();
  const vault1 = Keypair.generate();
  const rent = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);

  const methods = program.methods as any;
  const launchPoolIx = await methods
    .launchPool()
    .accounts({
      creator,
      pool,
      token0Mint: memeMint,
      token1Mint: quoteMint,
      token0Vault: vault0.publicKey,
      token1Vault: vault1.publicKey,
      creatorToken0,
      creatorToken1,
      lpPosition,
      registry,
      tokenProgram,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  const maturityIx = await methods
    .launchPoolMaturity()
    .accounts({
      creator,
      pool,
      maturityConfig,
      maturityState,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  const stateIx = await methods
    .launchPoolState(new BN(supplySeed.toString()), new BN(quoteSeed.toString()))
    .accounts({
      creator,
      pool,
      launchState,
      launchBucket,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const transaction = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: LAUNCH_CU_LIMIT }),
    SystemProgram.createAccount({
      fromPubkey: creator,
      newAccountPubkey: vault0.publicKey,
      lamports: rent,
      space: ACCOUNT_SIZE,
      programId: tokenProgram,
    }),
    createInitializeAccountInstruction(vault0.publicKey, memeMint, pool, tokenProgram),
    SystemProgram.createAccount({
      fromPubkey: creator,
      newAccountPubkey: vault1.publicKey,
      lamports: rent,
      space: ACCOUNT_SIZE,
      programId: tokenProgram,
    }),
    createInitializeAccountInstruction(vault1.publicKey, quoteMint, pool, tokenProgram),
    launchPoolIx,
    maturityIx,
    stateIx,
  );

  return {
    transaction,
    vaultKeypairs: [vault0, vault1],
    pool,
    launchState,
    creatorToken0,
    creatorToken1,
  };
}

// ---------------------------------------------------------------------------
// if_fee_inv self-heal (demo-swaps.ts pattern): trading requires the per-pool
// IfFeeInventory ledger; only fund.admin can init it.
// ---------------------------------------------------------------------------

export type FeeInventoryStatus =
  | { kind: "exists" }
  | { kind: "initialized"; signature: string }
  | { kind: "needs_admin"; admin: PublicKey };

export async function ensureIfFeeInventory(
  program: Program,
  pool: PublicKey,
): Promise<FeeInventoryStatus> {
  const programId = program.programId;
  const inventory = deriveIfFeeInventory(programId, pool);
  const p = program as any;

  const existing = await p.account.ifFeeInventory.fetchNullable(inventory);
  if (existing) return { kind: "exists" };

  const fund = deriveInsuranceFund(programId);
  const fundData = await p.account.globalInsuranceFund.fetchNullable(fund);
  if (!fundData) throw new Error("insurance_fund_not_found");
  const admin = fundData.admin as PublicKey;

  const wallet = program.provider.publicKey;
  if (!wallet || !wallet.equals(admin)) {
    return { kind: "needs_admin", admin };
  }

  const signature = await p.methods
    .initializeIfFeeInventory()
    .accounts({
      admin: wallet,
      fund,
      pool,
      inventory,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return { kind: "initialized", signature };
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Raw atoms → grouped display string (max 4 fraction digits). */
export function formatTokenAmount(atoms: bigint, decimals: number): string {
  if (decimals <= 0) return atoms.toLocaleString("en-US");
  const base = 10n ** BigInt(decimals);
  const whole = atoms / base;
  const frac = atoms % base;
  if (frac === 0n) return whole.toLocaleString("en-US");
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${fracStr ? `.${fracStr}` : ""}`;
}
