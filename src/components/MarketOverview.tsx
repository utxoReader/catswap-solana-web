import { TradingPair } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { formatPrice, formatVolume } from '../shared/lib/formatters';

interface MarketOverviewProps {
  pairs: TradingPair[];
  selectedPair: TradingPair | null;
  onSelectPair: (pair: TradingPair) => void;
}

const TABS = ['Hot', 'Gainers', 'Losers', 'New'] as const;

const getPairColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    BTC: '#f7931a',
    ETH: '#627eea',
    SOL: '#14f195',
    BNB: '#f3ba2f',
    XRP: '#23292f',
    DOGE: '#c3a634',
    ADA: '#0033ad',
    AVAX: '#e84142',
  };
  const key = symbol.split('/')[0];
  return colors[key] || '#6b7280';
};

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  pairs,
  selectedPair,
  onSelectPair,
}) => {
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Markets
        </h2>
        <Tabs value="Hot" onValueChange={() => {}}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr] px-4 py-3 border-b border-border text-xs font-medium text-foreground-tertiary uppercase">
          <span>Name</span>
          <span className="text-right">Last Price</span>
          <span className="text-right">24h Change</span>
          <span className="text-right">24h Volume</span>
          <span className="text-right">24h High</span>
          <span className="text-right">24h Low</span>
          <span></span>
        </div>

        {/* Mobile Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] sm:hidden px-4 py-3 border-b border-border text-xs font-medium text-foreground-tertiary uppercase">
          <span>Name</span>
          <span className="text-right">Price</span>
          <span className="text-right">Change</span>
          <span></span>
        </div>

        {/* Table Body */}
        <div className="max-h-[500px] overflow-y-auto">
          {pairs.map((pair) => (
            <div
              key={pair.id}
              onClick={() => onSelectPair(pair)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPair(pair);
                }
              }}
              role="button"
              tabIndex={0}
              className={`hidden sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr] px-4 py-4 border-b border-border cursor-pointer transition-colors items-center ${
                selectedPair?.id === pair.id
                  ? 'bg-background-tertiary border-l-2 border-l-success'
                  : 'hover:bg-background-tertiary'
              }`}
            >
              {/* Name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: getPairColor(pair.symbol) }}
                >
                  {pair.symbol.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {pair.symbol}
                  </div>
                  <div className="text-xs text-foreground-tertiary">
                    {pair.name}
                  </div>
                </div>
              </div>

              {/* Price */}
              <span className="text-sm font-medium text-foreground text-right">
                ${formatPrice(pair.price)}
              </span>

              {/* Change */}
              <span
                className={`text-sm font-medium text-right ${
                  pair.change24h >= 0
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                {pair.change24h >= 0 ? '+' : ''}
                {pair.change24h.toFixed(2)}%
              </span>

              {/* Volume */}
              <span className="text-sm text-foreground-tertiary text-right">
                {formatVolume(pair.volume24h)}
              </span>

              {/* High */}
              <span className="text-sm text-foreground-tertiary text-right">
                ${formatPrice(pair.high24h)}
              </span>

              {/* Low */}
              <span className="text-sm text-foreground-tertiary text-right">
                ${formatPrice(pair.low24h)}
              </span>

              {/* Action */}
              <div className="text-right">
                <Button variant="secondary" size="sm">
                  Trade
                </Button>
              </div>
            </div>
          ))}

          {/* Mobile Row */}
          {pairs.map((pair) => (
            <div
              key={`mobile-${pair.id}`}
              onClick={() => onSelectPair(pair)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPair(pair);
                }
              }}
              role="button"
              tabIndex={0}
              className={`grid grid-cols-[2fr_1fr_1fr_auto] sm:hidden px-4 py-4 border-b border-border cursor-pointer transition-colors items-center ${
                selectedPair?.id === pair.id
                  ? 'bg-background-tertiary border-l-2 border-l-success'
                  : 'hover:bg-background-tertiary'
              }`}
            >
              {/* Name */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                  style={{ background: getPairColor(pair.symbol) }}
                >
                  {pair.symbol.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {pair.symbol}
                  </div>
                  <div className="text-xs text-foreground-tertiary">
                    {pair.name}
                  </div>
                </div>
              </div>

              {/* Price */}
              <span className="text-sm font-medium text-foreground text-right">
                ${formatPrice(pair.price)}
              </span>

              {/* Change */}
              <span
                className={`text-sm font-medium text-right ${
                  pair.change24h >= 0
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                {pair.change24h >= 0 ? '+' : ''}
                {pair.change24h.toFixed(2)}%
              </span>

              {/* Action */}
              <div className="text-right pl-2">
                <Button variant="secondary" size="sm" className="px-2 py-1 text-xs">
                  Trade
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
