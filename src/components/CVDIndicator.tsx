import React, { useState } from 'react';
import { CVDData, TickCvdPoint } from '../types';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

interface CVDIndicatorProps {
  cvdData: CVDData;
  timeframe: string;
}

export const CVDIndicator: React.FC<CVDIndicatorProps> = ({ cvdData, timeframe }) => {
  const {
    points,
    netDeltaUsd,
    buyerDominancePercent,
    trend,
    liveTickPoints = [],
    liveTickDeltaUsd = 0,
    liveTradesCount = 0,
    liveBuyVolumeUsd = 0,
    liveSellVolumeUsd = 0,
  } = cvdData;

  const [viewMode, setViewMode] = useState<'CANDLE' | 'TICK'>('TICK');

  const formatUsd = (val: number): string => {
    const abs = Math.abs(val);
    const sign = val >= 0 ? '+' : '-';
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
    return `${sign}$${abs.toFixed(0)}`;
  };

  const isNetPositive = viewMode === 'TICK' ? liveTickDeltaUsd >= 0 : netDeltaUsd >= 0;
  const currentDeltaUsd = viewMode === 'TICK' ? liveTickDeltaUsd : netDeltaUsd;

  const liveTotalVolume = liveBuyVolumeUsd + liveSellVolumeUsd;
  const liveBuyerDominance = liveTotalVolume > 0 ? (liveBuyVolumeUsd / liveTotalVolume) * 100 : 50;

  const getTrendBadge = () => {
    switch (trend) {
      case 'BULLISH_FLOW':
        return {
          label: 'Bullish Aggression',
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          icon: <TrendingUp className="w-3 h-3 mr-1" />,
          desc: 'Маркет-покупатели активно двигают цену вверх (Taker Buy доминирует)',
        };
      case 'BEARISH_FLOW':
        return {
          label: 'Bearish Aggression',
          color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          icon: <TrendingDown className="w-3 h-3 mr-1" />,
          desc: 'Маркет-продавцы агрессивно давят цену вниз (Taker Sell доминирует)',
        };
      case 'ABSORPTION':
        return {
          label: 'Absorption / Divergence',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Activity className="w-3 h-3 mr-1" />,
          desc: 'Поглощение: рыночные ордера встречают крупные лимитные стенки',
        };
      default:
        return {
          label: 'Neutral Delta Flow',
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <ShieldCheck className="w-3 h-3 mr-1" />,
          desc: 'Сбалансированный поток маркет-ордеров покупателей и продавцов',
        };
    }
  };

  const badge = getTrendBadge();

  // Tick-by-Tick High Frequency CVD Chart
  const renderLiveTickChart = () => {
    if (!liveTickPoints || liveTickPoints.length < 2) {
      return (
        <div className="h-16 flex items-center justify-center text-[11px] font-mono text-slate-500 bg-slate-900/60 rounded border border-slate-800">
          <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400 mr-1.5" />
          <span>Ожидание входящих тиковых маркет-сделок (aggTrade stream)...</span>
        </div>
      );
    }

    const values = liveTickPoints.map((p) => p.cumulativeUsd);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 360;
    const height = 56;
    const padding = 6;

    const pts = liveTickPoints.map((p, idx) => {
      const x = (idx / (liveTickPoints.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((p.cumulativeUsd - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const lastVal = liveTickPoints[liveTickPoints.length - 1].cumulativeUsd;
    const firstVal = liveTickPoints[0].cumulativeUsd;
    const isPositiveSlope = lastVal >= firstVal;
    const strokeColor = isPositiveSlope ? '#10b981' : '#f43f5e';
    const fillColor = isPositiveSlope ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)';

    const areaPoints = `${pts.join(' ')} ${width - padding},${height} ${padding},${height}`;

    const lastX = width - padding;
    const lastY = height - padding - ((lastVal - min) / range) * (height - padding * 2);

    return (
      <div className="relative bg-slate-950/70 p-2 rounded-lg border border-slate-800 overflow-hidden">
        {/* Zero baseline indicator */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1">
          <span className="flex items-center gap-1 text-slate-400">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            <span>Тиковый поток ({liveTickPoints.length} сделок)</span>
          </span>
          <span className={isNetPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            Сессия: {formatUsd(liveTickDeltaUsd)}
          </span>
        </div>

        <svg className="w-full h-14 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          <polygon points={areaPoints} fill={fillColor} />
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pts.join(' ')}
          />

          {/* Glowing Head Point */}
          <circle
            cx={lastX}
            cy={lastY}
            r="3.5"
            fill={strokeColor}
            className="animate-ping opacity-75"
          />
          <circle
            cx={lastX}
            cy={lastY}
            r="3"
            fill="#ffffff"
            stroke={strokeColor}
            strokeWidth="1.5"
          />

          {/* Zero reference dashed line */}
          {min < 0 && max > 0 && (
            <line
              x1="0"
              y1={height - padding - ((0 - min) / range) * (height - padding * 2)}
              x2={width}
              y2={height - padding - ((0 - min) / range) * (height - padding * 2)}
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}
        </svg>

        {/* Live Mini Trades Feed Bar */}
        <div className="mt-2 flex items-center justify-between text-[10px] font-mono border-t border-slate-800/80 pt-1.5 text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Buy Taker: <strong className="text-slate-200">{formatUsd(liveBuyVolumeUsd)}</strong></span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Sell Taker: <strong className="text-slate-200">{formatUsd(liveSellVolumeUsd)}</strong></span>
          </span>
        </div>
      </div>
    );
  };

  // Candle-based Sparkline for historical timeframe
  const renderCandleSparkline = () => {
    if (!points || points.length < 2) return null;
    const slice = points.slice(-35);
    const cvdValues = slice.map((p) => p.cvdUsd);
    const min = Math.min(...cvdValues);
    const max = Math.max(...cvdValues);
    const range = max - min || 1;

    const width = 360;
    const height = 56;
    const padding = 6;

    const pts = slice.map((p, idx) => {
      const x = (idx / (slice.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((p.cvdUsd - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const isPositiveSlope = slice[slice.length - 1].cvdUsd >= slice[0].cvdUsd;
    const strokeColor = isPositiveSlope ? '#10b981' : '#f43f5e';
    const fillColor = isPositiveSlope ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

    const areaPoints = `${pts.join(' ')} ${width - padding},${height} ${padding},${height}`;

    return (
      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1">
          <span>Свечной CVD ({timeframe})</span>
          <span className={netDeltaUsd >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            Итог: {formatUsd(netDeltaUsd)}
          </span>
        </div>
        <svg className="w-full h-14 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          <polygon points={areaPoints} fill={fillColor} />
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pts.join(' ')}
          />
          {min < 0 && max > 0 && (
            <line
              x1="0"
              y1={height - padding - ((0 - min) / range) * (height - padding * 2)}
              x2={width}
              y2={height - padding - ((0 - min) / range) * (height - padding * 2)}
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          )}
        </svg>
      </div>
    );
  };

  const effectiveBuyerPct = viewMode === 'TICK' ? liveBuyerDominance : buyerDominancePercent;

  return (
    <div id="cvd-indicator-widget" className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-3 shadow-md">
      {/* Header with Mode Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              Cumulative Volume Delta (CVD)
            </h3>
          </div>
        </div>

        {/* Live / Candle Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setViewMode('TICK')}
            className={`px-2 py-1 rounded font-bold flex items-center gap-1 transition ${
              viewMode === 'TICK'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-2.5 h-2.5" />
            <span>Тиковый Live</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('CANDLE')}
            className={`px-2 py-1 rounded font-bold flex items-center gap-1 transition ${
              viewMode === 'CANDLE'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Свечной ({timeframe})</span>
          </button>
        </div>
      </div>

      {/* Net Delta Metrics Row */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block">
            {viewMode === 'TICK' ? 'Live Taker Дельта (USD)' : 'Свечной Net Delta (USD)'}
          </span>
          <span className={`text-base font-bold flex items-center gap-0.5 ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isNetPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {formatUsd(currentDeltaUsd)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Taker Buyer Доминирование</span>
          <span className="font-bold text-slate-200">
            {effectiveBuyerPct.toFixed(1)}%{' '}
            <span className="text-slate-400 text-[10px]">
              ({(100 - effectiveBuyerPct).toFixed(1)}% Sell)
            </span>
          </span>
        </div>
      </div>

      {/* Main CVD Visual: Tick or Candle */}
      {viewMode === 'TICK' ? renderLiveTickChart() : renderCandleSparkline()}

      {/* Dominance Split Bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-750">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${effectiveBuyerPct}%` }}
            title={`Покупки: ${effectiveBuyerPct.toFixed(1)}%`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${100 - effectiveBuyerPct}%` }}
            title={`Продажи: ${(100 - effectiveBuyerPct).toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Trend Diagnosis Badge */}
      <div className="flex items-center justify-between text-[11px] font-mono pt-1">
        <span className={`px-2 py-0.5 rounded border inline-flex items-center font-bold text-[10px] ${badge.color}`}>
          {badge.icon}
          {badge.label}
        </span>
        <span className="text-slate-400 text-[10px] text-right truncate max-w-[220px]">
          {badge.desc}
        </span>
      </div>
    </div>
  );
};
