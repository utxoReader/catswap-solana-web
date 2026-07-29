import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "./ui";
import { useDeposit } from "../hooks/useDeposit";
import { useUserAccount } from "../hooks/useUserAccount";

interface DepositWithdrawProps {
  connected: boolean;
}

export const DepositWithdraw: React.FC<DepositWithdrawProps> = ({ connected }) => {
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");

  const { deposit, withdraw, loading, error, txSig } = useDeposit();
  const { userAccount } = useUserAccount();

  if (!connected) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Connect your wallet to deposit or withdraw.
          </p>
        </CardContent>
      </Card>
    );
  }

  const balance0 = userAccount ? userAccount.balance0.toNumber() / 1e8 : 0;
  const balance1 = userAccount ? userAccount.balance1.toNumber() / 1e6 : 0;

  const handleSubmit = async () => {
    const a0 = parseFloat(amount0 || "0");
    const a1 = parseFloat(amount1 || "0");
    if (a0 <= 0 && a1 <= 0) return;

    const params = { amount0: a0, amount1: a1, decimals0: 8, decimals1: 6 };
    if (mode === "deposit") {
      await deposit(params);
    } else {
      await withdraw(params);
    }
    setAmount0("");
    setAmount1("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deposit / Withdraw</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-md bg-[var(--bg-tertiary)]">
          <button
            onClick={() => setMode("deposit")}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              mode === "deposit"
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setMode("withdraw")}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              mode === "withdraw"
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Balances */}
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>Balance: {balance0.toFixed(8)} DEVT</span>
          <span>{balance1.toFixed(2)} USDC</span>
        </div>

        {/* Amount inputs */}
        <Input
          label="DEVT Amount"
          type="number"
          placeholder="0.00"
          value={amount0}
          onChange={(e) => setAmount0(e.target.value)}
        />
        <Input
          label="USDC Amount"
          type="number"
          placeholder="0.00"
          value={amount1}
          onChange={(e) => setAmount1(e.target.value)}
        />

        {/* Status */}
        {error && (
          <div className="text-xs text-[var(--color-sell)] break-all">{error}</div>
        )}
        {txSig && (
          <div className="text-xs text-[var(--color-buy)]">
            Confirmed: {txSig.slice(0, 8)}...
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={loading || (parseFloat(amount0 || "0") <= 0 && parseFloat(amount1 || "0") <= 0)}
          className="w-full"
        >
          {loading
            ? `${mode === "deposit" ? "Depositing" : "Withdrawing"}...`
            : mode === "deposit"
              ? "Deposit"
              : "Withdraw"}
        </Button>
      </CardContent>
    </Card>
  );
};
