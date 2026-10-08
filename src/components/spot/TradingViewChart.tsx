import React, { useEffect, useRef, useState } from 'react';
import type {
  CandlestickData,
  CustomData,
  CustomSeriesOptions,
  CustomSeriesWhitespaceData,
  IChartApi,
  ICustomSeriesPaneRenderer,
  ICustomSeriesPaneView,
  ISeriesApi,
  PaneRendererCustomData,
  Time,
} from 'lightweight-charts';
import { CandleData, TradingPair } from '../../types';

type TimeFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

// Custom volume series data: value carries the (possibly 1e6-normalized)
// volume, color comes from CustomData.color.
interface VolumeBarItem extends CustomData<Time> {
  value: number;
}

type RenderTarget = Parameters<ICustomSeriesPaneRenderer['draw']>[0];
type PriceConverter = Parameters<ICustomSeriesPaneRenderer['draw']>[1];

// Draws volume bars at candlestick body width (~0.8 * barSpacing). The stock
// HistogramSeries spans the full x-pitch, which made volume bars visibly
// wider than the candles.
class VolumeBarsRenderer implements ICustomSeriesPaneRenderer {
  private _data: PaneRendererCustomData<Time, VolumeBarItem> | null = null;

  update(data: PaneRendererCustomData<Time, VolumeBarItem>): void {
    this._data = data;
  }

  draw(target: RenderTarget, priceConverter: PriceConverter): void {
    const data = this._data;
    if (!data || data.bars.length === 0) return;
    const zeroY = priceConverter(0);
    if (zeroY === null) return;
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;
      const barWidth = Math.max(1, Math.floor(data.barSpacing * 0.8));
      const halfWidth = barWidth / 2;
      const from = Math.max(0, Math.floor(data.visibleRange?.from ?? 0));
      const to = Math.min(data.bars.length, Math.ceil(data.visibleRange?.to ?? data.bars.length));
      for (let i = from; i < to; i++) {
        const bar = data.bars[i];
        const y = priceConverter(bar.originalData.value);
        if (y === null) continue;
        const top = Math.min(y, zeroY);
        const height = Math.max(1, Math.abs(zeroY - y));
        ctx.fillStyle = bar.barColor;
        ctx.fillRect(
          Math.round((bar.x - halfWidth) * hRatio),
          Math.round(top * vRatio),
          Math.max(1, Math.round(barWidth * hRatio)),
          Math.max(1, Math.round(height * vRatio))
        );
      }
    });
  }
}

class VolumeBarsPaneView implements ICustomSeriesPaneView<Time, VolumeBarItem, CustomSeriesOptions> {
  private readonly _renderer = new VolumeBarsRenderer();
  private readonly _defaults: CustomSeriesOptions;

  constructor(defaults: CustomSeriesOptions) {
    this._defaults = defaults;
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  update(data: PaneRendererCustomData<Time, VolumeBarItem>): void {
    this._renderer.update(data);
  }

  // Include 0 so autoscale pins the baseline to the region bottom.
  priceValueBuilder(plotRow: VolumeBarItem): number[] {
    return [plotRow.value, 0, plotRow.value];
  }

  isWhitespace(data: VolumeBarItem | CustomSeriesWhitespaceData<Time>): data is CustomSeriesWhitespaceData<Time> {
    return (data as VolumeBarItem).value === undefined;
  }

  defaultOptions(): CustomSeriesOptions {
    return this._defaults;
  }
}

interface TradingViewChartProps {
  selectedPair: TradingPair;
  candleData: CandleData[];
  timeFrame: TimeFrame;
  onTimeFrameChange: (tf: TimeFrame) => void;
}

const TIME_FRAMES: { value: TimeFrame; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1H', label: '1H' },
  { value: '4H', label: '4H' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
];

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  selectedPair: _selectedPair,
  candleData,
  timeFrame,
  onTimeFrameChange,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Custom'> | null>(null);
  const hasRangedRef = useRef(false);
  const lastRangeTfRef = useRef<TimeFrame | null>(null);
  // Volume region split: top margin of the 'volume' scale (0.8 = bottom 20%).
  const volumeRatioRef = useRef(0.8);
  const isDraggingSplitRef = useRef(false);
  const [volumeRatio, setVolumeRatio] = useState(0.8);
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || typeof window === 'undefined') return;

    let isActive = true;
    let resizeObserver: ResizeObserver | null = null;

    const setupChart = async () => {
      const { CandlestickSeries, createChart, customSeriesDefaultOptions } = await import('lightweight-charts');
      if (!isActive || !chartContainerRef.current) return;

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#888',
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#758696',
            style: 2,
            width: 1,
            labelBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#758696',
          },
          horzLine: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#758696',
            style: 2,
            width: 1,
            labelBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#758696',
          },
        },
        rightPriceScale: {
          borderVisible: false,
          // Candle scale region: top 80% (bottom 20% reserved for volume).
          scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
          // satswap recipe (boss-approved reference): TV-default candle width
          barSpacing: 6,
          minBarSpacing: 2,
          rightOffset: 5,
        },
        handleScroll: {
          vertTouchDrag: false,
        },
        // Explicit zoom affordances (OKX-style): wheel/pinch zoom, axis drag.
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#0ECB81',
        downColor: '#F6465D',
        borderUpColor: '#0ECB81',
        borderDownColor: '#F6465D',
        wickUpColor: '#0ECB81',
        wickDownColor: '#F6465D',
        // Default RIGHT price scale — only 'left'/'right' render axis labels.
        // (satswap's named 'candle' scale is an overlay scale with NO axis
        // labels, which blanked the price axis. Only volume uses a named
        // hidden scale.)
      });

      // Custom series: HistogramSeries bars span the full x-pitch and looked
      // wider than the candle bodies; this renderer matches candle width.
      const volumeSeries = chart.addCustomSeries(
        new VolumeBarsPaneView({
          ...customSeriesDefaultOptions,
          // Dust volumes (~1e-4): type 'volume' uses precision 0, which rounds
          // the autoscale range to [0,0] and collapses every bar to zero
          // height. A custom format with a tiny minMove keeps the scale honest.
          priceFormat: {
            type: 'custom',
            formatter: (v: number) => (v > 0 && v < 1 ? v.toPrecision(2) : v.toLocaleString('en-US')),
            minMove: 0.0001,
          },
          lastValueVisible: false,
          priceLineVisible: false,
        }),
        { priceScaleId: 'volume' }
      );

      // Volume occupies the bottom 20% on its own hidden scale.
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: volumeRatioRef.current, bottom: 0 },
        visible: false,
      });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      setIsChartReady(true);

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };

      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartContainerRef.current);
      handleResize();
    };

    void setupChart();

    return () => {
      isActive = false;
      resizeObserver?.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, []);

  // Update data when candleData changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !isChartReady) return;

    // On-chain meme prices can be ~1e-11 — default precision 2 would round
    // every label to 0.00, and fixed 12-decimal labels truncate on the axis.
    // Use a compact significant-digit formatter for tiny prices.
    const maxPrice = candleData.reduce((m, d) => Math.max(m, d.high), 0);
    if (maxPrice > 0 && maxPrice < 0.01) {
      const precision = Math.min(12, Math.max(4, Math.ceil(-Math.log10(maxPrice)) + 3));
      candleSeriesRef.current.applyOptions({
        priceFormat: {
          type: 'custom',
          formatter: (p: number) => (p > 0 && p < 0.01 ? p.toPrecision(3) : p.toFixed(2)),
          minMove: Math.pow(10, -precision),
        },
      });
    }

    const formattedCandles: CandlestickData[] = candleData.map(d => ({
      time: (d.time / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    // Dust volumes (~1e-4 USDC) collapse to zero-height bars when fed raw
    // (autoscale nice-range rounds the span away, regardless of formatter).
    // Normalize to a healthy magnitude; the formatter divides back so the
    // crosshair legend still shows true USDC values.
    const maxVol = candleData.reduce((m, d) => Math.max(m, d.volume), 0);
    const volScale = maxVol > 0 && maxVol < 1 ? 1e6 : 1;
    volumeSeriesRef.current.applyOptions({
      priceFormat: {
        type: 'custom',
        formatter: (v: number) => {
          const raw = v / volScale;
          return raw > 0 && raw < 1 ? raw.toPrecision(2) : raw.toLocaleString('en-US');
        },
        minMove: 1,
      },
    });

    const formattedVolumes: VolumeBarItem[] = candleData.map(d => ({
      time: (d.time / 1000) as Time,
      value: d.volume * volScale,
      color: d.close >= d.open ? '#0ECB81' : '#F6465D',
    }));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current.setData(formattedVolumes);

    // Auto-range ONLY on first load or timeframe switch. The 10s live poll
    // must never touch the visible range — otherwise user zoom/pan is reset
    // every refresh (the "can't zoom" complaint).
    const ts = chartRef.current?.timeScale();
    const tfChanged = lastRangeTfRef.current !== timeFrame;
    if (tfChanged || !hasRangedRef.current) {
      if (candleData.length < 50) {
        ts?.scrollToRealTime();
      } else {
        ts?.fitContent();
      }
      lastRangeTfRef.current = timeFrame;
      hasRangedRef.current = true;
    }
  }, [candleData, isChartReady, timeFrame]);

  // OKX-style split drag: resize price/volume regions by dragging the
  // boundary. ratio = top margin of the 'volume' scale, clamped so the
  // volume region stays between 10% and 50% of the chart height.
  const applySplitRatio = (ratio: number) => {
    const clamped = Math.min(0.9, Math.max(0.5, ratio));
    volumeRatioRef.current = clamped;
    setVolumeRatio(clamped);
    if (!chartRef.current) return;
    chartRef.current.priceScale('volume').applyOptions({
      scaleMargins: { top: clamped, bottom: 0 },
    });
    chartRef.current.priceScale('right').applyOptions({
      scaleMargins: { top: 0.1, bottom: 1 - clamped },
    });
  };

  const handleSplitPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingSplitRef.current = true;
    setIsSplitActive(true);
  };

  const handleSplitPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplitRef.current || !chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    applySplitRatio((e.clientY - rect.top) / rect.height);
  };

  const handleSplitPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSplitRef.current = false;
    setIsSplitActive(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)]">
      {/* Time Frame Selector */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-primary)]">
        {TIME_FRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onTimeFrameChange(tf.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              timeFrame === tf.value
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart Container (relative: hosts the split drag strip) */}
      <div ref={chartContainerRef} className="relative flex-1 min-h-[300px]">
        {/* Invisible 6px strip at the volume region's top edge; drag to resize. */}
        <div
          className="absolute left-0 right-0 z-10 hover:bg-[var(--border-primary)]"
          style={{
            top: `calc(${volumeRatio * 100}% - 3px)`,
            height: 6,
            cursor: 'row-resize',
            touchAction: 'none',
            background: isSplitActive ? 'var(--border-primary)' : undefined,
          }}
          onPointerDown={handleSplitPointerDown}
          onPointerMove={handleSplitPointerMove}
          onPointerUp={handleSplitPointerUp}
          onPointerCancel={handleSplitPointerUp}
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
