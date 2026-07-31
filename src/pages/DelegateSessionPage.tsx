import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import { deriveUserAccount, deriveDelegateSession } from "@/lib/pda";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Scope bits from programs/catswap/src/state/delegate_session.rs
const SCOPE_BITS: Record<string, number> = {
  Swap: 1 << 0,
  "Perp Open": 1 << 1,
  "Perp Close": 1 << 2,
  "LSP Open": 1 << 3,
  "LSP Close": 1 << 4,
  "PM Open": 1 << 5,
  "PM Close": 1 << 6,
};

const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;

const PERMISSION_LABELS = [
  "Swap",
  "Perp Open",
  "Perp Close",
  "LSP Open",
  "LSP Close",
  "PM Open",
  "PM Close",
];

export function DelegateSessionPage() {
  const { publicKey } = useWallet();
  const { program, programId } = useAnchorProgram();
  const [agentPubkey, setAgentPubkey] = useState("");
  const [perTxCap, setPerTxCap] = useState("10000");
  const [totalBudget, setTotalBudget] = useState("100000");
  const [durationHours, setDurationHours] = useState("24");
  const [gasPrepay, setGasPrepay] = useState("0.05");
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(["Swap", "Perp Open", "Perp Close"]),
  );
  const [status, setStatus] = useState("");
  const [newAgent] = useState(() => Keypair.generate());

  if (!publicKey || !program || !POOL_ADDRESS) {
    return <Card>Loading...</Card>;
  }

  const progId = new PublicKey(programId);

  const togglePermission = (label: string) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const computeScope = () => {
    let scope = 0;
    for (const label of permissions) {
      scope |= SCOPE_BITS[label] ?? 0;
    }
    return scope;
  };

  const handleCreate = async () => {
    try {
      setStatus("Creating session...");
      const pool = POOL_ADDRESS!;
      const uaPda = deriveUserAccount(progId, pool, publicKey!);
      const agent = agentPubkey
        ? new PublicKey(agentPubkey)
        : newAgent.publicKey;

      const sessionPda = deriveDelegateSession(progId, uaPda, agent);

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = new BN(now + parseInt(durationHours || "24") * 3600);
      const scope = computeScope();
      const perTxNotionalCap = new BN(
        Math.floor(parseFloat(perTxCap || "0") * 1e6),
      );
      const totalNotionalBudget = new BN(
        Math.floor(parseFloat(totalBudget || "0") * 1e6),
      );
      const gasPrefundLamports = new BN(
        Math.floor(parseFloat(gasPrepay || "0") * 1e9),
      );

      await (program.methods as any)
        .createSession(
          expiresAt,
          scope,
          perTxNotionalCap,
          totalNotionalBudget,
          gasPrefundLamports,
        )
        .accounts({
          owner: publicKey,
          userAccount: uaPda,
          agent,
          session: sessionPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus(
        `Session created! Agent: ${agent.toString().slice(0, 12)}...`,
      );
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleRevoke = async () => {
    try {
      setStatus("Revoking...");
      const pool = POOL_ADDRESS!;
      const uaPda = deriveUserAccount(progId, pool, publicKey!);
      const agent = agentPubkey
        ? new PublicKey(agentPubkey)
        : newAgent.publicKey;
      const sessionPda = deriveDelegateSession(progId, uaPda, agent);

      await (program.methods as any)
        .revokeSession()
        .accounts({
          owner: publicKey,
          session: sessionPda,
        })
        .rpc();

      setStatus("Session revoked!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleConfigure = async () => {
    try {
      setStatus("Configuring...");
      const pool = POOL_ADDRESS!;
      const uaPda = deriveUserAccount(progId, pool, publicKey!);
      const agent = agentPubkey
        ? new PublicKey(agentPubkey)
        : newAgent.publicKey;
      const sessionPda = deriveDelegateSession(progId, uaPda, agent);

      const now = Math.floor(Date.now() / 1000);
      const newExpiresAt = new BN(
        now + parseInt(durationHours || "24") * 3600,
      );
      const newScope = computeScope();
      const newPerTxNotionalCap = new BN(
        Math.floor(parseFloat(perTxCap || "0") * 1e6),
      );
      const newTotalNotionalBudget = new BN(
        Math.floor(parseFloat(totalBudget || "0") * 1e6),
      );
      const gasTopUpLamports = new BN(
        Math.floor(parseFloat(gasPrepay || "0") * 1e9),
      );

      await (program.methods as any)
        .configureSession(
          newExpiresAt,
          newScope,
          newPerTxNotionalCap,
          newTotalNotionalBudget,
          gasTopUpLamports,
        )
        .accounts({
          owner: publicKey,
          session: sessionPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus("Session configured!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Delegate Session</h2>
      <p className="text-sm text-foreground-secondary">
        Authorize an agent key to trade on your behalf. Agent can only trade
        (swap/perp/LSP) — never withdraw.
      </p>

      <Card>
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Create Session
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-foreground-tertiary mb-1">
              Agent Public Key
            </p>
            <Input
              placeholder={newAgent.publicKey.toString()}
              value={agentPubkey}
              onChange={(e) => setAgentPubkey(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">
                Per-tx cap (USDC)
              </p>
              <Input
                placeholder="10000"
                value={perTxCap}
                onChange={(e) => setPerTxCap(e.target.value)}
              />
            </div>
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">
                Total budget (USDC)
              </p>
              <Input
                placeholder="100000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">
                Duration (hours)
              </p>
              <Input
                placeholder="24"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
              />
            </div>
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">
                Gas prepay (SOL)
              </p>
              <Input
                placeholder="0.05"
                value={gasPrepay}
                onChange={(e) => setGasPrepay(e.target.value)}
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground-tertiary mb-2">
              Permissions
            </p>
            <div className="flex gap-3 flex-wrap">
              {PERMISSION_LABELS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-1.5 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={permissions.has(p)}
                    onChange={() => togglePermission(p)}
                    className="accent-success"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <Button variant="primary" onClick={handleCreate} className="w-full">
            Create Session
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Configure
          </h3>
          <p className="text-sm text-foreground-secondary mb-3">
            Adjust limits on a live session.
          </p>
          <Button
            variant="secondary"
            onClick={handleConfigure}
            className="w-full"
          >
            Update Limits
          </Button>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Revoke
          </h3>
          <p className="text-sm text-foreground-secondary mb-3">
            Immediately disable agent + refund gas.
          </p>
          <Button variant="sell" onClick={handleRevoke} className="w-full">
            Revoke Session
          </Button>
        </Card>
      </div>

      {status && (
        <Card>
          <p className="text-sm text-foreground">{status}</p>
        </Card>
      )}
    </div>
  );
}
