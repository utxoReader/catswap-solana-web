import React, { useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { TradingPair } from '../../types';

export interface PairRow extends TradingPair {
  /** undefined = treat as eligible (mock majors); false = spot-only */
  perpEligible?: boolean;
}

interface TradingPairDropdownProps {
  pairs: PairRow[];
  currentPair: TradingPair;
  onSelectPair: (pair: PairRow) => void;
  /** Column label for the change stats — live pools report a rolling window. */
  changeLabel?: string;
  /** Anchored fixed position (button rect), asterdex-style hover dropdown. */
  anchor: { top: number; left: number };
  onClose: () => void;
  /** Perps page opens directly on the Perp tab. */
  defaultTab?: 'favorites' | 'spot' | 'perp';
}

type TabType = 'favorites' | 'spot' | 'perp';

const TOKEN_ICONS: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', SOL: '◎', BNB: 'B', XRP: '✕',
  DOGE: 'Ð', ADA: '₳', AVAX: 'A', USDC: 'U',
};

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#14F195', BNB: '#F3BA2F',
  XRP: '#23292F', DOGE: '#C2A633', ADA: '#0033AD', AVAX: '#E84142',
  USDC: '#2775CA',
};

/**
 * Asterdex-style pair selector: a dropdown panel anchored under the ticker
 * (opened on hover by the parent), NOT a centered modal. Spot and Perp tabs
 * share one asset universe — the Perp tab simply filters to perp-eligible
 * assets.
 */
export const TradingPairDropdown: React.FC<TradingPairDropdownProps> = ({
  pairs,
  onSelectPair,
  changeLabel = '24h change',
  anchor,
  onClose,
  defaultTab = 'spot',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filteredPairs = useMemo(() => {
    let list = pairs;
    if (activeTab === 'favorites') {
      list = list.filter(p => favorites.has(p.id));
    } else if (activeTab === 'perp') {
      // Same universe as spot — only the perp-eligibility filter applies.
      list = list.filter(p => p.perpEligible !== false);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.symbol.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [pairs, activeTab, favorites, searchQuery]);

  const toggleFavorite = (e: React.MouseEvent, pairId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(pairId)) next.delete(pairId);
      else next.add(pairId);
      return next;
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price > 0 && price < 0.01) return price.toPrecision(3); // tiny on-chain prices (~1e-11)
    return price.toFixed(4);
  };

  const getTokenIcon = (symbol: string) => TOKEN_ICONS[symbol.split('/')[0]] || symbol[0];
  const getTokenColor = (symbol: string) => TOKEN_COLORS[symbol.split('/')[0]] || '#888';

  return (
    <div
      className="fixed z-[100] w-[640px] max-w-[92vw] bg-[var(--bg-secondary)] rounded-md border border-[var(--border-primary)] overflow-hidden"
      style={{ top: anchor.top, left: anchor.left, boxShadow: '0 8px 20px -6px rgba(0,0,0,0.22)' }}
      role="dialog"
    >
      {/* Search */}
      <div className="px-4 py-3 border-b border-[var(--border-primary)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm rounded-md pl-10 pr-4 py-2.5 border border-[var(--border-primary)] outline-none focus:border-[var(--text-primary)] transition-colors placeholder:text-[var(--text-tertiary)]"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs: one universe — spot shows all, perp filters by eligibility.
          Same underline style as OrdersPanel / OKX (consistency rule). */}
      <div className="flex items-center gap-4 px-4 border-b border-[var(--border-primary)]">
        {([
          { id: 'favorites' as TabType, label: 'Favorites', icon: Star },
          { id: 'spot' as TabType, label: 'Spot' },
          { id: 'perp' as TabType, label: 'Perp' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 py-2 text-xs whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.icon && <tab.icon className="w-3 h-3" />}
            {tab.label}
            {activeTab === tab.id && (
              // Underline matches the text width (button carries no x-padding).
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_110px_90px] px-4 py-2 text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
        <span>Name</span>
        <span className="text-right">Last price</span>
        <span className="text-right">{changeLabel}</span>
      </div>

      {/* Pair List */}
      <div className="overflow-y-auto max-h-[340px]">
        {filteredPairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No trading pairs found</p>
          </div>
        ) : (
          filteredPairs.map((pair) => {
            const baseToken = pair.symbol.split('/')[0];
            const quoteToken = pair.symbol.split('/')[1];
            const isFavorite = favorites.has(pair.id);

            return (
              <div
                key={pair.id}
                onClick={() => {
                  onSelectPair(pair);
                  onClose();
                }}
                // OKX-style rows: no default grey on the current row — only a
                // subtle hover highlight.
                className="grid grid-cols-[1fr_110px_90px] px-4 py-3 cursor-pointer transition-colors border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-primary)]"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => toggleFavorite(e, pair.id)}
                    className={`transition-colors ${
                      isFavorite ? 'text-yellow-500' : 'text-[var(--text-tertiary)] hover:text-yellow-500'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getTokenColor(pair.symbol) }}
                  >
                    {getTokenIcon(pair.symbol)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{baseToken}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">/{quoteToken}</span>
                      {pair.perpEligible !== false && (
                        <span className="text-[10px] px-1 py-px rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">perp</span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">{pair.name}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm text-[var(--text-primary)]">
                    ${formatPrice(pair.price)}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`text-sm ${
                    pair.change24h >= 0 ? 'text-[var(--color-buy)]' : 'text-[var(--color-sell)]'
                  }`}>
                    {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TradingPairDropdown;
