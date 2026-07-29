import React, { useState } from 'react';
import { ArrowDown, ChevronDown, Settings, RefreshCw } from 'lucide-react';

const TOKENS = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 98542.36, icon: '₿' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3456.78, icon: 'Ξ' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 187.45, icon: '◎' },
  { id: 'usdt', symbol: 'USDT', name: 'Tether', price: 1.0, icon: '₮' },
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', price: 1.0, icon: '$' },
];

interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  icon: string;
}

interface TokenSelectorProps {
  token: Token;
  onSelect: (token: Token) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ token, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors"
      >
        <span className="text-lg">{token.icon}</span>
        <span className="font-semibold text-[var(--text-primary)]">{token.symbol}</span>
        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-lg z-50">
          {TOKENS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelect(t);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <span className="text-lg">{t.icon}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-[var(--text-primary)]">{t.symbol}</div>
                <div className="text-xs text-[var(--text-secondary)]">{t.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface TokenInputProps {
  label: string;
  balance: string;
  token: Token;
  amount: string;
  onTokenChange: (token: Token) => void;
  onAmountChange?: (value: string) => void;
  readOnly?: boolean;
  valueInUsd?: string;
}

const TokenInput: React.FC<TokenInputProps> = ({
  label,
  balance,
  token,
  amount,
  onTokenChange,
  onAmountChange,
  readOnly = false,
  valueInUsd,
}) => (
  <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-transparent focus-within:border-[var(--border-hover)] transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className="text-xs text-[var(--text-tertiary)]">Balance: {balance}</span>
    </div>
    <div className="flex items-center justify-between gap-4">
      <TokenSelector token={token} onSelect={onTokenChange} />
      <input
        type="number"
        value={amount}
        onChange={(e) => onAmountChange?.(e.target.value)}
        placeholder="0.00"
        readOnly={readOnly}
        className="flex-1 bg-transparent text-right text-2xl font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
      />
    </div>
    <div className="flex items-center justify-between mt-2">
      <button className="text-xs text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] transition-colors">
        MAX
      </button>
      <span className="text-xs text-[var(--text-tertiary)]">${valueInUsd || '0.00'}</span>
    </div>
  </div>
);

export const SwapPage: React.FC = () => {
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[3]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && fromToken && toToken) {
      const fromValue = parseFloat(value) * fromToken.price;
      const toValue = fromValue / toToken.price;
      setToAmount(toValue.toFixed(6));
    } else {
      setToAmount('');
    }
  };

  const handleSwap = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwapSubmit = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setIsSwapping(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSwapping(false);
    setFromAmount('');
    setToAmount('');
  };

  const fromValueInUsd = fromAmount
    ? (parseFloat(fromAmount) * fromToken.price).toFixed(2)
    : '0.00';
  const toValueInUsd = toAmount
    ? (parseFloat(toAmount) * toToken.price).toFixed(2)
    : '0.00';

  const rate = fromToken.price / toToken.price;

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Spot</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swap Card */}
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4 sm:p-6">
          {/* From Token */}
          <TokenInput
            label="From"
            balance="0.5 BTC"
            token={fromToken}
            amount={fromAmount}
            onTokenChange={setFromToken}
            onAmountChange={handleFromAmountChange}
            valueInUsd={fromValueInUsd}
          />

          {/* Swap Button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={handleSwap}
              className="p-2 rounded-lg bg-[var(--bg-quaternary)] border border-[var(--border-primary)] hover:border-[var(--text-primary)] transition-all group"
            >
              <ArrowDown className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
            </button>
          </div>

          {/* To Token */}
          <TokenInput
            label="To (Estimated)"
            balance="10000 USDT"
            token={toToken}
            amount={toAmount}
            onTokenChange={setToToken}
            readOnly
            valueInUsd={toValueInUsd}
          />

          {/* Rate & Info */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Rate</span>
              <span className="text-[var(--text-primary)]">
                1 {fromToken.symbol} = {rate.toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Network Fee</span>
              <span className="text-[var(--text-primary)]">~0.0001 BTC</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Slippage Tolerance</span>
              <span className="text-[var(--text-primary)]">{slippage}%</span>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">Slippage Tolerance</span>
                <select
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="bg-[var(--bg-quaternary)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 border border-[var(--border-primary)] outline-none"
                >
                  <option value="0.1">0.1%</option>
                  <option value="0.5">0.5%</option>
                  <option value="1.0">1.0%</option>
                  <option value="3.0">3.0%</option>
                </select>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Your transaction will revert if the price changes unfavorably by more than this percentage.
              </p>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwapSubmit}
            disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isSwapping}
            className="w-full mt-6 py-3.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold text-base hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSwapping ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Swapping...
              </span>
            ) : (
              'Swap'
            )}
          </button>
        </div>

        {/* Price Info */}
        <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">{fromToken.symbol} Price</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              ${fromToken.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-[var(--text-secondary)]">{toToken.symbol} Price</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              ${toToken.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
