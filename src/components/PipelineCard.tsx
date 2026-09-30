import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowLeftRight,
  Flame,
  Snowflake,
  Activity,
  Calendar,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Compass,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { MemeTokenCandidate, FunnelStage, StageHealth } from '../data/memePipelineTokens';
import { STAGE_DEFINITIONS } from './TokenStageDifferenceCard';
import { calculateTokenStageFacts } from './TokenStageHelper';
import { classifyTokenGrowthDrivers } from '../utils/growthDriversClassifier';

interface PipelineCardProps {
  token: MemeTokenCandidate;
  onPromoteStage: (tokenId: string, targetStage: FunnelStage, customNote?: string) => void;
  onCheckLiveDexPool: (tokenId: string) => void;
  onOpenAuditForToken?: (contract: string, chain?: string, symbol?: string) => void;
  onSendToTerminal?: (symbol: string) => void;
  onDeleteToken: (tokenId: string) => void;
  copiedContract: string | null;
  onCopy: (text: string) => void;
  isCheckingPool: boolean;
  defaultExpanded?: boolean;
}

export const PipelineCard: React.FC<PipelineCardProps> = ({
  token,
  onPromoteStage,
  onCheckLiveDexPool,
  onOpenAuditForToken,
  onSendToTerminal,
  onDeleteToken,
  copiedContract,
  onCopy,
  isCheckingPool,
  defaultExpanded = false
}) => {
  // Accordion Expand/Collapse state: default collapsed (compact stock view)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Derive slow Stage facts and fast Health status
  const stageFacts = useMemo(() => calculateTokenStageFacts(token), [token]);
  const stageMeta = STAGE_DEFINITIONS[stageFacts.tokenStage];

  // Zero liquidity lock check
  const isZeroLiquidity = !token.dexPoolFound || token.dexLiquidityUsd === 0 || token.dexLiquidityUsd < 1000;

  // Dynamic visual styling depending on Funnel Column
  const funnelTheme = useMemo(() => {
    switch (token.stage) {
      case 'STAGE_3_FINAL_VERIFIED':
        return {
          border: 'border-emerald-500/40 hover:border-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          boxBg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200',
          accentText: 'text-emerald-400'
        };
      case 'STAGE_2_DEEP_AUDIT':
        return {
          border: 'border-blue-500/40 hover:border-blue-400',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          boxBg: 'bg-blue-950/40 border-blue-500/30 text-blue-200',
          accentText: 'text-blue-400'
        };
      case 'STAGE_1_PRESCREEN':
        return {
          border: 'border-amber-500/30 hover:border-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          boxBg: 'bg-amber-950/30 border-amber-500/20 text-amber-200',
          accentText: 'text-amber-400'
        };
      case 'REJECTED':
      default:
        return {
          border: 'border-rose-500/30 hover:border-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          boxBg: 'bg-rose-950/30 border-rose-500/20 text-rose-200',
          accentText: 'text-rose-400'
        };
    }
  }, [token.stage]);

  // Stage Health Pill Color and Icon
  const healthBadge = useMemo(() => {
    switch (stageFacts.stageHealth) {
      case 'HEATING':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Flame className="w-2.5 h-2.5 text-amber-400 animate-pulse" />,
          label: 'HEATING',
          ru: 'Нагрев'
        };
      case 'COOLING':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Snowflake className="w-2.5 h-2.5 text-cyan-400" />,
          label: 'COOLING',
          ru: 'Остывание'
        };
      case 'STABLE':
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Activity className="w-2.5 h-2.5 text-emerald-400" />,
          label: 'STABLE',
          ru: 'Стабильно'
        };
    }
  }, [stageFacts.stageHealth]);

  // Algorithmic 27-method growth driver classifier (Primary, Secondary, Sustainability 1-5)
  const growthDrivers = useMemo(() => {
    return classifyTokenGrowthDrivers({
      symbol: token.symbol,
      category: token.category,
      dexLiquidityUsd: token.dexLiquidityUsd,
      volume24hUsd: token.volume24hUsd,
      txns24h: token.txns24h,
      buyPercent: token.buyPercent,
      priceChange24h: token.priceChange24h,
      multiplierFdvTvl: token.multiplierFdvTvl,
      chain: token.chain,
      poolPairs: token.poolPairs
    });
  }, [token]);

  // Determine 3-Basket asset risk routing profile
  const assetBasket = useMemo(() => {
    if (
      (token.fdvUsd && token.fdvUsd >= 100_000_000) ||
      (token.dexLiquidityUsd && token.dexLiquidityUsd >= 2_000_000) ||
      (token.category && (token.category.toLowerCase().includes('tier-1') || token.category.toLowerCase().includes('global') || token.category.toLowerCase().includes('top-100')))
    ) {
      return { id: 'BASKET_3', label: 'К3: CEX', color: 'text-purple-300 border-purple-500/40 bg-purple-950/40', title: 'Корзина 3: CEX Институционал (> $100M MCap / Top-100)' };
    }
    if (
      (token.fdvUsd && token.fdvUsd >= 5_000_000) ||
      (token.dexLiquidityUsd && token.dexLiquidityUsd >= 100_000) ||
      (token.category && (token.category.toLowerCase().includes('stock') || token.category.toLowerCase().includes('ai') || token.category.toLowerCase().includes('alpha')))
    ) {
      return { id: 'BASKET_2', label: 'К2: Альфа', color: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40', title: 'Корзина 2: Секторный Альфа ($5M–$100M / AI & bStocks)' };
    }
    return { id: 'BASKET_1', label: 'К1: Снайпер', color: 'text-amber-300 border-amber-500/40 bg-amber-950/40', title: 'Корзина 1: Дельта-Снайпер (< $5M / Защита $11 депозита)' };
  }, [token.fdvUsd, token.dexLiquidityUsd, token.category]);

  return (
    <div
      className={`rounded-xl bg-slate-900 border ${funnelTheme.border} transition-all text-xs shadow-md overflow-hidden`}
    >
      {/* ========================================================================= */}
      {/* 1. STOCK / HEADER BAR (Always Visible & Clickable to Expand / Collapse)    */}
      {/* Displays: Ticker, Name, Chain, Slow Stage Pill, Fast Health Pill, Price  */}
      {/* ========================================================================= */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className="p-2.5 cursor-pointer hover:bg-slate-800/60 transition-colors select-none space-y-1.5"
      >
        <div className="flex items-center justify-between gap-1.5">
          {/* Left: Ticker + Name + Chain + Basket Pill */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`px-1.5 py-0.5 rounded font-black text-[11px] border tracking-wide font-mono ${funnelTheme.badgeBg}`}
            >
              {token.symbol}
            </span>
            <span className="font-bold text-white truncate max-w-[85px]" title={token.name}>
              {token.name}
            </span>
            <span className="text-[8px] uppercase px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {token.chain}
            </span>
            <span
              className={`text-[8px] uppercase px-1 py-0.5 rounded border font-mono font-bold ${assetBasket.color}`}
              title={assetBasket.title}
            >
              {assetBasket.label}
            </span>
          </div>

          {/* Right: Price + 24h delta + Expand toggle button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right font-mono">
              <div className="text-white font-bold leading-tight text-xs">
                ${token.priceUsd > 0
                  ? token.priceUsd >= 1
                    ? token.priceUsd.toFixed(4)
                    : token.priceUsd >= 0.01
                    ? token.priceUsd.toFixed(4)
                    : token.priceUsd >= 0.0001
                    ? token.priceUsd.toFixed(6)
                    : token.priceUsd.toFixed(8)
                  : '0.00'}
              </div>
              {token.priceChange24h !== 0 && (
                <div
                  className={`text-[9px] font-bold ${
                    token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {token.priceChange24h > 0 ? '+' : ''}
                  {token.priceChange24h.toFixed(1)}%
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteToken(token.id);
              }}
              className="p-1 rounded bg-slate-800 hover:bg-rose-900/80 text-slate-400 hover:text-rose-300 transition"
              title={`Удалить ${token.symbol} из воронки`}
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
              title={isExpanded ? 'Свернуть карточку' : 'Развернуть детали и аудит'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Essential Stock Sub-bar: Slow Stage Anchor + Fast Health + Days in Stage + TVL */}
        <div className="flex items-center justify-between gap-1 text-[10px] pt-0.5">
          {/* Stage Anchor + Days */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${stageMeta.bgColor} ${stageMeta.color} ${stageMeta.borderColor}`}
              title={`Медленный факт: ${stageMeta.nameRu}`}
            >
              <Compass className="w-2.5 h-2.5" />
              <span>Ст.{stageFacts.tokenStage}</span>
            </span>

            {/* Stage Health: Fast intraday state */}
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-0.5 ${healthBadge.bg}`}
              title={`Быстрое состояние внутри стадии: ${stageFacts.healthReason}`}
            >
              {healthBadge.icon}
              <span>{healthBadge.label}</span>
            </span>

            {/* Days in stage indicator */}
            <span
              className="text-[9px] text-slate-400 flex items-center gap-0.5 font-mono"
              title={`Дней на этой стадии: ${stageFacts.daysInStage}`}
            >
              <Clock className="w-2.5 h-2.5 text-slate-500" />
              <span>{stageFacts.daysInStage}д</span>
            </span>
          </div>

          {/* Quick TVL / Impact snippet in collapsed stock */}
          <div className="text-[10px] text-slate-400 font-mono text-right truncate">
            TVL:{' '}
            <strong className={token.dexLiquidityUsd > 0 ? 'text-white' : 'text-rose-400'}>
              {token.dexLiquidityUsd > 0 ? `$${(token.dexLiquidityUsd / 1000).toFixed(0)}k` : '$0'}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXPANDED ACCORDION BODY (Revealed when card is clicked / opened)       */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="p-3 pt-1 border-t border-slate-800 space-y-2.5 animate-fadeIn">
          {/* 1. Stage Anchor Card Breakdown */}
          <div className={`p-2 rounded-lg border text-[10px] space-y-1.5 ${stageMeta.bgColor} ${stageMeta.borderColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <Compass className={`w-3.5 h-3.5 ${stageMeta.color}`} />
                <span className={stageMeta.color}>{stageMeta.nameRu}</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">
                {stageFacts.daysInStage} дней в стадии
              </span>
            </div>

            <p className="text-[10px] text-slate-300 leading-snug">
              {stageFacts.stageReason}
            </p>

            {/* Contextual Meaning of Signals */}
            <div className="pt-1 border-t border-slate-800/80 text-[10px] space-y-1">
              <div className="text-amber-300 font-semibold flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-400" />
                <span>Контекст сигнала для Стадии {stageFacts.tokenStage}:</span>
              </div>
              <p className="text-slate-200/90 leading-tight">
                {stageFacts.contextualSignal}
              </p>
            </div>
          </div>

          {/* Contract Row with Copy and DexScreener Link */}
          <div className="flex items-center justify-between text-[10px] bg-slate-950 p-1.5 rounded-lg border border-slate-800 font-mono text-slate-400">
            <span className="truncate max-w-[170px]">
              CA: {token.contract ? `${token.contract.slice(0, 8)}...${token.contract.slice(-6)}` : 'N/A'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(token.contract);
                }}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Скопировать контракт BEP-20"
              >
                {copiedContract === token.contract ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
              <a
                href={`https://dexscreener.com/${token.chain}/${token.contract}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-amber-400 hover:text-amber-300 p-1"
                title="Открыть график и пул на DexScreener"
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteToken(token.id);
                }}
                className="p-1 rounded bg-slate-800 hover:bg-rose-900/80 text-slate-400 hover:text-rose-300 transition ml-0.5"
                title={`Удалить ${token.symbol} из воронки`}
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Verdict or Rejection Reason Box */}
          <div className={`p-2 rounded-lg border leading-snug text-[10px] ${funnelTheme.boxBg}`}>
            <div className="font-bold mb-0.5 flex items-center gap-1">
              {token.stage === 'REJECTED' ? (
                <ShieldAlert className="w-3 h-3 text-rose-400" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-400" />
              )}
              <span>{token.stage === 'REJECTED' ? 'Причина отсева:' : 'Вердикт ончейн-аудита:'}</span>
            </div>
            {token.stage === 'REJECTED'
              ? token.rejectionReason || 'Отсеян по параметрам ликвидности'
              : token.deepAuditVerdict || token.passHighlight || 'Анализ ончейн-метрик'}
          </div>

          {/* 4-Metric Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div>
              TVL:{' '}
              <strong className={token.dexLiquidityUsd > 0 ? 'text-white' : 'text-rose-400'}>
                {token.dexLiquidityUsd > 0 ? `$${(token.dexLiquidityUsd / 1000).toFixed(1)}k` : '$0 (Нет пула)'}
              </strong>
            </div>
            <div>
              24h Vol:{' '}
              <strong className="text-white">
                {token.volume24hUsd > 0 ? `$${(token.volume24hUsd / 1000).toFixed(1)}k` : '$0'}
              </strong>
            </div>
            <div>
              Buys:{' '}
              <strong className={token.buyPercent >= 50 ? 'text-emerald-400' : 'text-slate-300'}>
                {token.buyPercent > 0 ? `${token.buyPercent.toFixed(1)}%` : 'N/A'}
              </strong>
            </div>
            <div>
              Импакт $11:{' '}
              <strong className={token.impact11Usd < 0.1 ? 'text-emerald-400' : 'text-amber-300'}>
                {token.impact11Usd > 0 ? `${token.impact11Usd.toFixed(4)}%` : '100%'}
              </strong>
            </div>
          </div>

          {/* Growth Driver (Методы роста: Primary, Secondary, Sustainability) */}
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-bold">
              <span className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Метод роста (Growth Driver):</span>
              </span>
              <span className="text-amber-400 font-mono" title={`Устойчивость драйвера: ${growthDrivers.driver_sustainability}/5`}>
                {growthDrivers.sustainability_stars} ({growthDrivers.driver_sustainability}/5)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[9px]">
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">Основной драйвер:</span>
                <strong className="text-white block truncate" title={growthDrivers.growth_driver_primary_name}>
                  {growthDrivers.growth_driver_primary_name}
                </strong>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">Вторичный драйвер:</span>
                <strong className="text-slate-300 block truncate" title={growthDrivers.growth_driver_secondary_name}>
                  {growthDrivers.growth_driver_secondary_name}
                </strong>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              <strong>Сигнал:</strong> {growthDrivers.evidence}
            </p>
          </div>

          {/* Invalidation Rule (What cancels the scenario) */}
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] space-y-1">
            <div className="text-slate-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Invalidation (условие отмены тезиса):</span>
            </div>
            <p className="text-slate-300 leading-tight">
              {stageFacts.invalidationCriteria}
            </p>
          </div>

          {/* Multi-Pool Dex Breakdown */}
          {token.poolPairs && token.poolPairs.length > 0 && (
            <div className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Layers className="w-2.5 h-2.5" />
                  <span>DEX Пулы ({token.poolPairs.length}):</span>
                </span>
                <span className="text-[8px] text-slate-500">Pancake / Uni</span>
              </div>
              <div className="space-y-0.5">
                {token.poolPairs.map((pair, idx) => (
                  <a
                    key={idx}
                    href={`https://dexscreener.com/${token.chain}/${pair.pairAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 transition font-mono border border-slate-800/60 text-slate-300 hover:text-white"
                    title={`Открыть пул ${pair.dexId} ${token.symbol}/${pair.quoteSymbol} на DexScreener`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 font-bold">
                        {token.symbol}/{pair.quoteSymbol}
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase">({pair.dexId.slice(0, 7)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        Liq: <strong className="text-white">${pair.liquidityUsd >= 1000000 ? `${(pair.liquidityUsd / 1000000).toFixed(2)}M` : `${(pair.liquidityUsd / 1000).toFixed(0)}k`}</strong>
                      </span>
                      <span className="text-slate-400">
                        Vol: <strong className="text-emerald-400">${pair.volume24hUsd >= 1000000 ? `${(pair.volume24hUsd / 1000000).toFixed(1)}M` : `${(pair.volume24hUsd / 1000).toFixed(0)}k`}</strong>
                      </span>
                      <ExternalLink className="w-2 h-2 text-slate-500" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Zero Liquidity Restriction Warning */}
          {isZeroLiquidity ? (
            <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-500/50 text-[10px] text-rose-300 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-bold text-rose-400">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Пул $0 TVL: Перенос заблокирован</span>
                </div>
                <button
                  type="button"
                  disabled={isCheckingPool}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckLiveDexPool(token.id);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-500/30 hover:bg-rose-500/50 text-white font-bold transition flex items-center gap-1 disabled:opacity-50"
                  title="Проверить, появилась ли ликвидность на PancakeSwap"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isCheckingPool ? 'animate-spin' : ''}`} />
                  <span>{isCheckingPool ? 'Проверка...' : 'Проверить DEX'}</span>
                </button>
              </div>
              <p className="text-[9px] text-rose-200/80 leading-tight">
                Вход на $11 невозможен. Актив остаётся в Отсеве, пока не появится реальный пул на PancakeSwap.
              </p>
            </div>
          ) : null}

          {/* STAGE MOVEMENT CONTROLS */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                <span>Переместить в колонку:</span>
              </span>
              {isZeroLiquidity ? (
                <span className="text-[9px] text-rose-400 font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Заблокировано
                </span>
              ) : (
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <Unlock className="w-2.5 h-2.5" /> Доступно
                </span>
              )}
            </div>

            {/* 4 Stage Movement Buttons */}
            <div className="grid grid-cols-4 gap-1">
              {/* 1. Экспресс */}
              <button
                type="button"
                disabled={isZeroLiquidity || token.stage === 'STAGE_1_PRESCREEN'}
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteStage(token.id, 'STAGE_1_PRESCREEN');
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition flex items-center justify-center gap-0.5 ${
                  token.stage === 'STAGE_1_PRESCREEN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                    : isZeroLiquidity
                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-amber-900/50 text-slate-300 hover:text-amber-200 border border-slate-700'
                }`}
              >
                {isZeroLiquidity ? <Lock className="w-2.5 h-2.5" /> : null}
                <span>1. Экспресс</span>
              </button>

              {/* 2. Аудит */}
              <button
                type="button"
                disabled={isZeroLiquidity || token.stage === 'STAGE_2_DEEP_AUDIT'}
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteStage(token.id, 'STAGE_2_DEEP_AUDIT');
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition flex items-center justify-center gap-0.5 ${
                  token.stage === 'STAGE_2_DEEP_AUDIT'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 cursor-default'
                    : isZeroLiquidity
                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-blue-900/50 text-slate-300 hover:text-blue-200 border border-slate-700'
                }`}
              >
                {isZeroLiquidity ? <Lock className="w-2.5 h-2.5" /> : null}
                <span>2. Аудит</span>
              </button>

              {/* 3. Финал */}
              <button
                type="button"
                disabled={isZeroLiquidity || token.stage === 'STAGE_3_FINAL_VERIFIED'}
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteStage(token.id, 'STAGE_3_FINAL_VERIFIED');
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition flex items-center justify-center gap-0.5 ${
                  token.stage === 'STAGE_3_FINAL_VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : isZeroLiquidity
                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-emerald-900/50 text-slate-300 hover:text-emerald-200 border border-slate-700'
                }`}
              >
                {isZeroLiquidity ? <Lock className="w-2.5 h-2.5" /> : null}
                <span>3. Финал</span>
              </button>

              {/* 4. Отсев */}
              <button
                type="button"
                disabled={token.stage === 'REJECTED'}
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteStage(token.id, 'REJECTED');
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-bold text-center transition ${
                  token.stage === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-default'
                    : 'bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 border border-slate-700'
                }`}
              >
                <span>Отсев ⛔</span>
              </button>
            </div>
          </div>

          {/* Auxiliary Action Row (5-Layer Audit & Terminal) */}
          <div className="flex items-center justify-between pt-1 gap-1.5">
            {onOpenAuditForToken && token.contract && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAuditForToken(token.contract, token.chain, token.symbol);
                }}
                className="flex-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition flex items-center justify-center gap-1 border border-slate-700"
                title="Открыть детальный 5-слойный отчет ончейн-аудита"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>5-Слойный Ончейн</span>
              </button>
            )}

            {onSendToTerminal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendToTerminal(token.symbol);
                }}
                className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition flex items-center gap-1 border border-slate-700 font-bold"
                title="Открыть стакан и график MEXC"
              >
                <Send className="w-2.5 h-2.5 text-amber-400" />
                <span>Терминал</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
