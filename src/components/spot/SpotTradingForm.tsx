import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { TradingPair } from "../../types";
import { Select } from "../ui/Select";
import { useUserAccount } from "../../hooks/useUserAccount";
import { useSwap } from "../../hooks/useSwap";

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market' | 'tpsl';

interface SpotTradingFormProps {
  selectedPair: TradingPair;
  connected: boolean;
  publicKey: string;
  connectWallet: () => void;
}

const MARGIN_LEVERAGE_OPTIONS = [1, 2, 3, 5, 10];

export const SpotTradingForm: React.FC<SpotTradingFormProps> = ({
  selectedPair,
  connected,
  connectWallet,
}) => {
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [showTpslMenu, setShowTpslMenu] = useState(false);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [condKind, setCondKind] = useState('conditional');
  const [tpslOrderType, setTpslOrderType] = useState('market');
  const [marginEnabled, setMarginEnabled] = useState(false);
  const [marginLeverage, setMarginLeverage] = useState(3);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [leverageInput, setLeverageInput] = useState('3');
  const [showSliderTooltip, setShowSliderTooltip] = useState(false);

  const baseToken = selectedPair.symbol.split('/')[0];
  const quoteToken = selectedPair.symbol.split('/')[1] || 'USDC';

  // Set default price when pair changes
  useMemo(() => {
    // Tiny on-chain prices (~1e-11) need significant digits, not 2dp ("0.00").
    setPrice(
      selectedPair.price > 0 && selectedPair.price < 0.01
        ? selectedPair.price.toPrecision(3)
        : selectedPair.price.toFixed(2)
    );
    setAmount('');
    setSliderValue(0);
  }, [selectedPair]);

  const total = useMemo(() => {
    const p = orderType === 'market' ? selectedPair.price : parseFloat(price || '0');
    const a = parseFloat(amount || '0');
    return p * a;
  }, [price, amount, orderType, selectedPair.price]);

  // On-chain balances (falls back to zeros when not connected)
  const { userAccount } = useUserAccount();
  const { swap: executeSwap, loading: swapLoading, error: swapError, txSig: swapTxSig } = useSwap();

  const baseBalance = userAccount ? userAccount.balance0.toNumber() / 1e8 : 0;
  const quoteBalance = userAccount ? userAccount.balance1.toNumber() / 1e6 : 0;

  const maxAmount = useMemo(() => {
    const leverage = marginEnabled ? marginLeverage : 1;
    if (orderSide === 'buy') {
      const availableQuote = quoteBalance * leverage;
      const p = orderType === 'market' ? selectedPair.price : parseFloat(price || selectedPair.price.toString());
      return p > 0 ? availableQuote / p : 0;
    } else {
      return baseBalance * leverage;
    }
  }, [orderSide, orderType, price, selectedPair.price, baseBalance, quoteBalance, marginEnabled, marginLeverage]);

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

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isBuy = orderSide === 'buy';
  // OKX desktop CTA spec: 40px high, radius-50 pill, 14px/400 font, buy green #25A750, sell red #CA3F64 (desktop tokens)
  const buttonColor = isBuy ? 'bg-[#25A750] hover:bg-[#25A750]/90' : 'bg-[#CA3F64] hover:bg-[#CA3F64]/90';
  const buttonTextColor = 'text-white';

  // Margin required when margin is enabled
  const marginRequired = marginEnabled ? total / marginLeverage : total;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
      {/* Header with Trade and Margin */}
      <div className="flex items-center gap-4 px-3 py-3 border-b border-[var(--border-primary)]">
        <span className="text-sm font-medium text-[var(--text-primary)]">Trade</span>
        
        {/* Margin Toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">Margin</span>
          <button
            onClick={() => setMarginEnabled(!marginEnabled)}
            className={`relative w-7 h-4 rounded-full transition-colors flex items-center ${
              marginEnabled
                ? 'bg-[var(--text-primary)]'
                : 'bg-[#DADDE1] dark:bg-[#4A4A4A]'
            }`}
          >
            <span
              className={`absolute w-3 h-3 rounded-full bg-white dark:bg-[var(--bg-tertiary)] transition-transform ${
                marginEnabled ? 'translate-x-[14px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
          
          {/* Leverage Selector (only when margin enabled) */}
          {marginEnabled && (
            <button
              onClick={() => setShowLeverageModal(true)}
              className="flex items-center gap-1 px-2 h-4 text-xs font-medium rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-quaternary)] transition-colors"
            >
              {marginLeverage}x
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Buy/Sell Tabs — OKX desktop spec: 28px high, 12px/500 font, radius 4px, padding 0/12, gap 2px, active green #25A750 (desktop token; boss mobile measure #31BD65 pending ruling) */}
      <div className="flex gap-0.5 p-3 border-b border-[var(--border-primary)]">
        <button
          onClick={() => setOrderSide('buy')}
          className={`flex-1 h-7 px-3 mx-0.5 text-xs font-medium rounded transition-colors ${
            isBuy
              ? 'bg-[#25A750] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Buy {baseToken}
        </button>
        <button
          onClick={() => setOrderSide('sell')}
          className={`flex-1 h-7 px-3 mx-0.5 text-xs font-medium rounded transition-colors ${
            !isBuy
              ? 'bg-[#CA3F64] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Sell {baseToken}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Order Type Tabs */}
        <div className="relative flex items-center gap-1 px-3 h-10 border-b border-[var(--border-primary)]">
          {(['limit', 'market'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`h-[35px] px-3 text-xs font-medium transition-colors capitalize ${
                orderType === type
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {type}
            </button>
          ))}
          {/* TP/SL dropdown (OKX spot order-type list; unsupported items grayed) */}
          <div className="relative">
            <button
              onClick={() => setShowTpslMenu(!showTpslMenu)}
              className={`h-[35px] px-3 text-xs font-medium transition-colors flex items-center gap-1 ${
                orderType === 'tpsl'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              TP/SL
              <ChevronDown className={`w-3 h-3 transition-transform ${showTpslMenu ? 'rotate-180' : ''}`} />
            </button>
            {showTpslMenu && (
              <div className="absolute top-full left-0 mt-1 w-[285px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => { setOrderType('tpsl'); setShowTpslMenu(false); }}
                  className="w-full text-left px-3 h-10 flex items-center text-xs text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  TP/SL
                </button>
                {['Trailing stop', 'Trigger', 'Advanced limit'].map((label) => (
                  <div key={label} className="px-3 h-10 flex items-center text-xs text-[var(--text-primary)] opacity-60 cursor-not-allowed" title="即将上线">
                    {label}
                  </div>
                ))}
                {['Slicing bots', 'Iceberg', 'TWAP'].map((label) => (
                  <div key={label} className="px-3 h-10 flex items-center text-xs text-[var(--text-tertiary)] cursor-not-allowed" title="即将上线">
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
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                  {quoteToken}
                </span>
              </div>
            </div>
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

          {orderType === 'tpsl' && (
            <>
              <div className="text-xs text-[var(--text-secondary)]">Conditional/OCO</div>
              <Select
                value={condKind}
                onChange={setCondKind}
                options={[
                  { value: 'conditional', label: 'Conditional' },
                  { value: 'oco', label: 'OCO', disabled: true },
                ]}
              />
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5 border-b border-dashed border-[var(--text-tertiary)] w-fit">
                  Trigger price({quoteToken})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                    {quoteToken}
                  </span>
                </div>
              </div>
              <Select
                value={tpslOrderType}
                onChange={setTpslOrderType}
                options={[
                  { value: 'market', label: `Market order (${quoteToken})` },
                  { value: 'limit', label: `Limit order (${quoteToken})`, disabled: true },
                ]}
              />
            </>
          )}

          {/* Total */}
          <div className="relative">
            <input
              type="text"
              value={total > 0 ? total.toFixed(2) : ''}
              readOnly
              placeholder={`Total (${quoteToken})`}
              className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16 opacity-60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
              {quoteToken}
            </span>
          </div>

          {/* Margin Required (only when margin enabled) */}
          {marginEnabled && (
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Margin Required</span>
              <span className="text-[var(--text-primary)]">
                {marginRequired > 0 ? formatPrice(marginRequired) : '--'} {quoteToken}
              </span>
            </div>
          )}

          {/* Balance Info */}
          <div className="space-y-1.5 pt-1 border-t border-[var(--border-primary)]">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Available</span>
              <span className="text-[var(--text-primary)]">
                {connected 
                  ? `${isBuy ? formatPrice(quoteBalance) : baseBalance.toFixed(6)} ${isBuy ? quoteToken : baseToken}`
                  : `-- ${isBuy ? quoteToken : baseToken}`
                }
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">
                Max {marginEnabled ? (isBuy ? 'Long' : 'Short') : (isBuy ? 'buy' : 'sell')}
              </span>
              <span className="text-[var(--text-primary)]">
                {connected 
                  ? `${maxAmount.toFixed(6)} ${baseToken}`
                  : `-- ${baseToken}`
                }
              </span>
            </div>
          </div>

          {/* Swap status feedback */}
          {swapError && (
            <div className="text-xs text-[var(--color-sell)] mb-1 break-all">{swapError}</div>
          )}
          {swapTxSig && (
            <div className="text-xs text-[var(--color-buy)] mb-1">
              Swap confirmed: {swapTxSig.slice(0, 8)}...
            </div>
          )}

          {/* Action Button */}
          {connected ? (
            <button
              className={`w-full h-10 rounded-full text-sm font-normal transition-all ${buttonColor} ${buttonTextColor}`}
              disabled={!amount || parseFloat(amount) <= 0 || swapLoading || marginEnabled}
              onClick={async () => {
                const amt = parseFloat(amount || '0');
                if (amt <= 0) return;
                // Buy = pay quote (token1) to get base (token0) → zeroForOne=false
                // Sell = pay base (token0) to get quote (token1) → zeroForOne=true
                if (isBuy) {
                  const totalQuote = orderType === 'market' ? selectedPair.price * amt : parseFloat(price) * amt;
                  await executeSwap({
                    zeroForOne: false,
                    amountIn: totalQuote,
                    minOut: amt * 0.99, // 1% slippage tolerance
                    decimalsIn: 6, // USDC
                  });
                } else {
                  await executeSwap({
                    zeroForOne: true,
                    amountIn: amt,
                    minOut: (orderType === 'market' ? selectedPair.price : parseFloat(price)) * amt * 0.99,
                    decimalsIn: 8, // DEVT
                  });
                }
              }}
            >
              {swapLoading
                ? 'Swapping...'
                : marginEnabled
                  ? (isBuy ? 'Long' : 'Short')
                  : (isBuy ? 'Buy' : 'Sell')
              } {baseToken}
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

      {/* Leverage Modal */}
      {showLeverageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[320px] bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]" style={{ boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)' }}>
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
                      val = Math.min(Math.max(val, 1), 10);
                      setMarginLeverage(val);
                      setLeverageInput(String(val));
                    }}
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">x</span>
                </div>
              </div>

              {/* Leverage Options */}
              <div className="flex flex-wrap gap-2">
                {MARGIN_LEVERAGE_OPTIONS.map((lev) => (
                  <button
                    key={lev}
                    onClick={() => {
                      setMarginLeverage(lev);
                      setLeverageInput(String(lev));
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      marginLeverage === lev
                        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-primary)]">
              <button
                onClick={() => {
                  setLeverageInput(String(marginLeverage));
                  setShowLeverageModal(false);
                }}
                className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  let val = parseInt(leverageInput) || 1;
                  val = Math.min(Math.max(val, 1), 10);
                  setMarginLeverage(val);
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
    </div>
  );
};

export default SpotTradingForm;
