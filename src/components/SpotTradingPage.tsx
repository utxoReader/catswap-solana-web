import React, { useEffect, useMemo, useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { useDemoPoolKlines } from '../hooks/useDemoPoolKlines';
import { DEMO_POOLS } from '../lib/demoPools';
import { TradingPair } from '../types';
import { tradingPairs, generateCandleData } from '../data/mockData';
import { TradingViewChart, SpotTradingForm } from './spot';
import { TradingPairDropdown, PairRow } from './spot/TradingPairDropdown';
import { MobileTradingForm } from './spot/MobileTradingForm';
import { OrdersPanel } from './spot/OrdersPanel';

type TimeFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

interface SpotTradingPageProps {
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

export const SpotTradingPage: React.FC<SpotTradingPageProps> = ({
  connected,
  publicKey,
  connectWallet,
  selectedPair: initialPair = 'BTC/USDC',
}) => {
  const [selectedPair, setSelectedPair] = useState<TradingPair>(() => {
    const found = tradingPairs.find(p => p.symbol === initialPair);
    return found || tradingPairs[0];
  });
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('15m');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pairAnchor, setPairAnchor] = useState<{ top: number; left: number } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [mobileFormSide, setMobileFormSide] = useState<'buy' | 'sell'>('buy');

  useEffect(() => {
    const found = tradingPairs.find(p => p.symbol === initialPair);
    if (found) {
      setSelectedPair(found);
    }
  }, [initialPair]);

  const mockCandleData = useMemo(() => generateCandleData(selectedPair.price), [selectedPair]);

  // Real on-chain klines for the three demo pools (shared hook — same data
  // source feeds the perps page); falls back to mock when RPC is unreachable.
  const { poolKlines, livePairs } = useDemoPoolKlines(timeFrame);

  // Which demo pool the chart is showing. Default: env pool match, else stock
  // (it has the densest real trade history).
  const [activePoolKey, setActivePoolKey] = useState<string>(() => {
    const envPool = import.meta.env.VITE_POOL_ADDRESS;
    const found = DEMO_POOLS.find(c => c.pool === envPool);
    return (found ?? DEMO_POOLS[1]).key;
  });
  const activePoolIdx = Math.max(0, DEMO_POOLS.findIndex(c => c.key === activePoolKey));
  const activeKline = poolKlines[activePoolIdx];
  const { candles: liveCandles, isLive, settled } = activeKline;
  // Mock fallback ONLY after the first fetch settled with no live data —
  // otherwise hard refresh flashes mock BTC before the RPC responds.
  const showMock = settled && !isLive;
  const candleData = isLive && liveCandles.length > 0 ? liveCandles : (showMock ? mockCandleData : []);

  // Live-pool header stats: when the chart shows on-chain data, the pair bar
  // must show the same pool's identity/stats, not the mock BTC pair.
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

  const pairSymbol = showMock ? selectedPair.symbol : DEMO_POOLS[activePoolIdx].symbol;
  const baseToken = pairSymbol.split('/')[0];
  const quoteToken = pairSymbol.split('/')[1] || 'USDC';
  const dispChange = liveStats ? liveStats.change : showMock ? selectedPair.change24h : null;
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
    livePairs?.find(p => p.id === activePoolKey) ?? selectedPair;

  return (
    <div className="h-[calc(100vh-68px)] bg-[var(--bg-primary)] flex flex-col gap-px lg:gap-[3px]">
      {/* Main Content - 模块 3 & 4 */}
      <div className="flex-1 flex gap-px lg:gap-[3px] min-h-0">
        {/* Left - Pair Info + Chart + Orders Panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-px lg:gap-[3px]">
          {/* Pair Info Bar - 只在左侧显示 */}
          <div className="bg-[var(--bg-secondary)] px-4 py-2">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
              {/* Pair Selector — asterdex-style hover dropdown */}
              <div
                className="relative shrink-0"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  // Flush against the ticker — any gap lets the pointer cross
                  // non-descendant space, firing mouseleave and closing the
                  // dropdown before the user reaches the list.
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
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
              {isModalOpen && pairAnchor && (
                <TradingPairDropdown
                  pairs={(livePairs ?? tradingPairs) as PairRow[]}
                  currentPair={currentPair}
                  onSelectPair={handleSelectPair}
                  changeLabel={livePairs ? 'Change (win)' : undefined}
                  anchor={pairAnchor}
                  onClose={() => setIsModalOpen(false)}
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
                  {liveStats ? fmtAny(liveStats.price) : showMock ? formatPrice(selectedPair.price) : '—'}
                </span>
                <span className={`text-xs ${priceChangeColor}`}>
                  {dispChange === null ? '—' : `${priceChangeSign}${dispChange.toFixed(2)}%`}
                </span>
              </div>

              {/* Stats - 两行显示 */}
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">{liveStats ? 'High (win)' : showMock ? '24h High' : 'High'}</span>
                  <span className="text-[var(--text-primary)] font-medium">{liveStats ? fmtAny(liveStats.high) : showMock ? formatPrice(selectedPair.high24h) : '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">{liveStats ? 'Low (win)' : showMock ? '24h Low' : 'Low'}</span>
                  <span className="text-[var(--text-primary)] font-medium">{liveStats ? fmtAny(liveStats.low) : showMock ? formatPrice(selectedPair.low24h) : '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">{liveStats ? 'Vol (win)' : showMock ? '24h Vol' : 'Vol'}</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {liveStats
                      ? `${liveStats.vol < 1 ? liveStats.vol.toPrecision(3) : liveStats.vol.toFixed(2)} ${quoteToken}`
                      : showMock ? `${(selectedPair.volume24h / 1e9).toFixed(2)}B ${quoteToken}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="relative flex-1 min-h-0 bg-[var(--bg-secondary)] overflow-hidden">
            <TradingViewChart
              selectedPair={selectedPair}
              candleData={candleData}
              timeFrame={timeFrame}
              onTimeFrameChange={setTimeFrame}
            />
            {/* Data source badge */}
            <span
              className={`absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                isLive && liveCandles.length > 0
                  ? 'text-[#0ECB81] border-[#0ECB81]/40 bg-[#0ECB81]/10'
                  : 'text-[var(--text-tertiary)] border-[var(--border-primary)] bg-[var(--bg-tertiary)]'
              }`}
            >
              {isLive && liveCandles.length > 0 ? 'ON-CHAIN' : 'MOCK'}
            </span>
          </div>
          
          {/* Orders Panel */}
          <div className="h-[160px] bg-[var(--bg-secondary)] overflow-hidden">
            <OrdersPanel connected={connected} publicKey={publicKey ?? ""} />
          </div>
        </div>

        {/* Right - Trading Form */}
        <div className="w-[320px] bg-[var(--bg-secondary)] overflow-hidden hidden md:block">
          <SpotTradingForm
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
              setMobileFormSide('buy');
              setMobileFormOpen(true);
            }}
            className="flex-1 h-10 rounded-full text-sm font-normal bg-[#25A750] text-white hover:bg-[#25A750]/90 transition-colors"
          >
            Buy {baseToken}
          </button>
          <button
            onClick={() => {
              setMobileFormSide('sell');
              setMobileFormOpen(true);
            }}
            className="flex-1 h-10 rounded-full text-sm font-normal bg-[#CA3F64] text-white hover:bg-[#CA3F64]/90 transition-colors"
          >
            Sell {baseToken}
          </button>
        </div>
      </div>

      {/* Mobile Trading Form */}
      <MobileTradingForm
        isOpen={mobileFormOpen}
        onClose={() => setMobileFormOpen(false)}
        selectedPair={currentPair}
        connected={connected} publicKey={publicKey ?? ""}
        connectWallet={connectWallet}
        initialSide={mobileFormSide}
      />
    </div>
  );
};

export default SpotTradingPage;
