import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TradingPair, CandleData } from '../types';
import { Card } from './ui/Card';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { formatPrice, formatVolume } from '../shared/lib/formatters';

interface PriceChartProps {
  pair: TradingPair | null;
  candleData: CandleData[];
}

type TimeFrame = '1H' | '4H' | '1D' | '1W' | '1M';

const TIME_FRAMES: TimeFrame[] = ['1H', '4H', '1D', '1W', '1M'];

export const PriceChart: React.FC<PriceChartProps> = ({
  pair,
  candleData,
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1D');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  const chartData = useMemo(() => {
    return candleData.map((candle) => ({
      time: new Date(candle.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      price: candle.close,
      volume: candle.volume,
    }));
  }, [candleData]);

  if (!pair) {
    return (
      <Card className="p-6">
        <div className="h-[350px] flex items-center justify-center text-foreground-tertiary">
          Select a trading pair to view the chart
        </div>
      </Card>
    );
  }

  const priceChange = pair.change24h >= 0;
  const chartColor = priceChange ? 'var(--color-buy)' : 'var(--color-sell)';

  const tooltipStyles = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '12px',
  };

  const labelStyle = {
    color: 'var(--text-tertiary)',
    marginBottom: '4px',
  };

  const itemStyle = {
    color: 'var(--text-primary)',
  };

  return (
    <Card className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-semibold text-foreground">
              {pair.symbol}
            </span>
            <span className="text-sm text-foreground-tertiary">
              {pair.name}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              ${formatPrice(pair.price)}
            </span>
            <span
              className={`text-sm font-medium px-2 py-0.5 rounded ${
                priceChange
                  ? 'text-success bg-success-light'
                  : 'text-danger bg-danger-light'
              }`}
            >
              {priceChange ? '+' : ''}
              {pair.change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Time Frames */}
          <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as TimeFrame)}>
            <TabsList>
              {TIME_FRAMES.map((tf) => (
                <TabsTrigger key={tf} value={tf}>
                  {tf}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Chart Types */}
          <Tabs
            value={chartType}
            onValueChange={(v) => setChartType(v as 'line' | 'area')}
          >
            <TabsList>
              <TabsTrigger value="area">Area</TabsTrigger>
              <TabsTrigger value="line">Line</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] sm:h-[350px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                tickFormatter={(value) => `$${formatPrice(value)}`}
                width={80}
              />
              <Tooltip
                contentStyle={tooltipStyles}
                labelStyle={labelStyle}
                itemStyle={itemStyle}
                formatter={(value) => [
                  `$${formatPrice(Number(value))}`,
                  'Price',
                ]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                tickFormatter={(value) => `$${formatPrice(value)}`}
                width={80}
              />
              <Tooltip
                contentStyle={tooltipStyles}
                labelStyle={labelStyle}
                itemStyle={itemStyle}
                formatter={(value) => [
                  `$${formatPrice(Number(value))}`,
                  'Price',
                ]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <div>
          <span className="block text-xs text-foreground-tertiary mb-1">
            24h High
          </span>
          <span className="text-sm font-medium text-foreground">
            ${formatPrice(pair.high24h)}
          </span>
        </div>
        <div>
          <span className="block text-xs text-foreground-tertiary mb-1">
            24h Low
          </span>
          <span className="text-sm font-medium text-foreground">
            ${formatPrice(pair.low24h)}
          </span>
        </div>
        <div>
          <span className="block text-xs text-foreground-tertiary mb-1">
            24h Volume
          </span>
          <span className="text-sm font-medium text-foreground">
            {formatVolume(pair.volume24h)}
          </span>
        </div>
      </div>
    </Card>
  );
};
