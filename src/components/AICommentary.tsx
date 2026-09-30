import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BrainCircuit,
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  Lightbulb,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  Flame,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  Shield,
  ArrowUpRight,
  Waves,
  PieChart,
  Boxes,
  Crosshair,
} from 'lucide-react';
import { AICommentaryPayload, AnalysisHorizonMode, TacticalTradePlan } from '../types';
import { TacticalTradeMap } from './TacticalTradeMap';

interface AICommentaryProps {
  payload: AICommentaryPayload;
  isLoading: boolean;
  onGenerate: (userQuery?: string, horizonMode?: AnalysisHorizonMode) => Promise<{ commentary: string; tacticalTradePlan?: TacticalTradePlan | null } | string | null>;
  marketRegime?: { regime: string; title: string; badgeColor: string; description: string };
  tacticalPlan?: TacticalTradePlan | null;
}

interface QuantScenario {
  id: string;
  category: 'smart_money' | 'derivatives' | 'setups' | 'sessions';
  categoryLabel: string;
  title: string;
  subtitle: string;
  query: string;
  recommendedMode: AnalysisHorizonMode;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge: string;
}

export const AICommentary: React.FC<AICommentaryProps> = ({
  payload,
  isLoading,
  onGenerate,
  marketRegime,
  tacticalPlan,
}) => {
  const [commentary, setCommentary] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [horizonMode, setHorizonMode] = useState<AnalysisHorizonMode>('FULL');
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string | null>(null);
  const [isQuantMenuOpen, setIsQuantMenuOpen] = useState<boolean>(false);
  const [selectedQuantCategory, setSelectedQuantCategory] = useState<string>('all');
  const symbolCacheRef = useRef<Record<string, { commentary: string; tacticalPlan?: TacticalTradePlan | null; timestamp?: string }>>({});
  const inFlightRef = useRef<boolean>(false);
  const currentSymbolRef = useRef<string>(payload.symbol);

  // Advanced Institutional Quant Scenarios Library
  const QUANT_SCENARIOS: QuantScenario[] = [
    {
      id: 'binance_alpha_audit',
      category: 'smart_money',
      categoryLabel: 'Smart Money & Киты',
      title: '🟡 Binance Alpha & On-Chain Аудит (On-Chain + Limit)',
      subtitle: 'Разбор токена по 8 метрикам Binance Alpha: Chain.Lq, Chain.Holders, Txns, Mkt Cap/FDV и риск слиппеджа',
      query: 'Выполни полный аудит токена по стандартам Binance Alpha (On-Chain + Limit): сопоставь 24h Vol ($), 24h Txns, Mkt Cap vs FDV, Chain.Holders и ликвидность пула Chain.Lq. Оцени приток смарт-денег, премию к споту и дай тактический план.',
      recommendedMode: 'FULL',
      icon: Sparkles,
      accentColor: 'text-amber-400',
      badge: 'Binance Alpha',
    },
    {
      id: 'flash_realtime_analyst',
      category: 'smart_money',
      categoryLabel: 'Smart Money & Киты',
      title: '🧠 Flash AI-Синтез Реального Времени',
      subtitle: 'Мгновенный срез: CVD дельта, баланс лимитов стакана, Dump Radar и точный Actionable-триггер',
      query: 'Выполни моментальный Gemini Flash синтез: оцени преобладание покупок/продаж по тиковому CVD, риски пролива цены и дай четкое торговое действие прямо сейчас.',
      recommendedMode: 'FLASH_SUMMARY',
      icon: Sparkles,
      accentColor: 'text-amber-300',
      badge: 'Flash Stream',
    },
    {
      id: 'tradfi_coinbase_etf',
      category: 'smart_money',
      categoryLabel: 'Smart Money & Киты',
      title: 'Премия Coinbase & Spot ETF (TradFi США)',
      subtitle: 'Анализ премии Coinbase Spot vs Binance, притоков Spot ETF и институционального спроса США',
      query: 'Проанализируй премию Coinbase Spot (USD), оценку чистых притоков Spot ETF и базис CME: скупают ли американские институционалы спот на сессии США или фиксируют прибыль?',
      recommendedMode: 'FULL',
      icon: Target,
      accentColor: 'text-amber-400',
      badge: 'TradFi Flow',
    },
    {
      id: 'altcoin_beta_btcd',
      category: 'derivatives',
      categoryLabel: 'Деривативы & Сквиз',
      title: 'Бета к BTC (β) & Доминация BTC.D',
      subtitle: 'Оценка чувствительности альткоина к импульсам BTC и кросс-биржевой спред фандинга Bybit/Binance',
      query: 'Оцени бету монеты к биткоину (β), тренд доминации BTC.D и кросс-биржевой спред фандинга (Bybit vs Binance): опережает ли актив рынок или рискует просесть сильнее BTC при локальном дампе?',
      recommendedMode: 'INTRADAY',
      icon: Flame,
      accentColor: 'text-cyan-400',
      badge: 'Beta & Dominance',
    },
    {
      id: 'timing_clearing_expiry',
      category: 'derivatives',
      categoryLabel: 'Деривативы & Сквиз',
      title: 'Тайминг клиринга фандинга & Экспирация',
      subtitle: 'Анализ времени до клиринга (8h Funding), сессии США и пятничной экспирации опционов',
      query: 'Проанализируй текущий тайминг: сколько минут до ближайшего клиринга фандинга, статус сессии США и близость пятничной экспирации опционов. Есть ли риск манипулятивного сквиза перед расчетом?',
      recommendedMode: 'INTRADAY',
      icon: Clock,
      accentColor: 'text-amber-400',
      badge: 'Clearing & Timing',
    },
    {
      id: 'whale_retail_div',
      category: 'smart_money',
      categoryLabel: 'Smart Money & Киты',
      title: 'Дивергенция Киты vs Ритейл',
      subtitle: 'Сравнение Top Traders L/S против толпы: где институциональный перевес и кто в ловушке',
      query: 'Сравни позиции Top Traders L/S и Global Accounts. На чьей стороне институциональный перевес, куда смотрят киты и кто рискует оказаться заперт в убытке при резком импульсе?',
      recommendedMode: 'INTRADAY',
      icon: PieChart,
      accentColor: 'text-indigo-400',
      badge: 'Smart Money',
    },
    {
      id: 'iceberg_absorption',
      category: 'smart_money',
      categoryLabel: 'Smart Money & Киты',
      title: 'Скрытое айсберг-поглощение (Absorption)',
      subtitle: 'Анализ тикового CVD и стакана: поглощаются ли маркет-ордера крупными лимитами',
      query: 'Проанализируй связку тикового CVD и лимитных стенок в стакане ($ Notional): поглощаются ли маркет-покупки или продажи скрытыми лимитными айсберг-ордерами крупных игроков?',
      recommendedMode: 'SCALP',
      icon: Waves,
      accentColor: 'text-cyan-400',
      badge: 'Microstructure',
    },
    {
      id: 'premium_discount_smc',
      category: 'smart_money',
      categoryLabel: 'Smart Money & Киты',
      title: 'Зоны Premium / Discount & Справедливая цена',
      subtitle: 'Оценка положения котировки в диапазоне для поиска оптимального математического входа',
      query: 'Определи положение цены относительно сессионного диапазона, зон Discount/Premium и равновесия (Equilibrium): где выгоднее искать подтверждение входа с точки зрения риск/прибыль?',
      recommendedMode: 'INTRADAY',
      icon: Target,
      accentColor: 'text-emerald-400',
      badge: 'SMC Balance',
    },
    {
      id: 'funding_squeeze_radar',
      category: 'derivatives',
      categoryLabel: 'Деривативы & Сквиз',
      title: 'Тест на Long/Short Сквиз до клиринга',
      subtitle: 'Расчет вероятности каскадного выноса стопов по 8h Funding Rate и Spot-Futures Basis',
      query: 'Оцени ставку фандинга (8h Funding Rate) и базис деривативов: перегреты ли плечевые позиции, в какую сторону перекошен открытый интерес и на каких уровнях произойдет каскадный сквиз?',
      recommendedMode: 'INTRADAY',
      icon: Flame,
      accentColor: 'text-amber-400',
      badge: 'Squeeze Radar',
    },
    {
      id: 'basis_contango_arbitrage',
      category: 'derivatives',
      categoryLabel: 'Деривативы & Сквиз',
      title: 'Spot-Futures Basis & Премия контанго',
      subtitle: 'Оценка премии деривативов, открытого интереса и среднесрочных институциональных ожиданий',
      query: 'Проанализируй Spot-Futures Basis (Contango vs Backwardation) и открытый интерес: отражает ли премия институциональный спрос или хеджирование риска?',
      recommendedMode: 'SWING',
      icon: TrendingUp,
      accentColor: 'text-purple-400',
      badge: 'Basis & OI',
    },
    {
      id: 'dump_radar_liquidation',
      category: 'derivatives',
      categoryLabel: 'Деривативы & Сквиз',
      title: 'Радар риска пролива (Dump Radar & Кластеры)',
      subtitle: 'Анализ индекса риска резкого сброса и карты недавних ликвидаций',
      query: 'Оцени индекс риска пролива (Dump Radar) и кластеры недавних ликвидаций: где заперта основная масса стоп-лоссов и какова вероятность резкого дампа?',
      recommendedMode: 'FULL',
      icon: Shield,
      accentColor: 'text-rose-400',
      badge: 'Dump Radar',
    },
    {
      id: 'two_way_playbook',
      category: 'setups',
      categoryLabel: 'Сетапы & Риск',
      title: 'Двусторонний сессионный сценарий (Long vs Short)',
      subtitle: 'Конкретный пошаговый план: триггер входа по дельте, цели и уровень отмены идеи',
      query: 'Сформируй 2 четких пошаговых сценария (бычий и медвежий) с триггером подтверждения по объему дельты, целями движения и жестким уровнем отмены (Invalidation).',
      recommendedMode: 'FULL',
      icon: Crosshair,
      accentColor: 'text-emerald-400',
      badge: 'Actionable Plan',
    },
    {
      id: 'stop_loss_risk_reward',
      category: 'setups',
      categoryLabel: 'Сетапы & Риск',
      title: 'Расчет Stop-Loss & Риск/Прибыль (R:R 1:3+)',
      subtitle: 'Математически выверенный расчет точки входа и стоп-лосса за реальной плотностью лимитов',
      query: 'Рассчитай оптимальную точку входа, защитный уровень Stop-Loss/Invalidation за реальной долларовой плотностью и соотношение риск/прибыль (R:R не менее 1:3).',
      recommendedMode: 'INTRADAY',
      icon: ArrowUpRight,
      accentColor: 'text-blue-400',
      badge: 'Risk Math',
    },
    {
      id: 'orderbook_usd_notional',
      category: 'setups',
      categoryLabel: 'Сетапы & Риск',
      title: 'HFT Разбор стакана в USD ($ Notional)',
      subtitle: 'Где стоят реальные долларовые стенки и какой объем Taker-ордеров нужен для их пробития',
      query: 'Где в книге заявок расположены реальные долларовые плотности сопротивления и поддержки ($ Notional) и какой объем Taker-ордеров потребуется для их пробития?',
      recommendedMode: 'SCALP',
      icon: Boxes,
      accentColor: 'text-amber-400',
      badge: 'OrderBook USD',
    },
    {
      id: 'session_transition_drive',
      category: 'sessions',
      categoryLabel: 'Мировые сессии',
      title: 'Переход сессий (London / NY Open Drive)',
      subtitle: 'Оценка снятия Asian Range и потенциал импульса на открытии Лондона или Нью-Йорка',
      query: 'Оцени поведение актива в контексте текущей торговой сессии: был ли вынос азиатского диапазона (Asian Range) и стоит ли ожидать импульса на открытии Лондона/Нью-Йорка?',
      recommendedMode: 'INTRADAY',
      icon: Clock,
      accentColor: 'text-teal-400',
      badge: 'Session SMC',
    },
  ];

  // Analysis Modes with dedicated metadata and descriptions
  const HORIZON_MODES: Array<{
    id: AnalysisHorizonMode;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    activeBg: string;
    borderActive: string;
  }> = [
    {
      id: 'FLASH_SUMMARY',
      label: '⚡ Flash-Аналитик',
      sublabel: 'Синтез в реальном времени (1 сек)',
      icon: Sparkles,
      accentColor: 'text-amber-300',
      activeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/50 shadow-sm',
      borderActive: 'border-amber-400/40',
    },
    {
      id: 'FULL',
      label: 'Полный отчет',
      sublabel: 'Глубокий институциональный разбор и выводы',
      icon: BarChart3,
      accentColor: 'text-emerald-400',
      activeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm',
      borderActive: 'border-emerald-500/30',
    },
    {
      id: 'SCALP',
      label: 'Скальпинг',
      sublabel: '5–30 мин (Live CVD & Стакан)',
      icon: Zap,
      accentColor: 'text-amber-400',
      activeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm',
      borderActive: 'border-amber-500/30',
    },
    {
      id: 'INTRADAY',
      label: 'Внутридень',
      sublabel: '1–8 часов (Сессия & Фандинг)',
      icon: Target,
      accentColor: 'text-cyan-400',
      activeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm',
      borderActive: 'border-cyan-500/30',
    },
    {
      id: 'SWING',
      label: 'Свинг / Макро',
      sublabel: '1–3 дня (Базис & 4H/1D тренд)',
      icon: TrendingUp,
      accentColor: 'text-purple-400',
      activeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-sm',
      borderActive: 'border-purple-500/30',
    },
  ];

  // Preset prompts tailored dynamically per Horizon Mode
  const MODE_PROMPTS: Record<AnalysisHorizonMode, Array<{ label: string; query: string }>> = {
    FLASH_SUMMARY: [
      { label: '⚡ Мгновенный синтез', query: 'Дай максимально емкий Flash-вердикт: доминирующий уклон (Bias), баланс тикового CVD, ключевые стенки в стакане и прямое торговое действие.' },
      { label: '🚨 Риск сброса (Dump Radar)', query: 'Оцени текущий риск внезапного пролива цены на основе дисбаланса книги заявок, динамики открытого интереса и Taker-агрессии.' },
      { label: '🌊 Моментум в стакане', query: 'Кто прямо сейчас контролирует книгу заявок и перевешивает ли тиковая дельта сопротивление лимитных ордеров?' },
      { label: '🎯 Точка входа в 1 клик', query: 'Сформулируй краткую точку входа по рынку или от ближайшего лимитного уровня с жестким стопом отмены.' },
    ],
    SCALP: [
      { label: '⚡ Экспресс-скальп сетап', query: 'Дай подробный скальп-сетап в моменте: анализ микроструктуры, направление импульса, точную точку входа и жесткий уровень отмены (Invalidation).' },
      { label: '🌊 Тиковый CVD поток', query: 'Оцени баланс маркет-покупок и продаж в тиковом CVD прямо сейчас: есть ли поглощение лимитами и истощение моментума?' },
      { label: '⚖️ USD Стенки в стакане', query: 'Где находятся ближайшие крупные лимитные стенки в USD ($ Notional), как они защищают цену или сдерживают рост?' },
      { label: '🛑 Условие отмены (Invalidation)', query: 'Где находится четкий уровень отмены скальп-сценария и какие триггеры укажут на слом сетапа?' },
    ],
    INTRADAY: [
      { label: '🎯 Сессионный торговый план', query: 'Сформируй развернутый торговый план на текущую сессию: ключевые уровни отбоя/пробоя, подтверждение по дельте и цели.' },
      { label: '🔥 Фандинг и риск сквиза', query: 'Оцени давление 8-часового фандинга, перекос открытого интереса и вероятность Long/Short сквиза до следующего клиринга.' },
      { label: '🐋 Топ-трейдеры vs Ритейл', query: 'Сравни позиционирование китов (Top Traders) и всех аккаунтов (Global): куда смещен перевес крупных игроков и почему?' },
      { label: '📊 Сессионные зоны ликвидности', query: 'Где сосредоточены основные пулы недавней ликвидационной ликвидности и куда рынок вероятнее пойдет за стопами?' },
    ],
    SWING: [
      { label: '📈 Макро-сценарий (1–3 дня)', query: 'Дай глубокую среднесрочную оценку структуры рынка на 4H/1D, фазу рынка (накопление/распределение) и сценарий развития.' },
      { label: '🏛️ Базис Spot-Futures', query: 'Оцени контанго/бэквордацию, премию деривативов и долгосрочные ожидания институционального рынка.' },
      { label: '🗺️ Ключевые зоны набора позиций', query: 'Определи стратегические уровни поддержки и сопротивления старшего таймфрейма для позиционного набора.' },
      { label: '🔥 Глобальные кластеры ликвидаций', query: 'Где заперты основные объемы убыточных позиций на старших периодах и каков риск каскадного сквиза?' },
    ],
    FULL: [
      { label: '📊 Полный институциональный срез', query: '' },
      { label: '🌊 CVD & Поток Taker-ордеров', query: 'Дай развернутый анализ кумулятивной дельты объемов (CVD), агрессии покупателей против продавцов и скрытого поглощения.' },
      { label: '⚖️ USD Дисбаланс стакана', query: 'Оцени баланс ликвидности в долларах ($ Notional) в книге заявок, расположение крупных стенок и их влияние.' },
      { label: '🔥 Фандинг, Базис & Сквиз', query: 'Подробно разбери ставку финансирования, спред Spot-Futures Basis и вероятность ликвидационного сквиза до клиринга.' },
    ],
  };

  const getCacheKey = (sym: string, mode: AnalysisHorizonMode, q?: string) => {
    return `${sym}_${mode}_${(q || '').trim().toLowerCase()}`;
  };

  const handleGenerate = async (query?: string, mode: AnalysisHorizonMode = horizonMode, force = false) => {
    if (inFlightRef.current && !force) return;
    
    const cacheKey = getCacheKey(payload.symbol, mode, query);

    // Check client cache if not forcing
    if (!query && !force && symbolCacheRef.current[cacheKey]) {
      setCommentary(symbolCacheRef.current[cacheKey].commentary);
      if (symbolCacheRef.current[cacheKey].timestamp) {
        setLastGeneratedTime(symbolCacheRef.current[cacheKey].timestamp || null);
      }
      return;
    }

    inFlightRef.current = true;
    try {
      const res = await onGenerate(query, mode);
      const currentTimeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastGeneratedTime(currentTimeStr);

      if (res) {
        if (typeof res === 'string') {
          setCommentary(res);
          symbolCacheRef.current[cacheKey] = { commentary: res, tacticalPlan: null, timestamp: currentTimeStr };
        } else {
          setCommentary(res.commentary);
          symbolCacheRef.current[cacheKey] = { commentary: res.commentary, tacticalPlan: res.tacticalTradePlan, timestamp: currentTimeStr };
        }
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  // Switch horizon mode: load from cache if available, otherwise clear commentary so user can trigger manually
  const handleSelectMode = (newMode: AnalysisHorizonMode) => {
    setHorizonMode(newMode);
    const cacheKey = getCacheKey(payload.symbol, newMode, userQuery);
    if (symbolCacheRef.current[cacheKey]) {
      setCommentary(symbolCacheRef.current[cacheKey].commentary);
      setLastGeneratedTime(symbolCacheRef.current[cacheKey].timestamp || null);
    } else {
      setCommentary('');
      setLastGeneratedTime(null);
    }
  };

  // When symbol changes, switch to cached commentary if exists, otherwise show ready state (no auto-call)
  useEffect(() => {
    currentSymbolRef.current = payload.symbol;
    const cacheKey = getCacheKey(payload.symbol, horizonMode);
    if (symbolCacheRef.current[cacheKey]) {
      setCommentary(symbolCacheRef.current[cacheKey].commentary);
      setLastGeneratedTime(symbolCacheRef.current[cacheKey].timestamp || null);
    } else {
      setCommentary('');
      setLastGeneratedTime(null);
    }
  }, [payload.symbol]);

  const handleCopy = () => {
    if (!commentary) return;
    navigator.clipboard.writeText(commentary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeModeMeta = HORIZON_MODES.find((m) => m.id === horizonMode) || HORIZON_MODES[0];

  return (
    <div id="ai-commentary-panel" className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                AI Market Intelligence (Gemini)
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Section 5 Rules
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Торговый ассистент с разделением на горизонты (скальп, сессия, свинг)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {commentary && (
            <button
              onClick={handleCopy}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано' : 'Копировать'}</span>
            </button>
          )}

          <button
            onClick={() => handleGenerate(userQuery, horizonMode, true)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>
              {isLoading
                ? 'Анализирую...'
                : commentary
                ? 'Обновить анализ'
                : `Сгенерировать (${activeModeMeta.label})`}
            </span>
          </button>
        </div>
      </div>

      {/* Analysis Horizon Mode Switcher Tabs */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            Режим анализа & Горизонт:
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {activeModeMeta.sublabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
          {HORIZON_MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = horizonMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectMode(m.id)}
                disabled={isLoading}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? `${m.activeBg} font-bold`
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850 border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? m.accentColor : 'text-slate-500'}`} />
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Market Regime Badge Banner */}
      {marketRegime && (
        <div className="mb-3 p-2.5 rounded-lg bg-slate-800/70 border border-slate-750 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono text-slate-400">Рыночный режим:</span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${marketRegime.badgeColor}`}>
              {marketRegime.title}
            </span>
          </div>
          <span className="text-[11px] text-slate-300 font-mono">
            {marketRegime.description}
          </span>
        </div>
      )}

      {/* Dynamic Preset Quick Questions (Tailored for current mode) */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        {MODE_PROMPTS[horizonMode].map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setUserQuery(p.query);
              handleGenerate(p.query, horizonMode, true);
            }}
            disabled={isLoading}
            className="text-[11px] font-mono px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Advanced Quant Scenarios Expandable Library Menu */}
      <div className="mb-3 rounded-lg border border-indigo-500/20 bg-slate-950/60 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsQuantMenuOpen(!isQuantMenuOpen)}
          className="w-full px-3 py-2 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/40 hover:bg-indigo-950/60 transition flex items-center justify-between gap-2 text-left cursor-pointer border-b border-indigo-500/10"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-200">
                  Библиотека квант-сценариев институционального анализа
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {QUANT_SCENARIOS.length} сценариев
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Готовые глубокие разборы: Smart Money, фандинг-сквиз, скрытое поглощение и расчет риска
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-mono">
            <span className="hidden sm:inline text-[11px]">
              {isQuantMenuOpen ? 'Свернуть' : 'Открыть меню'}
            </span>
            {isQuantMenuOpen ? (
              <ChevronUp className="w-4 h-4 text-indigo-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-400" />
            )}
          </div>
        </button>

        {isQuantMenuOpen && (
          <div className="p-3 bg-slate-900/80 border-t border-slate-800/80 space-y-2.5">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800">
              {[
                { id: 'all', label: 'Все сценарии', count: QUANT_SCENARIOS.length },
                { id: 'smart_money', label: '🐋 Smart Money & Киты', count: QUANT_SCENARIOS.filter(s => s.category === 'smart_money').length },
                { id: 'derivatives', label: '⚡ Деривативы & Сквиз', count: QUANT_SCENARIOS.filter(s => s.category === 'derivatives').length },
                { id: 'setups', label: '🎯 Сетапы & Риск', count: QUANT_SCENARIOS.filter(s => s.category === 'setups').length },
                { id: 'sessions', label: '🌐 Мировые сессии', count: QUANT_SCENARIOS.filter(s => s.category === 'sessions').length },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedQuantCategory(cat.id)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md transition cursor-pointer border ${
                    selectedQuantCategory === cat.id
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 font-bold'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-750'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {QUANT_SCENARIOS.filter(
                (sc) => selectedQuantCategory === 'all' || sc.category === selectedQuantCategory
              ).map((sc) => {
                const IconComponent = sc.icon;
                return (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setUserQuery(sc.query);
                      setHorizonMode(sc.recommendedMode);
                      handleGenerate(sc.query, sc.recommendedMode, true);
                    }}
                    disabled={isLoading}
                    className="p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left transition group cursor-pointer flex flex-col justify-between gap-1.5 disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md bg-slate-900 border border-slate-800 group-hover:border-indigo-500/40 ${sc.accentColor}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-200 transition">
                          {sc.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 whitespace-nowrap">
                        {sc.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-tight">
                      {sc.subtitle}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-900 text-slate-500">
                      <span className="flex items-center gap-1 text-slate-400">
                        <span>Горизонт:</span>
                        <strong className="text-slate-300">
                          {sc.recommendedMode === 'FLASH_SUMMARY'
                            ? 'Flash AI'
                            : sc.recommendedMode === 'FULL'
                            ? 'Полный'
                            : sc.recommendedMode === 'SCALP'
                            ? 'Скальп'
                            : sc.recommendedMode === 'INTRADAY'
                            ? 'Внутридень'
                            : 'Свинг'}
                        </strong>
                      </span>
                      <span className="text-indigo-400 group-hover:underline flex items-center gap-0.5">
                        Запустить анализ →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main AI Commentary Output Card */}
      <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-4 text-xs font-sans leading-relaxed text-slate-200 min-h-[160px] max-h-[380px] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3">
            <div className="relative">
              <BrainCircuit className="w-8 h-8 text-amber-400 animate-pulse" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <p className="text-xs font-mono text-slate-300">
              Генерирую {activeModeMeta.label.toLowerCase()} анализ для {payload.symbol}...
            </p>
          </div>
        ) : commentary ? (
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800/70">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${activeModeMeta.activeBg}`}>
                  Горизонт: {activeModeMeta.label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeModeMeta.sublabel}
                </span>
              </div>
              {lastGeneratedTime && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Обновлено: {lastGeneratedTime}</span>
                </div>
              )}
            </div>

            {/* Tactical AI Trade Roadmap (Entry, Targets, Invalidation) */}
            {tacticalPlan && (
              <TacticalTradeMap
                plan={tacticalPlan}
                currentPrice={payload.spotPrice}
              />
            )}

            <div className="prose prose-invert prose-xs max-w-none space-y-2 text-slate-200">
              <ReactMarkdown>{commentary}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-7 px-4 text-center space-y-3">
            <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${activeModeMeta.accentColor}`}>
              {React.createElement(activeModeMeta.icon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Готов к расчету: {activeModeMeta.label} ({payload.symbol})
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                {activeModeMeta.sublabel}. Нажмите кнопку ниже или выберите один из быстрых сценариев.
              </p>
            </div>
            <button
              onClick={() => handleGenerate(userQuery, horizonMode, true)}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Сгенерировать {activeModeMeta.label}-анализ</span>
            </button>
          </div>
        )}
      </div>

      {/* User Custom Query Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (userQuery.trim()) {
            handleGenerate(userQuery, horizonMode, true);
          }
        }}
        className="flex items-center gap-2 mt-3"
      >
        <input
          id="ai-user-query-input"
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder={`Задайте вопрос в режиме [${activeModeMeta.label}] по ${payload.symbol} (например: "Оцени точку входа")...`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono"
        />
        <button
          type="submit"
          disabled={isLoading || !userQuery.trim()}
          className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Спросить</span>
        </button>
      </form>
    </div>
  );
};

