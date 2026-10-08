import { Buffer } from "buffer";

// Solana web3/anchor bundles expect Node's Buffer global. Vite dev injects a
// polyfill automatically; production builds don't, and dependencies touch
// Buffer at module-init time — so this MUST be a standalone module imported
// FIRST in main.tsx (import order = evaluation order; statements in main.tsx
// itself run too late).
if (typeof globalThis.Buffer === "undefined") {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}
