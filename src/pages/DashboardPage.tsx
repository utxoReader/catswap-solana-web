import { useWallet } from "@solana/wallet-adapter-react";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function DashboardPage() {
  const { connected, publicKey } = useWallet();

  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">CatSwap Solana</h1>
        <p className="text-foreground-secondary text-lg">
          Portfolio Margin + Spot Swap + Delegate Session
        </p>
      </div>

      {!connected ? (
        <Card className="text-center max-w-md mx-auto">
          <Wallet className="w-12 h-12 mx-auto text-foreground-tertiary mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Connect Wallet</h3>
          <p className="text-foreground-secondary text-sm">
            Connect Phantom or Solflare to start testing deposit, swap, and
            delegated trading.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/portfolio">
            <Card className="hover:border-border-hover transition-colors cursor-pointer h-full">
              <TrendingUp className="w-8 h-8 text-success mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Portfolio</h3>
              <p className="text-sm text-foreground-secondary">
                Deposit, withdraw, swap, view health
              </p>
            </Card>
          </Link>
          <Link to="/session">
            <Card className="hover:border-border-hover transition-colors cursor-pointer h-full">
              <Zap className="w-8 h-8 text-success mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Delegate Session</h3>
              <p className="text-sm text-foreground-secondary">
                One-click trading, manage agent keys
              </p>
            </Card>
          </Link>
          <Card className="h-full">
            <Wallet className="w-8 h-8 text-foreground-tertiary mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Account</h3>
            <p className="text-sm text-foreground-secondary font-mono">
              {publicKey?.toString().slice(0, 12)}...
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
