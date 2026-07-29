import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function DelegateSessionPage() {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [agentPubkey, setAgentPubkey] = useState("");
  const [status, setStatus] = useState("");
  const [newAgent] = useState(() => Keypair.generate());

  if (!publicKey || !program) {
    return <Card>Loading...</Card>;
  }

  const handleCreate = async () => {
    try {
      setStatus("Creating session...");
      // TODO: call program.methods.createSession(...)
      setStatus(
        `Session created! Agent: ${newAgent.publicKey.toString().slice(0, 12)}...`,
      );
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleRevoke = async () => {
    try {
      setStatus("Revoking...");
      // TODO: call program.methods.revokeSession(...)
      setStatus("Session revoked!");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  const handleConfigure = async () => {
    try {
      setStatus("Configuring...");
      // TODO: call program.methods.configureSession(...)
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
        <h3 className="text-lg font-semibold text-foreground mb-3">Create Session</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-foreground-tertiary mb-1">Agent Public Key</p>
            <Input
              placeholder={newAgent.publicKey.toString()}
              value={agentPubkey}
              onChange={(e) => setAgentPubkey(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">Per-tx cap (USDC)</p>
              <Input placeholder="10000" defaultValue="10000" />
            </div>
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">Total budget (USDC)</p>
              <Input placeholder="100000" defaultValue="100000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">Duration (hours)</p>
              <Input placeholder="24" defaultValue="24" />
            </div>
            <div>
              <p className="text-sm text-foreground-tertiary mb-1">Gas prepay (SOL)</p>
              <Input placeholder="0.05" defaultValue="0.05" />
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground-tertiary mb-2">Permissions</p>
            <div className="flex gap-3 flex-wrap">
              {["Swap", "Perp Open", "Perp Close", "LSP Open", "LSP Close", "PM Open", "PM Close"].map(
                (p) => (
                  <label key={p} className="flex items-center gap-1.5 text-sm text-foreground">
                    <input type="checkbox" defaultChecked className="accent-success" />
                    {p}
                  </label>
                ),
              )}
            </div>
          </div>
          <Button variant="primary" onClick={handleCreate} className="w-full">
            Create Session
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">Configure</h3>
          <p className="text-sm text-foreground-secondary mb-3">
            Adjust limits on a live session.
          </p>
          <Button variant="secondary" onClick={handleConfigure} className="w-full">
            Update Limits
          </Button>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-3">Revoke</h3>
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
