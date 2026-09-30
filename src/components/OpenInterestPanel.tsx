import React, { useState, useEffect, useMemo } from 'react';
import { OpenInterest, OpenInterestHist } from '../types';
import { binanceRest } from '../services/binanceRest';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OpenInterestPanelProps {
  openInterest: OpenInterest | null;
  initialOiHistory: OpenInterestHist[];
  symbol: string;
  futuresPrice: number;
  priceChange24h?: number;
}

export type OiPeriod = '15m' | '1h' | '4h';

interface OiRegime {
  badgeText: string;
  badgeClass: string;
  description: string;
  type: 'LONG_BUILD' | 'SHORT_BUILD' | 'SHORT_SQUEEZE' | 'LONG_LIQ' | 'NEUTRAL';
  icon: typeof TrendingUp;
}

export const OpenInterestPanel: React.FC<OpenInterestPanelProps> = ({
  openInterest,
  initialOiHistory,
  symbol,
  futuresPrice,
  priceChange24h = 0,
}) => {
  const [period, setPeriod] = useState<OiPeriod>('1h');
  const [history, setHistory] = useState<OpenInterestHist[]>(initialOiHistory);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Sync initial history
  useEffect(() => {
    if (initialOiHistory && initialOiHistory.length > 0 && period === '1h') {
      setHistory(initialOiHistory);
    }
  }, [initialOiHistory, period]);

  // Fetch when period changes
  const handlePeriodChange = async (newPeriod: OiPeriod) => {
    setPeriod(newPeriod);
    setIsLoadingHistory(true);
    try {
      const data = await binanceRest.getOpenInterestHist(symbol, newPeriod, 30);
      if (data && data.length > 0) {
        setHistory(data);
      }
    } catch {
      // Keep existing history on network error
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const oiVal = openInterest ? parseFloat(openInterest.openInterest) : 0;
  const oiUsd = oiVal * (futuresPrice || 1);

  // Analytics on OI History
  const analytics = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        change1: 0,
        change1Pct: 0,
        change4: 0,
        change4Pct: 0,
        changeTotal: 0,
        changeTotalPct: 0,
        minUsd: oiUsd,
        maxUsd: oiUsd,
        regime: {
          badgeText: 'Баланс / Нейтрально',
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
          description: 'Открытый интерес стабилен. Фаза накопления позиций.',
          type: 'NEUTRAL' as const,
          icon: ShieldCheck,
        },
        bars: [],
      };
    }

    const numericValues = history.map((item) => parseFloat(item.sumOpenInterestValue));
    const currentHistVal = numericValues[numericValues.length - 1] || oiUsd;
    const minUsd = Math.min(...numericValues);
    const maxUsd = Math.max(...numericValues);

    // 1-step delta (last vs previous)
    const prev1 = numericValues[numericValues.length - 2] || currentHistVal;
    const change1 = currentHistVal - prev1;
    const change1Pct = prev1 > 0 ? (change1 / prev1) * 100 : 0;

    // 4-step delta
    const prev4Idx = Math.max(0, numericValues.length - 5);
    const prev4 = numericValues[prev4Idx] || currentHistVal;
    const change4 = currentHistVal - prev4;
    const change4Pct = prev4 > 0 ? (change4 / prev4) * 100 : 0;

    // Total period delta
    const firstVal = numericValues[0] || currentHistVal;
    const changeTotal = currentHistVal - firstVal;
    const changeTotalPct = firstVal > 0 ? (changeTotal / firstVal) * 100 : 0;

    // Prepare Bars data with dynamic scaling and delta comparison
    const rawRange = maxUsd - minUsd;
    // Focused baseline scaling: avoid flat bars by zooming in on actual variance
    const range = rawRange > 0 ? rawRange : 1;

    const bars = history.map((item, idx) => {
      const val = parseFloat(item.sumOpenInterestValue);
      const prevVal = idx > 0 ? parseFloat(history[idx - 1].sumOpenInterestValue) : val;
      const stepDelta = val - prevVal;
      const stepDeltaPct = prevVal > 0 ? (stepDelta / prevVal) * 100 : 0;
      const isUp = stepDelta >= 0;

      // Scaled height between 20% and 100% of container
      const normalizedHeight = Math.max(20, Math.min(100, ((val - minUsd) / range) * 80 + 20));

      const timeLabel = item.timestamp
        ? new Date(typeof item.timestamp === 'string' ? parseInt(item.timestamp, 10) : item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : `${idx}`;

      return {
        val,
        stepDelta,
        stepDeltaPct,
        isUp,
        normalizedHeight,
        timeLabel,
        rawTimestamp: item.timestamp,
      };
    });

    // Determine Institutional Price + OI Regime
    let regime: OiRegime;
    const isPriceUp = priceChange24h > 0.3;
    const isPriceDown = priceChange24h < -0.3;
    const isOiUp = changeTotalPct > 1.5;
    const isOiDown = changeTotalPct < -1.5;

    if (isPriceUp && isOiUp) {
      regime = {
        badgeText: '🟢 Long Build-Up (Приток лонгов)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        description: 'Цена растет на притоке свежего капитала в лонги. Сильный бычий тренд с подтверждением деривативов.',
        type: 'LONG_BUILD',
        icon: TrendingUp,
      };
    } else if (isPriceDown && isOiUp) {
      regime = {
        badgeText: '🔴 Short Build-Up (Набор шортов)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        description: 'Цена падает, а открытый интерес растет: агрессивный набор коротких позиций. Давление продавцов усиливается.',
        type: 'SHORT_BUILD',
        icon: TrendingDown,
      };
    } else if (isPriceUp && isOiDown) {
      regime = {
        badgeText: '🟡 Short Squeeze (Шорт-сквиз / Вынос)',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        description: 'Рост цены происходит на закрытии и ликвидации шортов (Short Covering). Неустойчивый импульс без притока новых спот-покупок.',
        type: 'SHORT_SQUEEZE',
        icon: Flame,
      };
    } else if (isPriceDown && isOiDown) {
      regime = {
        badgeText: '🔵 Long Liquidation (Сброс лонгов)',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        description: 'Падение цены на фоне сброса позиций и ликвидации лонгов (Washout). Очищение рынка от избыточного плеча.',
        type: 'LONG_LIQ',
        icon: ArrowDownRight,
      };
    } else {
      regime = {
        badgeText: '⚪ Консолидация / Баланс OI',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        description: 'Открытый интерес в стабильном диапазоне. Трейдеры выжидают триггер для набора новых позиций.',
        type: 'NEUTRAL',
        icon: ShieldCheck,
      };
    }

    return {
      change1,
      change1Pct,
      change4,
      change4Pct,
      changeTotal,
      changeTotalPct,
      minUsd,
      maxUsd,
      regime,
      bars,
    };
  }, [history, oiUsd, priceChange24h]);

  const formatUsdM = (val: number): string => {
    if (Math.abs(val) >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  const activeBar = hoveredIndex !== null && analytics.bars[hoveredIndex] ? analytics.bars[hoveredIndex] : null;

  return (
    <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-750 space-y-3">
      {/* 1. Header with Title, Timeframe Tabs & Info Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              Open Interest (OI) & Капитал
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Объем активных фьючерсных позиций
            </span>
          </div>
        </div>

        {/* Timeframe Interval Selector */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-750">
          {(['15m', '1h', '4h'] as OiPeriod[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => handlePeriodChange(tf)}
              disabled={isLoadingHistory}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition cursor-pointer ${
                period === tf
                  ? 'bg-indigo-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tf}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="p-1 text-slate-400 hover:text-amber-400 transition cursor-pointer"
            title="Как читать Open Interest?"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Value & Key Period Deltas Grid */}
      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-750/80">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Текущий Open Interest:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight">
                {formatUsdM(oiUsd)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({!isNaN(oiVal) ? Math.round(oiVal).toLocaleString() : '—'} {symbol.replace('USDT', '')})
              </span>
            </div>
          </div>

          {/* Period Total Delta */}
          <div className="sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Динамика за период ({period}):</span>
            <span
              className={`text-sm font-bold font-mono inline-flex items-center gap-1 ${
                analytics.changeTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {analytics.changeTotal >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {analytics.changeTotal >= 0 ? '+' : ''}
              {formatUsdM(analytics.changeTotal)} ({analytics.changeTotalPct >= 0 ? '+' : ''}
              {analytics.changeTotalPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* 3 Step-by-Step Delta Horizon Badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
          <div className="bg-slate-800/60 p-1.5 rounded border border-slate-750">
            <span className="text-[10px] text-slate-400 block">Посл. шаг ({period})</span>
            <span
              className={`font-bold ${
                analytics.change1 >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {analytics.change1 >= 0 ? '+' : ''}
              {formatUsdM(analytics.change1)} ({analytics.change1Pct >= 0 ? '+' : ''}
              {analytics.change1Pct.toFixed(1)}%)
            </span>
          </div>

          <div className="bg-slate-800/60 p-1.5 rounded border border-slate-750">
            <span className="text-[10px] text-slate-400 block">4 шага ({period === '15m' ? '1ч' : period === '1h' ? '4ч' : '16ч'})</span>
            <span
              className={`font-bold ${
                analytics.change4 >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {analytics.change4 >= 0 ? '+' : ''}
              {formatUsdM(analytics.change4)} ({analytics.change4Pct >= 0 ? '+' : ''}
              {analytics.change4Pct.toFixed(1)}%)
            </span>
          </div>

          <div className="bg-slate-800/60 p-1.5 rounded border border-slate-750">
            <span className="text-[10px] text-slate-400 block">Диапазон Min / Max</span>
            <span className="text-slate-300 font-semibold text-[11px]">
              {formatUsdM(analytics.minUsd)} ↔ {formatUsdM(analytics.maxUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Market Regime Indicator (Price vs OI Matrix Verdict) */}
      <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${analytics.regime.badgeClass}`}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
            <analytics.regime.icon className="w-4 h-4 flex-shrink-0" />
            <span>{analytics.regime.badgeText}</span>
          </div>
          <p className="text-[11px] font-sans opacity-90 leading-snug">
            {analytics.regime.description}
          </p>
        </div>
      </div>

      {/* 4. Interactive Histogram with Color-Coded Delta Bars */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span>Гистограмма изменения OI ({analytics.bars.length} точек):</span>
          {activeBar ? (
            <span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {activeBar.timeLabel}: {formatUsdM(activeBar.val)} (
              <span className={activeBar.stepDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {activeBar.stepDelta >= 0 ? '+' : ''}
                {formatUsdM(activeBar.stepDelta)}
              </span>
              )
            </span>
          ) : (
            <span className="text-slate-500">Наведите на столбик для деталей</span>
          )}
        </div>

        {/* Bar Chart Canvas Container */}
        <div className="h-16 bg-slate-900/90 rounded-lg p-2 border border-slate-750 flex items-end gap-1 relative overflow-hidden">
          {analytics.bars.map((bar, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={`oi-bar-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col justify-end items-center h-full group cursor-pointer relative"
              >
                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isHovered
                      ? 'bg-amber-400 shadow-lg scale-y-105'
                      : bar.isUp
                      ? 'bg-emerald-500 hover:bg-emerald-400'
                      : 'bg-rose-500 hover:bg-rose-400'
                  }`}
                  style={{
                    height: `${bar.normalizedHeight}%`,
                    opacity: isHovered ? 1 : 0.75 + (idx / analytics.bars.length) * 0.25,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Timeline Range Indicator */}
        <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
          <span>{analytics.bars[0]?.timeLabel || 'Начало'}</span>
          <span>Средняя точка</span>
          <span>{analytics.bars[analytics.bars.length - 1]?.timeLabel || 'Сейчас'}</span>
        </div>
      </div>

      {/* 5. Collapsible Cheat Sheet: "Как читать взаимодействие Цены и OI" */}
      {showExplanation && (
        <div className="bg-slate-900/95 border border-slate-750 p-3 rounded-lg text-xs space-y-2 animate-fadeIn">
          <div className="flex justify-between items-center font-bold text-slate-200 border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Матрица «Цена + Open Interest» (Binance Market Microstructure)
            </span>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
              <span className="text-emerald-400 font-bold block">🟢 Цена ↑ + OI ↑ (Long Build-Up)</span>
              <span className="text-slate-300 text-[10px] font-sans">
                В рынок вливаются новые деньги в лонг. Истинный бычий тренд, подтвержденный ростом позиций.
              </span>
            </div>

            <div className="bg-rose-500/10 p-2 rounded border border-rose-500/20">
              <span className="text-rose-400 font-bold block">🔴 Цена ↓ + OI ↑ (Short Build-Up)</span>
              <span className="text-slate-300 text-[10px] font-sans">
                Агрессивный вход маркет-продавцов и открытие шортов. Медведи наращивают давление.
              </span>
            </div>

            <div className="bg-amber-500/10 p-2 rounded border border-amber-500/20">
              <span className="text-amber-400 font-bold block">🟡 Цена ↑ + OI ↓ (Short Squeeze)</span>
              <span className="text-slate-300 text-[10px] font-sans">
                Рост идет на ликвидации и принудительном закрытии шортов. Неустойчив без свежих спот-покупок.
              </span>
            </div>

            <div className="bg-cyan-500/10 p-2 rounded border border-cyan-500/20">
              <span className="text-cyan-400 font-bold block">🔵 Цена ↓ + OI ↓ (Long Liquidation)</span>
              <span className="text-slate-300 text-[10px] font-sans">
                Капитуляция покупателей и выбивание лонг-стопов (Washout). Рынок очищается от избыточного плеча.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
