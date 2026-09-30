import React, { useState } from 'react';
import { SentimentAnalysis, LongShortRatio, TakerLongShortRatio } from '../types';
import {
  Gauge,
  Flame,
  TrendingUp,
  Users,
  Compass,
  HelpCircle,
  ShieldCheck,
  Info,
  Scale,
  Activity,
  Layers,
} from 'lucide-react';

interface SentimentGaugeProps {
  sentiment: SentimentAnalysis;
  topTraderRatio: LongShortRatio | null;
  globalRatio: LongShortRatio | null;
  takerRatio: TakerLongShortRatio | null;
  fundingRate: number;
  hasFutures?: boolean;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  sentiment,
  topTraderRatio,
  globalRatio,
  takerRatio,
  fundingRate,
  hasFutures = true,
}) => {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const score = sentiment.compositeScore; // -100 to +100
  // Normalized 0 to 100 for gauge angle
  const gaugePercent = (score + 100) / 2; // 0 to 100

  // Needle angle (-90deg to +90deg)
  const needleAngle = -90 + (gaugePercent / 100) * 180;

  const getScoreColor = () => {
    if (score >= 50) return 'text-emerald-400';
    if (score >= 15) return 'text-teal-400';
    if (score <= -50) return 'text-rose-500';
    if (score <= -15) return 'text-orange-400';
    return 'text-amber-400';
  };

  const getScoreBg = () => {
    if (score >= 50) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 15) return 'bg-teal-500/10 border-teal-500/30';
    if (score <= -50) return 'bg-rose-500/10 border-rose-500/30';
    if (score <= -15) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-amber-500/10 border-amber-500/30';
  };

  const getLabel = () => {
    switch (sentiment.classification) {
      case 'EXTREME_GREED':
        return 'Экстремальная жадность';
      case 'GREED':
        return 'Бычий сентимент';
      case 'EXTREME_FEAR':
        return 'Экстремальный страх';
      case 'FEAR':
        return 'Медвежий сентимент';
      default:
        return 'Нейтральный баланс';
    }
  };

  const topLongPct = topTraderRatio ? (parseFloat(topTraderRatio.longAccount) * 100).toFixed(1) : '50.0';
  const topShortPct = topTraderRatio ? (parseFloat(topTraderRatio.shortAccount) * 100).toFixed(1) : '50.0';

  const globalLongPct = globalRatio ? (parseFloat(globalRatio.longAccount) * 100).toFixed(1) : '50.0';
  const globalShortPct = globalRatio ? (parseFloat(globalRatio.shortAccount) * 100).toFixed(1) : '50.0';

  return (
    <div id="sentiment-gauge-panel" className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 space-y-3">
      {/* Header with collapsible cheat sheet button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Sentiment Analysis Engine
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExplanation((prev) => !prev)}
            className={`p-1 transition rounded cursor-pointer ${
              showExplanation
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
            }`}
            title="Как читать сентимент и 4 столпа?"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getScoreBg()} ${getScoreColor()}`}>
            {score > 0 ? `+${score}` : score} / 100
          </span>
        </div>
      </div>

      {/* Collapsible "How to read" Guide (same pattern as Open Interest Panel) */}
      {showExplanation && (
        <div className="bg-slate-950/90 rounded-lg p-3 border border-amber-500/30 space-y-2.5 text-xs text-slate-300 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              Архитектура расчета сентимента (4 столпа деривативов)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Шкала: от -100 до +100</span>
              <button
                type="button"
                onClick={() => setShowExplanation(false)}
                className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer ml-1"
                title="Закрыть подсказку"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Композитный сентимент не является субъективным мнением, а вычисляется взвешенной математической моделью на основе институциональных данных биржи Binance Futures:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span>1. Funding Rate (Вес 30%)</span>
              </div>
              <p className="text-slate-400">
                Премия бессрочного фьючерса к споту. <strong className="text-slate-200">&gt;+0.01%</strong> = лонги переплачивают шортам (бычий перегрев, риск сквиза вниз). Отрицательный фандинг = преобладание шортов.
              </p>
            </div>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                <Users className="w-3.5 h-3.5" />
                <span>2. L/S Ratio Top Traders (Вес 30%)</span>
              </div>
              <p className="text-slate-400">
                Позиции топ-20% самых прибыльных китов. <strong className="text-slate-200">&gt;1.0</strong> = киты в лонгах, <strong className="text-slate-200">&lt;1.0</strong> = киты ставят на падение.
              </p>
            </div>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>3. Динамика OI (Вес 20%)</span>
              </div>
              <p className="text-slate-400">
                Приток нового спекулятивного капитала за 24 часа. Рост OI подтверждает силу направления и накопление энергии.
              </p>
            </div>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-400">
                <Compass className="w-3.5 h-3.5" />
                <span>4. Taker Volume Flow (Вес 20%)</span>
              </div>
              <p className="text-slate-400">
                Агрессивные маркет-покупки против продаж. <strong className="text-slate-200">&gt;1.0</strong> = инициатива на стороне маркет-покупателей (спрос).
              </p>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt; -50: Экстремальный страх
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400" /> -50..-15: Медвежий
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> -15..+15: Нейтральный
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> +15..+50: Бычий
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt; +50: Экстремальная жадность
            </span>
          </div>
        </div>
      )}

      {/* Main Gauge Graphic */}
      <div className="flex flex-col items-center justify-center py-1 relative">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 200 110">
          {/* Gauge Background Arcs */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Extreme Fear Arc (0 - 20%) */}
          <path
            d="M 20 100 A 80 80 0 0 1 45 43"
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeOpacity="0.8"
          />
          {/* Fear Arc (20 - 40%) */}
          <path
            d="M 45 43 A 80 80 0 0 1 80 23"
            fill="none"
            stroke="#f97316"
            strokeWidth="16"
            strokeOpacity="0.8"
          />
          {/* Neutral Arc (40 - 60%) */}
          <path
            d="M 80 23 A 80 80 0 0 1 120 23"
            fill="none"
            stroke="#eab308"
            strokeWidth="16"
            strokeOpacity="0.8"
          />
          {/* Greed Arc (60 - 80%) */}
          <path
            d="M 120 23 A 80 80 0 0 1 155 43"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="16"
            strokeOpacity="0.8"
          />
          {/* Extreme Greed Arc (80 - 100%) */}
          <path
            d="M 155 43 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#10b981"
            strokeWidth="16"
            strokeOpacity="0.8"
          />

          {/* Needle Pointer */}
          <g transform={`translate(100, 100) rotate(${needleAngle})`}>
            <polygon points="-3,-10 0,-78 3,-10" fill="#f8fafc" />
            <circle cx="0" cy="0" r="7" fill="#f8fafc" />
            <circle cx="0" cy="0" r="3" fill="#0f172a" />
          </g>
        </svg>

        {/* Status text */}
        <div className="text-center mt-[-10px]">
          <div className={`text-sm font-bold tracking-tight ${getScoreColor()}`}>{getLabel()}</div>
          <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">{sentiment.description}</p>
        </div>
      </div>

      {hasFutures ? (
        <>
          {/* 4 Pillars Formula Breakdown (Section 5.2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            {/* Pillar 1: Funding Rate (30%) */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-750">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Funding (30%)</span>
                <Flame className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-xs font-bold font-mono text-slate-200">
                {(fundingRate * 100).toFixed(4)}%
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Score: <span className={sentiment.fundingScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{sentiment.fundingScore > 0 ? `+${sentiment.fundingScore}` : sentiment.fundingScore}</span>
              </div>
            </div>

            {/* Pillar 2: Long/Short Deviation (30%) */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-750">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>L/S Ratio (30%)</span>
                <Users className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="text-xs font-bold font-mono text-slate-200">
                {topTraderRatio ? parseFloat(topTraderRatio.longShortRatio).toFixed(2) : '1.00'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Score: <span className={sentiment.longShortScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{sentiment.longShortScore > 0 ? `+${sentiment.longShortScore}` : sentiment.longShortScore}</span>
              </div>
            </div>

            {/* Pillar 3: OI 24h Change (20%) */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-750">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>OI Change (20%)</span>
                <TrendingUp className="w-3 h-3 text-indigo-400" />
              </div>
              <div className="text-xs font-bold font-mono text-slate-200">
                {sentiment.rawOiChangePercent !== undefined
                  ? `${sentiment.rawOiChangePercent >= 0 ? '+' : ''}${sentiment.rawOiChangePercent.toFixed(1)}%`
                  : `${sentiment.oiScore >= 0 ? '+' : ''}${(sentiment.oiScore / 10).toFixed(1)}%`}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Score: <span className={sentiment.oiScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{sentiment.oiScore > 0 ? `+${sentiment.oiScore}` : sentiment.oiScore}</span>
              </div>
            </div>

            {/* Pillar 4: Taker Buy/Sell (20%) */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-750">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Taker Flow (20%)</span>
                <Compass className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-xs font-bold font-mono text-slate-200">
                {takerRatio ? parseFloat(takerRatio.buySellRatio).toFixed(2) : '1.00'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Score: <span className={sentiment.takerScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{sentiment.takerScore > 0 ? `+${sentiment.takerScore}` : sentiment.takerScore}</span>
              </div>
            </div>
          </div>

          {/* Position Breakdown Bars (Top Traders vs Retail) */}
          <div className="pt-1 space-y-2 text-xs font-mono">
            {/* Top Traders Ratio Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Топ-трейдеры (Whales L/S)</span>
                <span className="text-slate-300">
                  <span className="text-emerald-400">{topLongPct}% L</span> /{' '}
                  <span className="text-rose-400">{topShortPct}% S</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${topLongPct}%` }} />
                <div className="bg-rose-500 h-full transition-all" style={{ width: `${topShortPct}%` }} />
              </div>
            </div>

            {/* Global Retail Accounts Ratio Bar */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Все аккаунты (Retail L/S)</span>
                <span className="text-slate-300">
                  <span className="text-emerald-400">{globalLongPct}% L</span> /{' '}
                  <span className="text-rose-400">{globalShortPct}% S</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${globalLongPct}%` }} />
                <div className="bg-rose-500 h-full transition-all" style={{ width: `${globalShortPct}%` }} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-mono text-amber-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Спотовый анализ активности (3 столпа)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">OrderBook & CVD Engine</span>
          </div>

          {/* 3 Pillars Breakdown for Spot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Spot Pillar 1: Order Book Depth Imbalance */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-750">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Стакан Bids/Asks (35%)</span>
                <Scale className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="text-xs font-bold font-mono text-slate-200">
                {sentiment.spotMetrics
                  ? `${sentiment.spotMetrics.rawImbalancePct >= 0 ? '+' : ''}${sentiment.spotMetrics.rawImbalancePct.toFixed(1)}%`
                  : '0.0%'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Score: <span className={(sentiment.spotMetrics?.imbalanceScore ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {(sentiment.spotMetrics?.imbalanceScore ?? 0) > 0 ? `+${sentiment.spotMetrics?.imbalanceScore}` : (sentiment.spotMetrics?.imbalanceScore ?? 0)}
                </span>
              </div>
            </div>

            {/* Spot Pillar 2: CVD Taker Dominance */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-750">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>CVD Taker Flow (35%)</span>
                <Compass className="w-3 h-3 text-purple-400" />
              </div>
              <div className="text-xs font-bold font-mono text-slate-200">
                {sentiment.spotMetrics
                  ? `${sentiment.spotMetrics.rawBuyerDominancePct.toFixed(1)}% Buy`
                  : '50.0%'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Score: <span className={(sentiment.spotMetrics?.cvdScore ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {(sentiment.spotMetrics?.cvdScore ?? 0) > 0 ? `+${sentiment.spotMetrics?.cvdScore}` : (sentiment.spotMetrics?.cvdScore ?? 0)}
                </span>
              </div>
            </div>

            {/* Spot Pillar 3: 24h Momentum */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-750">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>24h Импульс (30%)</span>
                <Activity className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-xs font-bold font-mono text-slate-200">
                {sentiment.spotMetrics
                  ? `${sentiment.spotMetrics.rawPriceChangePct >= 0 ? '+' : ''}${sentiment.spotMetrics.rawPriceChangePct.toFixed(2)}%`
                  : '0.00%'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Score: <span className={(sentiment.spotMetrics?.momentumScore ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {(sentiment.spotMetrics?.momentumScore ?? 0) > 0 ? `+${sentiment.spotMetrics?.momentumScore}` : (sentiment.spotMetrics?.momentumScore ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
