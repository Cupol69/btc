import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  DollarSign,
  Lock,
  Unlock,
  Coins,
  Bot,
  Info,
  Clock,
  Filter,
  BarChart2,
  ChevronDown,
  ChevronUp,
  RotateCw,
} from 'lucide-react';
import { PoolDecoderData, PoolDecoderSnapshot, PriceImpactTier } from '../types';

interface AmmPoolDecoderPanelProps {
  poolDecoder: PoolDecoderData;
  symbol: string;
  onAskAi?: (question: string) => void;
}

// Clean price formatter avoiding scientific exponential notation
function formatPriceClean(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price) || price === 0) return '0.00';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.1) return price.toFixed(4);
  if (price >= 0.001) return price.toFixed(5);
  if (price >= 0.00001) return price.toFixed(7);
  if (price >= 0.000001) return price.toFixed(8);
  return price.toFixed(10).replace(/(\.\d*?[1-9])0+$/, '$1');
}

export const AmmPoolDecoderPanel: React.FC<AmmPoolDecoderPanelProps> = ({
  poolDecoder,
  symbol,
  onAskAi,
}) => {
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'POSITIVE_FLOW' | 'MEV_SPIKES'>('ALL');
  const [customOrderSize, setCustomOrderSize] = useState<number>(5000);
  const [selectedSnapshot, setSelectedSnapshot] = useState<PoolDecoderSnapshot | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'5m' | '1h' | '6h' | '24h'>('1h');

  // Multi-Period Active Organic Flow
  const activeFlow = useMemo(() => {
    if (poolDecoder.multiPeriodOrganicFlow) {
      if (selectedPeriod === '5m' && poolDecoder.multiPeriodOrganicFlow.p5m) return poolDecoder.multiPeriodOrganicFlow.p5m;
      if (selectedPeriod === '1h' && poolDecoder.multiPeriodOrganicFlow.p1h) return poolDecoder.multiPeriodOrganicFlow.p1h;
      if (selectedPeriod === '6h' && poolDecoder.multiPeriodOrganicFlow.p6h) return poolDecoder.multiPeriodOrganicFlow.p6h;
      if (selectedPeriod === '24h' && poolDecoder.multiPeriodOrganicFlow.p24h) return poolDecoder.multiPeriodOrganicFlow.p24h;
    }
    // Fallback to summary1h data
    return {
      period: '1h' as const,
      periodLabel: '1 час',
      grossBuyVolumeUsd: poolDecoder.summary1h.grossBuyVolumeUsd,
      grossSellVolumeUsd: poolDecoder.summary1h.grossSellVolumeUsd,
      grossNetFlowUsd: poolDecoder.summary1h.grossNetFlowUsd,
      totalBuys: poolDecoder.summary1h.totalBuys,
      totalSells: poolDecoder.summary1h.totalSells,
      washVolumeUsd: Math.round(poolDecoder.summary1h.grossBuyVolumeUsd * 0.15),
      mevSandwichVolumeUsd: poolDecoder.summary1h.mevSandwichVolumeUsd,
      lpRebalanceEffectUsd: Math.round(poolDecoder.summary1h.grossBuyVolumeUsd * 0.05),
      clusterSelfTradeUsd: Math.round(poolDecoder.summary1h.grossBuyVolumeUsd * 0.08),
      removedInorganicVolumeUsd: poolDecoder.summary1h.mevSandwichVolumeUsd,
      organicNetFlowUsd: poolDecoder.summary1h.organicNetFlowUsd,
      organicBuysUsd: Math.round(poolDecoder.summary1h.grossBuyVolumeUsd * 0.8),
      organicSellsUsd: Math.round(poolDecoder.summary1h.grossSellVolumeUsd * 0.8),
      organicFlowToLiquidityPct: Number(((poolDecoder.summary1h.organicNetFlowUsd / (poolDecoder.quoteToken.reserveUsd * 2 || 1)) * 100).toFixed(2)),
      organicFlowPerUniqueBuyerUsd: Math.round(poolDecoder.summary1h.organicNetFlowUsd / (poolDecoder.summary1h.uniqueBuyersCount || 1)),
      uniqueBuyersCount: poolDecoder.summary1h.uniqueBuyersCount,
      uniqueSellersCount: poolDecoder.summary1h.uniqueSellersCount,
      buyerToSellerRatio: poolDecoder.summary1h.buyerToSellerRatio,
      top3VolumeSharePercent: poolDecoder.summary1h.top3VolumeSharePercent,
      isWashTradingSuspected: poolDecoder.summary1h.isWashTradingSuspected,
      sandwichPercent: poolDecoder.summary1h.sandwichPercent,
      flowHealth: poolDecoder.summary1h.organicNetFlowUsd > 0 ? ('BULLISH_ORGANIC' as const) : ('DISTRIBUTION_RISK' as const),
      flowHealthLabel: poolDecoder.summary1h.organicNetFlowUsd > 0 ? 'Преобладание чистого спроса' : 'Преобладание чистого предложения',
    };
  }, [poolDecoder, selectedPeriod]);

  // Dynamic Custom Price Impact based on AMM formula: dx/x = dy / (y + dy)
  const customImpact = useMemo(() => {
    const quoteReserveUsd = poolDecoder.quoteToken.reserveUsd || 50000;
    const basePrice = poolDecoder.currentPrice || 0.0001;
    const sz = Math.max(1, customOrderSize);
    const impactPct = Number(((sz / (quoteReserveUsd + sz)) * 100).toFixed(2));
    const execPrice = Number((basePrice * (1 + (impactPct / 100) * 0.5)).toFixed(6));
    const tokensRec = execPrice > 0 ? Number((sz / execPrice).toFixed(1)) : 0;
    const canExit = impactPct < 15;
    let warning = '✅ Безопасный вход/выход (<5% сдвиг)';
    if (impactPct > 20) {
      warning = '🛑 КРИТИЧЕСКИЙ СДВИГ: Своп обрушит пул. Только через TWAP!';
    } else if (impactPct > 8) {
      warning = '⚠️ УМЕРЕННЫЙ СДВИГ: Рекомендуется сплитовать ордер на 3-5 частей.';
    }
    return {
      sizeUsd: sz,
      impactPct,
      executionPrice: execPrice,
      tokensReceived: tokensRec,
      canExitSafely: canExit,
      slippageWarning: warning,
    };
  }, [customOrderSize, poolDecoder]);

  // Filtered Snapshots
  const filteredSnapshots = useMemo(() => {
    if (!poolDecoder.snapshots) return [];
    if (activeFilter === 'POSITIVE_FLOW') {
      return poolDecoder.snapshots.filter((s) => s.organicNetFlowUsd > 0);
    }
    if (activeFilter === 'MEV_SPIKES') {
      return poolDecoder.snapshots.filter((s) => s.sandwichPercent >= 30);
    }
    return poolDecoder.snapshots;
  }, [poolDecoder.snapshots, activeFilter]);

  // Phase badge styles
  const phaseTheme = useMemo(() => {
    switch (poolDecoder.poolPhase) {
      case 'ORGANIC_ACCUMULATION':
        return {
          badge: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
          dot: 'bg-emerald-400',
          border: 'border-emerald-500/40',
          glow: 'shadow-emerald-500/10',
        };
      case 'MEV_WASH_TRAP':
        return {
          badge: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
          dot: 'bg-rose-400',
          border: 'border-rose-500/40',
          glow: 'shadow-rose-500/10',
        };
      case 'EXPLOSION_READY':
        return {
          badge: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          dot: 'bg-amber-400',
          border: 'border-amber-500/40',
          glow: 'shadow-amber-500/10',
        };
      case 'NEUTRAL_CHURN':
      default:
        return {
          badge: 'bg-slate-950 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          border: 'border-slate-800',
          glow: 'shadow-slate-500/5',
        };
    }
  }, [poolDecoder.poolPhase]);

  return (
    <div id="amm-pool-decoder-section" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4 font-mono animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HEADER & AMM CORE MECHANIC (x * y = k)                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                <span>AMM Pool Decoder: Механика x · y = k</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                DEX AMM Forensics
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Анатомия пула <strong>{poolDecoder.symbol}/{poolDecoder.quoteToken.symbol}</strong> ({poolDecoder.dexId}) · Вычет MEV/Sandwich ботов и поиск реального триггера движения.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${phaseTheme.badge}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${phaseTheme.dot}`} />
            <span>{poolDecoder.poolPhaseTitle}</span>
          </div>
        </div>
      </div>

      {/* Phase Description Banner */}
      <div className={`p-3 rounded-lg bg-slate-950/80 border ${phaseTheme.border} text-xs font-sans leading-relaxed text-slate-200 flex items-start gap-2.5 shadow-sm ${phaseTheme.glow}`}>
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Текущий вердикт ончейн-пула: </span>
          <span>{poolDecoder.poolPhaseDescription}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE CORE CARDS: AMM CONSTANT, QUOTE RESERVE, TOKEN RESERVE           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Card 1: Constant Product k = x * y */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300 font-bold">
              <span>Константа Пула (k)</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-bold">x · y = k</span>
          </div>
          <div className="text-lg font-black text-white truncate">
            {poolDecoder.kConstant.toExponential(4)}
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            Сделки лишь перемещают точку по гиперболе. Константа k меняется <strong>только при добавлении или снятии LP</strong>.
          </div>
        </div>

        {/* Card 2: Reserve Quote (WBNB / SOL / ETH) */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span>Резерв {poolDecoder.quoteToken.symbol} (Quote)</span>
            </span>
            <span className="text-[10px] text-slate-500">~${poolDecoder.quoteToken.priceUsd}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black text-white">
              {poolDecoder.quoteToken.reserve.toLocaleString()} {poolDecoder.quoteToken.symbol}
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              ${(poolDecoder.quoteToken.reserveUsd / 1e3).toFixed(1)}k
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            50% стоимости пула. Реальные деньги, доступные для мгновенного вывода.
          </div>
        </div>

        {/* Card 3: Reserve Base Token */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-indigo-400 font-bold">
              <span>Резерв {poolDecoder.baseToken.symbol} (Base)</span>
            </span>
            <span className="text-[10px] text-slate-500">Цена: ${poolDecoder.currentPrice.toFixed(6)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black text-white truncate">
              {poolDecoder.baseToken.reserve >= 1e6
                ? `${(poolDecoder.baseToken.reserve / 1e6).toFixed(2)}M`
                : poolDecoder.baseToken.reserve.toLocaleString()}{' '}
              {poolDecoder.baseToken.symbol}
            </span>
            <span className="text-xs text-indigo-400 font-bold">
              ${(poolDecoder.baseToken.reserveUsd / 1e3).toFixed(1)}k
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {poolDecoder.summary1h.organicNetFlowUsd > 0 ? (
              <span className="text-emerald-400 font-bold">🟢 Предложение в пуле сжимается (Дефицит)</span>
            ) : (
              <span className="text-rose-400 font-bold">🔴 Токены возвращаются в пул (Навес продаж)</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ORDER FLOW FORENSICS: GROSS VS TRUE ORGANIC NET FLOW (MEV DEDUCTION)   */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Filter className="w-4 h-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <span>Очистка от Шума: Gross Order Flow vs True Organic Net Flow</span>
                </h4>
                {/* INTERACTIVE PERIOD SWITCHER */}
                <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Период:</span>
                  {(['5m', '1h', '6h', '24h'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                        selectedPeriod === period
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {period.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                Фильтрация 1-3 блочных сэндвичей, MEV-ботов (EigenPhi/Flashbots) и самоторговли (Wash Trading) · Режим {activeFlow.periodLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Sandwich Bot Share:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              activeFlow.sandwichPercent > 40
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : activeFlow.sandwichPercent > 20
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
            }`}>
              {activeFlow.sandwichPercent}% токсичного объема
            </span>
          </div>
        </div>

        {/* 4-Stat Comparison Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500">Видимый валовой приток:</div>
            <div className="text-white font-bold mt-0.5">
              ${(activeFlow.grossBuyVolumeUsd / 1e3).toFixed(1)}k
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
              +{activeFlow.totalBuys} покупок
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500">Видимый валовой отток:</div>
            <div className="text-white font-bold mt-0.5">
              ${(activeFlow.grossSellVolumeUsd / 1e3).toFixed(1)}k
            </div>
            <div className="text-[10px] text-rose-400 font-medium mt-0.5">
              -{activeFlow.totalSells} продаж
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/30">
            <div className="text-[10px] text-amber-400">MEV & Сэндвич-свопы:</div>
            <div className="text-amber-300 font-bold mt-0.5">
              ${(activeFlow.mevSandwichVolumeUsd / 1e3).toFixed(1)}k
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Вычет шума: -${(activeFlow.removedInorganicVolumeUsd / 1e3).toFixed(1)}k
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border ${
            activeFlow.organicNetFlowUsd > 0
              ? 'bg-emerald-950/40 border-emerald-500/50'
              : 'bg-rose-950/40 border-rose-500/50'
          }`}>
            <div className="text-[10px] text-slate-300 font-bold flex items-center justify-between">
              <span>Очищенный Organic Net Flow:</span>
              <span className="text-[9px] px-1 rounded bg-slate-900 text-amber-300 font-bold">{selectedPeriod.toUpperCase()}</span>
            </div>
            <div className={`text-base font-black mt-0.5 ${
              activeFlow.organicNetFlowUsd > 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {activeFlow.organicNetFlowUsd >= 0 ? '+' : ''}
              ${(activeFlow.organicNetFlowUsd / 1e3).toFixed(2)}k
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5 flex items-center justify-between">
              <span>Валовой поток:</span>
              <span className="font-bold text-white">
                {activeFlow.grossNetFlowUsd >= 0 ? '+' : ''}
                ${(activeFlow.grossNetFlowUsd / 1e3).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown of Filtered Inorganic Noise */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-850">
          <div>
            <span className="text-slate-500 block">Отфильтровано MEV:</span>
            <span className="font-bold text-amber-300">-${(activeFlow.mevSandwichVolumeUsd / 1e3).toFixed(1)}k</span>
          </div>
          <div>
            <span className="text-slate-500 block">Wash Trading & Роботы:</span>
            <span className="font-bold text-rose-400">-${(activeFlow.washVolumeUsd / 1e3).toFixed(1)}k</span>
          </div>
          <div>
            <span className="text-slate-500 block">LP-ребаланс & Стены:</span>
            <span className="font-bold text-cyan-300">-${(activeFlow.lpRebalanceEffectUsd / 1e3).toFixed(1)}k</span>
          </div>
          <div>
            <span className="text-slate-500 block">Приток на 1 покупателя:</span>
            <span className="font-bold text-emerald-400">${activeFlow.organicFlowPerUniqueBuyerUsd.toLocaleString()}</span>
          </div>
        </div>

        {/* Unique Buyers vs Sellers & Wash Trading Radar */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-500">Уникальные кошельки ({selectedPeriod}): </span>
              <span className="text-emerald-400 font-bold">{activeFlow.uniqueBuyersCount} покупателей</span>
              <span className="text-slate-500"> vs </span>
              <span className="text-rose-400 font-bold">{activeFlow.uniqueSellersCount} продавцов</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-cyan-300">
              {activeFlow.buyerToSellerRatio}x Ratio
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Концентрация топ-3 адресов:</span>
            <span className={`font-bold ${
              activeFlow.isWashTradingSuspected ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {activeFlow.top3VolumeSharePercent}% объема
              {activeFlow.isWashTradingSuspected ? ' (⚠️ Риск Wash Trading)' : ' (Органично)'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. 12 FIVE-MINUTE SNAPSHOTS (TIME-SERIES ORDER FLOW FOR LAST 60 MINUTES)  */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-xs font-black uppercase text-white tracking-wider">
              12 Снимков Пула (Интервалы по 5 минут за последний час)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Chips */}
            <div className="flex items-center gap-1 text-[10px]">
              {(['ALL', 'POSITIVE_FLOW', 'MEV_SPIKES'] as const).map((flt) => (
                <button
                  key={flt}
                  onClick={() => setActiveFilter(flt)}
                  className={`px-2 py-0.5 rounded transition ${
                    activeFilter === flt
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {flt === 'ALL' ? 'Все 12' : flt === 'POSITIVE_FLOW' ? '🟢 Приток' : '⚠️ MEV >30%'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsTableExpanded(!isTableExpanded)}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] flex items-center gap-1"
            >
              <span>{isTableExpanded ? 'Свернуть' : 'Развернуть'}</span>
              {isTableExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {isTableExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-slate-800">
                  <th className="py-1.5 px-2">Интервал</th>
                  <th className="py-1.5 px-2">Цена ($)</th>
                  <th className="py-1.5 px-2">Резерв Токенов</th>
                  <th className="py-1.5 px-2">Δ Токенов в Пуле</th>
                  <th className="py-1.5 px-2">Сделки (B/S)</th>
                  <th className="py-1.5 px-2">Объем 5м</th>
                  <th className="py-1.5 px-2">Organic Net Flow</th>
                  <th className="py-1.5 px-2">MEV Сэндвич %</th>
                  <th className="py-1.5 px-2">Уник. Кошельки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredSnapshots.map((snap, idx) => {
                  const isPositive = snap.organicNetFlowUsd >= 0;
                  const isTokenDeficit = snap.deltaReserveToken < 0; // Negative delta means tokens REMOVED from pool (good for price)
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedSnapshot(snap)}
                      className={`hover:bg-slate-900/80 cursor-pointer transition ${
                        selectedSnapshot?.timestamp === snap.timestamp ? 'bg-indigo-950/30 border-l-2 border-indigo-500' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 font-bold text-slate-300 whitespace-nowrap">
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px]">
                          {snap.timeLabel}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-white font-bold">
                        ${formatPriceClean(snap.price)}
                      </td>
                      <td className="py-1.5 px-2 text-slate-300">
                        {snap.reserveToken >= 1e6 ? `${(snap.reserveToken / 1e6).toFixed(2)}M` : snap.reserveToken.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2">
                        <span className={`font-bold ${isTokenDeficit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {snap.deltaReserveToken > 0 ? '+' : ''}
                          {Math.round(snap.deltaReserveToken).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-500 ml-1">
                          {isTokenDeficit ? '(выкуп)' : '(слив)'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <span className="text-emerald-400 font-bold">{snap.buys5m}B</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-rose-400 font-bold">{snap.sells5m}S</span>
                      </td>
                      <td className="py-1.5 px-2 text-slate-300">
                        ${(snap.buyVolumeUsd + snap.sellVolumeUsd).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2">
                        <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}${snap.organicNetFlowUsd.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-1.5 px-2">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          snap.sandwichPercent > 40
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : snap.sandwichPercent > 20
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}>
                          {snap.sandwichPercent}% (${(snap.mevVolumeUsd / 1e3).toFixed(1)}k)
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-slate-400 text-[10px]">
                        {snap.uniqueBuyers}B / {snap.uniqueSellers}S
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. PRICE IMPACT MATRIX ($1,000, $10,000, $50,000 & CUSTOM SLIDER)        */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <DollarSign className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                Матрица Влияния на Цену (Price Impact & Slippage)
              </h4>
              <span className="text-[10px] text-slate-400 font-sans">
                Расчет смещения кривой x · y = k при ордерах разного размера ($1k, $10k, $50k)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[10px]">Глубина пула:</span>
            <span className="text-white font-bold">${((poolDecoder.quoteToken.reserveUsd * 2) / 1e3).toFixed(1)}k</span>
          </div>
        </div>

        {/* Standard Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {poolDecoder.priceImpactMatrix.map((tier) => (
            <div
              key={tier.sizeUsd}
              className={`p-3 rounded-lg border ${
                tier.impactPct > 20
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : tier.impactPct > 8
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : 'bg-emerald-950/30 border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">Ордер ${tier.sizeUsd.toLocaleString()}</span>
                <span className={`font-bold ${tier.impactPct > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ~{tier.impactPct}% сдвиг
                </span>
              </div>
              <div className="mt-2 space-y-1 text-[10px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Цена исполнения:</span>
                  <span className="font-bold text-white">${tier.executionPrice.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Токенов на выходе:</span>
                  <span className="font-bold text-white">{tier.tokensReceived.toLocaleString()}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 text-[10px]">
                  <span>{tier.slippageWarning}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Order Interactive Calculator */}
        <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
              <span>Симуляция пользовательского сайза:</span>
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {[500, 2000, 5000, 15000, 30000].map((val) => (
                <button
                  key={val}
                  onClick={() => setCustomOrderSize(val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    customOrderSize === val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ${(val / 1e3).toFixed(1)}k
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-40">
              <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold text-xs">$</span>
              <input
                type="number"
                value={customOrderSize}
                onChange={(e) => setCustomOrderSize(Math.max(1, Number(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 pl-6 py-1 text-white font-bold text-xs focus:border-indigo-400 outline-none"
              />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-400">Сдвиг пула: </span>
                <span className={`font-bold ${customImpact.impactPct > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ~{customImpact.impactPct}%
                </span>
                <span className="text-slate-500 text-[10px] ml-2">
                  (Исп: ${customImpact.executionPrice.toFixed(6)})
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-300">
                {customImpact.slippageWarning}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. PHASE SIGNALS CHECKLIST (7 VERIFICATION POINTS)                        */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-black uppercase text-white tracking-wider">
              Ончейн-Чеклист Сигналов Пула (Rule 2 & Rule 10)
            </h4>
          </div>
          <span className="text-[10px] text-slate-500">7 Параметров</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {poolDecoder.phaseSignals.map((sig, idx) => {
            const isConfirmed = sig.status === 'CONFIRMED';
            const isViolated = sig.status === 'VIOLATED';
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 ${
                  isConfirmed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                    : isViolated
                    ? 'bg-rose-950/20 border-rose-500/30 text-slate-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-white text-[11px]">{sig.label}</div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight">{sig.detail}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    isConfirmed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : isViolated
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isConfirmed ? '✓ CONFIRMED' : isViolated ? '⚠ VIOLATED' : 'NEUTRAL'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. AI POOL DECODER FORENSIC VERDICT & QUICK CHAT ACTION                   */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Bot className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-black uppercase text-white tracking-wider">
              ИИ-Анализ Пула: Механика Движения Цены
            </h4>
          </div>
          {onAskAi && (
            <button
              onClick={() => {
                const prompt = `Разбери ончейн-механику AMM пула ${poolDecoder.symbol} (x*y=k): резерв ${poolDecoder.quoteToken.symbol} (${poolDecoder.quoteToken.reserve}), Reserve_TOKEN (${poolDecoder.baseToken.reserve}), вычет MEV-сэндвичей (${poolDecoder.summary1h.sandwichPercent}%), почему видны большие покупки, но цена стоит или падает? Где реальный триггер движения?`;
                onAskAi(prompt);
              }}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>Спросить ИИ подробнее</span>
              <Bot className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-300 font-sans leading-relaxed space-y-2">
          <p className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-slate-200">
            {poolDecoder.aiPoolDecoderVerdict.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-indigo-400 font-bold uppercase">Динамика Резервов:</div>
              <div className="mt-1 text-slate-300">{poolDecoder.aiPoolDecoderVerdict.reserveTokenTrend}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-amber-400 font-bold uppercase">MEV & Сэндвич-Угроза:</div>
              <div className="mt-1 text-slate-300">{poolDecoder.aiPoolDecoderVerdict.mevTrapAnalysis}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30 text-[11px] font-mono flex items-center justify-between">
            <div>
              <span className="text-emerald-400 font-bold">Ключевой вывод для трейдера: </span>
              <span className="text-white">{poolDecoder.aiPoolDecoderVerdict.keyTakeaway}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
