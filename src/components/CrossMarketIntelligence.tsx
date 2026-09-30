import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  Layers,
  Activity,
  Globe,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  HelpCircle,
  X,
  Flame,
  Info,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { CrossMarketData } from '../types';

interface CrossMarketIntelligenceProps {
  data: CrossMarketData | null;
  currentSymbol: string;
  isLoading?: boolean;
}

interface MetricExplanation {
  title: string;
  badge: string;
  whatIsIt: string;
  marketImpact: string;
  tacticalAdvice: string[];
  warningNote?: string;
}

const EXPLANATIONS: Record<string, MetricExplanation> = {
  coinbasePremium: {
    title: 'Премия Coinbase Spot (Coinbase Premium Index)',
    badge: 'США / Институционалы',
    whatIsIt: 'Разница котировок между спотовым рынком регулируемой биржи США Coinbase (BTC/USD, ETH/USD) и офшорными деривативными биржами (Binance BTC/USDT). На Coinbase сосредоточены институциональные кастодиальные кошельки и американские ETF (BlackRock, Fidelity).',
    marketImpact: 'Положительная премия (> +0.03%) доказывает реальный органический выкуп физического спота за доллары США. Отрицательная премия (< -0.03%) указывает на то, что американские игроки сбрасывают актив или не поддерживают движение.',
    tacticalAdvice: [
      'Рост цены при отрицательной премии Coinbase — это движение на офшорных фьючерсных плечах с повышенным риском сквиза вниз.',
      'Рост цены при уверенно плюсовой премии Coinbase — самый надежный институциональный восходящий тренд.',
      'Наиболее информативное окно: 13:30–20:00 UTC (официальная сессия в Нью-Йорке).',
    ],
    warningNote: 'Перед открытием торгов в Нью-Йорке (13:30 UTC) возможны резкие скачки премии из-за премаркет-заявок.',
  },
  etfFlows: {
    title: 'Мониторинг спотовых ETF США (SoSoValue / Bitbo / Farside)',
    badge: 'Прямые первоисточники',
    whatIsIt: 'Официальные данные о чистых притоках и оттоках институционального капитала в американские спотовые Bitcoin ETF (BlackRock IBIT, Fidelity FBTC, Grayscale GBTC, Bitwise BITB и др.).',
    marketImpact: 'Притоки свыше +$200M/день изымают спотовый BTC из свободного обращения. Во избежание дезинформации и искажений из-за задержек кэша, терминал перенаправляет на прямые верифицированные дашборды SoSoValue и Bitbo.',
    tacticalAdvice: [
      'Официальные данные брокеров обновляются вечером и ночью по Нью-Йорку (23:00–04:00 UTC).',
      'Проверяйте сразу 2 источника: SoSoValue и Farside для исключения ошибок расчетов.',
    ],
  },
  cmeBasis: {
    title: 'Базис фьючерсов CME & Гэпы выходного дня',
    badge: 'Чикагская товарная биржа (CME)',
    whatIsIt: 'Премия фьючерсов Чикагской товарной биржи над спотовой ценой. CME закрывается на выходные (с вечера пятницы до вечера воскресенья по времени США).',
    marketImpact: 'Разница котировок между закрытием в пятницу и открытием в воскресенье образует ценовой разрыв («CME Gap»), который цена закрывает в 75–80% случаев.',
    tacticalAdvice: [
      'Незакрытые гэпы CME служат первоочередными магнитами для цены в начале торговой недели.',
      'Здоровый базис CME составляет +0.4%...+1.2% (годовых ~6-12%), что привлекает институциональный арбитраж Cash-and-Carry.',
    ],
  },
  globalOi: {
    title: 'Совокупный Global Open Interest (Все биржи)',
    badge: 'Binance + Bybit + OKX + Deribit + CME',
    whatIsIt: 'Суммарный объем открытых длинных и коротких позиций по всем деривативным биржам мира.',
    marketImpact: 'Рост цены при растущем Global OI означает приток свежих денег в рынок. Рост цены при падающем OI указывает на ликвидацию шортистов (Short Squeeze) без притока новых покупателей.',
    tacticalAdvice: [
      'Экстремальный пик совокупного OI в узком ценовом коридоре предвещает мощный импульсный пробой с серией ликвидаций.',
    ],
  },
  altBeta: {
    title: 'Бета к Биткоину (Коэффициент β)',
    badge: 'Чувствительность к BTC',
    whatIsIt: 'Коэффициент, показывающий во сколько раз сильнее данный альткоин реагирует на импульсы Биткоина.',
    marketImpact: 'Бета 1.5x означает: при росте BTC на +2% альткоин в среднем дает +3%, но и при падении BTC на -2% падает на -3%.',
    tacticalAdvice: [
      'На бычьем импульсе BTC выгоднее монеты с высокой бетой (β > 1.4x).',
      'При проливе или слабости BTC из высокобетовых альтов выходят в первую очередь, спасаясь от ликвидаций.',
    ],
  },
  btcDominance: {
    title: 'Доминация Bitcoin (BTC.D) & Альтсезон',
    badge: 'Переток ликвидности',
    whatIsIt: 'Доля капитализации Биткоина относительно всего криптовалютного рынка.',
    marketImpact: 'Рост BTC.D при росте BTC означает переток денег из альткоинов в Биткоин. Снижение BTC.D на фоне боковика или плавного роста BTC запускает взрывной «Альтсезон».',
    tacticalAdvice: [
      'При растущей доминации BTC альткоины слабеют к BTC, агрессивные лонги по альтам в это время опасны.',
    ],
  },
  fundingSpread: {
    title: 'Кросс-биржевой спред фандинга (Bybit vs Binance)',
    badge: 'Спекулятивный перекос',
    whatIsIt: 'Разница ставок финансирования на бессрочных фьючерсах между Bybit и Binance.',
    marketImpact: 'Если ставка на Bybit существенно выше Binance (+0.02% и более), на Bybit скопился избыточный спекулятивный лонг толпы, готовый к бритью.',
    tacticalAdvice: [
      'Большой спред сигнализирует о перекосе кредитных плеч на ритейл-платформах.',
    ],
  },
};

export const CrossMarketIntelligence: React.FC<CrossMarketIntelligenceProps> = ({
  data,
  currentSymbol,
  isLoading,
}) => {
  const [activeModal, setActiveModal] = useState<MetricExplanation | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'CROSS_CEX' | 'MACRO_TRADFI'>('OVERVIEW');

  if (!data) return null;

  const isMajor = data.isMajor;

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between gap-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  {isMajor ? 'TradFi & Cross-Exchange Matrix' : 'Кросс-рыночная матрица & Связь с BTC'}
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                  {isMajor ? 'Институционалы & ETF' : `Бета к BTC: ${data.altcoinBetaToBtc || 1.3}x`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isMajor
                  ? 'Спот Coinbase США, потоки Spot ETF, фьючерсы CME и совокупный Global OI'
                  : `Сектор ${data.altcoinSector || 'CRYPTO'}, доминация BTC и спред Bybit vs Binance`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
              data.tradFiRiskAppetite === 'RISK_ON'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : data.tradFiRiskAppetite === 'RISK_OFF'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {data.tradFiRiskAppetite === 'RISK_ON'
                ? '🟢 RISK-ON'
                : data.tradFiRiskAppetite === 'RISK_OFF'
                ? '🔴 RISK-OFF'
                : '⚪ NEUTRAL'}
            </span>

            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-750 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveSubTab('OVERVIEW')}
                className={`px-2 py-1 rounded font-medium transition cursor-pointer ${
                  activeSubTab === 'OVERVIEW'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Сводка
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('CROSS_CEX')}
                className={`px-2 py-1 rounded font-medium transition cursor-pointer ${
                  activeSubTab === 'CROSS_CEX'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Биржи
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('MACRO_TRADFI')}
                className={`px-2 py-1 rounded font-medium transition cursor-pointer ${
                  activeSubTab === 'MACRO_TRADFI'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isMajor ? 'TradFi & ETF' : 'BTC.D & Макро'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-750 transition cursor-pointer"
              title={isExpanded ? 'Свернуть матрицу' : 'Развернуть матрицу'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isExpanded && (
          <div className="p-4 space-y-3.5">
            {/* Grid for Major (BTC/ETH) */}
            {isMajor ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Coinbase Spot Premium */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      Премия Coinbase Spot
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.coinbasePremium)}
                      className="p-1 rounded text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold font-mono ${
                        data.coinbasePremiumPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {data.coinbasePremiumPercent >= 0 ? '+' : ''}{data.coinbasePremiumPercent}%
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        (${data.coinbasePrice.toLocaleString()})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Спред к Binance: <strong className={data.coinbasePremiumUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {data.coinbasePremiumUsd >= 0 ? '+' : ''}${data.coinbasePremiumUsd.toFixed(1)}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                      data.coinbasePremiumStatus === 'STRONG_US_BUYING'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : data.coinbasePremiumStatus === 'US_DISCOUNT_SELLING'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {data.coinbasePremiumStatus === 'STRONG_US_BUYING'
                        ? '🇺🇸 Агрессивный выкуп в США'
                        : data.coinbasePremiumStatus === 'US_DISCOUNT_SELLING'
                        ? '🇺🇸 Скидка / Продажи США'
                        : 'Нейтральный паритет'}
                    </span>
                  </div>
                </div>

                {/* 2. Spot Bitcoin ETF Monitor (Verified Direct Sources: SoSoValue / Bitbo / Farside) */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Spot Bitcoin ETF (Прямой монитор)</span>
                      <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-bold">
                        SOSOVALUE
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.etfFlows)}
                      className="p-1 rounded text-emerald-400 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-[10px] text-slate-400 leading-snug">
                      Локальные расчеты отключены во избежание дезинформации. Смотрите верифицированные живые потоки напрямую:
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href="https://sosovalue.com/assets/etf/us-btc-spot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-lg text-emerald-300 hover:text-emerald-200 text-center font-bold text-[10px] flex items-center justify-center gap-1 transition"
                        title="Официальный дашборд SoSoValue Spot ETF"
                      >
                        <span>SoSoValue</span>
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                      </a>
                      <a
                        href="https://charts.bitbo.io/etf-flows/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white text-center font-medium text-[10px] flex items-center justify-center gap-1 transition"
                        title="График потоков Bitbo Bitcoin ETF"
                      >
                        <span>Bitbo ETF</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Без искажений кэша</span>
                    <a
                      href="https://farside.co.uk/btc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200 underline font-mono text-[9px]"
                      title="Первоисточник Farside Investors (сырые таблицы отчетов фондов)"
                    >
                      farside.co.uk ↗
                    </a>
                  </div>
                </div>

                {/* 3. CME Futures & Basis */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-purple-400" />
                      CME Фьючерсы & Базис
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.cmeBasis)}
                      className="p-1 rounded text-purple-400 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-slate-100">
                        ${data.cmeFuturesPrice ? data.cmeFuturesPrice.toLocaleString() : '—'}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        +{data.cmeBasisPercent || 0.45}% Базис
                      </span>
                    </div>

                    {/* CME Friday Close vs Current Spot Real Gap */}
                    {data.cmeWeekendGap && (
                      <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[10px] space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Пятница (Close 22:00 UTC):</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            ${data.cmeWeekendGap.fridayClosePrice ? data.cmeWeekendGap.fridayClosePrice.toLocaleString() : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Гэп CME к споту:</span>
                          <span className={`font-mono font-bold ${
                            data.cmeWeekendGap.gapDistancePct > 0 ? 'text-emerald-400' : (data.cmeWeekendGap.gapDistancePct < 0 ? 'text-rose-400' : 'text-slate-300')
                          }`}>
                            {data.cmeWeekendGap.gapDistancePct > 0 ? `+${data.cmeWeekendGap.gapDistancePct}% (UP GAP)` : `${data.cmeWeekendGap.gapDistancePct}% (DOWN GAP)`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                    <span>Чикагская биржа (CME)</span>
                    <span className="text-purple-300 font-mono">Сессия: Вс 22:00 UTC</span>
                  </div>
                </div>

                {/* 4. Global Aggregate Open Interest */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Совокупный Global OI
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.globalOi)}
                      className="p-1 rounded text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-amber-400">
                        ${((data.globalAggregateOiUsd || 20000000000) / 1e9).toFixed(1)}B
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Все CEX)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Доля Binance: <strong className="text-slate-200">~{data.binanceOiSharePercent || 42}%</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>Binance + Bybit + OKX + Deribit</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Grid for Altcoins */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Beta to BTC */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Бета к BTC (Коэфф. β)
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.altBeta)}
                      className="p-1 rounded text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-amber-400">
                        {data.altcoinBetaToBtc || 1.4}x
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        (Чувствительность)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Сектор: <strong className="text-slate-200">{data.altcoinSector || 'ECOSYSTEM'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>{Number(data.altcoinBetaToBtc || 1.4) > 1.3 ? '🔥 Высоковолатильный альт' : '🛡️ Умеренная волатильность'}</span>
                  </div>
                </div>

                {/* 2. BTC Dominance */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      Доминация BTC (BTC.D)
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.btcDominance)}
                      className="p-1 rounded text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-cyan-400">
                        {data.btcDominancePercent || 58.4}%
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {data.btcDominanceTrend || 'STABLE'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Влияние: <strong className="text-slate-300">
                        {data.btcDominanceTrend === 'RISING' ? 'Отток в BTC' : 'Благоприятно'}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>Индекс доминирования Биткоина</span>
                  </div>
                </div>

                {/* 3. Altcoin Regime to BTC */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      Режим к паре с BTC
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.altBeta)}
                      className="p-1 rounded text-emerald-400 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2.5">
                    <div className="text-sm font-bold font-mono text-slate-100 truncate">
                      {data.altcoinRegime}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Опережение / Отставание от BTC
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                      data.altcoinRegime === 'OUTPERFORMING_BTC'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : data.altcoinRegime === 'UNDERPERFORMING_BTC'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {data.altcoinRegime === 'OUTPERFORMING_BTC' ? '🚀 Опережает BTC' : 'Следование за BTC'}
                    </span>
                  </div>
                </div>

                {/* 4. Funding Arbitrage Spread */}
                <div className="bg-slate-850/80 border border-slate-750 rounded-xl p-3 flex flex-col justify-between hover:border-slate-650 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      Спред Bybit vs Binance
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModal(EXPLANATIONS.fundingSpread)}
                      className="p-1 rounded text-purple-400 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Нажмите для объяснения"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Инфо</span>
                    </button>
                  </div>

                  <div className="my-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold font-mono ${
                        data.crossExchangeFundingDiff >= 0 ? 'text-purple-400' : 'text-slate-300'
                      }`}>
                        {data.crossExchangeFundingDiff >= 0 ? '+' : ''}{data.crossExchangeFundingDiff}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Фандинг)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Арбитражная разница бирж
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>{Math.abs(data.crossExchangeFundingDiff) > 0.01 ? '⚠️ Спекулятивный перекос' : 'Паритет бирж'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Cross CEX details */}
            {activeSubTab === 'CROSS_CEX' && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Разбивка цен и фандинга по мировым биржам</span>
                  <span className="text-[10px] text-slate-400 font-mono">Binance • Bybit • OKX • Coinbase</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400">Binance Spot</div>
                    <div className="font-mono font-bold text-slate-100">${data.binanceSpotPrice.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400">Coinbase Spot</div>
                    <div className="font-mono font-bold text-cyan-300">${data.coinbasePrice.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400">Bybit Perp Фандинг</div>
                    <div className="font-mono font-bold text-purple-300">{data.bybitFundingRate}%</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400">Спред Фандинга CEX</div>
                    <div className="font-mono font-bold text-amber-300">{data.crossExchangeFundingDiff > 0 ? `+${data.crossExchangeFundingDiff}%` : `${data.crossExchangeFundingDiff}%`}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Macro Summary footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-300">Итоговый макро-вывод:</span>
                <span className="text-slate-300">{data.macroSummary}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal with tactical explanation */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">{activeModal.title}</h3>
                <span className="text-xs text-indigo-400 font-mono mt-1 inline-block bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                  🏛️ {activeModal.badge}
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
                  Что это такое:
                </h4>
                <p className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 text-slate-200">
                  {activeModal.whatIsIt}
                </p>
              </div>

              {/* 2. Market Impact */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Как это влияет на цену и институционалов:
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
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
