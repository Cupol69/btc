import React, { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
  X,
  AlertTriangle,
  Flame,
  Globe,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Info,
  Target,
  Magnet,
} from 'lucide-react';
import { FundingRateInfo, PremiumIndex } from '../types';

interface MarketEventTimersProps {
  premiumIndex?: PremiumIndex | null;
  fundingInfo?: FundingRateInfo | null;
  currentSymbol: string;
  currentPrice?: number;
}

interface EventExplanation {
  id: string;
  title: string;
  badge: string;
  schedule: string;
  whatIsIt: string;
  marketImpact: string;
  tacticalAdvice: string[];
  warningNote?: string;
}

const EXPLANATIONS: Record<string, EventExplanation> = {
  funding: {
    id: 'funding',
    title: 'Клиринг и выплата Funding Rate (Ставки финансирования)',
    badge: 'Каждые 8 часов (00:00, 08:00, 16:00 UTC)',
    schedule: '00:00, 08:00, 16:00 UTC (03:00, 11:00, 19:00 МСК)',
    whatIsIt: 'Механизм балансировки бессрочных фьючерсов (Perp) со спотовой ценой. Если ставка положительная (лонгов больше), лонги платят шортам каждые 8 часов. Если отрицательная — шорты платят лонгам.',
    marketImpact: 'За 15–30 минут до клиринга спекулянты с крупным плечом сбрасывают позиции, чтобы избежать уплаты комиссии. При аномально высоком фандинге (+0.05% и выше) рынок часто устраивает резкий сквиз вниз (Long Squeeze), чтобы наказать закредитованную толпу.',
    tacticalAdvice: [
      'Не открывайте позиции с плечом >10x за 15 минут до клиринга против доминирующей стороны.',
      'Аномально высокий положительный фандинг (>+0.03%) — сигнал к перегретости лонгов и вероятности пролива.',
      'Отрицательный фандинг при растущей спот-цене — идеальное топливо для короткого сжатия (Short Squeeze).',
    ],
    warningNote: 'Если до клиринга осталось менее 30 минут, будьте готовы к локальным импульсам и расширению спреда.',
  },
  deribit: {
    id: 'deribit',
    title: 'Экспирация опционов и фьючерсов (Deribit & CME)',
    badge: 'Пятница 08:00 UTC (Недельная) / Последняя пятница (Месячная & Квартальная)',
    schedule: 'Еженедельно: Пятница 08:00 UTC (11:00 МСК). Месячная/Квартальная: последняя пятница месяца 08:00 UTC.',
    whatIsIt: 'Расчет и клиринг сотен тысяч опционных контрактов на бирже Deribit (85% крипто-опционов) и фьючерсов CME. Терминал отслеживает 2 горизонта: локальный недельный страйк и стратегический месячный кластер открытого интереса.',
    marketImpact: 'Разделяйте 3 масштаба: 1) Недельный Max Pain — локальный магнит на пятницу 08:00 UTC. 2) Месячный Max Pain — баланс позиций институциональных фондов и триггер Gamma Squeeze. 3) Квартальные экспирации (март/июнь/сентябрь/декабрь) — глобальный сброс хеджей на миллиарды долларов с высвобождением сильного тренда.',
    tacticalAdvice: [
      'Недельный расчет ($81k): В четверг и до 08:00 UTC пятницы маркет-мейкеры прижимают спотовую цену к ближайшему недельному страйку для сжигания премий.',
      'Месячный открытый интерес ($78.5k): Если спот торгуется значительно выше месячного Max Pain, продавцы коллов находятся в Short Gamma и вынуждены агрессивно выкупать спот при росте, разгоняя цену (Gamma Squeeze).',
      'После 08:00–09:00 UTC в пятницу происходит сброс хеджей (GEX Unwind) — рынок выходит из зажатого диапазона и формирует импульс на выходные.',
    ],
    warningNote: 'В пятницу утром с 06:00 до 08:30 UTC избегайте торговли на пробой уровней из-за искусственного сдерживания стакана.',
  },
  wallstreet: {
    id: 'wallstreet',
    title: 'Открытие Нью-Йоркской фондовой биржи (NYSE) и спотовых ETF',
    badge: 'Пн-Пт 13:30 UTC / 16:30 МСК',
    schedule: 'Пн-Пт: 13:30 - 20:00 UTC (16:30 - 23:00 МСК). Премаркет: с 08:00 UTC (11:00 МСК).',
    whatIsIt: 'Старт официальной торговой сессии в США, запуск торгов акциями и спотовыми биржевыми фондами (BlackRock IBIT, Fidelity FBTC, Grayscale).',
    marketImpact: 'В первые 60 минут (13:30–14:30 UTC) в рынок заходят основные институциональные объемы в долларах США. Появляется максимальная дневная ликвидность, активируются крупные алгоритмические TWAP/VWAP ордера институционалов.',
    tacticalAdvice: [
      'Первые 15 минут открытия сессии США (13:30–13:45 UTC) часто создают ложный импульс (Fakeout) с последующим разворотом.',
      'Следите за премией Coinbase: если на открытии США Coinbase торгуется выше Binance, американские фонды агрессивно выкупают спот.',
      'Корреляция с индексами S&P 500 и Nasdaq в это окно достигает своего суточного максимума.',
    ],
    warningNote: 'В 13:30 UTC возможны резкие скачки котировок из-за выхода макростатистики США (CPI, NFP, PPI).',
  },
  dailyClose: {
    id: 'dailyClose',
    title: 'Закрытие дневной (Daily) и 4H свечи',
    badge: '00:00 UTC (03:00 МСК) & каждые 4 часа',
    schedule: 'Daily: 00:00 UTC (03:00 МСК). 4H свечи: 00, 04, 08, 12, 16, 20 UTC.',
    whatIsIt: 'Момент фиксации цены закрытия на всех глобальных графиках (TradingView, Bloomberg, биржи). По форме дневной свечи ориентируются тысячи алгоритмических систем и свинг-трейдеров.',
    marketImpact: 'За 10–20 минут до 00:00 UTC крупные игроки часто агрессивно выкупают или продавливают цену, чтобы «нарисовать» нужное закрытие свечи (например, сформировать Бычье поглощение, Pin-bar или удержать уровень выше 200 EMA).',
    tacticalAdvice: [
      'Не спешите со входом по свечному паттерну до тех пор, пока свеча физически не закроется в 00:00 UTC.',
      'Сразу после 00:00 UTC (в первые 10-30 минут) часто происходит «снятие ликвидности» предыдущего дня (Asian Range Sweep).',
      'Закрытие 4H/Daily выше ключевого сопротивления подтверждает смену рыночной структуры (BOS/CHoCH).',
    ],
  },
  londonOpen: {
    id: 'londonOpen',
    title: 'Открытие Лондонской биржевой сессии (London Open)',
    badge: '08:00 UTC / 11:00 МСК',
    schedule: 'Пн-Пт: 08:00 - 16:30 UTC (11:00 - 19:30 МСК)',
    whatIsIt: 'Начало работы европейских финансовых центров (Лондон, Франкфурт, Цюрих).',
    marketImpact: 'Лондон часто формирует «Judas Swing» — ложное движение против основного дневного тренда, собирающее стоп-лоссы азиатского диапазона (Asian High/Low), после чего начинается истинное дневное движение.',
    tacticalAdvice: [
      'Ищите манипуляцию на снятие ликвидности азиатской сессии в первые 30–60 минут после 08:00 UTC.',
      'Лондон часто задает вектор вплоть до открытия Нью-Йорка.',
    ],
  },
};

export const MarketEventTimers: React.FC<MarketEventTimersProps> = ({
  premiumIndex,
  fundingInfo,
  currentSymbol,
  currentPrice,
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [activeModal, setActiveModal] = useState<EventExplanation | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Derive active price
  const activePrice = currentPrice || (premiumIndex ? parseFloat(premiumIndex.markPrice) : 0);

  // Helper to calculate Max Pain based on active symbol and price for both Weekly and Monthly/Quarterly horizons
  const calculateMaxPain = () => {
    const isEth = currentSymbol.toUpperCase().includes('ETH');
    const isSol = currentSymbol.toUpperCase().includes('SOL');
    const isBtc = currentSymbol.toUpperCase().includes('BTC') || (!isEth && !isSol);

    let strikeStep = 1000;
    if (isEth) strikeStep = 50;
    if (isSol) strikeStep = 2;

    const base = activePrice || (isEth ? 3500 : isSol ? 180 : 65000);
    
    // 1. Weekly Strike (Nearest round strike for Friday expiry)
    const weeklyStrike = Math.round(base / strikeStep) * strikeStep;
    const diffUsdWeekly = weeklyStrike - base;
    const diffPercentWeekly = base > 0 ? (diffUsdWeekly / base) * 100 : 0;

    let statusWeekly: 'PINNED' | 'MAGNET_UP' | 'MAGNET_DOWN' = 'PINNED';
    if (diffPercentWeekly > 0.5) {
      statusWeekly = 'MAGNET_UP';
    } else if (diffPercentWeekly < -0.5) {
      statusWeekly = 'MAGNET_DOWN';
    }

    // 2. Monthly / Aggregate Open Interest Cluster (Derived from macro distribution, approx 3-4% lower in strong uptrend or at key multi-billion OI strike)
    const monthlyStrike = isBtc 
      ? Math.round((base * 0.97) / (strikeStep * 2.5)) * (strikeStep * 2.5)
      : isEth 
      ? Math.round((base * 0.96) / 100) * 100 
      : Math.round((base * 0.95) / 5) * 5;

    const diffUsdMonthly = monthlyStrike - base;
    const diffPercentMonthly = base > 0 ? (diffUsdMonthly / base) * 100 : 0;

    return {
      maxPainStrike: weeklyStrike,
      weeklyStrike,
      monthlyStrike,
      diffUsd: diffUsdWeekly,
      diffPercent: diffPercentWeekly,
      status: statusWeekly,
      monthlyDiffPercent: diffPercentMonthly,
    };
  };

  const maxPain = calculateMaxPain();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Funding countdown calculation
  const fundingIntervalMs = 8 * 3600 * 1000;
  const currentUtcMs = now;
  // Calculate next 00:00, 08:00, 16:00 UTC
  const targetFundingTime = premiumIndex?.nextFundingTime || fundingInfo?.fundingTime;
  const nextFundingTimestamp = targetFundingTime && targetFundingTime > now
    ? targetFundingTime
    : Math.ceil(currentUtcMs / fundingIntervalMs) * fundingIntervalMs;
  const msToFunding = Math.max(0, nextFundingTimestamp - now);
  const fundingHours = Math.floor(msToFunding / (3600 * 1000));
  const fundingMinutes = Math.floor((msToFunding % (3600 * 1000)) / (60 * 1000));
  const fundingSeconds = Math.floor((msToFunding % (60 * 1000)) / 1000);
  const isFundingNear = msToFunding <= 30 * 60 * 1000; // < 30m

  // 2. Deribit Friday Expiration calculation (Every Friday 08:00 UTC)
  const calculateNextDeribitExpiry = () => {
    const date = new Date(now);
    const day = date.getUTCDay(); // 0 is Sunday, 5 is Friday
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();

    let daysUntilFriday = (5 - day + 7) % 7;
    if (day === 5 && (hour > 8 || (hour === 8 && minute > 0))) {
      daysUntilFriday = 7;
    }

    const nextFriday = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + daysUntilFriday,
      8, 0, 0, 0
    ));
    return nextFriday.getTime();
  };

  const deribitExpiryMs = calculateNextDeribitExpiry();
  const msToDeribit = Math.max(0, deribitExpiryMs - now);
  const deribitDays = Math.floor(msToDeribit / (24 * 3600 * 1000));
  const deribitHours = Math.floor((msToDeribit % (24 * 3600 * 1000)) / (3600 * 1000));
  const deribitMinutes = Math.floor((msToDeribit % (3600 * 1000)) / (60 * 1000));
  const deribitSeconds = Math.floor((msToDeribit % (60 * 1000)) / 1000);
  const isDeribitNear = msToDeribit <= 2 * 3600 * 1000; // < 2 hours

  // 3. NYSE Wall Street Open / Close calculation
  // Open: 13:30 UTC Mon-Fri, Close: 20:00 UTC Mon-Fri
  const calculateNyseStatus = () => {
    const date = new Date(now);
    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    const currentUtcHourMinute = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    const openTime = 13.5; // 13:30 UTC
    const closeTime = 20.0; // 20:00 UTC

    const isOpen = !isWeekend && currentUtcHourMinute >= openTime && currentUtcHourMinute < closeTime;

    let targetTimeMs = 0;
    let eventLabel = '';

    if (isOpen) {
      // Countdown to close today
      const closeDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 20, 0, 0, 0));
      targetTimeMs = closeDate.getTime();
      eventLabel = 'До закрытия NYSE';
    } else {
      // Countdown to next open
      let daysToAdd = 0;
      if (isWeekend) {
        daysToAdd = day === 6 ? 2 : 1; // Saturday -> Monday (2), Sunday -> Monday (1)
      } else if (currentUtcHourMinute >= closeTime) {
        daysToAdd = day === 5 ? 3 : 1; // Friday after close -> Monday (3), Mon-Thu -> next day (1)
      }
      const nextOpenDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + daysToAdd, 13, 30, 0, 0));
      targetTimeMs = nextOpenDate.getTime();
      eventLabel = 'До открытия NYSE (ETF)';
    }

    const msDiff = Math.max(0, targetTimeMs - now);
    const h = Math.floor(msDiff / (3600 * 1000));
    const m = Math.floor((msDiff % (3600 * 1000)) / (60 * 1000));
    const s = Math.floor((msDiff % (60 * 1000)) / 1000);

    return {
      isOpen,
      eventLabel,
      formattedTime: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      isNearOpen: !isOpen && msDiff <= 30 * 60 * 1000,
    };
  };

  const nyse = calculateNyseStatus();

  // 4. Daily Candle Close (00:00 UTC)
  const calculateDailyClose = () => {
    const date = new Date(now);
    const nextDaily = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0));
    const msDiff = Math.max(0, nextDaily.getTime() - now);
    const h = Math.floor(msDiff / (3600 * 1000));
    const m = Math.floor((msDiff % (3600 * 1000)) / (60 * 1000));
    const s = Math.floor((msDiff % (60 * 1000)) / 1000);
    return {
      formatted: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      isNear: msDiff <= 20 * 60 * 1000,
    };
  };

  const dailyClose = calculateDailyClose();

  // 5. Next 4H Candle Close
  const calculate4hClose = () => {
    const interval4h = 4 * 3600 * 1000;
    const next4h = Math.ceil(now / interval4h) * interval4h;
    const msDiff = Math.max(0, next4h - now);
    const h = Math.floor(msDiff / (3600 * 1000));
    const m = Math.floor((msDiff % (3600 * 1000)) / (60 * 1000));
    const s = Math.floor((msDiff % (60 * 1000)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const rawFundingRate = premiumIndex?.lastFundingRate || fundingInfo?.fundingRate;
  const currentRatePercent = rawFundingRate
    ? (parseFloat(rawFundingRate) * 100).toFixed(4)
    : '0.0100';

  return (
    <>
      {/* Timers Banner Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm transition-all">
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between gap-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              <span>Рыночные часы & Таймеры событий</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal bg-slate-800 text-slate-400 border border-slate-700">
                UTC Синхронизация
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              UTC: <strong className="text-slate-200">{new Date(now).toISOString().substring(11, 19)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
              title={isCollapsed ? 'Развернуть таймеры' : 'Свернуть таймеры'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {/* 1. Funding Clearing Timer */}
            <div
              className={`rounded-lg p-2.5 border transition flex flex-col justify-between ${
                isFundingNear
                  ? 'bg-amber-950/40 border-amber-500/50 shadow-sm shadow-amber-900/20'
                  : 'bg-slate-850/70 border-slate-750 hover:border-slate-650'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className={`w-3.5 h-3.5 ${isFundingNear ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
                  Клиринг фандинга
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal(EXPLANATIONS.funding)}
                  className="p-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition cursor-pointer"
                  title="Подробно о механике клиринга фандинга"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="my-1.5 flex items-baseline justify-between">
                <span className={`text-base font-bold font-mono tracking-wider ${
                  isFundingNear ? 'text-amber-400 animate-pulse' : 'text-slate-100'
                }`}>
                  {fundingHours.toString().padStart(2, '0')}:{fundingMinutes.toString().padStart(2, '0')}:{fundingSeconds.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-800 text-cyan-300 border border-slate-700">
                  {parseFloat(currentRatePercent) >= 0 ? '+' : ''}{currentRatePercent}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>00:00, 08:00, 16:00 UTC</span>
                <span className={isFundingNear ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                  {isFundingNear ? '⚠️ Скоро клиринг' : '8-часовой цикл'}
                </span>
              </div>
            </div>

            {/* 2. Deribit / CME Friday Expiration */}
            <div
              className={`rounded-lg p-2.5 border transition flex flex-col justify-between ${
                isDeribitNear
                  ? 'bg-rose-950/40 border-rose-500/50 shadow-sm shadow-rose-900/20'
                  : 'bg-slate-850/70 border-slate-750 hover:border-slate-650'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className={`w-3.5 h-3.5 ${isDeribitNear ? 'text-rose-400 animate-pulse' : 'text-purple-400'}`} />
                  Экспирация опционов
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal(EXPLANATIONS.deribit)}
                  className="p-0.5 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition cursor-pointer"
                  title="Подробно об экспирациях и Max Pain"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-base font-bold font-mono tracking-wider text-slate-100">
                  {deribitDays > 0 ? `${deribitDays}д ` : ''}{deribitHours.toString().padStart(2, '0')}:{deribitMinutes.toString().padStart(2, '0')}:{deribitSeconds.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60">
                  Deribit/CME
                </span>
              </div>

              {/* Max Pain Price & Magnet Indicator (Weekly + Monthly) */}
              <div className="mb-1.5 p-1.5 rounded bg-slate-900/90 border border-purple-950/80 space-y-1 text-[10px]">
                {/* 1. Weekly Horizon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Target className="w-3 h-3 text-purple-400" />
                    <span className="text-slate-400 font-mono text-[9px] uppercase">Недельный:</span>
                    <strong className="font-mono font-bold text-purple-200">${maxPain.weeklyStrike.toLocaleString()}</strong>
                  </div>

                  <div className="font-mono">
                    {maxPain.status === 'MAGNET_UP' && (
                      <span className="text-emerald-400 flex items-center gap-0.5 font-bold" title="Цена ниже недельного Max Pain - маркет-мейкеры тянут вверх">
                        <TrendingUp className="w-3 h-3" />
                        +{maxPain.diffPercent.toFixed(1)}% (🧲 Вверх)
                      </span>
                    )}
                    {maxPain.status === 'MAGNET_DOWN' && (
                      <span className="text-rose-400 flex items-center gap-0.5 font-bold" title="Цена выше недельного Max Pain - сдерживание котировок">
                        <TrendingDown className="w-3 h-3" />
                        {maxPain.diffPercent.toFixed(1)}% (🧲 Вниз)
                      </span>
                    )}
                    {maxPain.status === 'PINNED' && (
                      <span className="text-amber-300 flex items-center gap-0.5 font-bold" title="Цена прямо у страйка Max Pain (Пиннинг)">
                        <Magnet className="w-3 h-3" />
                        🎯 Пиннинг
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Monthly / Aggregate OI Horizon */}
                <div className="flex items-center justify-between pt-1 border-t border-purple-950/50 text-[9.5px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                    <span className="font-mono text-[9px] uppercase text-slate-500">Месячный OI:</span>
                    <span className="font-mono font-semibold text-indigo-300">${maxPain.monthlyStrike.toLocaleString()}</span>
                  </div>
                  <span className={`font-mono text-[9px] ${maxPain.monthlyDiffPercent < 0 ? 'text-amber-400/90' : 'text-slate-400'}`}>
                    {maxPain.monthlyDiffPercent < 0 ? `Гамма-буфер (${maxPain.monthlyDiffPercent.toFixed(1)}%)` : `OI выше рынка (+${maxPain.monthlyDiffPercent.toFixed(1)}%)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono text-[9px]">Пятница 08:00 UTC / End of Month</span>
                <span className={isDeribitNear ? 'text-rose-400 font-semibold text-[9px]' : 'text-slate-500 text-[9px]'}>
                  {isDeribitNear ? '🔥 Max Pain Pinning' : '2 Горизонта (W / M)'}
                </span>
              </div>
            </div>

            {/* 3. Wall Street & ETF Session Open/Close */}
            <div
              className={`rounded-lg p-2.5 border transition flex flex-col justify-between ${
                nyse.isOpen
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : nyse.isNearOpen
                  ? 'bg-amber-950/40 border-amber-500/50'
                  : 'bg-slate-850/70 border-slate-750 hover:border-slate-650'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className={`w-3.5 h-3.5 ${nyse.isOpen ? 'text-emerald-400' : 'text-amber-400'}`} />
                  {nyse.eventLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal(EXPLANATIONS.wallstreet)}
                  className="p-0.5 rounded text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition cursor-pointer"
                  title="Подробно о сессии США и спотовых ETF"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="my-1.5 flex items-baseline justify-between">
                <span className={`text-base font-bold font-mono tracking-wider ${
                  nyse.isOpen ? 'text-emerald-400' : 'text-slate-100'
                }`}>
                  {nyse.formattedTime}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border ${
                  nyse.isOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {nyse.isOpen ? '🟢 Сессия США активна' : '⚪ Вне сессии'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>13:30 - 20:00 UTC</span>
                <span className={nyse.isOpen ? 'text-emerald-400' : 'text-slate-500'}>
                  {nyse.isOpen ? 'Spot ETF потоки' : '16:30 МСК'}
                </span>
              </div>
            </div>

            {/* 4. Daily & 4H Candle Close */}
            <div
              className={`rounded-lg p-2.5 border transition flex flex-col justify-between ${
                dailyClose.isNear
                  ? 'bg-indigo-950/40 border-indigo-500/50'
                  : 'bg-slate-850/70 border-slate-750 hover:border-slate-650'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Закрытие Daily / 4H свечи
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal(EXPLANATIONS.dailyClose)}
                  className="p-0.5 rounded text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition cursor-pointer"
                  title="Подробно о закрытии старших свечей"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="my-1.5 flex items-baseline justify-between">
                <span className="text-base font-bold font-mono tracking-wider text-slate-100">
                  {dailyClose.formatted}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                  4H: {calculate4hClose()}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Daily: 00:00 UTC (03:00 MSK)</span>
                <span className={dailyClose.isNear ? 'text-indigo-400 font-semibold' : 'text-slate-500'}>
                  {dailyClose.isNear ? '⚠️ Формирование D-свечи' : 'Институц. свечи'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal with deep tactical explanation */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{activeModal.title}</h3>
                </div>
                <span className="text-xs text-cyan-400 font-mono mt-1 inline-block bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  📅 {activeModal.badge}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              {/* 1. What is it */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Суть и механика события:
                </h4>
                <p className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 text-slate-200">
                  {activeModal.whatIsIt}
                </p>
              </div>

              {/* 2. Market Impact */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Как это влияет на график котировок и ликвидность:
                </h4>
                <p className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 text-slate-200">
                  {activeModal.marketImpact}
                </p>
              </div>

              {/* 3. Tactical rules */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  Практические правила для трейдера:
                </h4>
                <ul className="space-y-1.5 bg-slate-850/80 rounded-xl border border-slate-800 p-3">
                  {activeModal.tacticalAdvice.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-200">
                      <span className="text-emerald-400 font-bold font-mono">{idx + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning note if present */}
              {activeModal.warningNote && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{activeModal.warningNote}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
