import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Star, X, TrendingUp, Clock } from 'lucide-react';
import { TradingPair } from '../../types';

interface TradingPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPair: (pair: TradingPair) => void;
  currentPair: TradingPair;
  allPairs: TradingPair[];
}

type TabType = 'favorites' | 'all' | 'top' | 'new';

// Token icon mapping
const TOKEN_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  SOL: '◎',
  BNB: 'B',
  XRP: '✕',
  DOGE: 'Ð',
  ADA: '₳',
  AVAX: 'A',
  USDT: '₮',
  USDC: 'U',
};

// Token colors
const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  BNB: '#F3BA2F',
  XRP: '#23292F',
  DOGE: '#C2A633',
  ADA: '#0033AD',
  AVAX: '#E84142',
  USDT: '#26A17B',
  USDC: '#2775CA',
};

export const TradingPairModal: React.FC<TradingPairModalProps> = ({
  isOpen,
  onClose,
  onSelectPair,
  currentPair,
  allPairs,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const filteredPairs = useMemo(() => {
    let pairs = allPairs;
    
    if (activeTab === 'favorites') {
      pairs = allPairs.filter(p => favorites.has(p.id));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      pairs = pairs.filter(p => 
        p.symbol.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query)
      );
    }
    
    return pairs;
  }, [allPairs, activeTab, favorites, searchQuery]);

  const toggleFavorite = (e: React.MouseEvent, pairId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(pairId)) {
        newFavorites.delete(pairId);
      } else {
        newFavorites.add(pairId);
      }
      return newFavorites;
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const getTokenIcon = (symbol: string) => {
    const baseToken = symbol.split('/')[0];
    return TOKEN_ICONS[baseToken] || baseToken[0];
  };

  const getTokenColor = (symbol: string) => {
    const baseToken = symbol.split('/')[0];
    return TOKEN_COLORS[baseToken] || '#888';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-[520px] max-h-[70vh] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Select Trading Pair</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search crypto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm rounded-lg pl-10 pr-4 py-2.5 border border-[var(--border-primary)] outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out placeholder:text-[var(--text-tertiary)]"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-primary)] overflow-x-auto">
          {[
            { id: 'favorites' as TabType, label: 'Favorites', icon: Star },
            { id: 'all' as TabType, label: 'All' },
            { id: 'top' as TabType, label: 'Top', icon: TrendingUp },
            { id: 'new' as TabType, label: 'New', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {tab.icon && <tab.icon className="w-3 h-3" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_80px] px-4 py-2 text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
          <span>Name</span>
          <span className="text-right">Last price</span>
          <span className="text-right">24h change</span>
        </div>

        {/* Pair List */}
        <div className="overflow-y-auto max-h-[350px]">
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
              const isCurrent = currentPair.id === pair.id;
              
              return (
                <div
                  key={pair.id}
                  onClick={() => {
                    onSelectPair(pair);
                    onClose();
                  }}
                  className={`grid grid-cols-[1fr_100px_80px] px-4 py-3 cursor-pointer transition-colors border-b border-[var(--border-primary)] last:border-b-0 ${
                    isCurrent 
                      ? 'bg-[var(--bg-primary)]' 
                      : 'hover:bg-[var(--bg-primary)]'
                  }`}
                >
                  {/* Name */}
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
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)]">{pair.name}</span>
                    </div>
                  </div>
                  
                  {/* Last Price */}
                  <div className="text-right">
                    <span className="text-sm text-[var(--text-primary)]">
                      ${formatPrice(pair.price)}
                    </span>
                  </div>
                  
                  {/* 24h Change */}
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
    </div>
  );
};

export default TradingPairModal;
