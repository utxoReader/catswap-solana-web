import { useState } from 'react';
import { TradingPair } from '../../types';

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';

interface TradingFormPanelProps {
  selectedPair: TradingPair;
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
}

// Mock open orders
interface Order {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: number;
  amount: number;
  filled: number;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  time: Date;
}

const OPEN_ORDERS: Order[] = [
  {
    id: '1',
    pair: 'BTC/USDC',
    side: 'buy',
    type: 'limit',
    price: 95000,
    amount: 0.5,
    filled: 0,
    status: 'pending',
    time: new Date(),
  },
];

export const TradingFormPanel: React.FC<TradingFormPanelProps> = ({
  selectedPair,
  orderType,
  onOrderTypeChange,
}) => {
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [leverage, setLeverage] = useState('20');

  const total = parseFloat(price || '0') * parseFloat(amount || '0');
  const maxAmount = orderSide === 'buy' ? 10000 / selectedPair.price : 1.5;
  const percentage = (parseFloat(amount || '0') / maxAmount) * 100;

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const baseSymbol = selectedPair.symbol.split('/')[0];
  const quoteSymbol = selectedPair.symbol.split('/')[1] || 'USDC';

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
      {/* Buy/Sell Tabs */}
      <div className="grid grid-cols-2 gap-1 p-3 border-b border-[var(--border-primary)]">
        <button
          onClick={() => setOrderSide('buy')}
          className={`py-2.5 text-sm font-semibold rounded transition-colors ${
            orderSide === 'buy'
              ? 'bg-[var(--color-buy)] text-black'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Buy {baseSymbol}
        </button>
        <button
          onClick={() => setOrderSide('sell')}
          className={`py-2.5 text-sm font-semibold rounded transition-colors ${
            orderSide === 'sell'
              ? 'bg-[var(--color-sell)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Sell {baseSymbol}
        </button>
      </div>

      <div className="px-3 py-3 flex-1 overflow-y-auto">
        {/* Order Type & Leverage */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {(['limit', 'market'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => onOrderTypeChange(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                  orderType === type
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Leverage</span>
            <select
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded px-2 py-1 border border-[var(--border-primary)] outline-none"
            >
              <option value="1">1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="20">20x</option>
              <option value="50">50x</option>
              <option value="100">100x</option>
            </select>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          {orderType === 'limit' && (
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                Price ({quoteSymbol})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={price || formatPrice(selectedPair.price)}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                  {quoteSymbol}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              Amount ({baseSymbol})
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-300 ease-out pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                {baseSymbol}
              </span>
            </div>
            
            {/* Percentage Buttons */}
            <div className="flex gap-1 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setAmount(((maxAmount * pct) / 100).toFixed(4))}
                  className="flex-1 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-quaternary)] transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              Total ({quoteSymbol})
            </label>
            <div className="relative">
              <input
                type="text"
                value={total > 0 ? total.toFixed(2) : ''}
                readOnly
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] opacity-60 pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">
                {quoteSymbol}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="pt-2">
            <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  orderSide === 'buy' ? 'bg-[var(--color-buy)]' : 'bg-[var(--color-sell)]'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Available Balance */}
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>Available</span>
            <span className="text-[var(--text-primary)]">
              {orderSide === 'buy'
                ? `10,000.00 ${quoteSymbol}`
                : `1.50 ${baseSymbol}`}
            </span>
          </div>

          {/* Submit Button */}
          <button
            className={`w-full py-3 rounded-md text-sm font-semibold transition-all ${
              orderSide === 'buy'
                ? 'bg-[var(--color-buy)] text-black hover:bg-[var(--color-buy-hover)]'
                : 'bg-[var(--color-sell)] text-white hover:bg-[var(--color-sell-hover)]'
            }`}
          >
            {orderSide === 'buy' ? 'Buy' : 'Sell'} {baseSymbol}
          </button>
        </div>
      </div>

      {/* Orders Section */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-[var(--border-primary)]">
        <div className="flex px-3 border-b border-[var(--border-primary)]">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'open'
                ? 'text-[var(--text-primary)] border-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            Open Orders ({OPEN_ORDERS.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors ml-4 ${
              activeTab === 'history'
                ? 'text-[var(--text-primary)] border-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            Order History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'open' && OPEN_ORDERS.length === 0 && (
            <div className="flex items-center justify-center h-24 text-sm text-[var(--text-tertiary)]">
              No open orders
            </div>
          )}

          {activeTab === 'open' &&
            OPEN_ORDERS.map((order) => (
              <div
                key={order.id}
                className="p-3 mb-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      order.side === 'buy'
                        ? 'text-[var(--color-buy)] bg-[var(--color-buy-bg)]'
                        : 'text-[var(--color-sell)] bg-[var(--color-sell-bg)]'
                    }`}
                  >
                    {order.side.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {order.pair}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] ml-auto capitalize">
                    {order.type}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      Price
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">
                      {formatPrice(order.price)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      Amount
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">
                      {order.amount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      Filled
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">
                      {((order.filled / order.amount) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <button className="w-full py-1.5 text-xs font-medium rounded bg-[var(--bg-quaternary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  Cancel
                </button>
              </div>
            ))}

          {activeTab === 'history' && (
            <div className="flex items-center justify-center h-24 text-sm text-[var(--text-tertiary)]">
              No order history
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingFormPanel;
