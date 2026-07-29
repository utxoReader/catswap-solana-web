import React, { useState, useMemo } from 'react';
import { Plus, Search, TrendingUp, DollarSign, BarChart3, ChevronDown, X } from 'lucide-react';
import { ClaimFeesModal } from './ClaimFeesModal';
import { usePoolData, sqrtPriceE16ToPrice } from '../hooks/usePoolData';
import { useLiquidity } from '../hooks/useLiquidity';

interface Pool {
  id: string;
  tokenA: string;
  tokenB: string;
  tvl: number;
  providers: number;
  volume24h: number;
  fee24h: number;
  apr7d: number;
  feeTier: string;
  hasPosition: boolean;
  hasFees: boolean;
}

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  BNB: '#F3BA2F',
  USDT: '#26A17B',
  USDC: '#2775CA',
};

const POOLS: Pool[] = [
  { id: '1', tokenA: 'BTC', tokenB: 'USDT', tvl: 50780000, providers: 100, volume24h: 50780000, fee24h: 90.49, apr7d: 90.49, feeTier: '0.08% / 10%', hasPosition: true, hasFees: true },
  { id: '2', tokenA: 'BTC', tokenB: 'USDT', tvl: 50780000, providers: 100, volume24h: 50780000, fee24h: 50.88, apr7d: 50.88, feeTier: '0.5% / 50%', hasPosition: true, hasFees: true },
  { id: '3', tokenA: 'BTC', tokenB: 'USDT', tvl: 50780000, providers: 100, volume24h: 50780000, fee24h: 8.56, apr7d: 8.56, feeTier: '0.5% / 50%', hasPosition: true, hasFees: true },
  { id: '4', tokenA: 'BTC', tokenB: 'USDT', tvl: 50780000, providers: 100, volume24h: 50780000, fee24h: 20.88, apr7d: 20.88, feeTier: '0.5% / 50%', hasPosition: true, hasFees: false },
  { id: '5', tokenA: 'BTC', tokenB: 'USDT', tvl: 50780000, providers: 100, volume24h: 50780000, fee24h: 10.88, apr7d: 10.88, feeTier: '0.5% / 50%', hasPosition: false, hasFees: false },
  { id: '6', tokenA: 'ETH', tokenB: 'USDT', tvl: 32400000, providers: 85, volume24h: 32400000, fee24h: 15.23, apr7d: 15.23, feeTier: '0.08% / 10%', hasPosition: true, hasFees: true },
];

const formatCurrency = (value: number) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, change }) => (
  <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
        {icon}
      </div>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-semibold text-[var(--text-primary)]">{value}</span>
      {change && (
        <span className="text-xs text-[var(--color-buy)]">{change}</span>
      )}
    </div>
  </div>
);

const TokenIcon: React.FC<{ symbol: string; className?: string }> = ({ symbol, className = '' }) => (
  <div
    className={`rounded-full flex items-center justify-center text-white text-xs font-bold ${className}`}
    style={{ backgroundColor: TOKEN_COLORS[symbol] || '#888' }}
  >
    {symbol[0]}
  </div>
);

const ActionButton: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'primary' | 'outline' | 'ghost';
  onClick?: () => void;
}> = ({ children, variant = 'outline', onClick }) => {
  const baseClasses = "w-[68px] h-[30px] flex items-center justify-center px-2 text-xs font-medium rounded-full transition-all duration-200";
  const variantClasses = {
    primary: "bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90",
    outline: "border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] hover:border-[var(--text-primary)]",
    ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  };
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};

const FeeTag: React.FC<{ text: string; tooltip: string }> = ({ text, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative inline-block">
      <span 
        className="px-1 py-0.5 text-[10px] rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {text}
      </span>
      {showTooltip && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-tooltip)] text-white text-xs font-medium rounded whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  );
};

// Deposit Modal
interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool | null;
  onDeposit?: (amountA: number, amountB: number) => Promise<void>;
  loading?: boolean;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, pool, onDeposit, loading }) => {
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  
  if (!isOpen || !pool) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
          <span className="text-base font-semibold text-[var(--text-primary)]">Add Liquidity</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="text-sm text-[var(--text-secondary)]">
            Deposit tokens to provide liquidity for {pool.tokenA}/{pool.tokenB} pool
          </div>
          
          {/* Token A Input */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{pool.tokenA} Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">{pool.tokenA}</span>
            </div>
          </div>
          
          {/* Token B Input */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">{pool.tokenB} Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">{pool.tokenB}</span>
            </div>
          </div>
          
          {/* Info */}
          <div className="p-3 rounded-md bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between mb-1">
              <span>Current Price</span>
              <span className="text-[var(--text-primary)]">1 {pool.tokenA} = 65,432 {pool.tokenB}</span>
            </div>
            <div className="flex justify-between">
              <span>Pool Share</span>
              <span className="text-[var(--text-primary)]">~0.05%</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (onDeposit) {
                await onDeposit(parseFloat(amountA || '0'), parseFloat(amountB || '0'));
              }
              onClose();
            }}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Remove Modal
interface RemoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool | null;
  onRemove?: (percentage: number) => Promise<void>;
  loading?: boolean;
}

const RemoveModal: React.FC<RemoveModalProps> = ({ isOpen, onClose, pool, onRemove, loading }) => {
  const [percentage, setPercentage] = useState(50);
  const [showSliderTooltip, setShowSliderTooltip] = useState(false);
  
  if (!isOpen || !pool) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
          <span className="text-base font-semibold text-[var(--text-primary)]">Remove Liquidity</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="text-sm text-[var(--text-secondary)]">
            Remove your liquidity from {pool.tokenA}/{pool.tokenB} pool
          </div>
          
          {/* Percentage Slider */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Amount to Remove</label>
            <div className="relative h-1 bg-[var(--bg-tertiary)] rounded-full">
              <div
                className="absolute h-full rounded-full bg-[var(--text-primary)]"
                style={{ width: `${percentage}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(parseInt(e.target.value))}
                onMouseDown={() => setShowSliderTooltip(true)}
                onMouseUp={() => setShowSliderTooltip(false)}
                onTouchStart={() => setShowSliderTooltip(true)}
                onTouchEnd={() => setShowSliderTooltip(false)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {/* Percentage Tooltip */}
              {showSliderTooltip && (
                <div
                  className="absolute -top-8 px-2 py-1 bg-[var(--bg-tooltip)] text-white text-xs font-medium rounded pointer-events-none"
                  style={{ left: `calc(${percentage}% - 20px)` }}
                >
                  {Math.round(percentage)}%
                </div>
              )}
              {/* Active thumb indicator */}
              {showSliderTooltip && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--text-primary)] pointer-events-none"
                  style={{ left: `calc(${percentage}% - ${percentage * 0.12}px)` }}
                />
              )}
              {/* Slider marks */}
              <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <div
                    key={pct}
                    className={`w-2 h-2 rounded-full ${percentage >= pct ? 'bg-[var(--text-primary)]' : 'bg-[var(--bg-quaternary)]'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-1">
              {['0%', '25%', '50%', '75%', '100%'].map((label, idx) => (
                <button
                  key={label}
                  onClick={() => setPercentage(idx * 25)}
                  className={`text-[10px] transition-colors ${
                    percentage >= idx * 25 ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Preview */}
          <div className="p-3 rounded-md bg-[var(--bg-tertiary)] space-y-2">
            <div className="text-xs text-[var(--text-secondary)] mb-2">You will receive:</div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-primary)]">{pool.tokenA}</span>
              <span className="text-[var(--text-primary)]">0.5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-primary)]">{pool.tokenB}</span>
              <span className="text-[var(--text-primary)]">32,716</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (onRemove) {
                await onRemove(percentage);
              }
              onClose();
            }}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-md bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PoolRowProps {
  pool: Pool;
  onDeposit: (pool: Pool) => void;
  onRemove: (pool: Pool) => void;
  onClaim: (pool: Pool) => void;
  onTrade: (pool: Pool, type: 'spot' | 'perp') => void;
  connected: boolean;
}

const PoolRow: React.FC<PoolRowProps> = ({ pool, onDeposit, onRemove, onClaim, onTrade, connected }) => (
  <div
    className="grid grid-cols-[minmax(140px,1.5fr)_minmax(100px,1fr)_minmax(90px,1fr)_minmax(80px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1fr)_minmax(120px,1fr)] gap-x-6 px-4 py-4 border-b border-[var(--border-primary)] items-center hover:bg-[var(--bg-tertiary)] transition-colors even:bg-[var(--bg-tertiary)]/30"
  >
    {/* Pools */}
    <div className="flex items-center gap-3">
      <div className="flex -space-x-1.5">
        <TokenIcon symbol={pool.tokenA} className="w-7 h-7 border-2 border-[var(--bg-secondary)]" />
        <TokenIcon symbol={pool.tokenB} className="w-7 h-7 border-2 border-[var(--bg-secondary)]" />
      </div>
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {pool.tokenA}/{pool.tokenB}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <FeeTag text="0.08%" tooltip="Trading Fee Rate" />
          <FeeTag text="10%" tooltip="Price Range" />
        </div>
      </div>
    </div>
    
    {/* Liquidity */}
    <div className="text-right">
      <div className="text-sm font-medium text-[var(--text-primary)]">
        {formatCurrency(pool.tvl)}
      </div>
      <div className="text-xs text-[var(--text-tertiary)]">
        {pool.providers} providers
      </div>
    </div>
    
    {/* 24H Vol */}
    <div className="text-right">
      <span className="text-sm text-[var(--text-primary)]">
        {formatCurrency(pool.volume24h)}
      </span>
    </div>
    
    {/* 24H Fee/L */}
    <div className="text-right">
      <span className="text-sm text-[var(--text-primary)]">
        {pool.fee24h.toFixed(2)}%
      </span>
    </div>
    
    {/* 7D APR */}
    <div className="text-right">
      <span className="text-sm text-[var(--text-primary)]">
        {pool.apr7d.toFixed(2)}%
      </span>
    </div>
    
    {/* Fees */}
    <div className="flex items-center justify-center">
      {pool.hasFees ? (
        <ActionButton onClick={() => onClaim(pool)}>claim</ActionButton>
      ) : (
        <span className="w-[68px] h-[30px] flex items-center justify-center text-xs text-[var(--text-tertiary)]">-</span>
      )}
    </div>
    
    {/* Positions */}
    <div className="flex items-center justify-center gap-3">
      <ActionButton onClick={() => onDeposit(pool)}>deposit</ActionButton>
      {connected && pool.hasPosition ? (
        <ActionButton onClick={() => onRemove(pool)}>remove</ActionButton>
      ) : (
        <span className="w-[68px] h-[30px] flex items-center justify-center rounded-full text-xs text-[var(--text-tertiary)]">-</span>
      )}
    </div>
    
    {/* Trade */}
    <div className="flex items-center justify-center gap-2">
      <ActionButton variant="outline" onClick={() => onTrade(pool, 'spot')}>spot</ActionButton>
      <ActionButton variant="outline" onClick={() => onTrade(pool, 'perp')}>perp</ActionButton>
    </div>
  </div>
);

interface PoolsPageProps {
  onNavigateToTrade?: (pair: string, type: 'spot' | 'perp') => void;
  connected?: boolean;
}

export const PoolsPage: React.FC<PoolsPageProps> = ({ onNavigateToTrade, connected = false }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  // On-chain pool data (falls back to mock data when pool not configured)
  const { poolData } = usePoolData();
  const { mintLiquidity, burnLiquidity, loading: lpLoading } = useLiquidity();

  const displayPools = useMemo<Pool[]>(() => {
    if (poolData) {
      const price = sqrtPriceE16ToPrice(poolData.sqrtPriceE16);
      const tvl = (poolData.balance0.toNumber() / 1e8) * price +
                  (poolData.balance1.toNumber() / 1e6);
      return [{
        id: 'real-pool',
        tokenA: 'DEVT',
        tokenB: 'USDC',
        tvl,
        providers: 1,
        volume24h: 0,
        fee24h: 0,
        apr7d: 0,
        feeTier: '—',
        hasPosition: false,
        hasFees: false,
      }];
    }
    return POOLS;
  }, [poolData]);

  const filteredPools = displayPools.filter(pool =>
    searchQuery === '' ||
    pool.tokenA.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.tokenB.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeposit = (pool: Pool) => {
    setSelectedPool(pool);
    setDepositModalOpen(true);
  };

  const handleRemove = (pool: Pool) => {
    setSelectedPool(pool);
    setRemoveModalOpen(true);
  };

  const handleTrade = (pool: Pool, type: 'spot' | 'perp') => {
    if (onNavigateToTrade) {
      onNavigateToTrade(`${pool.tokenA}/${pool.tokenB}`, type);
    }
  };

  const handleClaim = (pool: Pool) => {
    setSelectedPool(pool);
    setClaimModalOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Pools</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Provide liquidity and earn trading fees
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium text-sm hover:opacity-90 transition-colors">
            <Plus className="w-4 h-4" />
            New Position
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Total Value Locked"
            value={poolData ? formatCurrency(displayPools[0]?.tvl ?? 0) : "$606.00M"}
            change={poolData ? undefined : "+5.2%"}
          />
          <StatCard
            icon={<BarChart3 className="w-4 h-4" />}
            label={poolData ? "LP Supply" : "24h Volume"}
            value={poolData ? poolData.lpSupply.toNumber().toLocaleString() : "$195.90M"}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label={poolData ? "Protocol Fees" : "24h Fees"}
            value={poolData ? `${(poolData.protocolFee1.toNumber() / 1e6).toFixed(2)} USDC` : "$587.70K"}
          />
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex gap-1 p-1 rounded-md bg-[var(--bg-tertiary)]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === 'all'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Pools
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === 'my'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              My Positions
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search pools"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm rounded-md pl-10 pr-4 py-2 border border-[var(--border-primary)] outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>

        {/* Pools Table */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[minmax(140px,1.5fr)_minmax(100px,1fr)_minmax(90px,1fr)_minmax(80px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1fr)_minmax(120px,1fr)] gap-x-6 px-4 py-3 border-b border-[var(--border-primary)] text-xs text-[var(--text-tertiary)]">
            <span>Pools</span>
            <span className="flex items-center justify-end gap-1 cursor-pointer hover:text-[var(--text-primary)]">
              Liquidity
              <ChevronDown className="w-3 h-3" />
            </span>
            <span className="text-right">24H Vol</span>
            <span className="text-right">24H Fee/L</span>
            <span className="text-right">7D APR</span>
            <span className="text-center">Fees</span>
            <span className="text-center">Positions</span>
            <span className="text-center">Trade</span>
          </div>

          {/* Table Body */}
          {activeTab === 'all' ? (
            filteredPools.length > 0 ? (
              filteredPools.map((pool) => (
                <PoolRow 
                  key={pool.id} 
                  pool={pool} 
                  onDeposit={handleDeposit}
                  onRemove={handleRemove}
                  onClaim={handleClaim}
                  onTrade={handleTrade}
                  connected={connected}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-16 text-[var(--text-tertiary)]">
                No pools found
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                You have no liquidity positions
              </p>
              <button className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-quaternary)] transition-colors">
                Add Liquidity
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <DepositModal 
        isOpen={depositModalOpen} 
        onClose={() => setDepositModalOpen(false)}
        pool={selectedPool}
        onDeposit={async (a0, a1) => { await mintLiquidity({ delta0: a0, delta1: a1, decimals0: 8, decimals1: 6 }); }}
        loading={lpLoading}
      />
      <RemoveModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        pool={selectedPool}
        onRemove={async (pct) => { await burnLiquidity(pct * 1e16); }}
        loading={lpLoading}
      />
      <ClaimFeesModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        tokenA={selectedPool?.tokenA || ''}
        tokenB={selectedPool?.tokenB || ''}
        feesA={`0.001234 ${selectedPool?.tokenA || ''}`}
        feesB={`12.456789 ${selectedPool?.tokenB || ''}`}
      />
    </div>
  );
};

export default PoolsPage;
