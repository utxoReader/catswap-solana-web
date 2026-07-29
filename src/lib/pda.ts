import { PublicKey } from "@solana/web3.js";

/**
 * Shared PDA derivation utilities for the Catswap program.
 * Seeds match the on-chain `seeds = [...]` declarations in the Anchor code.
 */

export const POOL_SEED = Buffer.from("pool");
export const USER_SEED = Buffer.from("user");
export const REGISTRY_SEED = Buffer.from("registry");
export const AGG_SEED = Buffer.from("agg");
export const REF_CFG_SEED = Buffer.from("ref_cfg");
export const PERP_SEED = Buffer.from("perp");
export const VOL_REGIME_SEED = Buffer.from("vol_regime");

export function derivePool(
  programId: PublicKey,
  token0Mint: PublicKey,
  token1Mint: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POOL_SEED, token0Mint.toBuffer(), token1Mint.toBuffer()],
    programId,
  );
}

export function deriveUserAccount(
  programId: PublicKey,
  pool: PublicKey,
  owner: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [USER_SEED, pool.toBuffer(), owner.toBuffer()],
    programId,
  )[0];
}

export function deriveRegistry(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([REGISTRY_SEED], programId)[0];
}

export function deriveAggregate(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [AGG_SEED, pool.toBuffer()],
    programId,
  )[0];
}

export function deriveReferralConfig(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [REF_CFG_SEED, pool.toBuffer()],
    programId,
  )[0];
}

export function derivePerpPoolState(
  programId: PublicKey,
  pool: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [PERP_SEED, pool.toBuffer()],
    programId,
  )[0];
}

export function deriveVolRegimeState(
  programId: PublicKey,
  pool: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [VOL_REGIME_SEED, pool.toBuffer()],
    programId,
  )[0];
}
