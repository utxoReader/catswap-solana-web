import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { TradingPair } from "../../types";
import { Select } from "../ui/Select";
import { CalculatorModal } from './CalculatorModal';
import { useUserAccount } from "../../hooks/useUserAccount";
import { usePerp } from "../../hooks/usePerp";


type OrderType = 'limit' | 'market' | 'tpsl';
type Mode = 'open' | 'close';

interface PerpsTradingFormProps {
  selectedPair: TradingPair;
  connected: boolean;
  publicKey: string;
  connectWallet: () => void;
}

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 30, 50, 75, 100];

export const PerpsTradingForm: React.FC<PerpsTradingFormProps> = ({
  selectedPair,
  connected,
  connectWallet,
}) => {
  const [mode, setMode] = useState<Mode>('open');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [showTpslMenu, setShowTpslMenu] = useState(false);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [tpTriggerType, setTpTriggerType] = useState('last');
  const [tpslOrderType, setTpslOrderType] = useState('market');
  const [leverage, setLeverage] = useState(100);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [leverageInput, setLeverageInput] = useState('100');
  const [showSliderTooltip, setShowSliderTooltip] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const baseToken = selectedPair.symbol.split('/')[0];
  const quoteToken = selectedPair.symbol.split('/')[1] || 'USDC';

  // Set default price when pair changes
  useMemo(() => {
    setPrice(selectedPair.price.toFixed(2));
    setAmount('');
    setSliderValue(0);
  }, [selectedPair]);

  

  // On-chain margin balance
  const { userAccount } = useUserAccount();
  const { openPerp, closePerp, loading: perpLoading, error: perpError, txSig: perpTxSig } = usePerp();

  const marginBalance = userAccount ? userAccount.margin.toNumber() / 1e6 : 0;

  const maxAmount = useMemo(() => {
    const availableMargin = marginBalance * leverage;
    const p = orderType === 'market' ? selectedPair.price : parseFloat(price || selectedPair.price.toString());
    return p > 0 ? availableMargin / p : 0;
  }, [orderType, price, selectedPair.price, marginBalance, leverage]);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (maxAmount > 0) {
      const newAmount = (maxAmount * value) / 100;
      setAmount(newAmount.toFixed(6));
    }
  };

  const handleAmountChange = (value: string) => {
    // 禁止输入负数
    if (value.startsWith('-')) return;
    setAmount(value);
    const numValue = parseFloat(value);
    if (maxAmount > 0 && !isNaN(numValue) && numValue >= 0) {
      setSliderValue(Math.min((numValue / maxAmount) * 100, 100));
    }
  };

  

  const isOpenMode = mode === 'open';

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
      {/* Open/Close Toggle */}
      <div className="p-3 border-b border-[var(--border-primary)]">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)]">
          <button
            onClick={() => setMode('open')}
            className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
              isOpenMode
                ? 'bg-[#25A750] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setMode('close')}
            className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
              !isOpenMode
                ? 'bg-[#CA3F64] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Close
          </button>
        </div>
      </div>

      {/* Margin & Leverage Row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-primary)]">
        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-quaternary)] transition-colors">
          Cross
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={() => setShowLeverageModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-quaternary)] transition-colors"
        >
          {leverage}x
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Order Type Tabs */}
        <div className="flex items-center gap-1 px-3 border-b border-[var(--border-primary)]">
          {(['limit', 'market'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`relative px-3 py-2 text-xs font-medium transition-colors capitalize ${
                orderType === type
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {type}
              {orderType === type && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
              )}
            </button>
          ))}
          {/* TP/SL dropdown (OKX perp order-type list; unsupported items grayed) */}
          <div className="relative">
            <button
              onClick={() => setShowTpslMenu(!showTpslMenu)}
              className={`relative px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                orderType === 'tpsl'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              TP/SL
              <ChevronDown className={`w-3 h-3 transition-transform ${showTpslMenu ? 'rotate-180' : ''}`} />
            </button>
            {showTpslMenu && (
              <div className="absolute top-full left-0 mt-1 py-1 min-w-[160px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-lg z-50">
                <button
                  onClick={() => { setOrderType('tpsl'); setShowTpslMenu(false); }}
                  className="w-full text-left px-4 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  TP/SL
                </button>
                {['Trailing stop', 'Advanced limit', 'Trigger', 'Scaled order', 'Chase order'].map((label) => (
                  <div key={label} className="px-4 py-2 text-xs text-[var(--text-primary)] opacity-60 cursor-not-allowed" title="即将上线">
                    {label}
                  </div>
                ))}
                {['Slicing bots', 'Iceberg', 'TWAP'].map((label) => (
                  <div key={label} className="px-4 py-2 text-xs text-[var(--text-tertiary)] cursor-not-allowed" title="即将上线">
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Price Input */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                Price ({quoteToken})
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                    placeholder="0.00"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
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
                <button
                  className="px-3 py-2 text-xs font-medium rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] bg-[var(--bg-tertiary)]"
                  title="一键把限价填成当前市价"
                  onClick={() => setPrice(selectedPair.price.toFixed(2))}
                >
                  最优价
                </button>
              </div>
            </div>
          )}

          {orderType === 'tpsl' && (
            <>
              <div className="text-xs text-[var(--text-secondary)]">Conditional/OCO</div>
              <button className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] text-left">
                Conditional
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5 border-b border-dashed border-[var(--text-tertiary)] w-fit">
                    Trigger price(USDC)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                    Trigger price type
                  </label>
                  <Select
                    value={tpTriggerType}
                    onChange={setTpTriggerType}
                    options={[
                      { value: 'last', label: 'Last' },
                      { value: 'mark', label: 'Mark', disabled: true },
                    ]}
                  />
                </div>
              </div>
              <Select
                value={tpslOrderType}
                onChange={setTpslOrderType}
                options={[
                  { value: 'market', label: 'Market order (USDC)' },
                  { value: 'limit', label: 'Limit order (USDC)', disabled: true },
                ]}
              />
            </>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              Amount ({baseToken})
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={`Min 0.00001 ${baseToken}`}
                className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16 placeholder:text-[var(--text-tertiary)]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
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

          {/* Position Info */}
          {isOpenMode ? (
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Max long 0.0000 {baseToken}</span>
              <span>Max short 0.0000 {baseToken}</span>
            </div>
          ) : (
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <div>
                <div>Short positions 0.0000 {baseToken}</div>
                <div>Available 0.0000 {baseToken}</div>
              </div>
              <div className="text-right">
                <div>Long positions 0.0000 {baseToken}</div>
                <div>Available 0.0000 {baseToken}</div>
              </div>
            </div>
          )}

          {/* Perp status feedback */}
          {perpError && (
            <div className="text-xs text-[var(--color-sell)] mb-1 break-all">{perpError}</div>
          )}
          {perpTxSig && (
            <div className="text-xs text-[var(--color-buy)] mb-1">
              Confirmed: {perpTxSig.slice(0, 8)}...
            </div>
          )}

          {/* Action Buttons */}
          {connected ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {isOpenMode ? (
                  <>
                    <button
                      className="w-full h-10 rounded-full text-sm font-normal bg-[#25A750] text-white hover:bg-[#25A750]/90 transition-colors"
                      disabled={!amount || parseFloat(amount) <= 0 || perpLoading}
                      onClick={async () => {
                        const amt = parseFloat(amount || '0');
                        if (amt <= 0) return;
                        const p = orderType === 'market' ? selectedPair.price : parseFloat(price || '0');
                        const marginIn = (amt * p) / leverage;
                        await openPerp({ isLong: true, marginIn, leverageX100: leverage });
                      }}
                    >
                      {perpLoading ? 'Opening...' : 'Long'}
                    </button>
                    <button
                      className="w-full h-10 rounded-full text-sm font-normal bg-[#CA3F64] text-white hover:bg-[#CA3F64]/90 transition-colors"
                      disabled={!amount || parseFloat(amount) <= 0 || perpLoading}
                      onClick={async () => {
                        const amt = parseFloat(amount || '0');
                        if (amt <= 0) return;
                        const p = orderType === 'market' ? selectedPair.price : parseFloat(price || '0');
                        const marginIn = (amt * p) / leverage;
                        await openPerp({ isLong: false, marginIn, leverageX100: leverage });
                      }}
                    >
                      {perpLoading ? 'Opening...' : 'Short'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full h-10 rounded-full text-sm font-normal bg-[#25A750] text-white hover:bg-[#25A750]/90 transition-colors"
                      disabled={!amount || parseFloat(amount) <= 0 || perpLoading}
                      onClick={async () => {
                        const amt = parseFloat(amount || '0');
                        if (amt <= 0) return;
                        await closePerp({ isLong: false, size: amt });
                      }}
                    >
                      {perpLoading ? 'Closing...' : 'Close short'}
                    </button>
                    <button
                      className="w-full h-10 rounded-full text-sm font-normal bg-[#CA3F64] text-white hover:bg-[#CA3F64]/90 transition-colors"
                      disabled={!amount || parseFloat(amount) <= 0 || perpLoading}
                      onClick={async () => {
                        const amt = parseFloat(amount || '0');
                        if (amt <= 0) return;
                        await closePerp({ isLong: true, size: amt });
                      }}
                    >
                      {perpLoading ? 'Closing...' : 'Close long'}
                    </button>
                  </>
                )}
              </div>

              {/* Cost Info */}
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Cost -- {quoteToken}</span>
                <span>Cost -- {quoteToken}</span>
              </div>

              {/* Price Info */}
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Max price --</span>
                <span>Min price --</span>
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full h-10 rounded-full text-sm font-normal bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </button>
          )}

          {/* Bottom Links */}
          <div className="flex gap-4 pt-2 border-t border-[var(--border-primary)]">
            <button 
              onClick={() => setShowCalculator(true)}
              className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculator
            </button>
            <button className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fees
            </button>
            <button className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Position builder
            </button>
          </div>
        </div>
      </div>

      {/* Leverage Modal */}
      {showLeverageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[360px] bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]" style={{ boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Adjust leverage</span>
              <button
                onClick={() => setShowLeverageModal(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Leverage Input */}
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-2">Leverage</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={leverageInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setLeverageInput(val);
                    }}
                    onBlur={() => {
                      let val = parseInt(leverageInput) || 1;
                      val = Math.min(Math.max(val, 1), 100);
                      setLeverage(val);
                      setLeverageInput(String(val));
                    }}
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">x</span>
                </div>
              </div>

              {/* Leverage Options */}
              <div className="flex flex-wrap gap-2">
                {LEVERAGE_OPTIONS.map((lev) => (
                  <button
                    key={lev}
                    onClick={() => {
                      setLeverage(lev);
                      setLeverageInput(String(lev));
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      leverage === lev
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>

              {/* Info */}
              <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Max position size at adjusted leverage</span>
                  <span className="text-[var(--text-primary)]">0.0000 {baseToken}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margin required</span>
                  <span className="text-[var(--text-primary)]">0 {quoteToken}</span>
                </div>
              </div>

              {/* Warning */}
              {leverage >= 50 && (
                <div className="text-xs text-[#F6465D]">
                  High leverage. Please trade with caution.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-primary)]">
              <button
                onClick={() => {
                  setLeverageInput(String(leverage));
                  setShowLeverageModal(false);
                }}
                className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  let val = parseInt(leverageInput) || 1;
                  val = Math.min(Math.max(val, 1), 100);
                  setLeverage(val);
                  setLeverageInput(String(val));
                  setShowLeverageModal(false);
                }}
                className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        selectedPair={selectedPair}
      />
    </div>
  );
};

export default PerpsTradingForm;
