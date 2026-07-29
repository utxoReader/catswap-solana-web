import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function PortfolioPage() {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [status, setStatus] = useState("");

  if (!publicKey || !program) {
    return <Card>Loading...</Card>;
  }

  // Derive UserPortfolio PDA
  const [userPortfolio] = PublicKey.findProgramAddressSync(
    [Buffer.from("portfolio"), publicKey.toBuffer()],
    program.programId,
  );

  const handleInit = async () => {
    try {
      setStatus("Initializing...");
      // TODO: call program.methods.initUserPortfolio()
      setStatus("Portfolio initialized!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleDeposit = async () => {
    try {
      setStatus("Depositing...");
      // TODO: call program.methods.depositPortfolioAsset(...)
      setStatus("Deposit successful!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleWithdraw = async () => {
    try {
      setStatus("Withdrawing...");
      // TODO: call program.methods.withdrawPortfolioAsset(...)
      setStatus("Withdrawal successful!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Portfolio Account</h2>
      <Card>
        <p className="text-sm text-foreground-tertiary mb-1">UserPortfolio PDA</p>
        <p className="text-sm text-foreground-secondary break-all font-mono">{userPortfolio.toString()}</p>
        <Button variant="primary" onClick={handleInit} className="mt-4">
          Initialize Portfolio
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">Deposit USDC</h3>
          <Input
            type="number"
            placeholder="Amount (USDC)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <Button variant="buy" onClick={handleDeposit} className="w-full mt-3">
            Deposit
          </Button>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">Withdraw USDC</h3>
          <Input
            type="number"
            placeholder="Amount (USDC)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <Button variant="sell" onClick={handleWithdraw} className="w-full mt-3">
            Withdraw
          </Button>
        </Card>
      </div>

      {/* Health Read-only Panel */}
      <Card>
        <h3 className="text-lg font-semibold text-foreground mb-3">Health Status</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-foreground-tertiary">USDC Free</p>
            <p className="text-xl font-bold text-foreground">—</p>
          </div>
          <div>
            <p className="text-xs text-foreground-tertiary">Reserved IM</p>
            <p className="text-xl font-bold text-foreground">—</p>
          </div>
          <div>
            <p className="text-xs text-foreground-tertiary">Positions</p>
            <p className="text-xl font-bold text-foreground">—</p>
          </div>
        </div>
        <p className="text-xs text-foreground-muted mt-3">
          TODO: Fetch from on-chain via verify_portfolio_solvency
        </p>
      </Card>

      {status && (
        <Card>
          <p className="text-sm text-foreground">{status}</p>
        </Card>
      )}
    </div>
  );
}
