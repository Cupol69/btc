import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CandlestickData,
  HistogramData,
  Time,
  LineStyle,
} from 'lightweight-charts';
import { Kline, TacticalTradePlan, DumpRiskAssessment } from '../types';
import { TIMEFRAMES } from './Header';
import { TrendingUp, BarChart2, Eye, SlidersHorizontal, Crosshair, ShieldAlert, Target } from 'lucide-react';
import { DumpRadarBulb } from './DumpRadarBulb';

interface PriceChartProps {
  symbol: string;
  klines: Kline[];
  activeInterval: string;
  onIntervalChange: (interval: string) => void;
  markPrice?: number;
  tacticalPlan?: TacticalTradePlan | null;
  dumpRisk?: DumpRiskAssessment | null;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  klines,
  activeInterval,
  onIntervalChange,
  markPrice,
  tacticalPlan,
  dumpRisk,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const ema20SeriesRef = useRef<any>(null);
  const ema50SeriesRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showAiLines, setShowAiLines] = useState(true);

  // Helper to compute EMA
  const calculateEMA = (data: Kline[], period: number) => {
    const k = 2 / (period + 1);
    const emaArray: { time: Time; value: number }[] = [];
    if (data.length < period) return emaArray;

    // Initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    let prevEma = sum / period;
    emaArray.push({ time: data[period - 1].time as Time, value: prevEma });

    for (let i = period; i < data.length; i++) {
      const currentEma = data[i].close * k + prevEma * (1 - k);
      emaArray.push({ time: data[i].time as Time, value: currentEma });
      prevEma = currentEma;
    }

    return emaArray;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart & series references
    if (chartInstanceRef.current) {
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      priceLinesRef.current = [];
      try {
        chartInstanceRef.current.remove();
      } catch {}
      chartInstanceRef.current = null;
    }

    let chart: IChartApi | null = null;
    try {
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: '#090d16' },
          textColor: '#94a3b8',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace, -apple-system",
        },
        grid: {
          vertLines: { color: '#1e293b' },
          horzLines: { color: '#1e293b' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#64748b',
            width: 1,
            style: 3,
            labelBackgroundColor: '#1e293b',
          },
          horzLine: {
            color: '#64748b',
            width: 1,
            style: 3,
            labelBackgroundColor: '#1e293b',
          },
        },
        rightPriceScale: {
          borderColor: '#1e293b',
          scaleMargins: {
            top: 0.1,
            bottom: 0.25,
          },
        },
        timeScale: {
          borderColor: '#1e293b',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartInstanceRef.current = chart;

      // 1. Candlestick Series
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      candleSeriesRef.current = candleSeries;

      // 2. Volume Series
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#38bdf8',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;

      // 3. EMA 20 (Amber)
      const ema20Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        priceLineVisible: false,
        title: 'EMA 20',
      });
      ema20SeriesRef.current = ema20Series;

      // 4. EMA 50 (Cyan/Blue)
      const ema50Series = chart.addSeries(LineSeries, {
        color: '#06b6d4',
        lineWidth: 2,
        priceLineVisible: false,
        title: 'EMA 50',
      });
      ema50SeriesRef.current = ema50Series;
    } catch (err) {
      console.warn('[PriceChart] Init chart error:', err);
    }

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      if (!chartInstanceRef.current) return;
      try {
        const { width, height } = entries[0].contentRect;
        chartInstanceRef.current.applyOptions({ width, height });
      } catch {}
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      priceLinesRef.current = [];
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch {}
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Update data when klines change
  useEffect(() => {
    if (!klines || klines.length === 0 || !candleSeriesRef.current || !volumeSeriesRef.current || !chartInstanceRef.current) return;

    try {
      const formattedCandles: CandlestickData<Time>[] = klines.map((k) => ({
        time: k.time as Time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));

      const formattedVolume: HistogramData<Time>[] = klines.map((k) => ({
        time: k.time as Time,
        value: k.volume,
        color: k.close >= k.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      }));

      candleSeriesRef.current.setData(formattedCandles);

      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(formattedVolume);
      } else if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData([]);
      }

      // Update EMAs
      if (showEma20 && ema20SeriesRef.current) {
        ema20SeriesRef.current.setData(calculateEMA(klines, 20));
      } else if (ema20SeriesRef.current) {
        ema20SeriesRef.current.setData([]);
      }

      if (showEma50 && ema50SeriesRef.current) {
        ema50SeriesRef.current.setData(calculateEMA(klines, 50));
      } else if (ema50SeriesRef.current) {
        ema50SeriesRef.current.setData([]);
      }
    } catch (e) {
      console.warn('Error updating chart data:', e);
    }
  }, [klines, showVolume, showEma20, showEma50]);

  // Update AI Tactical Trade Plan price lines overlay
  useEffect(() => {
    if (!candleSeriesRef.current || !chartInstanceRef.current) return;

    // Clear existing price lines
    priceLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];

    if (!showAiLines || !tacticalPlan || tacticalPlan.entryPrice <= 0) return;

    try {
      const isLong = tacticalPlan.bias === 'LONG' || tacticalPlan.bias === 'NEUTRAL';

      // 1. Entry Line
      const entryLine = candleSeriesRef.current.createPriceLine({
        price: tacticalPlan.entryPrice,
        color: '#38bdf8', // Sky blue
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `AI Entry (${tacticalPlan.bias})`,
      });
      priceLinesRef.current.push(entryLine);

      // 2. Target 1 Line
      if (tacticalPlan.target1Price > 0) {
        const tp1Line = candleSeriesRef.current.createPriceLine({
          price: tacticalPlan.target1Price,
          color: '#10b981', // Emerald green
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'TP 1',
        });
        priceLinesRef.current.push(tp1Line);
      }

      // 3. Target 2 Line (if present)
      if (tacticalPlan.target2Price && tacticalPlan.target2Price > 0) {
        const tp2Line = candleSeriesRef.current.createPriceLine({
          price: tacticalPlan.target2Price,
          color: '#059669', // Darker emerald
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'TP 2',
        });
        priceLinesRef.current.push(tp2Line);
      }

      // 4. Invalidation / Stop Line
      if (tacticalPlan.invalidationPrice > 0) {
        const slLine = candleSeriesRef.current.createPriceLine({
          price: tacticalPlan.invalidationPrice,
          color: '#ef4444', // Red
          lineWidth: 2,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: true,
          title: 'AI Invalidation',
        });
        priceLinesRef.current.push(slLine);
      }
    } catch (e) {
      console.warn('Error adding AI trade lines to chart:', e);
    }
  }, [tacticalPlan, showAiLines]);

  const lastKline = klines.length > 0 ? klines[klines.length - 1] : null;

  const isCriticalRisk = dumpRisk?.level === 'CRITICAL';
  const isHighRisk = dumpRisk?.level === 'HIGH';

  return (
    <div
      id="price-chart-panel"
      className={`bg-slate-900/90 rounded-xl border p-3.5 flex flex-col h-[480px] transition-all duration-300 ${
        isCriticalRisk
          ? 'border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
          : isHighRisk
          ? 'border-orange-500/50'
          : 'border-slate-800'
      }`}
    >
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {symbol} Candlesticks
          </h3>

          {/* Dump Radar Bulb Component */}
          {dumpRisk && <DumpRadarBulb dumpRisk={dumpRisk} symbol={symbol} />}

          {lastKline && (
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 ml-1">
              <span>O: <span className="text-slate-200">{lastKline.open}</span></span>
              <span>H: <span className="text-emerald-400">{lastKline.high}</span></span>
              <span>L: <span className="text-rose-400">{lastKline.low}</span></span>
              <span>C: <span className="text-slate-200">{lastKline.close}</span></span>
            </div>
          )}
        </div>

        {/* Indicators and Timeframe controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Levels Toggle */}
          {tacticalPlan && (
            <button
              onClick={() => setShowAiLines(!showAiLines)}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                showAiLines
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
              }`}
              title="Переключить отображение тактических уровней AI (Entry, Targets, Invalidation)"
            >
              <Crosshair className="w-3 h-3" />
              <span>AI Levels {showAiLines ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Indicator toggles */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-[10px] font-mono">
            <button
              onClick={() => setShowEma20(!showEma20)}
              className={`px-1.5 py-0.5 rounded transition ${
                showEma20 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              EMA 20
            </button>
            <button
              onClick={() => setShowEma50(!showEma50)}
              className={`px-1.5 py-0.5 rounded transition ${
                showEma50 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              EMA 50
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-1.5 py-0.5 rounded transition ${
                showVolume ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Vol
            </button>
          </div>

          {/* Timeframe switch */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => onIntervalChange(tf.id)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded transition ${
                  activeInterval === tf.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="flex-1 w-full relative min-h-0 rounded-lg overflow-hidden border border-slate-800/80">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
