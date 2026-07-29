# CatSwap Solana — Test Interface

Frontend for testing CatSwap Solana PM + DelegateSession on devnet/localnet.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example .env

# 3. Get the IDL from the Anchor program build
#    Copy target/idl/catswap.json to src/idl/catswap.json
#    (from the catswap-solana protocol repo after `anchor build`)

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000

# 6. Connect Phantom/Solflare wallet (switch to Solana Devnet in wallet settings)
```

## Features (v1)

- **Dashboard**: Wallet connection status, quick links
- **Portfolio**: Initialize UserPortfolio, deposit/withdraw USDC, health panel
- **Delegate Session**: Create/configure/revoke one-click trading agent

## Architecture

- **Vite + React 18 + TypeScript**
- **@coral-xyz/anchor**: Program interaction
- **@solana/wallet-adapter**: Phantom/Solflare wallet connection
- **Tailwind CSS**: Dark theme matching CatSwapService design

## Deploy Contract

Before using the frontend, deploy the Anchor program:

```bash
# In the catswap-solana protocol repo:
solana config set --url devnet
anchor build
anchor deploy --provider.cluster devnet

# Then copy the program ID to src/idl/catswap.json
# And run the deployment script:
ts-node scripts/devnet-deploy.ts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
