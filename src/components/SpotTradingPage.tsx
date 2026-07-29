import React, { useEffect, useMemo, useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { TradingPair } from '../types';
import { tradingPairs, generateCandleData } from '../data/mockData';
import { TradingPairModal, TradingViewChart, SpotTradingForm } from './spot';
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [mobileFormSide, setMobileFormSide] = useState<'buy' | 'sell'>('buy');

  useEffect(() => {
    const found = tradingPairs.find(p => p.symbol === initialPair);
    if (found) {
      setSelectedPair(found);
    }
  }, [initialPair]);

  const candleData = useMemo(() => generateCandleData(selectedPair.price), [selectedPair]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTokenIcon = (symbol: string) => TOKEN_ICONS[symbol.split('/')[0]] || symbol[0];
  const getTokenColor = (symbol: string) => TOKEN_COLORS[symbol.split('/')[0]] || '#888';

  const baseToken = selectedPair.symbol.split('/')[0];
  const quoteToken = selectedPair.symbol.split('/')[1] || 'USDC';
  const priceChangeColor = selectedPair.change24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]';
  const priceChangeSign = selectedPair.change24h >= 0 ? '+' : '';

  return (
    <div className="h-[calc(100vh-68px)] bg-[var(--bg-primary)] flex flex-col gap-px lg:gap-[3px]">
      {/* Main Content - 模块 3 & 4 */}
      <div className="flex-1 flex gap-px lg:gap-[3px] min-h-0">
        {/* Left - Pair Info + Chart + Orders Panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-px lg:gap-[3px]">
          {/* Pair Info Bar - 只在左侧显示 */}
          <div className="bg-[var(--bg-secondary)] px-4 py-2">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
              {/* Pair Selector */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 hover:bg-[var(--bg-tertiary)] px-2 py-1 rounded transition-colors shrink-0"
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getTokenColor(selectedPair.symbol) }}
                >
                  {getTokenIcon(selectedPair.symbol)}
                </div>
                <span className="text-base font-semibold text-[var(--text-primary)]">
                  {selectedPair.symbol}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>

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
                  {formatPrice(selectedPair.price)}
                </span>
                <span className={`text-xs ${priceChangeColor}`}>
                  {priceChangeSign}{selectedPair.change24h}%
                </span>
              </div>

              {/* Stats - 两行显示 */}
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">24h High</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatPrice(selectedPair.high24h)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">24h Low</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatPrice(selectedPair.low24h)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--text-tertiary)]">24h Vol</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {(selectedPair.volume24h / 1e9).toFixed(2)}B {quoteToken}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-0 bg-[var(--bg-secondary)] overflow-hidden">
            <TradingViewChart
              selectedPair={selectedPair}
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
          <SpotTradingForm
            selectedPair={selectedPair}
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
            className="flex-1 py-3 bg-[var(--color-success)] text-black text-sm font-semibold rounded-md"
          >
            Buy {baseToken}
          </button>
          <button
            onClick={() => {
              setMobileFormSide('sell');
              setMobileFormOpen(true);
            }}
            className="flex-1 py-3 bg-[var(--color-danger)] text-white text-sm font-semibold rounded-md"
          >
            Sell {baseToken}
          </button>
        </div>
      </div>

      {/* Mobile Trading Form */}
      <MobileTradingForm
        isOpen={mobileFormOpen}
        onClose={() => setMobileFormOpen(false)}
        selectedPair={selectedPair}
        connected={connected} publicKey={publicKey ?? ""}
        connectWallet={connectWallet}
        initialSide={mobileFormSide}
      />

      {/* Trading Pair Modal */}
      <TradingPairModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPair={setSelectedPair}
        currentPair={selectedPair}
        allPairs={tradingPairs}
      />
    </div>
  );
};

export default SpotTradingPage;
