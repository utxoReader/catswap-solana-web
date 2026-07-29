import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TradingPair, CandleData } from '../../types';

type TimeFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

interface ChartPanelProps {
  selectedPair: TradingPair;
  candleData: CandleData[];
  timeFrame: TimeFrame;
  onTimeFrameChange: (tf: TimeFrame) => void;
}

const TIME_FRAMES: TimeFrame[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

export const ChartPanel: React.FC<ChartPanelProps> = ({
  selectedPair,
  candleData,
  timeFrame,
  onTimeFrameChange,
}) => {
  const priceChange = selectedPair.change24h >= 0;

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toFixed(2);
  };

  const tooltipStyles = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '6px',
    padding: '8px 12px',
  };

  const labelStyle = {
    color: 'var(--text-tertiary)',
    fontSize: 12,
  };

  return (
    <div className="flex flex-col h-full min-w-0 bg-[var(--bg-secondary)]">
      {/* Stats Row */}
      <div className="hidden sm:flex items-center gap-6 px-4 py-2 border-b border-[var(--border-primary)] overflow-x-auto">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase">Mark Price</span>
          <span className={`text-sm font-medium ${priceChange ? 'text-[var(--color-buy)]' : 'text-[var(--color-sell)]'}`}>
            {formatPrice(selectedPair.price)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase">Index Price</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {formatPrice(selectedPair.price * 0.9998)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase">24h High</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {formatPrice(selectedPair.high24h)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase">24h Low</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {formatPrice(selectedPair.low24h)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase">24h Volume</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {formatVolume(selectedPair.volume24h)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase">Funding Rate</span>
          <span className="text-sm font-medium text-[var(--color-buy)]">
            +0.01%
          </span>
        </div>
      </div>

      {/* Time Frame Selector */}
      <div className="flex gap-1 px-4 py-2 border-b border-[var(--border-primary)] overflow-x-auto">
        {TIME_FRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeFrameChange(tf)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              timeFrame === tf
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={candleData.slice(-100)}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
            />
            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickFormatter={(value) => `$${formatPrice(value)}`}
              width={70}
              orientation="right"
            />
            <Tooltip
              contentStyle={tooltipStyles}
              labelStyle={labelStyle}
              formatter={(value: number) => [`$${formatPrice(value)}`, 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={priceChange ? 'var(--color-buy)' : 'var(--color-sell)'}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: priceChange ? 'var(--color-buy)' : 'var(--color-sell)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartPanel;
