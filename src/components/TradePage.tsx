import { useState, useMemo } from 'react';
import { ChevronDown, Search, Star } from 'lucide-react';
import { TradingPair } from '../types';
import { tradingPairs, generateCandleData } from '../data/mockData';
import {
  PairListPanel,
  ChartPanel,
  TradingFormPanel,
} from './trade';

type TimeFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
type ActiveTab = 'chart' | 'form' | 'pairs';

export const TradePage: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<TradingPair>(tradingPairs[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1H');
  const [activeTab, setActiveTab] = useState<ActiveTab>('chart');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');

  const candleData = useMemo(
    () => generateCandleData(selectedPair.price),
    [selectedPair]
  );

  const filteredPairs = useMemo(() => {
    return tradingPairs.filter(
      (pair) =>
        pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectPair = (pair: TradingPair) => {
    setSelectedPair(pair);
  };

  // Pair Header Component
  const PairHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 hover:bg-[var(--bg-tertiary)] px-2 py-1 rounded transition-colors">
          <Star className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-base font-semibold text-[var(--text-primary)]">
            {selectedPair.symbol}
          </span>
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
        <div className="hidden sm:flex items-center gap-4">
          <span className={`text-lg font-bold ${selectedPair.change24h >= 0 ? 'text-[var(--color-buy)]' : 'text-[var(--color-sell)]'}`}>
            ${selectedPair.price.toLocaleString()}
          </span>
          <span className={`text-sm ${selectedPair.change24h >= 0 ? 'text-[var(--color-buy)]' : 'text-[var(--color-sell)]'}`}>
            {selectedPair.change24h >= 0 ? '+' : ''}{selectedPair.change24h}%
          </span>
        </div>
      </div>
      
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden items-center gap-1 bg-[var(--bg-tertiary)] rounded-md p-1">
        {[
          { id: 'chart' as ActiveTab, label: 'Chart' },
          { id: 'form' as ActiveTab, label: 'Trade' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] bg-[var(--bg-primary)]">
      <PairHeader />
      
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr_360px] h-[calc(100%-57px)]">
        {/* Left: Pair List */}
        <div className="border-r border-[var(--border-primary)] overflow-hidden">
          <div className="p-3 border-b border-[var(--border-primary)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search pair"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm rounded-md pl-9 pr-3 py-2 outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-53px)]">
            <PairListPanel
              pairs={filteredPairs}
              selectedPair={selectedPair}
              onSelectPair={handleSelectPair}
            />
          </div>
        </div>

        {/* Center: Chart */}
        <div className="border-r border-[var(--border-primary)]">
          <ChartPanel
            selectedPair={selectedPair}
            candleData={candleData}
            timeFrame={timeFrame}
            onTimeFrameChange={setTimeFrame}
          />
        </div>

        {/* Right: Trading Form */}
        <div className="overflow-hidden">
          <TradingFormPanel
            selectedPair={selectedPair}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
          />
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:grid md:grid-cols-[240px_1fr] lg:hidden h-[calc(100%-57px)]">
        <div className="border-r border-[var(--border-primary)] overflow-hidden">
          <div className="p-3 border-b border-[var(--border-primary)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm rounded-md pl-9 pr-3 py-2 outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>
          <PairListPanel
            pairs={filteredPairs}
            selectedPair={selectedPair}
            onSelectPair={handleSelectPair}
          />
        </div>
        <div className="grid grid-rows-[1fr_300px]">
          <ChartPanel
            selectedPair={selectedPair}
            candleData={candleData}
            timeFrame={timeFrame}
            onTimeFrameChange={setTimeFrame}
          />
          <TradingFormPanel
            selectedPair={selectedPair}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-[calc(100%-57px)] overflow-hidden">
        {activeTab === 'chart' && (
          <ChartPanel
            selectedPair={selectedPair}
            candleData={candleData}
            timeFrame={timeFrame}
            onTimeFrameChange={setTimeFrame}
          />
        )}
        {activeTab === 'form' && (
          <TradingFormPanel
            selectedPair={selectedPair}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
          />
        )}
      </div>
    </div>
  );
};

export default TradePage;
