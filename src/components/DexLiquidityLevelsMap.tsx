import React, { useState } from 'react';
import { DexLiquidityLevelsData, DexLiquidityLevel } from '../types';
import {
  Crosshair,
  Target,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Flame,
  Droplets,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Scale,
  RefreshCw,
  Zap,
  Activity,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface DexLiquidityLevelsMapProps {
  liquidityPlan: DexLiquidityLevelsData | null | undefined;
  symbol: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DexLiquidityLevelsMap: React.FC<DexLiquidityLevelsMapProps> = ({
  liquidityPlan,
  symbol,
  onRefresh,
  isLoading = false,
}) => {
  const [customSellAmount, setCustomSellAmount] = useState<number>(25000);
  const [selectedLevel, setSelectedLevel] = useState<DexLiquidityLevel | null>(null);

  if (!liquidityPlan) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <Crosshair className="w-8 h-8 text-indigo-400 mx-auto opacity-70 animate-pulse" />
        <h3 className="text-sm font-bold text-white">Расчет Уровней Ликвидности и Фиксаций DEX</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Запустите генерацию AI-отчета или обновите данные пулов для построения тактической карты уровней фиксации китов и AMM-проскальзывания.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold font-mono transition inline-flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Рассчитать уровни {symbol}</span>
          </button>
        )}
      </div>
    );
  }

  const {
    currentPrice,
    primaryDexName,
    primaryChain,
    poolLiquidityUsd,
    whaleCostBasisEst,
    syndicatePhase,
    slippage5PctSellUsd,
    slippage10PctSellUsd,
    slippage25PctSellUsd,
    levels,
    ammSpikeTarget,
    tacticalPlan,
  } = liquidityPlan;

  // Format price nicely for micro-cents or standard tokens
  const formatPrice = (p: number) => {
    if (!p || isNaN(p)) return '$0.00';
    if (p >= 100) return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(4)}`;
    if (p >= 0.0001) return `$${p.toFixed(5)}`;
    return `$${p.toFixed(8)}`;
  };

  const formatUsd = (num: number) => {
    if (!num) return '$0';
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}k`;
    return `$${num.toLocaleString()}`;
  };

  // Phase badge formatting
  const getPhaseBadge = (phase: string) => {
    switch (phase) {
      case 'MARKUP_PUMP':
        return {
          title: '🚀 Фаза активного разгона (Памп синдиката)',
          desc: 'Синдикат и маркетмейкер разгоняют цену к целевым уровням фиксации (TP1/TP2). Высокий суточный оборот.',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'DISTRIBUTION_PEAK':
        return {
          title: '⚠️ Пик распределения (Сброс китов)',
          desc: 'Крупные кошельки фиксируют прибыль об приток розничных покупателей. Высокий риск резкого сброса.',
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'COOLOFF_DUMP':
        return {
          title: '❄️ Фаза остывания / Откат',
          desc: 'Снижение покупательской активности, тест поддержек пула и поиск нового равновесия.',
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'ACCUMULATION':
      default:
        return {
          title: '🛡️ Накопление смарт-денег',
          desc: 'Синдикат формирует позицию по средней цене в районе себестоимости. Волатильность сжата.',
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        };
    }
  };

  const phaseInfo = getPhaseBadge(syndicatePhase);

  // Calculate instant slippage for custom sell amount in $
  const calcEstimatedSlippage = (sellAmountUsd: number) => {
    if (!poolLiquidityUsd || poolLiquidityUsd <= 0) return 0;
    // Constant product model: Slippage % ~= (sellAmount / (poolLiquidity + sellAmount)) * 100 * 2
    const impact = (sellAmountUsd / (poolLiquidityUsd + sellAmountUsd)) * 200;
    return Math.min(99.9, Math.max(0.01, impact));
  };

  const currentWhaleProfitPct = whaleCostBasisEst > 0
    ? (((currentPrice - whaleCostBasisEst) / whaleCostBasisEst) * 100)
    : 0;

  return (
    <div id="dex-liquidity-levels-map" className="space-y-4 animate-fadeIn">
      {/* Top Banner: Syndicate Phase & Tactical Verdict */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Карта Ликвидности & Стенки Фиксации DEX
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {symbol}
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${phaseInfo.bg}`}>
                  {phaseInfo.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{phaseInfo.desc}</p>
            </div>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-mono transition flex items-center gap-1.5 border border-slate-700 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Обновить уровни</span>
            </button>
          )}
        </div>

        {/* AI Tactical Action Summary */}
        <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                Тактический вердикт AI для DEX
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                R:R {tacticalPlan?.riskRewardRatio || '1:3.4'}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {tacticalPlan?.actionVerdict}
            </p>
          </div>

          {/* Quick Target Badges */}
          <div className="flex items-center gap-2 font-mono flex-shrink-0 flex-wrap">
            <div className="bg-slate-900 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-right">
              <span className="text-[9px] text-emerald-400 block font-bold">ЦЕЛЬ 1 (TP1)</span>
              <span className="text-xs font-bold text-emerald-300">
                {formatPrice(tacticalPlan?.recommendedTakeProfit1 || currentPrice * 1.18)}
              </span>
            </div>
            <div className="bg-slate-900 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-right">
              <span className="text-[9px] text-amber-400 block font-bold">ОСНОВНАЯ (TP2)</span>
              <span className="text-xs font-bold text-amber-300">
                {formatPrice(tacticalPlan?.recommendedTakeProfit2 || currentPrice * 1.45)}
              </span>
            </div>
            <div className="bg-slate-900 border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-right">
              <span className="text-[9px] text-rose-400 block font-bold">СТОП (SL)</span>
              <span className="text-xs font-bold text-rose-300">
                {formatPrice(tacticalPlan?.recommendedStopLoss || currentPrice * 0.90)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ⚡ Dedicated Indicator: AMM Spike Target & Whale Magnet (Цель минутного закола ММ) */}
      {ammSpikeTarget && (
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border-2 border-amber-500/40 rounded-xl p-4 sm:p-5 shadow-xl shadow-amber-950/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex-shrink-0 animate-pulse">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>⚡ AMM Spike Target & Whale Magnet</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      МИНУТНЫЙ ВЫСТРЕЛ ММ
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  Математическая цель импульсного сброса ликвидности роботом маркетмейкера (паттерн <span className="text-amber-300 font-mono font-semibold">1m Sweep & Spike</span>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto font-mono">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                ammSpikeTarget.probabilityRating === 'VERY_HIGH'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : ammSpikeTarget.probabilityRating === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                ВЕРОЯТНОСТЬ: {ammSpikeTarget.probabilityRating === 'VERY_HIGH' ? 'ОЧЕНЬ ВЫСОКАЯ' : ammSpikeTarget.probabilityRating === 'HIGH' ? 'ВЫСОКАЯ' : 'УМЕРЕННАЯ'}
              </span>
            </div>
          </div>

          {/* 4 Spike Target Diagnostic Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
            {/* Tile 1: Spike Target Price */}
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-amber-400/90 font-sans">
                <span>МАГНИТНАЯ ЦЕЛЬ ЗАКОЛА</span>
                <Target className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-300">
                {formatPrice(ammSpikeTarget.targetPrice)}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">
                +{ammSpikeTarget.spikePotentialPct}% от текущей
              </div>
            </div>

            {/* Tile 2: Pre-Set Limit Take-Profit */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-emerald-400/90 font-sans">
                <span>ЛИМИТ-ВЫХОД ТРЕЙДЕРА</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-300">
                {formatPrice(ammSpikeTarget.recommendedLimitTakeProfit)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Заранее перед стенкой
              </div>
            </div>

            {/* Tile 3: Required Buy Inflow to Trigger */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-cyan-400/90 font-sans">
                <span>ВБРОС ДЛЯ ТРИГГЕРА</span>
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base sm:text-lg font-bold text-cyan-300">
                {formatUsd(ammSpikeTarget.requiredBuyFlowUsd)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Покупок робота в пул
              </div>
            </div>

            {/* Tile 4: Duration & Timing */}
            <div className="bg-slate-950/80 border border-purple-500/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-purple-400/90 font-sans">
                <span>ФОРМАТ СВЕЧИ</span>
                <Clock className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-sm sm:text-base font-bold text-purple-200 truncate">
                1m Spike & Sweep
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Окно выхода: ~60 сек
              </div>
            </div>
          </div>

          {/* Actionable Tactical Guidance & FOMO Protection Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs font-sans">
            <div className="flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-white font-mono text-[11px] uppercase tracking-wider">
                  Как забрать профит на выстреле робота:
                </span>
                <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                  {ammSpikeTarget.tacticalPlaybook}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-850">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-300 font-mono text-[11px] uppercase tracking-wider">
                  ⚠️ Защита от FOMO-ловушки (Почему нельзя покупать на вершине):
                </span>
                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                  {ammSpikeTarget.fomoTrapWarning}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Quantitative Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Metric 1: Current DEX Price */}
        <div className="bg-slate-900/85 border border-cyan-500/30 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-sans font-medium text-cyan-300">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              Текущая цена DEX
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
              {primaryDexName}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {formatPrice(currentPrice)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1 font-sans">
            <span>Сеть:</span>
            <span className="text-slate-200 capitalize font-mono font-semibold">{primaryChain}</span>
          </div>
        </div>

        {/* Metric 2: Estimated Whale Cost Basis */}
        <div className="bg-slate-900/85 border border-indigo-500/30 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-sans font-medium text-indigo-300">
              <DollarSign className="w-4 h-4 text-indigo-400" />
              Себестоимость китов
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              EST. ENTRY
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-300 tracking-tight">
            {formatPrice(whaleCostBasisEst)}
          </div>
          <div className="mt-1 text-[11px] flex items-center gap-1 font-sans">
            <span className="text-slate-400">Профит китов:</span>
            <span className={`font-mono font-bold ${currentWhaleProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentWhaleProfitPct >= 0 ? '+' : ''}{currentWhaleProfitPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Metric 3: Total Pool Liquidity & 5% Slippage Impact */}
        <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
              <Droplets className="w-4 h-4 text-cyan-400" />
              Емкость пула (TVL)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              AMM DEPTH
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {formatUsd(poolLiquidityUsd)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-sans">
            Сброс на -5%: <span className="text-amber-300 font-mono font-semibold">{formatUsd(slippage5PctSellUsd)}</span>
          </div>
        </div>

        {/* Metric 4: 10% Slippage Wall */}
        <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Стенка сброса (-10%)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              MAX ABSORB
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-300 tracking-tight">
            {formatUsd(slippage10PctSellUsd)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-sans">
            Критический сброс (-25%): <span className="text-rose-400 font-mono font-semibold">{formatUsd(slippage25PctSellUsd)}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Section: Vertical Liquidity Ladder + AMM Slippage Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Interactive Visual Liquidity Levels Ladder */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Лестница Ценовых Уровней & Зон Разгрузки Китов
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Нажмите на уровень для деталей
            </span>
          </div>

          {/* Vertical Level Ladder Items */}
          <div className="space-y-2 font-mono text-xs">
            {levels.map((lvl) => {
              const isCurrent = lvl.type === 'CURRENT_PRICE';
              const isResistance = lvl.type.startsWith('RESISTANCE');
              const isSupport = lvl.type.startsWith('SUPPORT');
              const isSelected = selectedLevel?.id === lvl.id;

              // Border & background styling
              let borderClass = 'border-slate-800 bg-slate-950/60 hover:border-slate-700';
              let badgeColor = 'bg-slate-800 text-slate-300';
              let priceColor = 'text-slate-200';

              if (lvl.type === 'RESISTANCE_EXTREME') {
                borderClass = isSelected
                  ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500'
                  : 'border-rose-500/30 bg-rose-950/20 hover:border-rose-500/60';
                badgeColor = 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
                priceColor = 'text-rose-300';
              } else if (lvl.type === 'RESISTANCE_MAJOR') {
                borderClass = isSelected
                  ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                  : 'border-amber-500/30 bg-amber-950/20 hover:border-amber-500/60';
                badgeColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                priceColor = 'text-amber-300';
              } else if (lvl.type === 'RESISTANCE_LOCAL') {
                borderClass = isSelected
                  ? 'border-yellow-500 bg-yellow-950/40 ring-1 ring-yellow-500'
                  : 'border-yellow-500/30 bg-yellow-950/20 hover:border-yellow-500/60';
                badgeColor = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
                priceColor = 'text-yellow-300';
              } else if (isCurrent) {
                borderClass = 'border-cyan-500/80 bg-cyan-950/40 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400';
                badgeColor = 'bg-cyan-500 text-slate-950 font-extrabold';
                priceColor = 'text-cyan-300 font-extrabold';
              } else if (lvl.type === 'SUPPORT_LOCAL') {
                borderClass = isSelected
                  ? 'border-teal-500 bg-teal-950/40 ring-1 ring-teal-500'
                  : 'border-teal-500/30 bg-teal-950/20 hover:border-teal-500/60';
                badgeColor = 'bg-teal-500/20 text-teal-300 border border-teal-500/40';
                priceColor = 'text-teal-300';
              } else if (lvl.type === 'SUPPORT_MAJOR') {
                borderClass = isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                  : 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60';
                badgeColor = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
                priceColor = 'text-emerald-300';
              } else if (lvl.type === 'SUPPORT_FLOOR') {
                borderClass = isSelected
                  ? 'border-rose-600 bg-rose-950/50 ring-1 ring-rose-600'
                  : 'border-rose-600/40 bg-rose-950/30 hover:border-rose-600/70';
                badgeColor = 'bg-rose-600/30 text-rose-200 border border-rose-600/50';
                priceColor = 'text-rose-400 font-bold';
              }

              return (
                <div
                  key={lvl.id}
                  onClick={() => setSelectedLevel(isSelected ? null : lvl)}
                  className={`border rounded-xl p-3 transition cursor-pointer ${borderClass}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {isCurrent ? (
                        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                      ) : isResistance ? (
                        <ArrowUpRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}

                      <div>
                        <span className="font-semibold text-white font-sans text-xs block">
                          {lvl.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {lvl.whaleAction === 'TAKE_PROFIT_HEAVY' && '🔴 Крупная фиксация (70%+ позиции)'}
                          {lvl.whaleAction === 'TAKE_PROFIT_SCALE' && '🟠 Частичная фиксация (тейк 30-50%)'}
                          {lvl.whaleAction === 'PIVOT_ZONE' && '🔵 Точка баланса спроса и предложения'}
                          {lvl.whaleAction === 'DEFENSE_ACCUMULATION' && '🟢 Защитный откуп пула / Накопление'}
                          {lvl.whaleAction === 'PANIC_DUMP_CASCADE' && '🚨 Слом структуры / Угроза ликвидации пула'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right self-end sm:self-auto">
                      <div>
                        <div className={`text-sm font-bold ${priceColor}`}>
                          {formatPrice(lvl.price)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isCurrent ? (
                            <span className="text-cyan-400 font-bold">PIVOT (0.00%)</span>
                          ) : (
                            <span className={lvl.distancePct > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                              {lvl.distancePct >= 0 ? '+' : ''}{lvl.distancePct.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${badgeColor}`}>
                        {lvl.riskRating}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Accordion */}
                  {(isSelected || isCurrent) && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-300 font-sans space-y-1.5 leading-relaxed">
                      <p>{lvl.description}</p>
                      {lvl.estSellPressureUsd && (
                        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                          <span>Ожидаемый сброс китов:</span>
                          <span className="text-amber-300 font-semibold">{formatUsd(lvl.estSellPressureUsd)}</span>
                          <span className="text-slate-600">|</span>
                          <span>Требуемый объем покупок для пробития:</span>
                          <span className="text-cyan-300 font-semibold">{formatUsd(lvl.estBuyVolumeNeededUsd || 0)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: AMM Slippage Simulator & Profit Taking Strategy */}
        <div className="space-y-4">
          {/* Card 1: Interactive AMM Slippage Simulator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-cyan-400" />
                Симулятор Слиппеджа AMM
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">x * y = k</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Оцените влияние рыночной продажи кита или вашего ордера на спотовую цену в пуле {primaryDexName.toUpperCase()}:
            </p>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
              {[5000, 25000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCustomSellAmount(amt)}
                  className={`py-1.5 rounded-lg border transition cursor-pointer text-center ${
                    customSellAmount === amt
                      ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ${(amt / 1000)}k
                </button>
              ))}
            </div>

            {/* Custom Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Объем продажи:</span>
                <span className="text-white font-bold">${customSellAmount.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min="1000"
                max={Math.min(500000, Math.round(poolLiquidityUsd * 0.4) || 200000)}
                step="1000"
                value={customSellAmount}
                onChange={(e) => setCustomSellAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Slippage Result Card */}
            <div className="bg-slate-950/80 border border-cyan-500/20 rounded-xl p-3 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-sans">Оценочный сдвиг цены:</span>
                <span className={`font-bold text-sm ${calcEstimatedSlippage(customSellAmount) > 10 ? 'text-rose-400' : calcEstimatedSlippage(customSellAmount) > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  -{calcEstimatedSlippage(customSellAmount).toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-sans">Цена после сброса:</span>
                <span className="text-slate-200 font-bold">
                  {formatPrice(currentPrice * (1 - calcEstimatedSlippage(customSellAmount) / 100))}
                </span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    calcEstimatedSlippage(customSellAmount) > 10 ? 'bg-rose-500' : calcEstimatedSlippage(customSellAmount) > 4 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, calcEstimatedSlippage(customSellAmount) * 3)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Whale Distribution Scheme Cheat-Sheet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Info className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Как действуют синдикаты на DEX</span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-emerald-400 block font-mono mb-0.5">1. Free-Roll (+50% - +100%):</span>
                <span>На первом мощном импульсе синдикат выводит исходное тело инвестиций (100% вложений), оставляя чистую прибыль в токенах.</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-amber-400 block font-mono mb-0.5">2. Лесенка на Fib 1.618:</span>
                <span>Основная разгрузка маркетмейкера происходит в диапазоне +35%...+60% от текущего уровня через микро-свопы во избежание резкого краша.</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-rose-400 block font-mono mb-0.5">3. Защита дна (Pool Support):</span>
                <span>Маркетмейкер защищает уровень себестоимости (-25%), пока не завершит разгрузку 80% своих кошельков.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
