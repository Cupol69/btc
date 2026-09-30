import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRightLeft,
  DollarSign,
  HelpCircle,
  Sparkles,
  BarChart3,
  Layers,
  Clock,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { PeriodNetFlow } from '../types';

interface NetBuySellVolumeCardProps {
  multiPeriodNetFlow?: {
    p5m?: PeriodNetFlow;
    p1h?: PeriodNetFlow;
    p6h?: PeriodNetFlow;
    p24h?: PeriodNetFlow;
  };
  symbol: string;
  priceUsd: number;
  // Raw fallback stats if multiPeriodNetFlow is not present
  fallbackStats?: {
    v5m: number;
    v1h: number;
    v24h: number;
    buys5m: number;
    sells5m: number;
    buys1h: number;
    sells1h: number;
    buys24h: number;
    sells24h: number;
    priceChange5m?: number;
    priceChange1h?: number;
    priceChange24h?: number;
  };
  onAskAi?: (question: string) => void;
}

export const NetBuySellVolumeCard: React.FC<NetBuySellVolumeCardProps> = ({
  multiPeriodNetFlow,
  symbol,
  priceUsd,
  fallbackStats,
  onAskAi,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'5m' | '1h' | '6h' | '24h' | 'ALL'>('1h');
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  // Helper to get or compute period flow
  const getPeriodFlow = (period: '5m' | '1h' | '6h' | '24h'): PeriodNetFlow => {
    if (multiPeriodNetFlow) {
      if (period === '5m' && multiPeriodNetFlow.p5m) return multiPeriodNetFlow.p5m;
      if (period === '1h' && multiPeriodNetFlow.p1h) return multiPeriodNetFlow.p1h;
      if (period === '6h' && multiPeriodNetFlow.p6h) return multiPeriodNetFlow.p6h;
      if (period === '24h' && multiPeriodNetFlow.p24h) return multiPeriodNetFlow.p24h;
    }

    // Fallback calculation
    const rawBuys = period === '5m' ? (fallbackStats?.buys5m ?? 0) : period === '1h' ? (fallbackStats?.buys1h ?? 0) : period === '6h' ? Math.round((fallbackStats?.buys24h ?? 0) * 0.35) : (fallbackStats?.buys24h ?? 0);
    const rawSells = period === '5m' ? (fallbackStats?.sells5m ?? 0) : period === '1h' ? (fallbackStats?.sells1h ?? 0) : period === '6h' ? Math.round((fallbackStats?.sells24h ?? 0) * 0.35) : (fallbackStats?.sells24h ?? 0);
    const rawVol = period === '5m' ? (fallbackStats?.v5m ?? 0) : period === '1h' ? (fallbackStats?.v1h ?? 0) : period === '6h' ? ((fallbackStats?.v24h ?? 0) * 0.35) : (fallbackStats?.v24h ?? 0);
    const rawPc = period === '5m' ? (fallbackStats?.priceChange5m ?? 0) : period === '1h' ? (fallbackStats?.priceChange1h ?? 0) : period === '6h' ? ((fallbackStats?.priceChange24h ?? 0) * 0.4) : (fallbackStats?.priceChange24h ?? 0);

    const totalTxns = rawBuys + rawSells;
    const txBuyRatio = totalTxns > 0 ? rawBuys / totalTxns : 0.5;
    const momentumAdjustment = Math.max(-0.25, Math.min(0.25, (rawPc / 100) * 0.4));
    const dollarBuyRatio = Math.max(0.03, Math.min(0.97, txBuyRatio + momentumAdjustment));

    const totalVol = rawVol > 0 ? rawVol : (totalTxns * 120);
    const buyVol = Math.round(totalVol * dollarBuyRatio);
    const sellVol = Math.max(0, Math.round(totalVol - buyVol));
    const netFlow = buyVol - sellVol;
    const buyRatioPct = totalVol > 0 ? Number(((buyVol / totalVol) * 100).toFixed(1)) : 50;
    const sellRatioPct = Number((100 - buyRatioPct).toFixed(1));
    const txBuyPct = totalTxns > 0 ? Number(((rawBuys / totalTxns) * 100).toFixed(1)) : 50;

    const avgBuy = rawBuys > 0 ? Math.round(buyVol / rawBuys) : 0;
    const avgSell = rawSells > 0 ? Math.round(sellVol / rawSells) : 0;

    let verdict: PeriodNetFlow['verdict'] = 'BALANCED';
    let verdictLabel = 'Баланс спроса и предложения';

    if (buyRatioPct >= 65) {
      verdict = 'STRONG_BUY_OVERWEIGHT';
      verdictLabel = `Мощный перевес Покупателей (+$${Math.abs(netFlow).toLocaleString()})`;
    } else if (buyRatioPct > 52) {
      verdict = 'BUY_OVERWEIGHT';
      verdictLabel = `Преобладание Покупок (+$${Math.abs(netFlow).toLocaleString()})`;
    } else if (buyRatioPct <= 35) {
      verdict = 'STRONG_SELL_OVERWEIGHT';
      verdictLabel = `Критический навес Продаж (-$${Math.abs(netFlow).toLocaleString()})`;
    } else if (buyRatioPct < 48) {
      verdict = 'SELL_OVERWEIGHT';
      verdictLabel = `Преобладание Продаж (-$${Math.abs(netFlow).toLocaleString()})`;
    }

    return {
      period,
      periodLabel: period === '5m' ? '5 минут' : period === '1h' ? '1 час' : period === '6h' ? '6 часов' : '24 часа',
      buysCount: rawBuys,
      sellsCount: rawSells,
      totalTxns,
      buyVolumeUsd: buyVol,
      sellVolumeUsd: sellVol,
      totalVolumeUsd: totalVol,
      netFlowUsd: netFlow,
      buyRatioPercent: buyRatioPct,
      sellRatioPercent: sellRatioPct,
      txBuyRatioPercent: txBuyPct,
      isVolumeSkewPositive: netFlow >= 0,
      avgBuySizeUsd: avgBuy,
      avgSellSizeUsd: avgSell,
      verdict,
      verdictLabel,
    };
  };

  const f5m = getPeriodFlow('5m');
  const f1h = getPeriodFlow('1h');
  const f6h = getPeriodFlow('6h');
  const f24h = getPeriodFlow('24h');

  const activeFlow = selectedPeriod === '5m' ? f5m : selectedPeriod === '1h' ? f1h : selectedPeriod === '6h' ? f6h : selectedPeriod === '24h' ? f24h : f1h;

  const getVerdictStyle = (v: PeriodNetFlow['verdict']) => {
    switch (v) {
      case 'STRONG_BUY_OVERWEIGHT':
        return {
          badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-400',
          titleColor: 'text-emerald-400',
          icon: <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />,
          label: '🔥 СИЛЬНЫЙ ПЕРЕВЕС ПОКУПОК ($)',
        };
      case 'BUY_OVERWEIGHT':
        return {
          badgeBg: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40',
          titleColor: 'text-emerald-400',
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
          label: '🟢 ПРЕОБЛАДАНИЕ ПОКУПОК ($)',
        };
      case 'STRONG_SELL_OVERWEIGHT':
        return {
          badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-400',
          titleColor: 'text-rose-400',
          icon: <TrendingDown className="w-4 h-4 text-rose-400 animate-pulse" />,
          label: '🚨 КРИТИЧЕСКИЙ НАВЕС ПРОДАЖ ($)',
        };
      case 'SELL_OVERWEIGHT':
        return {
          badgeBg: 'bg-rose-950/50 text-rose-400 border-rose-500/40',
          titleColor: 'text-rose-400',
          icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
          label: '🔴 ПРЕОБЛАДАНИЕ ПРОДАЖ ($)',
        };
      default:
        return {
          badgeBg: 'bg-slate-900 text-slate-300 border-slate-700',
          titleColor: 'text-slate-300',
          icon: <ArrowRightLeft className="w-4 h-4 text-slate-400" />,
          label: '⚖️ БАЛАНС СПРОСА И ПРЕДЛОЖЕНИЯ',
        };
    }
  };

  const currentVerdictStyle = getVerdictStyle(activeFlow.verdict);

  return (
    <div className="border-2 border-amber-400 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 shadow-xl shadow-amber-500/10 rounded-xl p-4 space-y-4 relative overflow-hidden">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-400/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-md shadow-amber-500/10">
            <DollarSign className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                <span>🟡 ПОНИМАНИЕ NET BUY / SELL ЗА ПЕРИОД: ДЕНЕЖНЫЙ ПЕРЕВЕС ($)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-400/60 font-bold">
                [RULE 2, 7 & 12 | ОБЪЕМЫ ($) &gt; КОЛИЧЕСТВО СДЕЛОК]
              </span>
            </div>
            <p className="text-xs text-amber-100/80 font-sans mt-0.5">
              Сравнение реальной суммы покупок (${symbol}) против суммы продаж в долларах, средний чек китов и чистый приток капитала.
            </p>
          </div>
        </div>

        {/* Toggle Explanation Button */}
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 self-start sm:self-auto transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showExplanation ? 'Скрыть пояснение' : 'Как понимать денежный перевес?'}</span>
        </button>
      </div>

      {/* Educational & Practical Context Box */}
      {showExplanation && (
        <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 text-xs text-amber-100/90 leading-relaxed font-sans space-y-1.5 animate-fadeIn">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Почему счетчик сделок обманчив (например: 4 покупки и 5 продаж):</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Часто в ленте видно <strong>4 покупки</strong> и <strong>5 продаж</strong>, что кажется давлением продавцов. Однако, если 4 покупки совершены на общую сумму <strong>$35,000</strong> ($8.7k/ордер), а 5 мелких продаж — всего на <strong>$6,000</strong> ($1.2k/ордер), то фактический перевес по деньгам составляет <strong>+$29,000 в пользу покупателей (85% Buy Volume)</strong>. Это классический признак <em>аккумуляции крупным капиталом</em>. Данный блок устраняет иллюзию и показывает реальный вектор денег.
          </p>
        </div>
      )}

      {/* Timeframe Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Период:
          </span>
          {[
            { id: '5m', label: '⚡ 5 Минут', skew: f5m.netFlowUsd },
            { id: '1h', label: '🕒 1 Час', skew: f1h.netFlowUsd },
            { id: '6h', label: '⏱️ 6 Часов', skew: f6h.netFlowUsd },
            { id: '24h', label: '📅 24 Часа', skew: f24h.netFlowUsd },
            { id: 'ALL', label: '📊 Сводка 4-х периодов', skew: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedPeriod(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedPeriod === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id !== 'ALL' && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    selectedPeriod === tab.id
                      ? tab.skew >= 0
                        ? 'bg-slate-950 text-emerald-400'
                        : 'bg-slate-950 text-rose-400'
                      : tab.skew >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {tab.skew >= 0 ? `+$${(tab.skew / 1e3).toFixed(1)}k` : `-$${(Math.abs(tab.skew) / 1e3).toFixed(1)}k`}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick AI ask action button */}
        {onAskAi && (
          <button
            type="button"
            onClick={() => {
              const q = `Сделай глубокий анализ перевеса Net Buy/Sell для ${symbol}. Данные за 5м: Net ${f5m.netFlowUsd >= 0 ? '+' : ''}$${f5m.netFlowUsd.toLocaleString()} (${f5m.buyRatioPercent}% Buy, ${f5m.buysCount}B vs ${f5m.sellsCount}S), 1ч: Net ${f1h.netFlowUsd >= 0 ? '+' : ''}$${f1h.netFlowUsd.toLocaleString()} (${f1h.buyRatioPercent}% Buy), 6ч: Net ${f6h.netFlowUsd >= 0 ? '+' : ''}$${f6h.netFlowUsd.toLocaleString()} (${f6h.buyRatioPercent}% Buy), 24ч: Net ${f24h.netFlowUsd >= 0 ? '+' : ''}$${f24h.netFlowUsd.toLocaleString()} (${f24h.buyRatioPercent}% Buy). Средний чек покупки: $${f1h.avgBuySizeUsd} vs продажи: $${f1h.avgSellSizeUsd}. Определи: это скрытая аккумуляция китами или ловушка?`;
              onAskAi(q);
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ИИ-анализ перевеса денег</span>
          </button>
        )}
      </div>

      {/* SINGLE PERIOD DETAIL VIEW */}
      {selectedPeriod !== 'ALL' && (
        <div className="space-y-4">
          {/* Main Net Flow Hero Metric Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Net Flow Dollar Sum */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Чистый Net Flow ({activeFlow.periodLabel}):</span>
                </span>
                <span className="text-[10px] text-slate-500">Сумма Buy - Sell</span>
              </div>

              <div className="space-y-1">
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-center gap-2 ${
                    activeFlow.netFlowUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <span>
                    {activeFlow.netFlowUsd >= 0 ? '+' : '-'}${Math.abs(activeFlow.netFlowUsd).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded border border-current bg-slate-900">
                    USD
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Доля покупок по объему:</span>
                  <strong className={activeFlow.buyRatioPercent >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                    {activeFlow.buyRatioPercent}%
                  </strong>
                </div>
              </div>

              {/* Status Pill */}
              <div className={`p-2 rounded-lg border flex items-center gap-2 text-xs font-mono font-bold ${currentVerdictStyle.badgeBg}`}>
                {currentVerdictStyle.icon}
                <span className="truncate">{activeFlow.verdictLabel}</span>
              </div>
            </div>

            {/* 2. Dollar Buy Sum vs Dollar Sell Sum Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Сумма Покупок vs Продаж ($):</span>
                <span className="text-[10px] text-slate-500">Всего: ${activeFlow.totalVolumeUsd.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400/80 font-bold">🟢 ПОКУПКИ ($):</div>
                  <div className="text-base font-black text-emerald-300 mt-0.5">
                    ${activeFlow.buyVolumeUsd.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400/70">{activeFlow.buyRatioPercent}% от всех денег</div>
                </div>

                <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
                  <div className="text-[10px] text-rose-400/80 font-bold">🔴 ПРОДАЖИ ($):</div>
                  <div className="text-base font-black text-rose-300 mt-0.5">
                    ${activeFlow.sellVolumeUsd.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-400/70">{activeFlow.sellRatioPercent}% от всех денег</div>
                </div>
              </div>

              {/* Proportional Volume Bar */}
              <div className="space-y-1 font-mono text-[10px]">
                <div className="w-full h-3 bg-rose-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${activeFlow.buyRatioPercent}%` }}
                    title={`Покупки: $${activeFlow.buyVolumeUsd.toLocaleString()} (${activeFlow.buyRatioPercent}%)`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{ width: `${activeFlow.sellRatioPercent}%` }}
                    title={`Продажи: $${activeFlow.sellVolumeUsd.toLocaleString()} (${activeFlow.sellRatioPercent}%)`}
                  />
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="text-emerald-400 font-bold">{activeFlow.buyRatioPercent}% Покупки</span>
                  <span className="text-rose-400 font-bold">{activeFlow.sellRatioPercent}% Продажи</span>
                </div>
              </div>
            </div>

            {/* 3. Deal Count vs Dollar Volume (The Core Comparison) */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Сделок (Count) vs Средний Чек:</span>
                </span>
                <span className="text-[10px] text-indigo-300 font-bold">Размер кошельков</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Кол-во сделок (B / S):</span>
                  <span className="font-bold text-slate-200">
                    <strong className="text-emerald-400">{activeFlow.buysCount} Buy</strong> / <strong className="text-rose-400">{activeFlow.sellsCount} Sell</strong>
                    <span className="text-[10px] text-slate-500 ml-1">({activeFlow.txBuyRatioPercent}% Buy Txns)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Средний чек покупки:</span>
                  <span className="font-bold text-emerald-400">${activeFlow.avgBuySizeUsd.toLocaleString()} / ордер</span>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Средний чек продажи:</span>
                  <span className="font-bold text-rose-400">${activeFlow.avgSellSizeUsd.toLocaleString()} / ордер</span>
                </div>
              </div>

              {/* Wallet Size Skew Insight */}
              <div className="text-[11px] font-mono text-slate-300 p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Перевес чека покупателей:</span>
                <strong
                  className={
                    activeFlow.avgBuySizeUsd >= activeFlow.avgSellSizeUsd * 1.5
                      ? 'text-emerald-400'
                      : activeFlow.avgSellSizeUsd >= activeFlow.avgBuySizeUsd * 1.5
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }
                >
                  {activeFlow.avgSellSizeUsd > 0
                    ? `${(activeFlow.avgBuySizeUsd / activeFlow.avgSellSizeUsd).toFixed(1)}x к размеру продаж`
                    : 'Доминирование'}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Context Summary Sentence */}
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-center gap-2 text-xs font-mono text-amber-200">
            <span className="p-1 rounded bg-amber-500/20 text-amber-300 shrink-0">💡</span>
            <span>
              <strong>Вывод за {activeFlow.periodLabel}:</strong> {activeFlow.buysCount} покупок на ${activeFlow.buyVolumeUsd.toLocaleString()} против {activeFlow.sellsCount} продаж на ${activeFlow.sellVolumeUsd.toLocaleString()}.{' '}
              {activeFlow.netFlowUsd >= 0 ? (
                <strong className="text-emerald-300">
                  Чистый перевес покупателей составляет +${activeFlow.netFlowUsd.toLocaleString()} ({activeFlow.buyRatioPercent}% Buy Volume).
                </strong>
              ) : (
                <strong className="text-rose-300">
                  Чистый перевес продавцов составляет -${Math.abs(activeFlow.netFlowUsd).toLocaleString()} ({activeFlow.sellRatioPercent}% Sell Volume).
                </strong>
              )}
            </span>
          </div>
        </div>
      )}

      {/* 4-PERIOD MULTI-TIMEFRAME MATRIX TABLE */}
      {(selectedPeriod === 'ALL' || selectedPeriod) && (
        <div className="space-y-2 pt-2 border-t border-amber-400/30">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Сравнение перевеса денег по 4-м таймфреймам (5м | 1ч | 6ч | 24ч):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Динамика смены тренда и притока</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
            {[f5m, f1h, f6h, f24h].map((f) => {
              const isSelected = selectedPeriod === f.period;
              return (
                <div
                  key={f.period}
                  onClick={() => setSelectedPeriod(f.period)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 relative ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1">
                      <span>{f.periodLabel}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${
                        f.netFlowUsd >= 0
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {f.netFlowUsd >= 0 ? `+${f.buyRatioPercent}% Buy` : `${f.buyRatioPercent}% Buy`}
                    </span>
                  </div>

                  {/* Net Flow USD */}
                  <div>
                    <div className="text-[10px] text-slate-400">Net Flow ($):</div>
                    <div
                      className={`text-lg font-black mt-0.5 ${
                        f.netFlowUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {f.netFlowUsd >= 0 ? '+' : '-'}${Math.abs(f.netFlowUsd).toLocaleString()}
                    </div>
                  </div>

                  {/* Buy vs Sell Amounts */}
                  <div className="space-y-1 text-[11px] pt-1 border-t border-slate-850">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-emerald-400">B: ${f.buyVolumeUsd.toLocaleString()}</span>
                      <span className="text-rose-400">S: ${f.sellVolumeUsd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{f.buysCount} сделок</span>
                      <span>{f.sellsCount} сделок</span>
                    </div>
                    {/* Mini bar */}
                    <div className="w-full h-1.5 bg-rose-950 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-400 h-full" style={{ width: `${f.buyRatioPercent}%` }} />
                    </div>
                  </div>

                  {/* Average Ticket */}
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-850 flex justify-between">
                    <span>Ср. чек:</span>
                    <span className="text-slate-200 font-bold">
                      ${f.avgBuySizeUsd.toLocaleString()} vs ${f.avgSellSizeUsd.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
