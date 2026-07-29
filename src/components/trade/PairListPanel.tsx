import { TradingPair } from '../../types';

interface PairListPanelProps {
  pairs: TradingPair[];
  selectedPair: TradingPair;
  onSelectPair: (pair: TradingPair) => void;
}

export const PairListPanel: React.FC<PairListPanelProps> = ({
  pairs,
  selectedPair,
  onSelectPair,
}) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toFixed(2);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-[var(--border-primary)]">
        {['USDT', 'USD', 'BTC'].map((tab) => (
          <button
            key={tab}
            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              tab === 'USDT'
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
        <span>Pair</span>
        <span className="text-right">Last Price</span>
        <span className="text-right">24h Change</span>
      </div>

      {/* Pair List */}
      <div className="flex-1 overflow-y-auto">
        {pairs.map((pair) => (
          <div
            key={pair.id}
            onClick={() => onSelectPair(pair)}
            className={`grid grid-cols-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)] ${
              selectedPair.id === pair.id
                ? 'bg-[var(--bg-tertiary)]'
                : ''
            }`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {pair.symbol.replace('/USDT', '')}
                <span className="text-[var(--text-tertiary)]">/USDT</span>
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                Vol {formatVolume(pair.volume24h)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm text-[var(--text-primary)]">
                {formatPrice(pair.price)}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`text-sm ${
                  pair.change24h >= 0
                    ? 'text-[var(--color-buy)]'
                    : 'text-[var(--color-sell)]'
                }`}
              >
                {pair.change24h >= 0 ? '+' : ''}
                {pair.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PairListPanel;
