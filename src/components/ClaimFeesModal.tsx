import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ClaimFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenA: string;
  tokenB: string;
  feesA: string;
  feesB: string;
}

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  BNB: '#F3BA2F',
  USDT: '#26A17B',
  USDC: '#2775CA',
};

export const ClaimFeesModal: React.FC<ClaimFeesModalProps> = ({
  isOpen,
  onClose,
  tokenA,
  tokenB,
  feesA,
  feesB,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    setIsClaiming(true);
    // Simulate claim transaction
    setTimeout(() => {
      setIsClaiming(false);
      setClaimed(true);
      // Close after showing success briefly
      setTimeout(() => {
        setClaimed(false);
        onClose();
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  const tokenAColor = TOKEN_COLORS[tokenA] || '#888888';
  const tokenBColor = TOKEN_COLORS[tokenB] || '#888888';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-[400px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <span className="text-base font-semibold text-[var(--text-primary)]">Claim Fees</span>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pool Info */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: tokenAColor }}>
              {tokenA[0]}
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold -ml-2" style={{ backgroundColor: tokenBColor }}>
              {tokenB[0]}
            </div>
            <span className="ml-2 text-lg font-semibold text-[var(--text-primary)]">
              {tokenA}/{tokenB}
            </span>
          </div>

          {/* Fees to Claim */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: tokenAColor }}>
                  {tokenA[0]}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{tokenA}</span>
              </div>
              <span className="text-base font-semibold text-[var(--text-primary)]">{feesA}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: tokenBColor }}>
                  {tokenB[0]}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{tokenB}</span>
              </div>
              <span className="text-base font-semibold text-[var(--text-primary)]">{feesB}</span>
            </div>
          </div>

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={isClaiming || claimed}
            className={`w-full py-3 rounded-full text-sm font-semibold transition-all ${
              claimed
                ? 'bg-[var(--color-success)] text-white'
                : 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90'
            } disabled:cursor-not-allowed`}
          >
            {isClaiming ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Claiming...
              </span>
            ) : claimed ? (
              'Claimed!'
            ) : (
              'Claim All'
            )}
          </button>

          <p className="mt-4 text-xs text-center text-[var(--text-secondary)]">
            Fees will be transferred to your wallet
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClaimFeesModal;
