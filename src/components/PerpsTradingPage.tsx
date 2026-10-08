import React, { useEffect, useMemo, useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { TradingPair } from '../types';
import { tradingPairs } from '../data/mockData';
import { TradingViewChart, PerpsTradingForm, OrdersPanel, MobilePerpTradingForm } from './spot';
import { TradingPairDropdown, PairRow } from './spot/TradingPairDropdown';
import { useDemoPoolKlines } from '../hooks/useDemoPoolKlines';
import { DEMO_POOLS } from '../lib/demoPools';

type TimeFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

interface PerpsTradingPageProps {
  connected: boolean;
  publicKey: string | null;
  connectWallet: () => void;
  
  selectedPair?: string;
}

const TOKEN_ICONS: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', SOL: '◎', BNB: 'B', XRP: '✕',
  DOGE: 'Ð', ADA: '₳', AVAX: 'A', USDC: 'U',
};

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#14F195', BNB: '#F3BA2F',
  XRP: '#23292F', DOGE: '#C2A633', ADA: '#0033AD', AVAX: '#E84142',
  USDC: '#2775CA',
};

export const PerpsTradingPage: React.FC<PerpsTradingPageProps> = ({
  connected,
  publicKey,
  connectWallet,
  selectedPair: initialPair = 'BTC/USDC',
}) => {
  const [, setSelectedPair] = useState<TradingPair>(() => {
    const found = tradingPairs.find(p => p.symbol === initialPair);
    return found || tradingPairs[0];
  });
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('15m');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pairAnchor, setPairAnchor] = useState<{ top: number; left: number } | null>(null);
  // Same on-chain asset universe + live charts as the spot page.
  const { poolKlines, livePairs } = useDemoPoolKlines(timeFrame);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [mobileFormSide, setMobileFormSide] = useState<'open' | 'close'>('open');

  useEffect(() => {
    const found = tradingPairs.find(p => p.symbol === initialPair);
    if (found) {
      setSelectedPair(found);
    }
  }, [initialPair]);

  // Which demo pool the chart shows. Perps defaults to a perp-eligible pool
  // (stock); meme (launch pool, perp off) is selectable but spot-flavored.
  const [activePoolKey, setActivePoolKey] = useState<string>(DEMO_POOLS[1].key);
  const activePoolIdx = Math.max(0, DEMO_POOLS.findIndex(c => c.key === activePoolKey));
  const activeKline = poolKlines[activePoolIdx];
  const { candles: liveCandles, isLive } = activeKline;

  // No mock candles anywhere (boss 10/08): chart shows real on-chain data or
  // an honest empty chart — never fabricated BTC history.
  const candleData = isLive && liveCandles.length > 0 ? liveCandles : [];

  // Live-pool header stats (same contract as the spot page).
  const liveStats = useMemo(() => {
    if (!isLive || liveCandles.length === 0) return null;
    const first = liveCandles[0];
    const last = liveCandles[liveCandles.length - 1];
    return {
      price: last.close,
      change: first.open > 0 ? ((last.close - first.open) / first.open) * 100 : 0,
      high: Math.max(...liveCandles.map(c => c.high)),
      low: Math.min(...liveCandles.map(c => c.low)),
      vol: liveCandles.reduce((s, c) => s + c.volume, 0),
    };
  }, [isLive, liveCandles]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  // Tiny on-chain prices (~1e-11) need significant-digit formatting, not 2dp.
  const fmtAny = (p: number) => (p > 0 && p < 0.01 ? p.toPrecision(3) : formatPrice(p));

  const getTokenIcon = (symbol: string) => TOKEN_ICONS[symbol.split('/')[0]] || symbol[0];
  const getTokenColor = (symbol: string) => TOKEN_COLORS[symbol.split('/')[0]] || '#888';

  const pairSymbol = DEMO_POOLS[activePoolIdx].symbol;
  const quoteToken = pairSymbol.split('/')[1] || 'USDC';
  const dispChange = liveStats ? liveStats.change : null;
  const priceChangeColor = dispChange === null ? 'text-[var(--text-primary)]' : dispChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]';
  const priceChangeSign = dispChange !== null && dispChange >= 0 ? '+' : '';

  const handleSelectPair = (pair: TradingPair) => {
    const demo = DEMO_POOLS.find(c => c.key === pair.id);
    if (demo) {
      setActivePoolKey(demo.key);
    } else {
      setSelectedPair(pair);
    }
  };

  const currentPair: TradingPair =
    livePairs?.find(p => p.id === activePoolKey) ?? {
      id: DEMO_POOLS[activePoolIdx].key,
      symbol: DEMO_POOLS[activePoolIdx].symbol,
      name: DEMO_POOLS[activePoolIdx].name,
      price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0,
    };

  return (
    <div className="h-[calc(100vh-68px)] bg-[var(--bg-primary)] flex flex-col gap-px lg:gap-[3px]">
      {/* Main Content - 模块 3 & 4 */}
      <div className="flex-1 flex gap-px lg:gap-[3px] min-h-0">
        {/* Left - Pair Info + Chart + Orders Panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-px lg:gap-[3px]">
          {/* Pair Info Bar - 只在左侧显示 */}
          <div className="bg-[var(--bg-secondary)] px-4 py-2">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
              {/* Pair Selector — unified asterdex-style hover dropdown */}
              <div
                className="relative shrink-0"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  // Flush against the ticker (see SpotTradingPage note).
                  setPairAnchor({ top: rect.bottom, left: rect.left });
                  setIsModalOpen(true);
                }}
                onMouseLeave={() => setIsModalOpen(false)}
              >
              <button
                onClick={() => setIsModalOpen(v => !v)}
                className="flex items-center gap-2 hover:bg-[var(--bg-tertiary)] px-2 py-1 rounded transition-colors shrink-0"
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getTokenColor(pairSymbol) }}
                >
                  {getTokenIcon(pairSymbol)}
                </div>
                <span className="text-base font-semibold text-[var(--text-primary)]">
                  {pairSymbol}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  Perp
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
              {isModalOpen && pairAnchor && (
                <TradingPairDropdown
                  pairs={(livePairs ?? []) as PairRow[]}
                  currentPair={currentPair}
                  onSelectPair={handleSelectPair}
                  changeLabel={livePairs ? 'Change (win)' : undefined}
                  anchor={pairAnchor}
                  onClose={() => setIsModalOpen(false)}
                  defaultTab="perp"
                />
              )}
              </div>

              {/* Star */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`transition-colors shrink-0 ${isFavorite ? 'text-yellow-500' : 'text-[var(--text-tertiary)] hover:text-yellow-500'}`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Price Info - 两行显示 */}
              <div className="flex flex-col shrink-0">
                <span className={`text-lg font-bold ${priceChangeColor}`}>
                  {liveStats ? fmtAny(liveStats.price) : '—'}
                </span>
                <span className={`text-xs ${priceChangeColor}`}>
                  {dispChange === null ? '—' : `${priceChangeSign}${dispChange.toFixed(2)}%`}
                </span>
              </div>

              {/* Stats - 两行显示 */}
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">{liveStats ? 'High (win)' : 'High'}</span>
                  <span className="text-[var(--text-primary)] font-medium">{liveStats ? fmtAny(liveStats.high) : '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">{liveStats ? 'Low (win)' : 'Low'}</span>
                  <span className="text-[var(--text-primary)] font-medium">{liveStats ? fmtAny(liveStats.low) : '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">{liveStats ? 'Vol (win)' : 'Vol'}</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {liveStats
                      ? `${liveStats.vol < 1 ? liveStats.vol.toPrecision(3) : liveStats.vol.toFixed(2)} ${quoteToken}`
                      : '—'}
                  </span>
                </div>
                {/* Funding/Countdown are mock constants — hide them while the
                    chart shows real on-chain data (no real funding feed yet). */}
                {!liveStats && (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[var(--text-tertiary)]">Funding</span>
                      <span className="text-[#0ECB81] font-medium">+0.01%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[var(--text-tertiary)]">Countdown</span>
                      <span className="text-[var(--text-primary)] font-medium">02:34:12</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-0 bg-[var(--bg-secondary)] overflow-hidden">
            <TradingViewChart
              selectedPair={currentPair}
              candleData={candleData}
              timeFrame={timeFrame}
              onTimeFrameChange={setTimeFrame}
            />
          </div>
          
          {/* Orders Panel */}
          <div className="h-[160px] bg-[var(--bg-secondary)] overflow-hidden">
            <OrdersPanel connected={connected} publicKey={publicKey ?? ""} />
          </div>
        </div>

        {/* Right - Trading Form */}
        <div className="w-[320px] bg-[var(--bg-secondary)] overflow-hidden hidden md:block">
          <PerpsTradingForm
            selectedPair={currentPair}
            connected={connected} publicKey={publicKey ?? ""}
            connectWallet={connectWallet}
          />
        </div>
      </div>

      {/* Mobile Trading Buttons */}
      <div className="md:hidden fixed bottom-[52px] left-0 right-0 p-3 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setMobileFormSide('open');
              setMobileFormOpen(true);
            }}
            className="flex-1 h-10 rounded-full text-sm font-normal bg-[#25A750] text-white hover:bg-[#25A750]/90 transition-colors"
          >
            Open
          </button>
          <button
            onClick={() => {
              setMobileFormSide('close');
              setMobileFormOpen(true);
            }}
            className="flex-1 h-10 rounded-full text-sm font-normal bg-[#CA3F64] text-white hover:bg-[#CA3F64]/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mobile Trading Form */}
      <MobilePerpTradingForm
        isOpen={mobileFormOpen}
        onClose={() => setMobileFormOpen(false)}
        selectedPair={currentPair}
        connected={connected} publicKey={publicKey ?? ""}
        connectWallet={connectWallet}
        initialMode={mobileFormSide}
      />
    </div>
  );
};

export default PerpsTradingPage;
