import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "./ui";
import { useConditionalOrders, COND_KIND } from "../hooks/useConditionalOrders";
import { useUserAccount } from "../hooks/useUserAccount";
import { usePoolData, sqrtPriceE16ToPrice } from "../hooks/usePoolData";

interface ConditionalOrdersPanelProps {
  connected: boolean;
}

const KIND_LABELS: Record<number, string> = {
  [COND_KIND.TP_LONG]: "Take Profit (Long)",
  [COND_KIND.SL_LONG]: "Stop Loss (Long)",
  [COND_KIND.TP_SHORT]: "Take Profit (Short)",
  [COND_KIND.SL_SHORT]: "Stop Loss (Short)",
};

const KIND_COLORS: Record<number, string> = {
  [COND_KIND.TP_LONG]: "text-[var(--color-buy)]",
  [COND_KIND.SL_LONG]: "text-[var(--color-sell)]",
  [COND_KIND.TP_SHORT]: "text-[var(--color-buy)]",
  [COND_KIND.SL_SHORT]: "text-[var(--color-sell)]",
};

export const ConditionalOrdersPanel: React.FC<ConditionalOrdersPanelProps> = ({ connected }) => {
  const { poolData } = usePoolData();
  const { userAccount } = useUserAccount();
  const { createOrder, cancelOrder, fetchOrders, loading, error, txSig } = useConditionalOrders();

  const [orders, setOrders] = useState<{ kind: number; data: any }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedKind, setSelectedKind] = useState<number>(COND_KIND.TP_LONG);
  const [triggerPrice, setTriggerPrice] = useState("");

  const currentPrice = poolData ? sqrtPriceE16ToPrice(poolData.sqrtPriceE16) : 0;
  const hasPosition = userAccount ? !userAccount.perp?.size?.isZero() : false;

  // Refresh orders when connected
  useEffect(() => {
    if (connected && hasPosition) {
      fetchOrders().then(setOrders);
    } else {
      setOrders([]);
    }
  }, [connected, hasPosition, txSig]);

  if (!connected) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Connect wallet to manage TP/SL orders.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasPosition) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditional Orders (TP/SL)</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Open a perp position first to set Take Profit / Stop Loss orders.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreate = async () => {
    const price = parseFloat(triggerPrice || "0");
    if (price <= 0) return;
    await createOrder({
      kind: selectedKind,
      triggerPrice: price,
    });
    setTriggerPrice("");
    setShowCreate(false);
  };

  const handleRefresh = async () => {
    const data = await fetchOrders();
    setOrders(data);
  };

  // E32 price to display
  const e32ToPrice = (e32bn: any) => {
    if (!e32bn) return 0;
    const bn = e32bn.toNumber ? e32bn.toNumber() : Number(e32bn);
    return bn / Math.pow(2, 32);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Conditional Orders (TP/SL)</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRefresh} disabled={loading} className="text-xs">
              Refresh
            </Button>
            <Button onClick={() => setShowCreate(!showCreate)} disabled={loading} className="text-xs">
              {showCreate ? "Cancel" : "Create"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current price */}
        <div className="text-xs text-[var(--text-secondary)]">
          Current Price: <span className="text-[var(--text-primary)]">{currentPrice.toFixed(2)}</span>
        </div>

        {/* Status messages */}
        {error && <div className="text-xs text-[var(--color-sell)] break-all">{error}</div>}
        {txSig && <div className="text-xs text-[var(--color-buy)]">Confirmed: {txSig.slice(0, 8)}...</div>}

        {/* Create form */}
        {showCreate && (
          <div className="space-y-2 p-3 rounded-md bg-[var(--bg-tertiary)]">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedKind}
                onChange={(e) => setSelectedKind(parseInt(e.target.value))}
                className="px-3 py-2 text-sm rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]"
              >
                <option value={COND_KIND.TP_LONG}>Take Profit (Long)</option>
                <option value={COND_KIND.SL_LONG}>Stop Loss (Long)</option>
                <option value={COND_KIND.TP_SHORT}>Take Profit (Short)</option>
                <option value={COND_KIND.SL_SHORT}>Stop Loss (Short)</option>
              </select>
              <Input
                type="number"
                placeholder={`Price (current: ${currentPrice.toFixed(2)})`}
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={loading || !triggerPrice} className="w-full">
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        )}

        {/* Existing orders */}
        {orders.length === 0 ? (
          <div className="text-center py-3 text-sm text-[var(--text-tertiary)]">
            No active conditional orders.
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.kind}
                className="flex items-center justify-between p-2 rounded-md bg-[var(--bg-tertiary)]"
              >
                <div>
                  <span className={`text-sm font-medium ${KIND_COLORS[order.kind] || ""}`}>
                    {KIND_LABELS[order.kind] || `Kind ${order.kind}`}
                  </span>
                  <div className="text-xs text-[var(--text-secondary)]">
                    Trigger: {e32ToPrice(order.data?.triggerPriceE32).toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => cancelOrder(order.kind)}
                  disabled={loading}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
