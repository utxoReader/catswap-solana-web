import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import {
  derivePortfolioConfig,
  deriveUserPortfolio,
  derivePortfolioAsset,
  derivePortfolioAssetVault,
} from "@/lib/pda";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

export function PortfolioPage() {
  const { publicKey } = useWallet();
  const { program, programId } = useAnchorProgram();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [status, setStatus] = useState("");

  // Health status from on-chain
  const [usdcFree, setUsdcFree] = useState<string>("—");
  const [reservedIm, setReservedIm] = useState<string>("—");
  const [positionCount, setPositionCount] = useState<string>("—");

  if (!publicKey || !program || !POOL_ADDRESS) {
    return <Card>Loading...</Card>;
  }

  const progId = new PublicKey(programId);

  // Derive PDAs
  const portfolioCfg = derivePortfolioConfig(progId);
  const userPortfolio = deriveUserPortfolio(progId, publicKey);

  const fetchHealth = useCallback(async () => {
    try {
      // Fetch user portfolio account for on-chain health data
      const pf = await (program.account as any).userPortfolio.fetchNullable(
        userPortfolio,
      );
      if (pf) {
        const free = new BN(pf.usdcFree.toString());
        const im = new BN(pf.usdcReservedIm.toString());
        setUsdcFree((free.toNumber() / 1e6).toFixed(2));
        setReservedIm((im.toNumber() / 1e6).toFixed(2));
        setPositionCount(pf.positionCount?.toString() ?? "0");
      }
    } catch {
      // Portfolio not initialized or account doesn't exist — leave defaults
    }
  }, [program, progId, userPortfolio]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleInit = async () => {
    try {
      setStatus("Initializing...");
      await (program.methods as any)
        .initializeUserPortfolio()
        .accounts({
          owner: publicKey,
          portfolioConfig: portfolioCfg,
          userPortfolio,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus("Portfolio initialized!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleDeposit = async () => {
    try {
      setStatus("Depositing...");
      // Read canonical USDC mint from registry (K3 review: not pool.token1Mint)
      const registryPda = PublicKey.findProgramAddressSync(
        [Buffer.from("registry")],
        progId,
      )[0];
      const registryData = await (program.account as any).poolRegistry.fetch(
        registryPda,
      );
      const usdcMint = registryData.usdcMint as PublicKey;
      const userUsdc = getAssociatedTokenAddressSync(usdcMint, publicKey!);
      const portfolioAssetPda = derivePortfolioAsset(
        progId,
        userPortfolio,
        usdcMint,
      );
      const portfolioAssetVaultPda = derivePortfolioAssetVault(
        progId,
        userPortfolio,
        usdcMint,
      );

      const amountAtoms = new BN(
        Math.floor(parseFloat(depositAmount || "0") * 1e6),
      );

      await (program.methods as any)
        .depositPortfolioAsset(amountAtoms)
        .accounts({
          owner: publicKey,
          portfolioConfig: portfolioCfg,
          userPortfolio,
          mint: usdcMint,
          userToken: userUsdc,
          portfolioAsset: portfolioAssetPda,
          portfolioAssetVault: portfolioAssetVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setStatus("Deposit successful!");
      fetchHealth();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleWithdraw = async () => {
    try {
      setStatus("Withdrawing...");
      const poolData = await (program.account as any).pool.fetch(
        POOL_ADDRESS,
      );
      const usdcMint = poolData.token1Mint as PublicKey;
      const userUsdc = getAssociatedTokenAddressSync(usdcMint, publicKey!);
      const portfolioAssetPda = derivePortfolioAsset(
        progId,
        userPortfolio,
        usdcMint,
      );
      const portfolioAssetVaultPda = derivePortfolioAssetVault(
        progId,
        userPortfolio,
        usdcMint,
      );

      const amountAtoms = new BN(
        Math.floor(parseFloat(withdrawAmount || "0") * 1e6),
      );

      await (program.methods as any)
        .withdrawPortfolioAsset(amountAtoms)
        .accounts({
          owner: publicKey,
          portfolioConfig: portfolioCfg,
          userPortfolio,
          mint: usdcMint,
          userToken: userUsdc,
          portfolioAsset: portfolioAssetPda,
          portfolioAssetVault: portfolioAssetVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setStatus("Withdrawal successful!");
      fetchHealth();
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Portfolio Account</h2>
      <Card>
        <p className="text-sm text-foreground-tertiary mb-1">
          UserPortfolio PDA
        </p>
        <p className="text-sm text-foreground-secondary break-all font-mono">
          {userPortfolio.toString()}
        </p>
        <Button variant="primary" onClick={handleInit} className="mt-4">
          Initialize Portfolio
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Deposit USDC
          </h3>
          <Input
            type="number"
            placeholder="Amount (USDC)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <Button
            variant="buy"
            onClick={handleDeposit}
            className="w-full mt-3"
          >
            Deposit
          </Button>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Withdraw USDC
          </h3>
          <Input
            type="number"
            placeholder="Amount (USDC)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <Button
            variant="sell"
            onClick={handleWithdraw}
            className="w-full mt-3"
          >
            Withdraw
          </Button>
        </Card>
      </div>

      {/* Health Read-only Panel */}
      <Card>
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Health Status
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-foreground-tertiary">USDC Free</p>
            <p className="text-xl font-bold text-foreground">{usdcFree}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-tertiary">Reserved IM</p>
            <p className="text-xl font-bold text-foreground">{reservedIm}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-tertiary">Positions</p>
            <p className="text-xl font-bold text-foreground">
              {positionCount}
            </p>
          </div>
        </div>
      </Card>

      {status && (
        <Card>
          <p className="text-sm text-foreground">{status}</p>
        </Card>
      )}
    </div>
  );
}
