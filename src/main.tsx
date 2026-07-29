import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter,
  AvanaWalletAdapter,
  AlphaWalletAdapter,
  LedgerWalletAdapter,
  KeystoneWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import type { Adapter } from "@solana/wallet-adapter-base";
import App from "./App";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

// Switch between: "devnet" | "testnet" | "mainnet-beta" | "http://localhost:8899"
const RPC_ENDPOINT = import.meta.env.VITE_RPC_URL || clusterApiUrl("devnet");

// Register all mainstream Solana wallets — users pick from the modal (Jupiter-style)
// Backpack & Glow register via Wallet Standard injection; the modal auto-detects them.
function buildWallets(): Adapter[] {
  const adapters: Adapter[] = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];
  try { adapters.push(new CoinbaseWalletAdapter()); } catch { /* not installed */ }
  try { adapters.push(new TrustWalletAdapter()); } catch { /* not installed */ }
  try { adapters.push(new AvanaWalletAdapter()); } catch { /* not installed */ }
  try { adapters.push(new AlphaWalletAdapter()); } catch { /* not installed */ }
  try { adapters.push(new LedgerWalletAdapter()); } catch { /* not installed */ }
  try { adapters.push(new KeystoneWalletAdapter()); } catch { /* not installed */ }
  return adapters;
}

const wallets = buildWallets();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>,
);
