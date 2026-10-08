import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { TradingPair } from "../../types"; '../../types';

interface MobileTradingFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPair: TradingPair;
  connected: boolean;
  publicKey: string;
  connectWallet: () => void;
  initialSide?: 'buy' | 'sell';
}

type OrderType = 'limit' | 'market';

export const MobileTradingForm: React.FC<MobileTradingFormProps> = ({
  isOpen,
  onClose,
  selectedPair,
  connected,
  connectWallet,
  initialSide = 'buy',
}) => {
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>(initialSide);
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [price, setPrice] = useState(selectedPair.price.toFixed(2));
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [showSliderTooltip, setShowSliderTooltip] = useState(false);

  const baseToken = selectedPair.symbol.split('/')[0];
  const quoteToken = selectedPair.symbol.split('/')[1] || 'USDC';

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    // Mock: 假设最大可买 1 个 baseToken
    const maxAmount = 1;
    setAmount((maxAmount * value / 100).toFixed(6));
  };

  const total = useMemo(() => {
    const p = orderType === 'market' ? selectedPair.price : parseFloat(price || '0');
    const a = parseFloat(amount || '0');
    return p * a;
  }, [price, amount, orderType, selectedPair.price]);

  if (!isOpen) return null;

  const isBuy = orderSide === 'buy';
  const buttonColor = isBuy ? 'bg-[#25A750] hover:bg-[#25A750]/90' : 'bg-[#CA3F64] hover:bg-[#CA3F64]/90';
  const buttonText = isBuy ? 'Buy' : 'Sell';

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
        <span className="text-base font-semibold text-[var(--text-primary)]">{selectedPair.symbol}</span>
        <button onClick={onClose} className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-60px)]">
        {/* Buy/Sell Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[var(--bg-tertiary)]">
          <button
            onClick={() => setOrderSide('buy')}
            className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
              isBuy
                ? 'bg-[#25A750] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setOrderSide('sell')}
            className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
              !isBuy
                ? 'bg-[#CA3F64] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Order Type */}
        <div className="flex gap-2">
          {(['limit', 'market'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
                orderType === type
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-tertiary)]'
                  : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Price Input */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Price ({quoteToken})</label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-md text-base bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
                {quoteToken}
              </span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Amount ({baseToken})</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  setSliderValue(Math.min((val / 1) * 100, 100));
                }
              }}
              className="w-full px-4 py-3 rounded-md text-base bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">
              {baseToken}
            </span>
          </div>
        </div>

                {/* Slider — OKX spec: 2px track / 8px hollow clickable nodes / 16px hollow handle / drag tooltip */}
        <div className="py-2">
          <div className="relative h-[2px] rounded-[3px] bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.13)] mx-2">
            {/* Fill */}
            <div
              className="absolute left-0 h-full rounded-[3px] bg-[var(--text-primary)]"
              style={{ width: `calc(${sliderValue}% * 0.96 + 2%)` }}
            />
        
            {/* Drag input — expanded touch area, click anywhere to jump */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              onMouseDown={() => setShowSliderTooltip(true)}
              onMouseUp={() => setShowSliderTooltip(false)}
              onMouseEnter={() => setShowSliderTooltip(true)}
              onMouseLeave={() => setShowSliderTooltip(false)}
              onTouchStart={() => setShowSliderTooltip(true)}
              onTouchEnd={() => setShowSliderTooltip(false)}
              className="absolute -inset-x-2 -inset-y-2.5 w-[calc(100%+16px)] h-6 opacity-0 cursor-pointer"
            />
        
            {/* Handle — hollow circle, clearly bigger than nodes; grows while dragging */}
            <div
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)] pointer-events-none ${
                showSliderTooltip ? 'w-[11px] h-[11px]' : 'w-[9px] h-[9px]'
              }`}
              style={{ left: `calc(${sliderValue}% * 0.96 + 2%)` }}
            />
        
            {/* Percentage tooltip while dragging */}
            {showSliderTooltip && (
              <div
                className="absolute -top-9 px-2 py-1 bg-[var(--bg-tooltip)] text-white text-xs font-medium rounded pointer-events-none whitespace-nowrap"
                style={{ left: `calc(${sliderValue}% * 0.96 + 2%)`, transform: 'translateX(-50%)' }}
              >
                {Math.round(sliderValue)}%
              </div>
            )}
        
            {/* Nodes — 8px hollow circles; click = snap to exact step */}
            <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
              {[0, 25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleSliderChange(pct)}
                  aria-label={`${pct}%`}
                  className={`w-2 h-2 rounded-full border pointer-events-auto cursor-pointer transition-colors ${
                    sliderValue >= pct
                      ? 'bg-[var(--text-primary)] border-[var(--text-primary)]'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-active)]'
                  }`}
                />
              ))}
            </div>
          </div>
        
          {/* Percentage labels — clickable */}
          <div className="flex justify-between mt-2 mx-2">
            {['0%', '25%', '50%', '75%', '100%'].map((label, idx) => (
              <button
                key={label}
                onClick={() => handleSliderChange(idx * 25)}
                className={`text-[10px] transition-colors ${
                  sliderValue >= idx * 25 ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Available Balance */}
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Available</span>
          <span className="text-[var(--text-primary)]">
            {connected ? '10,000 USDC' : '--'}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between text-sm py-2 border-t border-[var(--border-primary)]">
          <span className="text-[var(--text-secondary)]">Total</span>
          <span className="text-[var(--text-primary)] font-medium">
            {total > 0 ? total.toFixed(2) : '--'} {quoteToken}
          </span>
        </div>

        {/* Action Button */}
        {connected ? (
          <button
            className={`w-full h-10 rounded-full text-sm font-normal transition-colors ${buttonColor} text-white`}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            {buttonText} {baseToken}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="w-full h-10 rounded-full text-sm font-normal bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileTradingForm;
