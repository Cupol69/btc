import React, { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Flame,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Crosshair,
  Compass,
} from 'lucide-react';

export type TokenStageLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TokenStageMeta {
  stage: TokenStageLevel;
  code: string;
  nameRu: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const STAGE_DEFINITIONS: Record<TokenStageLevel, TokenStageMeta> = {
  0: {
    stage: 0,
    code: 'STAGE_0_FRESH',
    nameRu: '0 — Свежий запуск / Новый пул (Fresh Pair)',
    subtitle: 'ВЫЖИВАНИЕ: 100% фокус на детект рагпула и проверку контракта',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-500/30',
  },
  1: {
    stage: 1,
    code: 'STAGE_1_EARLY_MOMENTUM',
    nameRu: '1 — Ранний импульс DEX (Early Momentum)',
    subtitle: 'ТЯГА: Проверка органики против накрутки ботами (Wash Trading)',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/30',
  },
  2: {
    stage: 2,
    code: 'STAGE_2_DEX_MATURE',
    nameRu: '2 — Зрелый DEX / Потолок пула (DEX Mature)',
    subtitle: 'ПРОВЕРКА ЕМКОСТИ: Готовность к переходу на CEX или скрытая разгрузка',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/40',
    borderColor: 'border-cyan-500/30',
  },
  3: {
    stage: 3,
    code: 'STAGE_3_TIER2_CEX',
    nameRu: '3 — Листинг Tier-2 CEX (MEXC / Gate / LBank)',
    subtitle: 'ПОДТВЕРЖДЕНИЕ: Приток свежего биржевого капитала vs арбитражный слив',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-950/40',
    borderColor: 'border-indigo-500/30',
  },
  4: {
    stage: 4,
    code: 'STAGE_4_BINANCE_ALPHA',
    nameRu: '4 — Инкубация Binance Alpha / Web3 Wallet',
    subtitle: 'ПЕРЕХОД: Стресс-тест на удержание базы перед спотом Binance',
    color: 'text-amber-300',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-400/40',
  },
  5: {
    stage: 5,
    code: 'STAGE_5_BINANCE_SPOT',
    nameRu: '5 — Binance Spot & Futures',
    subtitle: 'ОСНОВНОЙ РЫНОК: Спотовый ордерфлоу, CVD, фандинг и ликвидации',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950/40',
    borderColor: 'border-yellow-500/40',
  },
  6: {
    stage: 6,
    code: 'STAGE_6_EXHAUSTION',
    nameRu: '6 — Поздняя дистрибуция / Истощение (Exhaustion)',
    subtitle: 'ВЫХОД КИТОВ: Медленное вымывание ликвидности и фиксация фондов',
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/40',
    borderColor: 'border-rose-500/40',
  },
};

export type MicroEntryGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface TokenStageDifferenceCardProps {
  tokenAddress?: string;
  symbol?: string;
  name?: string;
  chain?: string;
  liquidityUsd?: number;
  volume24h?: number;
  priceUsd?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  buys1h?: number;
  sells1h?: number;
  holdersCount?: number;
  ageHours?: number;
  safetyScore?: number;
  isHoneypot?: boolean;
  hasBlacklist?: boolean;
  cannotSellAll?: boolean;
  transferPausable?: boolean;
  buyTax?: number;
  sellTax?: number;
  ownerPercent?: number;
  isBinanceAlpha?: boolean;
  binanceSpotPair?: string;
  primaryCex?: string;
  topHolders?: Array<{ address: string; percent: number }>;
  bitqueryClusters?: Array<{
    role?: string;
    shareOfVolumePct?: number;
    details?: string;
  }>;
  customEntryUsd?: number;
}

export const TokenStageDifferenceCard: React.FC<TokenStageDifferenceCardProps> = ({
  tokenAddress = '',
  symbol = 'TOKEN',
  name = 'Token',
  chain = 'BSC',
  liquidityUsd = 25000,
  volume24h = 100000,
  priceUsd = 0.01,
  priceChange1h = 0,
  priceChange24h = 0,
  buys1h = 20,
  sells1h = 10,
  holdersCount = 1200,
  ageHours = 24,
  safetyScore = 80,
  isHoneypot = false,
  hasBlacklist = false,
  cannotSellAll = false,
  transferPausable = false,
  buyTax = 0,
  sellTax = 0,
  ownerPercent = 0,
  isBinanceAlpha = false,
  binanceSpotPair,
  primaryCex,
  topHolders = [],
  bitqueryClusters = [],
  customEntryUsd = 11,
}) => {
  // 1. Determine Current Stage (0-6)
  const currentStageMeta = useMemo<TokenStageMeta>(() => {
    const isSpot = Boolean(binanceSpotPair);
    const isAlpha = Boolean(isBinanceAlpha);
    const hasSmallCex = Boolean(primaryCex);

    if (isSpot) {
      if (priceChange24h < -25 && volume24h < 2000000) return STAGE_DEFINITIONS[6];
      return STAGE_DEFINITIONS[5];
    }
    if (isAlpha) return STAGE_DEFINITIONS[4];
    if (hasSmallCex) return STAGE_DEFINITIONS[3];

    if (ageHours < 4 && liquidityUsd < 40000) return STAGE_DEFINITIONS[0];
    if (liquidityUsd > 150000 && volume24h > 600000) return STAGE_DEFINITIONS[2];
    return STAGE_DEFINITIONS[1];
  }, [binanceSpotPair, isBinanceAlpha, primaryCex, ageHours, liquidityUsd, volume24h, priceChange24h]);

  // 2. Core 6 Structural Stage Analyses
  const stageBreakdown = useMemo(() => {
    const cleanFlowPositive = buys1h > sells1h * 0.9;
    const topWhaleShare = bitqueryClusters?.[0]?.shareOfVolumePct || 0;

    // 1. DEX Health
    let dexHealth = 'Clean flow положительный, база холдеров расширяется, пул удерживает стабильность.';
    if (isHoneypot) {
      dexHealth = 'КРИТИЧЕСКИЙ СБОЙ: Симуляция продажи заблокирована (Honeypot / 100% Tax).';
    } else if (sells1h > buys1h * 1.5) {
      dexHealth = 'Отрицательный чистый поток: преобладают продажи ранних держателей над покупками.';
    } else if (liquidityUsd < 15000) {
      dexHealth = 'Тонкий пул (< $15k): экстремальное проскальзывание даже на ордерах от $500.';
    }

    // 2. CEX Transition
    let cexTransition = 'CEX не подтвержден. Торговый объем ниже необходимого порога листинга ($500k/сутки).';
    if (primaryCex) {
      cexTransition = `Листинг активен на ${primaryCex}. Торговая пара обеспечивает арбитраж с DEX.`;
    } else if (volume24h > 800000 && liquidityUsd > 120000 && holdersCount > 2500) {
      cexTransition = 'Высокий шанс перехода: метрики удовлетворяют базовым требованиям MEXC / Gate / Bitget.';
    }

    // 3. Binance Status
    let binanceStatus = 'DEX-only актив. На споте и деривативах Binance не представлен.';
    if (binanceSpotPair) {
      binanceStatus = `Binance Spot активен (${binanceSpotPair}). Спотовый стакан является главным источником ценообразования.`;
    } else if (isBinanceAlpha) {
      binanceStatus = 'Инкубатор Binance Alpha / Web3 Wallet. Спотовый листинг не гарантирован (требуется стресс-тест).';
    }

    // 4. Distribution Risk
    let distRisk = 'Умеренный риск: распределение токенов органическое, критических скоплений не выявлено.';
    if (topWhaleShare > 40) {
      distRisk = `КРИТИЧЕСКИЙ КЛАСТЕР: Первичный дистрибьютор/кит контролирует ${topWhaleShare.toFixed(1)}% объема транзакций.`;
    } else if (ownerPercent > 15) {
      distRisk = `Повышенный риск: прямой баланс создателя составляет ${ownerPercent}% эмиссии.`;
    }

    // 5. Upside Path
    let upsidePath = 'Для продолжения роста требуется: суточный объем > $500k, рост холдеров > 3,000 и выход в тренды.';
    if (currentStageMeta.stage === 0) {
      upsidePath = 'Первая цель: преодолеть $50k ликвидности и набрать первые 500 органических покупателей без сброса деплоера.';
    } else if (currentStageMeta.stage >= 3) {
      upsidePath = 'Цель экспансии: удержание базы на CEX, подтверждение притока депозитов и отсутствие сброса на DEX-пул.';
    }

    // 6. Failure Mode
    let failureMode = 'Если приток покупателей прекратится, а ранние кошельки сбросят >15% за 6ч — токен застрянет на DEX и затухнет.';
    if (isHoneypot) {
      failureMode = 'Мгновенная потеря 100% средств: вывод заблокирован на уровне смарт-контракта.';
    } else if (liquidityUsd < 20000 && topWhaleShare > 50) {
      failureMode = 'Опустошение пула (Drain): продажа даже одного кита обвалит цену на >80%.';
    }

    return {
      dexHealth,
      cexTransition,
      binanceStatus,
      distRisk,
      upsidePath,
      failureMode,
    };
  }, [isHoneypot, buys1h, sells1h, liquidityUsd, primaryCex, volume24h, holdersCount, binanceSpotPair, isBinanceAlpha, bitqueryClusters, ownerPercent, currentStageMeta]);

  // 3. Micro Entry ($11) Scoring & Classification
  const microEntryAssessment = useMemo(() => {
    const isFatal =
      isHoneypot ||
      cannotSellAll ||
      transferPausable ||
      hasBlacklist ||
      buyTax > 15 ||
      sellTax > 15;

    if (isFatal) {
      return {
        score: 5,
        grade: 'E' as MicroEntryGrade,
        gradeTitle: 'E — Scam / Rug Risk (КРИТИЧЕСКИЙ РИСК)',
        gradeColor: 'text-rose-400',
        gradeBg: 'bg-rose-950/80 border-rose-500',
        verdictText: `ВХОД ЗАПРЕЩЕН. Контракт содержит блокирующие уязвимости (Honeypot/Blacklist/High Tax). Потеря $${customEntryUsd} гарантирована на 100%.`,
        canEnter: false,
      };
    }

    // Calculate components
    // 25% Contract Safety
    const safetyComp = Math.min(25, (safetyScore / 100) * 25);

    // 20% Clean Flow
    const buys = buys1h || 1;
    const sells = sells1h || 1;
    const flowRatio = Math.min(2, buys / sells);
    const flowComp = Math.min(20, (flowRatio / 2) * 20);

    // 15% Holder Growth
    const holdersComp = holdersCount > 1000 ? 15 : (holdersCount / 1000) * 15;

    // 15% Cluster Risk Inverse
    const whaleShare = bitqueryClusters?.[0]?.shareOfVolumePct || 20;
    const clusterComp = Math.max(0, 15 - (whaleShare / 100) * 15);

    // 10% Liquidity Health
    const liqComp = liquidityUsd > 50000 ? 10 : (liquidityUsd / 50000) * 10;

    // 10% Narrative / Momentum
    const momComp = priceChange1h > 0 ? 10 : 5;

    // 5% CEX Path
    const cexComp = primaryCex || isBinanceAlpha ? 5 : 2.5;

    const totalScore = Math.round(
      safetyComp + flowComp + holdersComp + clusterComp + liqComp + momComp + cexComp
    );

    let grade: MicroEntryGrade = 'B';
    let gradeTitle = 'B — Watch Only (Наблюдение)';
    let gradeColor = 'text-amber-300';
    let gradeBg = 'bg-amber-950/60 border-amber-500/40';
    let verdictText = `Наблюдение. Метрики стабильны, но перед входом на $${customEntryUsd} рекомендуется дождаться подтверждения чистого притока.`;
    let canEnter = false;

    if (totalScore >= 80 && liquidityUsd >= 20000 && whaleShare < 45) {
      grade = 'A';
      gradeTitle = 'A — Worth Micro-Entry (Зеленый свет)';
      gradeColor = 'text-emerald-400';
      gradeBg = 'bg-emerald-950/80 border-emerald-500';
      verdictText = `Микро-лотерея на $${customEntryUsd} допустима: симуляция продажи успешна, кластер деплоера под контролем, риск оправдан.`;
      canEnter = true;
    } else if (priceChange24h > 400 && buys < sells) {
      grade = 'C';
      gradeTitle = 'C — Too Late (Поезд ушел)';
      gradeColor = 'text-orange-400';
      gradeBg = 'bg-orange-950/70 border-orange-500/40';
      verdictText = `Слишком поздно для входа: токен показал +${priceChange24h.toFixed(0)}%, идет фиксация ранних китов в розничный объем.`;
    } else if (totalScore < 50 || whaleShare > 60) {
      grade = 'D';
      gradeTitle = 'D — Avoid (Избегать)';
      gradeColor = 'text-rose-300';
      gradeBg = 'bg-rose-950/60 border-rose-500/30';
      verdictText = `Не рекомендуется: высокая концентрация монет у создателя или слабая органика. Высокий шанс потерять $${customEntryUsd}.`;
    }

    return {
      score: totalScore,
      grade,
      gradeTitle,
      gradeColor,
      gradeBg,
      verdictText,
      canEnter,
    };
  }, [isHoneypot, cannotSellAll, transferPausable, hasBlacklist, buyTax, sellTax, safetyScore, buys1h, sells1h, holdersCount, bitqueryClusters, liquidityUsd, priceChange1h, primaryCex, isBinanceAlpha, customEntryUsd, priceChange24h]);

  return (
    <div className="rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 space-y-5 font-mono shadow-2xl">
      {/* Header with Stage Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              STAGE DIFFERENCE & $11 MICRO-ENTRY RADAR
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Анализ жизненной стадии токена (0–6), проверка барьеров перехода и скоринг микро-позиции
          </p>
        </div>

        {/* Current Stage Indicator */}
        <div
          className={`px-3.5 py-2 rounded-xl border flex items-center gap-2.5 shrink-0 ${currentStageMeta.bgColor} ${currentStageMeta.borderColor}`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">ТЕКУЩАЯ СТАДИЯ</div>
            <div className={`text-xs font-black ${currentStageMeta.color}`}>
              {currentStageMeta.nameRu}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Subtitle Note */}
      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-sans flex items-center gap-2">
        <Layers className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-white font-mono">{currentStageMeta.code}:</strong>{' '}
          {currentStageMeta.subtitle}
        </span>
      </div>

      {/* 6 Structural Analytical Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
        {/* 1. DEX Health */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>DEX HEALTH (ЗДОРОВЬЕ ПУЛА)</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {stageBreakdown.dexHealth}
          </p>
        </div>

        {/* 2. CEX Transition */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
            <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>CEX TRANSITION (ПЕРЕХОД НА CEX)</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {stageBreakdown.cexTransition}
          </p>
        </div>

        {/* 3. Binance Status */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
            <span className="w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>BINANCE STATUS (СТАТУС BINANCE)</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {stageBreakdown.binanceStatus}
          </p>
        </div>

        {/* 4. Distribution Risk */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
            <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px]">
              4
            </span>
            <span>DISTRIBUTION RISK (РИСК СБРОСА)</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {stageBreakdown.distRisk}
          </p>
        </div>

        {/* 5. Upside Path */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>5. UPSIDE PATH (УСЛОВИЯ РОСТА)</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {stageBreakdown.upsidePath}
          </p>
        </div>

        {/* 6. Failure Mode */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-mono font-bold text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>6. FAILURE MODE (УСЛОВИЕ ПРОВАЛА)</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {stageBreakdown.failureMode}
          </p>
        </div>
      </div>

      {/* $11 Micro-Entry Classification Banner */}
      <div className={`p-4 rounded-xl border space-y-3 font-mono ${microEntryAssessment.gradeBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                СКОРИНГ ДЛЯ ПОЗИЦИИ ${customEntryUsd} (MICRO-ENTRY)
              </div>
              <div className={`text-base font-black ${microEntryAssessment.gradeColor}`}>
                {microEntryAssessment.gradeTitle}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">Итоговый скор:</span>
            <span className="text-xl font-black text-white">
              {microEntryAssessment.score}
              <span className="text-xs text-slate-400">/100</span>
            </span>
          </div>
        </div>

        {/* Direct Verdict */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs font-sans text-slate-200 leading-relaxed flex items-start gap-2.5">
          {microEntryAssessment.canEnter ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="text-white font-mono">VERDICT FOR ${customEntryUsd}: </strong>
            {microEntryAssessment.verdictText}
          </div>
        </div>

        {/* Weights Breakdown Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] text-slate-400 font-sans border-t border-white/10">
          <div>• Безопасность (25%)</div>
          <div>• Чистый приток (20%)</div>
          <div>• Рост холдеров (15%)</div>
          <div>• Кластер инверс (15%)</div>
          <div>• Пул ликвидности (10%)</div>
          <div>• Нарратив/Импульс (10%)</div>
          <div>• CEX переход (5%)</div>
          <div className="text-rose-400 font-mono font-bold">• Honeypot ➔ Grade E</div>
        </div>
      </div>
    </div>
  );
};
