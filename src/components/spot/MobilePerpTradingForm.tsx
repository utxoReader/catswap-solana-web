import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TradingPair } from "../../types"; '../../types';
import { CalculatorModal } from './CalculatorModal';

interface MobilePerpTradingFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPair: TradingPair;
  connected: boolean;
  publicKey: string;
  connectWallet: () => void;
  initialMode?: 'open' | 'close';
}

type OrderType = 'limit' | 'market';

export const MobilePerpTradingForm: React.FC<MobilePerpTradingFormProps> = ({
  isOpen,
  onClose,
  selectedPair,
  connected,
  connectWallet,
  initialMode = 'open',
}) => {
  const [mode, setMode] = useState<'open' | 'close'>(initialMode);
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [price, setPrice] = useState(selectedPair.price.toFixed(2));
  const [amount, setAmount] = useState('');
  const [leverage] = useState(100);
  const [sliderValue, setSliderValue] = useState(0);
  const [showSliderTooltip, setShowSliderTooltip] = useState(false);
  const [tpslEnabled, setTpslEnabled] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const baseToken = selectedPair.symbol.split('/')[0];
  const quoteToken = selectedPair.symbol.split('/')[1] || 'USDT';

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const maxAmount = 1;
    setAmount((maxAmount * value / 100).toFixed(6));
  };

  if (!isOpen) return null;

  const isOpenMode = mode === 'open';

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-secondary)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
        <span className="text-base font-semibold text-[var(--text-primary)]">Place order</span>
        <button onClick={onClose} className="p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Open/Close Toggle */}
          <div className="p-1 rounded-lg bg-[var(--bg-tertiary)]">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setMode('open')}
                className={`py-2.5 text-sm font-semibold rounded-md transition-colors ${
                  isOpenMode
                    ? 'bg-[var(--color-success)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setMode('close')}
                className={`py-2.5 text-sm font-semibold rounded-md transition-colors ${
                  !isOpenMode
                    ? 'bg-[var(--color-danger)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Close
              </button>
            </div>
          </div>

          {/* Margin & Leverage */}
          <div className="flex gap-2">
            <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] flex items-center justify-center gap-2 bg-[var(--bg-tertiary)]">
              <span>Cross</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md border border-[var(--border-primary)] text-[var(--color-buy)] flex items-center justify-center gap-2 bg-[var(--bg-tertiary)]">
              <span>{leverage}x</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Order Type Tabs */}
          <div className="flex gap-4 border-b border-[var(--border-primary)]">
            {(['limit', 'market'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`pb-2 text-sm font-medium transition-colors relative ${
                  orderType === type
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {orderType === type && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
                )}
              </button>
            ))}
            <button className="pb-2 text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1">
              TP/SL
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm text-[var(--text-primary)] mb-1.5">Price ({quoteToken})</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-base bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                  placeholder="0.00"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                  <button className="p-0.5 hover:bg-[var(--bg-quaternary)] rounded">
                    <svg className="w-3 h-3 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button className="p-0.5 hover:bg-[var(--bg-quaternary)] rounded">
                    <svg className="w-3 h-3 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              <button className="px-4 py-3 rounded-md text-sm font-medium border border-[var(--border-primary)] text-[var(--text-primary)] bg-[var(--bg-tertiary)]">
                BBO
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-[var(--text-primary)] mb-1.5">
              Amount ({baseToken})
              <svg className="w-3 h-3 inline ml-1 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </label>
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
          </div>

          {/* Slider + % box (layout per boss ref; theme tokens) */}
          <div className="py-2">
            <div className="flex items-center gap-3">
              <div className="relative h-1 bg-[var(--bg-quaternary)] rounded-full mx-1.5 flex-1">
              {/* Progress bar - adjusted to not overflow */}
              <div
                className="absolute h-full rounded-full bg-[var(--text-primary)]"
                style={{ 
                  width: `calc(${sliderValue}% * 0.97 + 1.5%)`,
                  left: '0%'
                }}
              />
              
              {/* Custom Thumb - Smaller, with proper boundary */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--text-primary)] pointer-events-none ${
                  showSliderTooltip ? 'w-3 h-3' : 'w-2 h-2'
                }`}
                style={{ 
                  left: `calc(${sliderValue}% * 0.97 + 1.5% - ${showSliderTooltip ? 6 : 4}px)` 
                }}
              />
              
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
                className="absolute -inset-x-1.5 -inset-y-2 w-[calc(100%+12px)] h-5 opacity-0 cursor-pointer"
              />
              
              {/* Percentage Tooltip */}
              {showSliderTooltip && (
                <div
                  className="absolute -top-9 px-2 py-1 bg-[var(--bg-tooltip)] text-white text-xs font-medium rounded pointer-events-none"
                  style={{ left: `calc(${sliderValue}% * 0.97 + 1.5% - 16px)` }}
                >
                  {Math.round(sliderValue)}%
                </div>
              )}
              
              {/* Slider marks - Hollow circles, positioned within bounds */}
              <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <div
                    key={pct}
                    className={`w-1.5 h-1.5 rounded-full border transition-colors ${
                      sliderValue >= pct 
                        ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' 
                        : 'bg-[var(--bg-secondary)] border-[var(--bg-quaternary)]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="px-3 py-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] min-w-[64px] text-center">
              {Math.round(sliderValue)} %
            </div>
          </div>
          </div>

          {/* Position Info */}
          {isOpenMode ? (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Max long 0.0000 {baseToken}</span>
              <span className="text-[var(--text-secondary)]">Max short 0.0000 {baseToken}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <div className="text-[var(--text-secondary)]">
                <div>Short positions 0.0000 {baseToken}</div>
                <div>Available 0.0000 {baseToken}</div>
              </div>
              <div className="text-right text-[var(--text-secondary)]">
                <div>Long positions 0.0000 {baseToken}</div>
                <div>Available 0.0000 {baseToken}</div>
              </div>
            </div>
          )}

          {/* TP/SL Checkbox */}
          <button
            onClick={() => setTpslEnabled(!tpslEnabled)}
            className="flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
              tpslEnabled 
                ? 'bg-[var(--text-primary)]' 
                : 'bg-[var(--bg-tertiary)] border border-[var(--border-primary)]'
            }`}>
              {tpslEnabled && (
                <svg className="w-3 h-3 text-[var(--bg-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-sm text-[var(--text-primary)]">TP/SL</span>
          </button>

          {/* Action Buttons */}
          {connected ? (
            <div className="space-y-3">
              {/* Long & Short Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {isOpenMode ? (
                  <>
                    <button
                      className="w-full py-3 rounded-full text-base font-semibold bg-[var(--color-success)] text-white"
                      disabled={!amount || parseFloat(amount) <= 0}
                    >
                      Long
                    </button>
                    <button
                      className="w-full py-3 rounded-full text-base font-semibold bg-[var(--color-danger)] text-white"
                      disabled={!amount || parseFloat(amount) <= 0}
                    >
                      Short
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full py-3 rounded-full text-base font-semibold bg-[var(--color-success)] text-white"
                    >
                      Close short
                    </button>
                    <button
                      className="w-full py-3 rounded-full text-base font-semibold bg-[var(--color-danger)] text-white"
                    >
                      Close long
                    </button>
                  </>
                )}
              </div>

              {/* Cost Info */}
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Cost -- {quoteToken}</span>
                <span>Cost -- {quoteToken}</span>
              </div>

              {/* Price Info */}
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Max price --</span>
                <span>Min price --</span>
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full py-4 rounded-full text-base font-semibold bg-[var(--text-primary)] text-[var(--bg-primary)]"
            >
              Connect Wallet
            </button>
          )}

          {/* Bottom Links */}
          <div className="flex gap-6 pt-4 border-t border-[var(--border-primary)]">
            <button 
              onClick={() => setShowCalculator(true)}
              className="flex items-center gap-1 text-sm text-[var(--text-secondary)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculator
            </button>
            <button className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fees
            </button>
            <button className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Position builder
            </button>
          </div>
        </div>
      </div>

      {/* Calculator Modal */}
      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        selectedPair={selectedPair}
      />
    </div>
  );
};

export default MobilePerpTradingForm;
