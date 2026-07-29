import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { TradingPair } from '../../types';

type CalculatorTab = 'pnl' | 'exit' | 'liquidation' | 'avgEntry';
type PositionSide = 'long' | 'short';
type MarginMode = 'isolated' | 'cross';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPair: TradingPair;
}

interface Position {
  entryPrice: string;
  filledAmount: string;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  selectedPair,
}) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('pnl');
  const [side, setSide] = useState<PositionSide>('long');
  
  // Common inputs
  const [leverage, setLeverage] = useState('100');
  const [entryPrice, setEntryPrice] = useState(selectedPair.price.toFixed(2));
  const [exitPrice, setExitPrice] = useState('');
  const [openAmount, setOpenAmount] = useState('');
  
  // PnL specific
  const [pnlInputMode, setPnlInputMode] = useState<'value' | 'percent'>('value');
  const [targetPnL, setTargetPnL] = useState('');
  
  // Liquidation specific
  const [marginMode] = useState<MarginMode>('isolated');
  const [additionalMargin, setAdditionalMargin] = useState('');
  
  // Avg entry specific
  const [positions, setPositions] = useState<Position[]>([
    { entryPrice: selectedPair.price.toFixed(2), filledAmount: '' },
  ]);

  const baseToken = selectedPair.symbol.split('/')[0];
  const quoteToken = selectedPair.symbol.split('/')[1] || 'USDT';

  // Calculate max position size based on leverage
  const maxPositionSize = useMemo(() => {
    const lev = parseFloat(leverage) || 100;
    // Mock: assume 1 BTC margin for 100x = 100 BTC max position
    return (1 * lev).toFixed(4);
  }, [leverage]);

  // PnL Calculations
  const pnlResults = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || 0;
    const amount = parseFloat(openAmount) || 0;
    const lev = parseFloat(leverage) || 100;
    
    if (!entry || !exit || !amount) return null;
    
    const notional = amount * entry;
    const margin = notional / lev;
    
    let pnl = 0;
    if (side === 'long') {
      pnl = (exit - entry) * amount;
    } else {
      pnl = (entry - exit) * amount;
    }
    
    const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;
    
    // Mock fees (0.02% maker, 0.05% taker)
    const makerFee = notional * 0.0002;
    const takerFee = notional * 0.0005;
    
    return {
      margin,
      pnl,
      pnlPercent,
      makerFee,
      takerFee,
    };
  }, [entryPrice, exitPrice, openAmount, leverage, side]);

  // Exit Price Calculations
  const exitPriceResult = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const amount = parseFloat(openAmount) || 0;
    const lev = parseFloat(leverage) || 100;
    const pnlValue = parseFloat(targetPnL) || 0;
    
    if (!entry || !amount || !pnlValue) return null;
    
    const margin = (entry * amount) / lev;
    let targetExit = 0;
    
    if (pnlInputMode === 'value') {
      // PnL = (Exit - Entry) * Amount for long
      if (side === 'long') {
        targetExit = entry + (pnlValue / amount);
      } else {
        targetExit = entry - (pnlValue / amount);
      }
    } else {
      // PnL% = (PnL / Margin) * 100
      const targetPnLValue = (pnlValue / 100) * margin;
      if (side === 'long') {
        targetExit = entry + (targetPnLValue / amount);
      } else {
        targetExit = entry - (targetPnLValue / amount);
      }
    }
    
    return targetExit;
  }, [entryPrice, openAmount, leverage, targetPnL, pnlInputMode, side]);

  // Liquidation Price Calculations
  const liquidationPriceResult = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const amount = parseFloat(openAmount) || 0;
    const lev = parseFloat(leverage) || 100;
    const addMargin = parseFloat(additionalMargin) || 0;
    
    if (!entry || !amount) return null;
    
    const notional = entry * amount;
    const initialMargin = notional / lev;
    const totalMargin = initialMargin + addMargin;
    
    // Simplified liquidation formula (maintenance margin ~0.5%)
    const maintenanceMarginRate = 0.005;
    const maintenanceMargin = notional * maintenanceMarginRate;
    
    let liqPrice = 0;
    if (side === 'long') {
      // For long: Liquidation when Margin - (Entry - Price) * Amount = Maintenance Margin
      liqPrice = entry - ((totalMargin - maintenanceMargin) / amount);
    } else {
      // For short: Liquidation when Margin - (Price - Entry) * Amount = Maintenance Margin
      liqPrice = entry + ((totalMargin - maintenanceMargin) / amount);
    }
    
    return liqPrice;
  }, [entryPrice, openAmount, leverage, additionalMargin, side]);

  // Avg Entry Price Calculations
  const avgEntryResult = useMemo(() => {
    let totalValue = 0;
    let totalAmount = 0;
    
    for (const pos of positions) {
      const price = parseFloat(pos.entryPrice) || 0;
      const amount = parseFloat(pos.filledAmount) || 0;
      totalValue += price * amount;
      totalAmount += amount;
    }
    
    if (totalAmount === 0) return null;
    return totalValue / totalAmount;
  }, [positions]);

  const addPosition = () => {
    setPositions([...positions, { entryPrice: '', filledAmount: '' }]);
  };

  const updatePosition = (index: number, field: keyof Position, value: string) => {
    // 禁止输入负数
    if (value.startsWith('-')) return;
    const newPositions = [...positions];
    newPositions[index][field] = value;
    setPositions(newPositions);
  };

  // 处理数值输入，禁止负数
  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    // 禁止输入负数
    if (value.startsWith('-')) return;
    setter(value);
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (isNaN(num)) return '--';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="w-[560px] max-h-[90vh] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden flex flex-col" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <div className="flex gap-6">
            {[
              { id: 'pnl', label: 'PnL' },
              { id: 'exit', label: 'Exit price' },
              { id: 'liquidation', label: 'Liquidation price' },
              { id: 'avgEntry', label: 'Avg entry price' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CalculatorTab)}
                className={`text-sm font-medium pb-1 transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
                )}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Pair Selector + Long/Short Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#F7931A] flex items-center justify-center text-white text-xs font-bold">
                  {baseToken[0]}
                </div>
                <span className="text-base font-semibold text-[var(--text-primary)]">
                  {selectedPair.symbol}
                </span>
                <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Long/Short Toggle */}
              <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)]">
                <button
                  onClick={() => setSide('long')}
                  className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                    side === 'long'
                      ? 'bg-[var(--color-success)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Long
                </button>
                <button
                  onClick={() => setSide('short')}
                  className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                    side === 'short'
                      ? 'bg-[var(--color-danger)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Left: Inputs */}
              <div className="flex-1 space-y-4">
                {/* PnL Tab */}
                {activeTab === 'pnl' && (
                  <>
                    {/* Leverage */}
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Leverage</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={leverage}
                          onChange={(e) => handleNumberInput(e.target.value, setLeverage)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                          placeholder="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">x</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Max position size {maxPositionSize} {baseToken}
                      </p>
                    </div>

                    {/* Entry Price */}
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Entry price</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={entryPrice}
                          onChange={(e) => handleNumberInput(e.target.value, setEntryPrice)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{quoteToken}</span>
                      </div>
                    </div>

                    {/* Exit Price */}
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Exit price</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={exitPrice}
                          onChange={(e) => handleNumberInput(e.target.value, setExitPrice)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{quoteToken}</span>
                      </div>
                    </div>

                    {/* Open Amount */}
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Open amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={openAmount}
                          onChange={(e) => handleNumberInput(e.target.value, setOpenAmount)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{baseToken}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Exit Price Tab */}
                {activeTab === 'exit' && (
                  <>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Leverage</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={leverage}
                          onChange={(e) => handleNumberInput(e.target.value, setLeverage)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                          placeholder="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">x</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Max position size {maxPositionSize} {baseToken}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Entry price</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={entryPrice}
                          onChange={(e) => handleNumberInput(e.target.value, setEntryPrice)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{quoteToken}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Open amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={openAmount}
                          onChange={(e) => handleNumberInput(e.target.value, setOpenAmount)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{baseToken}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                        {pnlInputMode === 'value' ? 'PnL' : 'PnL%'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={targetPnL}
                          onChange={(e) => handleNumberInput(e.target.value, setTargetPnL)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">
                          {pnlInputMode === 'value' ? quoteToken : '%'}
                        </span>
                      </div>
                      <button
                        onClick={() => setPnlInputMode(pnlInputMode === 'value' ? 'percent' : 'value')}
                        className="mt-1 text-xs text-[var(--color-buy)] hover:underline"
                      >
                        Switch to {pnlInputMode === 'value' ? 'PnL%' : 'PnL'}
                      </button>
                    </div>
                  </>
                )}

                {/* Liquidation Price Tab */}
                {activeTab === 'liquidation' && (
                  <>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Margin mode</label>
                      <button className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex items-center justify-between">
                        <span className="capitalize">{marginMode}</span>
                        <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Leverage</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={leverage}
                          onChange={(e) => handleNumberInput(e.target.value, setLeverage)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out"
                          placeholder="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">x</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Max position size {maxPositionSize} {baseToken}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Entry price</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={entryPrice}
                          onChange={(e) => handleNumberInput(e.target.value, setEntryPrice)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{quoteToken}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Open amount</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={openAmount}
                          onChange={(e) => handleNumberInput(e.target.value, setOpenAmount)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{baseToken}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        ≈ 10,000 contracts
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Additional margin</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={additionalMargin}
                          onChange={(e) => handleNumberInput(e.target.value, setAdditionalMargin)}
                          className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{quoteToken}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Avg Entry Price Tab */}
                {activeTab === 'avgEntry' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Load existing position
                    </div>

                    {positions.map((pos, index) => (
                      <div key={index} className="space-y-3">
                        <div>
                          <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                            Entry price ({index + 1}/{positions.length})
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={pos.entryPrice}
                              onChange={(e) => updatePosition(index, 'entryPrice', e.target.value)}
                              className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                              placeholder="0.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{quoteToken}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Filled amount</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={pos.filledAmount}
                              onChange={(e) => updatePosition(index, 'filledAmount', e.target.value)}
                              className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                              placeholder="0.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">{baseToken}</span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            ≈ 10,000 contracts
                          </p>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addPosition}
                      className="flex items-center gap-1 text-sm text-[var(--text-primary)] hover:text-[var(--color-buy)]"
                    >
                      <Plus className="w-4 h-4" />
                      Add position
                    </button>
                  </>
                )}

                {/* Calculate Button */}
                <button className="w-full py-3 rounded-full text-sm font-semibold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
                  Calculate
                </button>
              </div>

              {/* Right: Results */}
              <div className="w-48 bg-[var(--bg-tertiary)] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Result</h3>

                {activeTab === 'pnl' && pnlResults && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Margin</span>
                      <span className="text-xs text-[var(--text-primary)]">{formatNumber(pnlResults.margin)} {quoteToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">PnL</span>
                      <span className={`text-xs ${pnlResults.pnl >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {pnlResults.pnl >= 0 ? '+' : ''}{formatNumber(pnlResults.pnl)} {quoteToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">PnL %</span>
                      <span className={`text-xs ${pnlResults.pnlPercent >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {pnlResults.pnlPercent >= 0 ? '+' : ''}{formatNumber(pnlResults.pnlPercent)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Maker fee</span>
                      <span className="text-xs text-[var(--text-primary)]">{formatNumber(pnlResults.makerFee)} {quoteToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Taker fee</span>
                      <span className="text-xs text-[var(--text-primary)]">{formatNumber(pnlResults.takerFee)} {quoteToken}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'exit' && exitPriceResult && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Exit price</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{formatNumber(exitPriceResult)} {quoteToken}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'liquidation' && liquidationPriceResult && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Liquidation price</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{formatNumber(liquidationPriceResult)} {quoteToken}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'avgEntry' && avgEntryResult && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Avg entry price</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{formatNumber(avgEntryResult)} {quoteToken}</span>
                    </div>
                  </div>
                )}

                <p className="mt-8 text-xs text-[var(--text-tertiary)]">
                  Calculations are for reference only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
