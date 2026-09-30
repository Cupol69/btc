/**
 * AI × Trader Global Session & Institutional Liquidity Service
 * Calculates world market trading sessions, solar terminator, DST season,
 * hardcoded session skeleton events (UTC), institutional reference pivots (Asian Range, PDH/PDL, Midnight UTC Open, 50% EQ),
 * and dynamic btc_regime status for meme altcoin spillovers.
 */

export type DstMode = 'SUMMER' | 'WINTER';

export interface MarketSession {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  utcStartHourSummer: number;
  utcEndHourSummer: number;
  utcStartHourWinter: number;
  utcEndHourWinter: number;
  color: string;
  glowColor: string;
  typicalShareOfVolume: number; // Percentage of 24h crypto volume
  volatilityRating: 'HIGH' | 'EXTREME' | 'MEDIUM' | 'MODERATE';
  description: string;
  coPilotNote: string;
}

export interface SessionStatus {
  session: MarketSession;
  isActive: boolean;
  isOpeningSoon: boolean; // within 60 mins
  isClosingSoon: boolean; // within 60 mins
  progressPercent: number;
  timeRemainingText: string;
  nextEventText: string;
  activeStartHour: number;
  activeEndHour: number;
}

export interface SessionTimelineEvent {
  id: string;
  title: string;
  shortLabel: string;
  category: 'FUNDING' | 'MACRO' | 'SESSION_OPEN' | 'SESSION_CLOSE' | 'EXPIRY' | 'CME' | 'DEAD_ZONE' | 'ETF_FLOWS';
  utcHourSummer: number; // e.g. 12.5 for 12:30
  utcHourWinter: number; // e.g. 13.5 for 13:30
  timeStringSummer: string;
  timeStringWinter: string;
  description: string;
  btcRelevance: string;
  memeRelevance: string;
  color: string;
  badge?: string;
  moduleKey: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  moduleQuestion: string;
}

export interface InstitutionalPivots {
  pdh: number; // Previous Day High
  pdl: number; // Previous Day Low
  asianHigh: number; // Asian Range High (00:00-08:00 UTC)
  asianLow: number;  // Asian Range Low
  asianRangeSizeUsd: number;
  asianRangePercent: number;
  midnightOpen: number; // 00:00 UTC Open
  currentPrice: number;
  equilibrium50: number; // (PDH + PDL) / 2
  marketZone: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM';
  distanceToPdhPercent: number;
  distanceToPdlPercent: number;
  liquidityBias: 'BULLISH_EXPANSION' | 'BEARISH_EXPANSION' | 'ASIAN_SWEEP_REVERSAL' | 'RANGE_BOUND';
  coPilotInsight: string;
}

export interface BtcRegimeInfo {
  regimeCode: 'GREEN_LIGHT_MEMES' | 'WAIT_NY' | 'MACRO_PAUSE' | 'DEAD_ZONE_WARNING' | 'CME_GAP_ALERT' | 'STANDARD_TREND';
  statusBadge: string;
  title: string;
  memeRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME_VOLATILITY';
  summary: string;
  recommendedAction: string;
  nextEventLabel: string;
  minutesToNextEvent: number;
  dstMode: DstMode;
}

export const GLOBAL_SESSIONS: MarketSession[] = [
  {
    id: 'tokyo',
    name: 'Азиатско-Тихоокеанская Сессия',
    city: 'Токио / Гонконг / Сингапур',
    country: 'Япония / Азия',
    lat: 35.6762,
    lng: 139.6503,
    utcStartHourSummer: 0,
    utcEndHourSummer: 9,
    utcStartHourWinter: 0,
    utcEndHourWinter: 9,
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.4)',
    typicalShareOfVolume: 22,
    volatilityRating: 'MEDIUM',
    description: 'Фаза накопления начальной ликвидности (Asian Range). Пик китайского капитала и BSC-мемов.',
    coPilotNote: 'AI+Trader фокус: Отслеживайте границы Asian High/Low (00:00–08:00 UTC). Золотое окно для китайских мемов (牛来, MarsCoin, CASHCAT) при спокойном BTC.',
  },
  {
    id: 'london',
    name: 'Европейская Сессия',
    city: 'Лондон / Франкфурт / Цюрих',
    country: 'Великобритания / ЕС',
    lat: 51.5074,
    lng: -0.1278,
    utcStartHourSummer: 7,
    utcEndHourSummer: 16,
    utcStartHourWinter: 8,
    utcEndHourWinter: 17,
    color: '#3b82f6', // Blue
    glowColor: 'rgba(59, 130, 246, 0.4)',
    typicalShareOfVolume: 34,
    volatilityRating: 'HIGH',
    description: 'Агрессивная экспансия и манипуляции ликвидностью. Часто формирует истинный дневной экстремум (Judas Swing).',
    coPilotNote: 'AI+Trader фокус: Первые 2 часа создают импульс снятия ликвидности азиатской сессии. Если цена возвращается в азиатский диапазон — ждать разворота на NY.',
  },
  {
    id: 'newyork',
    name: 'Американская Сессия',
    city: 'Нью-Йорк / Чикаго (CME)',
    country: 'США',
    lat: 40.7128,
    lng: -74.006,
    utcStartHourSummer: 12,
    utcEndHourSummer: 21,
    utcStartHourWinter: 13,
    utcEndHourWinter: 22,
    color: '#f59e0b', // Amber
    glowColor: 'rgba(245, 158, 11, 0.4)',
    typicalShareOfVolume: 42,
    volatilityRating: 'EXTREME',
    description: 'Пиковая ликвидность институциональных фондов США, выход макроэкономических данных (CPI, FOMC, NFP) и торговля CME.',
    coPilotNote: 'AI+Trader фокус: Окно перекрытия Лондон+Нью-Йорк генерирует до 65% суточного оборота. Высокая корреляция с Nasdaq.',
  },
  {
    id: 'sydney',
    name: 'Тихоокеанская Сессия',
    city: 'Сидней / Веллингтон',
    country: 'Австралия / Океания',
    lat: -33.8688,
    lng: 151.2093,
    utcStartHourSummer: 21,
    utcEndHourSummer: 6,
    utcStartHourWinter: 21,
    utcEndHourWinter: 6,
    color: '#10b981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.4)',
    typicalShareOfVolume: 12,
    volatilityRating: 'MODERATE',
    description: 'Переходная сессия открытия нового торгового дня. Пониженная глубина стакана, возможны манипулятивные выбросы.',
    coPilotNote: 'AI+Trader фокус: Учитывайте спреды и тонкий стакан перед фиксацией Midnight UTC Open (00:00).',
  },
];

/**
 * Hardcoded 16+ Key Session Timeline Events Skeleton (UTC) with Summer / Winter DST support
 */
export const SESSION_TIMELINE_EVENTS: SessionTimelineEvent[] = [
  {
    id: 'daily_close',
    title: 'Daily Candle Close (00:00 UTC)',
    shortLabel: '00:00 Дневная свеча',
    category: 'SESSION_CLOSE',
    utcHourSummer: 0,
    utcHourWinter: 0,
    timeStringSummer: '00:00 UTC',
    timeStringWinter: '00:00 UTC',
    description: 'Закрытие и открытие суточной свечи. Фиксация PDH/PDL и Midnight Open.',
    btcRelevance: 'Главная свеча, фиксация дневных уровней и переход в новый цикл.',
    memeRelevance: 'Перезапуск суточных метрик на DEX Screener и агрегаторах.',
    color: '#f59e0b',
    badge: '00:00',
    moduleKey: 'A',
    moduleQuestion: 'Каковы ключевые ориентиры после закрытия дневной свечи (Midnight Open, PDH/PDL) и кто сейчас у руля?',
  },
  {
    id: 'funding_00',
    title: 'Funding Rate Window #1 (00:00 UTC)',
    shortLabel: '⚡ Фандинг 00:00',
    category: 'FUNDING',
    utcHourSummer: 0,
    utcHourWinter: 0,
    timeStringSummer: '00:00 UTC',
    timeStringWinter: '00:00 UTC',
    description: 'Списание/начисление ставки финансирования на Binance/Bybit/OKX.',
    btcRelevance: 'Перед 00:00 часто происходит «отжим» перегруженной стороны (лонги/шорты).',
    memeRelevance: 'При экстремальном фандинге на CEX спекулятивный капитал перетекает в DEX.',
    color: '#eab308',
    badge: 'Funding',
    moduleKey: 'C',
    moduleQuestion: 'Какой фандинг зафиксирован в окне 00:00 UTC и как он менялся за последние 3 окна? Кто перегружен?',
  },
  {
    id: 'tokyo_open',
    title: 'Токио Открытие (00:00 UTC)',
    shortLabel: '🇯🇵 Токио Open',
    category: 'SESSION_OPEN',
    utcHourSummer: 0,
    utcHourWinter: 0,
    timeStringSummer: '00:00 UTC',
    timeStringWinter: '00:00 UTC',
    description: 'Старт азиатской ликвидности и формирования Asian Range.',
    btcRelevance: 'Начало фазы накопления, формирование базового коридора на первые 8 часов.',
    memeRelevance: 'Пробуждение азиатских трейдеров и комьюнити.',
    color: '#06b6d4',
    badge: 'Asia',
    moduleKey: 'B',
    moduleQuestion: 'Как формируется азиатский диапазон после открытия Токио и где находятся расчетные границы?',
  },
  {
    id: 'shanghai_open',
    title: 'Шанхай / Гонконг Открытие (01:30 UTC)',
    shortLabel: '🇨🇳 Шанхай / HK Open',
    category: 'SESSION_OPEN',
    utcHourSummer: 1.5,
    utcHourWinter: 1.5,
    timeStringSummer: '01:30 UTC',
    timeStringWinter: '01:30 UTC',
    description: 'Приход китайского капитала. Самое активное окно для восточных токенов.',
    btcRelevance: 'Тестирование азиатской медианы при умеренной волатильности.',
    memeRelevance: 'Ключевое время старта органических пампов китайских BSC-мемов (牛来, MarsCoin, CASHCAT).',
    color: '#ef4444',
    badge: 'China Capital',
    moduleKey: 'E',
    moduleQuestion: 'Если BTC стоит в диапазоне в Азии, течет ли капитал в китайские BSC-мемы (牛来, CASHCAT)? Какова безопасность риска?',
  },
  {
    id: 'london_open',
    title: 'Лондон Открытие (07:00 EDT / 08:00 EST)',
    shortLabel: '🏛️ Лондон Open',
    category: 'SESSION_OPEN',
    utcHourSummer: 7,
    utcHourWinter: 8,
    timeStringSummer: '07:00 UTC',
    timeStringWinter: '08:00 UTC',
    description: 'Открытие европейских банков. Первый крупный импульс и потенциальный Judas Swing.',
    btcRelevance: 'Первый крупный импульс, часто «фейк-пробой» азиатского диапазона со снятием ликвидности.',
    memeRelevance: 'При резком движении BTC мем-токены могут испытать каскад стопов.',
    color: '#3b82f6',
    badge: 'London',
    moduleKey: 'B',
    moduleQuestion: 'Лондон пробил азиатский диапазон вверх или вниз, и вернулась ли цена обратно? Совпадает ли пробой с фандингом?',
  },
  {
    id: 'deribit_expiry',
    title: 'Deribit Options Expiry (08:00 UTC)',
    shortLabel: '🎯 Deribit Expiry 08:00',
    category: 'EXPIRY',
    utcHourSummer: 8,
    utcHourWinter: 8,
    timeStringSummer: '08:00 UTC',
    timeStringWinter: '08:00 UTC',
    description: 'Ежедневная экспирация опционов на Deribit (в пятницу — недельные/месячные).',
    btcRelevance: 'Магнит Max Pain: стремление маркет-мейкеров удержать цену у страйков максимальной боли.',
    memeRelevance: 'После 08:00 высвобождается ликвидность институциональных хеджеров.',
    color: '#a855f7',
    badge: 'Max Pain',
    moduleKey: 'C',
    moduleQuestion: 'Где находится уровень Max Pain по опционам Deribit и как далеко цена BTC от него перед 08:00 UTC?',
  },
  {
    id: 'funding_08',
    title: 'Funding Rate Window #2 (08:00 UTC)',
    shortLabel: '⚡ Фандинг 08:00',
    category: 'FUNDING',
    utcHourSummer: 8,
    utcHourWinter: 8,
    timeStringSummer: '08:00 UTC',
    timeStringWinter: '08:00 UTC',
    description: 'Второе суточное окно фандинга. Совпадает с европейским разгоном.',
    btcRelevance: 'Оценка настроений трейдеров на переходе из Азии в Европу.',
    memeRelevance: 'Сдвиг премий на бессрочных фьючерсах.',
    color: '#eab308',
    badge: 'Funding',
    moduleKey: 'C',
    moduleQuestion: 'Каково значение фандинга в 08:00 UTC и есть ли перегрузка длинных/коротких позиций?',
  },
  {
    id: 'us_macro',
    title: 'US Macro Releases: CPI / NFP / PPI (12:30 EDT / 13:30 EST)',
    shortLabel: '📊 US Macro CPI/NFP',
    category: 'MACRO',
    utcHourSummer: 12.5,
    utcHourWinter: 13.5,
    timeStringSummer: '12:30 UTC',
    timeStringWinter: '13:30 UTC',
    description: 'Публикация ключевых данных по инфляции и рынку труда США.',
    btcRelevance: 'Самая волатильная минута дня в дни релизов. Резкие сквизы стакана в обе стороны.',
    memeRelevance: 'КРИТИЧЕСКИЙ РИСК: За 30 минут до релиза ставить паузу на входы в мем-токены.',
    color: '#ec4899',
    badge: 'High Volatility',
    moduleKey: 'D',
    moduleQuestion: 'Какие макро-релизы стоят в календаре (CPI, NFP, PPI) и как рынок исторически реагирует на них в первые 15 минут?',
  },
  {
    id: 'nyse_open',
    title: 'NYSE / Wall Street Открытие (13:30 EDT / 14:30 EST)',
    shortLabel: '🗽 NYSE Open',
    category: 'SESSION_OPEN',
    utcHourSummer: 13.5,
    utcHourWinter: 14.5,
    timeStringSummer: '13:30 UTC',
    timeStringWinter: '14:30 UTC',
    description: 'Старт торгов на фондовых биржах США и активная фаза спотовых Bitcoin ETF.',
    btcRelevance: 'Приток реального институционального американского капитала, сильнейшая корреляция с Nasdaq/SPX.',
    memeRelevance: 'Определение общего аппетита к риску (Risk-on / Risk-off).',
    color: '#f59e0b',
    badge: 'Wall St',
    moduleKey: 'D',
    moduleQuestion: 'Что сделал Nasdaq/S&P на открытии и как сейчас торгуются фьючерсы? Какова корреляция с BTC в NY-сессию?',
  },
  {
    id: 'london_ny_overlap',
    title: 'Лондон / Нью-Йорк Overlap (13:30–16:00 EDT / 14:30–16:30 EST)',
    shortLabel: '⚡ Golden Overlap',
    category: 'SESSION_OPEN',
    utcHourSummer: 14,
    utcHourWinter: 15,
    timeStringSummer: '13:30–16:00 UTC',
    timeStringWinter: '14:30–16:30 UTC',
    description: 'Золотые часы ликвидности: до 65% суточного спотового и деривативного объема.',
    btcRelevance: 'Максимальный объем и наиболее «честные» направленные трендовые движения.',
    memeRelevance: 'Если BTC выходит в тренд, ликвидность отсасывается из альтов в биткоин.',
    color: '#10b981',
    badge: '65% Daily Vol',
    moduleKey: 'A',
    moduleQuestion: 'Кто сейчас за рулем в Golden Overlap и подтверждается ли движение реальным притоком объема и открытого интереса?',
  },
  {
    id: 'funding_16',
    title: 'Funding Rate Window #3 (16:00 UTC)',
    shortLabel: '⚡ Фандинг 16:00',
    category: 'FUNDING',
    utcHourSummer: 16,
    utcHourWinter: 16,
    timeStringSummer: '16:00 UTC',
    timeStringWinter: '16:00 UTC',
    description: 'Третье суточное окно фандинга. Закрытие европейских позиций.',
    btcRelevance: 'Перерасчет кредитных плеч перед закрытием европейских десков.',
    memeRelevance: 'Фиксация спекулятивных позиций.',
    color: '#eab308',
    badge: 'Funding',
    moduleKey: 'C',
    moduleQuestion: 'Какой фандинг зафиксирован в 16:00 UTC и как он соотносится с трендом американской сессии?',
  },
  {
    id: 'fomc_events',
    title: 'FOMC Решение по ставке / Пресс-конференция (18:00/18:30 EDT)',
    shortLabel: '🏛️ FOMC / Fed Rate',
    category: 'MACRO',
    utcHourSummer: 18,
    utcHourWinter: 19,
    timeStringSummer: '18:00 / 18:30 UTC',
    timeStringWinter: '19:00 / 19:30 UTC',
    description: 'Решение ФРС США по процентной ставке и выступление главы ФРС (8 раз в год).',
    btcRelevance: 'Глобальный триггер, способный развернуть среднесрочный и долгосрочный тренд.',
    memeRelevance: 'Полный стоп любых деривативных и высокорисковых сделок.',
    color: '#dc2626',
    badge: 'FOMC Day',
    moduleKey: 'D',
    moduleQuestion: 'Каковы ожидания от FOMC и какие уровни инвалидации тренда сформированы перед решением?',
  },
  {
    id: 'nyse_close',
    title: 'NYSE Закрытие (20:00 EDT / 21:00 EST)',
    shortLabel: '🔔 NYSE Close',
    category: 'SESSION_CLOSE',
    utcHourSummer: 20,
    utcHourWinter: 21,
    timeStringSummer: '20:00 UTC',
    timeStringWinter: '21:00 UTC',
    description: 'Закрытие фондового рынка США. Уход крупных институционалов.',
    btcRelevance: 'Фиксация объемов дня и расчет чистых притоков/оттоков спотовых ETF.',
    memeRelevance: 'Снижение институциональной ликвидности.',
    color: '#f97316',
    badge: 'NYSE Close',
    moduleKey: 'A',
    moduleQuestion: 'Какие результаты дня зафиксированы на закрытии NYSE и кто из крупных участников покидает стол?',
  },
  {
    id: 'etf_flows_pub',
    title: 'Spot ETF Flows Settlement (~20:30–23:00 UTC)',
    shortLabel: '📦 Spot ETF Flows',
    category: 'ETF_FLOWS',
    utcHourSummer: 21,
    utcHourWinter: 22,
    timeStringSummer: '~20:30–23:00 UTC',
    timeStringWinter: '~21:30–00:00 UTC',
    description: 'Публикация суточных отчетов по чистым притокам/оттокам в BTC/ETH Spot ETF (BlackRock, Fidelity и др.).',
    btcRelevance: 'Ключевой сентимент институционалов на следующий торговый день (outflows = давление на NY open).',
    memeRelevance: 'Индикатор общего институционального фона.',
    color: '#8b5cf6',
    badge: 'ETF Inflow/Outflow',
    moduleKey: 'D',
    moduleQuestion: 'Что показали спотовые ETF-потоки за прошлый/текущий день (Net Inflow/Outflow) и как это влияет на настроение на завтра?',
  },
  {
    id: 'cme_futures_close',
    title: 'TradFi Close & CME 24/7 Mode (21:00 EDT / 22:00 EST)',
    shortLabel: '📜 CME 24/7 / TradFi Off',
    category: 'CME',
    utcHourSummer: 21,
    utcHourWinter: 22,
    timeStringSummer: '21:00 UTC',
    timeStringWinter: '22:00 UTC',
    description: 'Закрытие традиционных рынков США и спотовых ETF (IBIT/FBTC). Криптофьючерсы CME с июня 2026 торгуются 24/7 на Globex без классических гэпов выходного дня.',
    btcRelevance: 'CME торгуется 24/7, классический гэп выходного дня устранён. Однако спотовые ETF закрыты, ликвидность выходного дня тоньше.',
    memeRelevance: 'Уход традиционных маркет-мейкеров США на выходные.',
    color: '#6366f1',
    badge: 'CME 24/7',
    moduleKey: 'C',
    moduleQuestion: 'Как ведет себя 24/7 стакан CME на выходных без классического гэпа, и где сосредоточен институциональный открытый интерес?',
  },
  {
    id: 'dead_zone',
    title: 'Мёртвая зона ликвидности (21:00–00:00 UTC)',
    shortLabel: '💀 Мёртвая зона',
    category: 'DEAD_ZONE',
    utcHourSummer: 22.5,
    utcHourWinter: 23,
    timeStringSummer: '21:00–00:00 UTC',
    timeStringWinter: '22:00–00:00 UTC',
    description: 'США закрылись, институционалы ушли, Азия еще спит. Тонкий стакан.',
    btcRelevance: 'Низкая ликвидность: длинные тени свечей, стоп-хантинг, повышенная уязвимость к манипуляциям.',
    memeRelevance: 'Любые пампы мемов в это окно — тонкая ликвидность! Запрет на агрессивный Degen Ape.',
    color: '#64748b',
    badge: 'Thin Liquidity',
    moduleKey: 'E',
    moduleQuestion: 'Если мем растет в мертвую зону (21:00–00:00 UTC) без подтверждения BTC, органика ли это или ловушка тонкого стакана?',
  },
  {
    id: 'cme_sunday_open',
    title: 'Воскресная институциональная фаза (22:00 EDT / 23:00 EST)',
    shortLabel: '🚀 Воскресная фаза',
    category: 'CME',
    utcHourSummer: 22,
    utcHourWinter: 23,
    timeStringSummer: '22:00 UTC (Вс)',
    timeStringWinter: '23:00 UTC (Вс)',
    description: 'Синхронизация глобальных институциональных десков перед стартом азиатской недели. Торги CME идут 24/7 без гэпа.',
    btcRelevance: 'Рост торговой активности и сужение спредов в преддверии понедельника.',
    memeRelevance: 'Перезапуск недельного аппетита к риску.',
    color: '#14b8a6',
    badge: 'Sunday Sync',
    moduleKey: 'C',
    moduleQuestion: 'Каковы объемы и открытый интерес на 24/7 CME перед открытием азиатских рынков в понедельник?',
  },
];

export const sessionService = {
  /**
   * Auto-detect Daylight Saving Time (DST) for USA/Europe
   * (Northern Hemisphere Summer: ~2nd Sunday in March to 1st Sunday in Nov)
   */
  detectDstMode(date = new Date()): DstMode {
    const month = date.getUTCMonth(); // 0 = Jan, 11 = Dec
    if (month > 2 && month < 10) {
      return 'SUMMER'; // Apr to Oct = definitely summer DST
    }
    if (month === 2) {
      // March: 2nd Sunday approx day >= 8
      return date.getUTCDate() >= 10 ? 'SUMMER' : 'WINTER';
    }
    if (month === 10) {
      // Nov: 1st Sunday approx day <= 7
      return date.getUTCDate() < 7 ? 'SUMMER' : 'WINTER';
    }
    return 'WINTER';
  },

  /**
   * Get current UTC time breakdown
   */
  getUtcTimeInfo(date = new Date()) {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const totalMinutes = hours * 60 + minutes;
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} UTC`;
    return { hours, minutes, seconds, totalMinutes, timeFormatted };
  },

  /**
   * Check session active status and time until next change respecting DST
   */
  getSessionStatuses(date = new Date(), dstMode: DstMode = 'SUMMER'): SessionStatus[] {
    const { hours, minutes, totalMinutes } = this.getUtcTimeInfo(date);

    return GLOBAL_SESSIONS.map((session) => {
      let isActive = false;
      const startHour = dstMode === 'SUMMER' ? session.utcStartHourSummer : session.utcStartHourWinter;
      const endHour = dstMode === 'SUMMER' ? session.utcEndHourSummer : session.utcEndHourWinter;
      const startMin = startHour * 60;
      const endMin = endHour * 60;

      let sessionDuration = 0;
      let elapsedMinutes = 0;

      if (startMin < endMin) {
        // Normal within-day range (e.g. 07:00 to 16:00)
        isActive = totalMinutes >= startMin && totalMinutes < endMin;
        sessionDuration = endMin - startMin;
        if (isActive) {
          elapsedMinutes = totalMinutes - startMin;
        }
      } else {
        // Cross-midnight range (e.g. 21:00 to 06:00)
        isActive = totalMinutes >= startMin || totalMinutes < endMin;
        sessionDuration = 24 * 60 - startMin + endMin;
        if (isActive) {
          elapsedMinutes = totalMinutes >= startMin ? totalMinutes - startMin : 24 * 60 - startMin + totalMinutes;
        }
      }

      const progressPercent = isActive ? Math.min(100, Math.max(0, (elapsedMinutes / sessionDuration) * 100)) : 0;

      // Calculate minutes until close or until open
      let minsToNext = 0;
      let nextEventText = '';
      let timeRemainingText = '';

      if (isActive) {
        let minsLeft = 0;
        if (totalMinutes < endMin) {
          minsLeft = endMin - totalMinutes;
        } else {
          minsLeft = 24 * 60 - totalMinutes + endMin;
        }
        minsToNext = minsLeft;
        const hLeft = Math.floor(minsLeft / 60);
        const mLeft = minsLeft % 60;
        timeRemainingText = hLeft > 0 ? `${hLeft}ч ${mLeft}м` : `${mLeft}м`;
        nextEventText = `Закрытие через ${timeRemainingText}`;
      } else {
        let minsToOpen = 0;
        if (totalMinutes < startMin) {
          minsToOpen = startMin - totalMinutes;
        } else {
          minsToOpen = 24 * 60 - totalMinutes + startMin;
        }
        minsToNext = minsToOpen;
        const hOpen = Math.floor(minsToOpen / 60);
        const mOpen = minsToOpen % 60;
        timeRemainingText = hOpen > 0 ? `${hOpen}ч ${mOpen}м` : `${mOpen}м`;
        nextEventText = `Открытие через ${timeRemainingText}`;
      }

      return {
        session,
        isActive,
        isOpeningSoon: !isActive && minsToNext <= 60,
        isClosingSoon: isActive && (sessionDuration - elapsedMinutes) <= 60,
        progressPercent,
        timeRemainingText,
        nextEventText,
        activeStartHour: startHour,
        activeEndHour: endHour,
      };
    });
  },

  /**
   * Determine overlap phase respecting DST
   */
  getCurrentMarketPhase(date = new Date(), dstMode: DstMode = 'SUMMER'): {
    phaseName: string;
    description: string;
    volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
    activeOverlap: string | null;
  } {
    const utcHours = date.getUTCHours();
    const londonOpen = dstMode === 'SUMMER' ? 7 : 8;
    const nyOpen = dstMode === 'SUMMER' ? 12 : 13;
    const nyOverlapEnd = dstMode === 'SUMMER' ? 16 : 16.5;

    if (utcHours >= nyOpen && utcHours < nyOverlapEnd) {
      return {
        phaseName: 'Лондон + Нью-Йорк Оверлап (Golden Hours 65% Vol)',
        description: 'Максимальная ликвидность дня. Пересечение европейского и американского банковских секторов.',
        volatility: 'ULTRA',
        activeOverlap: 'London + New York',
      };
    }
    if (utcHours >= londonOpen && utcHours < londonOpen + 2) {
      return {
        phaseName: 'Токио + Лондон Оверлап',
        description: 'Передача эстафеты ликвидности из Азии в Европу. Начало манипуляций европейского открытия.',
        volatility: 'HIGH',
        activeOverlap: 'Tokyo + London',
      };
    }
    if (utcHours >= nyOpen && utcHours < 21) {
      return {
        phaseName: 'Американская Сессия (Нью-Йорк & CME)',
        description: 'Высокая динамика, реакция на макроэкономику и институциональные потоки спотовых ETF/деривативов.',
        volatility: 'HIGH',
        activeOverlap: null,
      };
    }
    if (utcHours >= londonOpen && utcHours < 16) {
      return {
        phaseName: 'Европейская Сессия (Лондон)',
        description: 'Трендовые пробои и расширение дневного диапазона.',
        volatility: 'HIGH',
        activeOverlap: null,
      };
    }
    if (utcHours >= 0 && utcHours < 9) {
      return {
        phaseName: 'Азиатская Сессия (Asian Range & China Capital)',
        description: 'Формирование начального диапазона консолидации. Золотое окно китайских BSC-мемов.',
        volatility: 'MEDIUM',
        activeOverlap: null,
      };
    }

    return {
      phaseName: 'Мёртвая зона / Межсессионная Фаза (Тонкая ликвидность)',
      description: 'США закрылись, институционалы ушли, Азия спит. Повышенный риск стоп-хантинга и ложных сквизов.',
      volatility: 'LOW',
      activeOverlap: null,
    };
  },

  /**
   * Calculate Institutional Pivots from candle history
   */
  calculateInstitutionalPivots(klines: any[], currentPrice: number): InstitutionalPivots {
    const defaultPivots: InstitutionalPivots = {
      pdh: currentPrice * 1.02 || 0,
      pdl: currentPrice * 0.98 || 0,
      asianHigh: currentPrice * 1.01 || 0,
      asianLow: currentPrice * 0.99 || 0,
      asianRangeSizeUsd: currentPrice * 0.02 || 0,
      asianRangePercent: 2.0,
      midnightOpen: currentPrice || 0,
      currentPrice: currentPrice || 0,
      equilibrium50: currentPrice || 0,
      marketZone: 'EQUILIBRIUM',
      distanceToPdhPercent: 2.0,
      distanceToPdlPercent: 2.0,
      liquidityBias: 'RANGE_BOUND',
      coPilotInsight: 'Идет калибровка опорных уровней ликвидности...',
    };

    if (!klines || klines.length < 5 || currentPrice <= 0) {
      return defaultPivots;
    }

    const now = Date.now();
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    const todayMidnightTs = todayUtc.getTime();
    const yesterdayMidnightTs = todayMidnightTs - 24 * 60 * 60 * 1000;

    // 1. Previous Day High & Low
    const yesterdayCandles = klines.filter(
      (k) => k.time >= yesterdayMidnightTs && k.time < todayMidnightTs
    );

    let pdh = 0;
    let pdl = Infinity;
    if (yesterdayCandles.length > 0) {
      pdh = Math.max(...yesterdayCandles.map((k) => k.high));
      pdl = Math.min(...yesterdayCandles.map((k) => k.low));
    } else {
      // Fallback from recent klines
      const slice = klines.slice(Math.max(0, klines.length - 48));
      pdh = Math.max(...slice.map((k) => k.high));
      pdl = Math.min(...slice.map((k) => k.low));
    }

    // 2. Today's Midnight UTC Open
    const todayCandles = klines.filter((k) => k.time >= todayMidnightTs);
    let midnightOpen = currentPrice;
    if (todayCandles.length > 0) {
      midnightOpen = todayCandles[0].open;
    }

    // 3. Asian Range (00:00 to 08:00 UTC today)
    const asianEndTs = todayMidnightTs + 8 * 60 * 60 * 1000;
    const asianCandles = klines.filter(
      (k) => k.time >= todayMidnightTs && k.time <= Math.min(now, asianEndTs)
    );

    let asianHigh = midnightOpen * 1.008;
    let asianLow = midnightOpen * 0.992;
    if (asianCandles.length > 0) {
      asianHigh = Math.max(...asianCandles.map((k) => k.high));
      asianLow = Math.min(...asianCandles.map((k) => k.low));
    }

    const asianRangeSizeUsd = Math.max(0, asianHigh - asianLow);
    const asianRangePercent = asianLow > 0 ? (asianRangeSizeUsd / asianLow) * 100 : 0;

    // 4. 50% Equilibrium of Day / Yesterday Range
    const eq = (pdh + pdl) / 2;
    const marketZone: 'PREMIUM' | 'DISCOUNT' | 'EQUILIBRIUM' =
      currentPrice > eq * 1.003
        ? 'PREMIUM'
        : currentPrice < eq * 0.997
        ? 'DISCOUNT'
        : 'EQUILIBRIUM';

    const distanceToPdhPercent = pdh > 0 ? ((pdh - currentPrice) / currentPrice) * 100 : 0;
    const distanceToPdlPercent = currentPrice > 0 ? ((currentPrice - pdl) / currentPrice) * 100 : 0;

    // 5. Co-Pilot Liquidity Bias
    let liquidityBias: 'BULLISH_EXPANSION' | 'BEARISH_EXPANSION' | 'ASIAN_SWEEP_REVERSAL' | 'RANGE_BOUND' = 'RANGE_BOUND';
    let coPilotInsight = '';

    if (currentPrice > asianHigh && currentPrice > midnightOpen) {
      liquidityBias = 'BULLISH_EXPANSION';
      coPilotInsight = `Цена торгуется выше Midnight Open ($${midnightOpen.toFixed(2)}) и пробила Asian High ($${asianHigh.toFixed(2)}). Рынок находится в бычьей фазе институциональной экспансии с магнитом ликвидности на PDH ($${pdh.toFixed(2)}).`;
    } else if (currentPrice < asianLow && currentPrice < midnightOpen) {
      liquidityBias = 'BEARISH_EXPANSION';
      coPilotInsight = `Цена удерживается ниже Midnight Open ($${midnightOpen.toFixed(2)}) и опустилась под Asian Low ($${asianLow.toFixed(2)}). Доминирует медвежья экспансия, ключевой пул ликвидности продавцов на PDL ($${pdl.toFixed(2)}).`;
    } else if (currentPrice > asianHigh && currentPrice < pdh) {
      liquidityBias = 'ASIAN_SWEEP_REVERSAL';
      coPilotInsight = `Зафиксировано снятие ликвидности выше Азиатского максимума ($${asianHigh.toFixed(2)}). В зоне Премиум возможна реакция крупных игроков на возврат к 50% EQ ($${eq.toFixed(2)}).`;
    } else {
      liquidityBias = 'RANGE_BOUND';
      coPilotInsight = `Котировки консолидируются внутри диапазона между PDL ($${pdl.toFixed(2)}) и PDH ($${pdh.toFixed(2)}). Оптимально дождаться импульса на стыке торговых сессий.`;
    }

    return {
      pdh,
      pdl,
      asianHigh,
      asianLow,
      asianRangeSizeUsd,
      asianRangePercent,
      midnightOpen,
      currentPrice,
      equilibrium50: eq,
      marketZone,
      distanceToPdhPercent,
      distanceToPdlPercent,
      liquidityBias,
      coPilotInsight,
    };
  },

  /**
   * Calculate btc_regime: The Conductor Link between BTC sessions and Meme/Altcoin spillovers
   */
  calculateBtcRegime(
    date = new Date(),
    pivots: InstitutionalPivots,
    dstMode: DstMode = 'SUMMER',
    fundingRate = 0.0001
  ): BtcRegimeInfo {
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const totalMins = utcHours * 60 + utcMinutes;
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

    const macroReleaseHour = dstMode === 'SUMMER' ? 12.5 : 13.5;
    const macroReleaseMins = macroReleaseHour * 60;
    const minsToMacro = macroReleaseMins - totalMins;

    // 1. MACRO / VOLATILITY PAUSE CHECK
    if (minsToMacro >= -15 && minsToMacro <= 45) {
      return {
        regimeCode: 'MACRO_PAUSE',
        statusBadge: '🔴 РЕЖИМ ПАУЗЫ (US MACRO)',
        title: 'За 30-45 минут до релиза США (CPI/NFP/PPI)',
        memeRisk: 'EXTREME_VOLATILITY',
        summary: 'Импульс BTC на 2-3% во время макро-релиза может снести высокобетовые мемы на 20-30%. Запрет на вход в новые позиции.',
        recommendedAction: 'Пауза на входы в мем-токены до стабилизации первого импульса после 13:30/14:30 UTC.',
        nextEventLabel: 'US Macro CPI/NFP',
        minutesToNextEvent: Math.max(0, minsToMacro),
        dstMode,
      };
    }

    // 2. DEAD ZONE OR WEEKEND CHECK
    if ((utcHours >= 21 || utcHours < 0) || isWeekend) {
      return {
        regimeCode: 'DEAD_ZONE_WARNING',
        statusBadge: '⚠️ МЁРТВАЯ ЗОНА / ТОНКАЯ ЛИКВИДНОСТЬ',
        title: 'США закрылись, Азия спит (21:00–00:00 UTC / Выходные)',
        memeRisk: 'HIGH',
        summary: 'Институциональный капитал вне рынка, отсутствие хеджа CME. Пампы в это окно часто искусственны.',
        recommendedAction: 'Не использовать агрессивный DEGEN_APE. Снижать сайз до $1k, проверять глубину пулов.',
        nextEventLabel: 'Токио Открытие (00:00 UTC)',
        minutesToNextEvent: utcHours >= 21 ? (24 * 60 - totalMins) : 0,
        dstMode,
      };
    }

    // 3. ASIA + BTC IN RANGE + NEUTRAL FUNDING = GREEN LIGHT FOR BSC MEMES
    const isAsiaSession = utcHours >= 0 && utcHours < 9;
    const isBtcRanging = pivots.currentPrice >= pivots.asianLow && pivots.currentPrice <= pivots.asianHigh;
    const isNeutralFunding = Math.abs(fundingRate) <= 0.0003;

    if (isAsiaSession && (isBtcRanging || pivots.liquidityBias === 'RANGE_BOUND') && isNeutralFunding) {
      return {
        regimeCode: 'GREEN_LIGHT_MEMES',
        statusBadge: '🟢 ЗЕЛЁНЫЙ СВЕТ ДЛЯ КИТАЙСКИХ МЕМОВ (BSC)',
        title: 'Азия (01:00–08:00 UTC) + Спокойный BTC в рейндже',
        memeRisk: 'LOW',
        summary: 'Идеальные рыночные условия для органических пампов китайских BSC-мемов (牛来, MarsCoin, CASHCAT). Ликвидность перетекает из стабильного BTC в альт-риск.',
        recommendedAction: 'Порог Final Score для алертов снижается (с 80 до 70). Благоприятное окно для удержания позиций.',
        nextEventLabel: 'Лондон Открытие (07:00 UTC)',
        minutesToNextEvent: Math.max(0, (dstMode === 'SUMMER' ? 7 : 8) * 60 - totalMins),
        dstMode,
      };
    }

    // 4. LONDON BROKE ASIAN RANGE WITHOUT RETURN -> WAIT NY
    const isLondonSession = utcHours >= (dstMode === 'SUMMER' ? 7 : 8) && utcHours < (dstMode === 'SUMMER' ? 13 : 14);
    if (isLondonSession && (pivots.currentPrice > pivots.asianHigh || pivots.currentPrice < pivots.asianLow)) {
      return {
        regimeCode: 'WAIT_NY',
        statusBadge: '🟡 РЕЖИМ «ЖДАТЬ NY» (Judas Swing Risk)',
        title: 'Лондон пробил азиатский диапазон',
        memeRisk: 'MEDIUM',
        summary: 'Европейский импульс может быть ложным выносом стопов (Judas Swing). Мемы могут дать резкий выброс, но подтверждение тренда произойдет только после 13:30 UTC.',
        recommendedAction: 'Ждать открытия NYSE / Overlap (13:30 UTC) для подтверждения направления дня.',
        nextEventLabel: 'NYSE Открытие (13:30 UTC)',
        minutesToNextEvent: Math.max(0, (dstMode === 'SUMMER' ? 13.5 : 14.5) * 60 - totalMins),
        dstMode,
      };
    }

    // 5. STANDARD INSTITUTIONAL EXPANSION
    return {
      regimeCode: 'STANDARD_TREND',
      statusBadge: '🔵 СТАНДАРТНЫЙ ИНСТИТУЦИОНАЛЬНЫЙ ТРЕКИНГ',
      title: 'Активная торговля в рамках сессионных коридоров',
      memeRisk: 'MEDIUM',
      summary: 'BTC движется в соответствии с балансом деривативов и открытого интереса. Высокая синхронизация с американскими индексами.',
      recommendedAction: 'Следить за Taker CVD дельтой и перекрытием сессий.',
      nextEventLabel: 'Следующее окно фандинга',
      minutesToNextEvent: 120,
      dstMode,
    };
  },

  /**
   * Status of Weekend & 24/7 CME Crypto Trading / TradFi Equity Markets
   * Note: Starting June 2026, CME Group officially launched 24/7 continuous trading
   * for Bitcoin and Ether futures/options on Globex. The traditional multi-day weekend CME gap
   * has been eliminated!
   * However:
   * 1. Saturday has a 2-hour maintenance window (07:00–09:00 UTC Summer / 08:00–10:00 UTC Winter).
   * 2. US Spot ETFs (IBIT, FBTC) & TradFi cash equities remain closed over the weekend.
   * 3. Weekend depth on CME is thinner than weekday Wall St hours.
   */
  getWeekendMarketStatus(date = new Date(), dstMode: DstMode = 'SUMMER') {
    const day = date.getUTCDay(); // 0 = Sun, 1 = Mon, ... 5 = Fri, 6 = Sat
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60;

    // Saturday Maintenance window on CME: 2:00 to 4:00 AM CT
    // In UTC Summer (CT = UTC-5): 07:00 to 09:00 UTC
    // In UTC Winter (CT = UTC-6): 08:00 to 10:00 UTC
    const maintStartUtc = dstMode === 'SUMMER' ? 7 : 8;
    const maintEndUtc = dstMode === 'SUMMER' ? 9 : 10;
    const isSaturdayMaintenance = day === 6 && hour >= maintStartUtc && hour < maintEndUtc;

    // TradFi & Spot ETF weekend closure: Friday 20:00/21:00 UTC to Monday 13:30/14:30 UTC
    const isFridayTradFiClosed = day === 5 && hour >= (dstMode === 'SUMMER' ? 20 : 21);
    const isWeekend = day === 0 || day === 6 || isFridayTradFiClosed;

    if (isSaturdayMaintenance) {
      const minutesLeft = Math.max(1, Math.round((maintEndUtc - hour) * 60));
      return {
        isWeekend: true,
        isCmeMaintenance: true,
        cme24x7Active: false,
        isTradFiClosed: true,
        classicGapEliminated: true,
        statusText: 'CME Техперерыв (02:00–04:00 CT)',
        badgeText: '⚙️ CME Globex Maint (2ч)',
        reason: 'Плановое субботнее техокно CME Globex (2 часа). Торги фьючерсами возобновятся автоматически.',
        nextOpenText: `Возобновление 24/7 торгов через ${minutesLeft}м`,
      };
    }

    if (isWeekend) {
      return {
        isWeekend: true,
        isCmeMaintenance: false,
        cme24x7Active: true,
        isTradFiClosed: true,
        classicGapEliminated: true,
        statusText: 'CME 24/7 активен (без гэпов) | TradFi & ETF закрыты',
        badgeText: '🟢 CME 24/7 (Без гэпов) | ETF OFF',
        reason: 'CME фьючерсы торгуются 24/7 (классический гэп устранён). Спотовые ETF (IBIT) и акции закрыты до понедельника.',
        nextOpenText: 'Открытие спотовых ETF США в понедельник 13:30 UTC',
      };
    }

    return {
      isWeekend: false,
      isCmeMaintenance: false,
      cme24x7Active: true,
      isTradFiClosed: false,
      classicGapEliminated: true,
      statusText: 'Все рынки активны (CME 24/7 + TradFi + Spot ETF)',
      badgeText: '🟢 Торги активны',
      reason: 'Полная институциональная ликвидность на деривативах CME и спотовых ETF.',
      nextOpenText: 'Штатный режим',
    };
  },

  /**
   * Legacy helper adapted for modern 24/7 CME reality
   */
  isWeekendCmeClosed(date = new Date(), dstMode: DstMode = 'SUMMER'): {
    isClosed: boolean;
    isCme24x7Active: boolean;
    isCmeMaintenance: boolean;
    reason: string;
    nextOpenText: string;
    opensInHours: number;
  } {
    const status = this.getWeekendMarketStatus(date, dstMode);
    return {
      isClosed: status.isTradFiClosed && status.isWeekend,
      isCme24x7Active: status.cme24x7Active,
      isCmeMaintenance: status.isCmeMaintenance,
      reason: status.reason,
      nextOpenText: status.nextOpenText,
      opensInHours: 0,
    };
  },

  /**
   * Get the single next upcoming institutional timeline event with live timing
   */
  getNextInstitutionalEventInfo(date = new Date(), dstMode: DstMode = 'SUMMER') {
    const currentTotalSeconds =
      date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();

    const events = SESSION_TIMELINE_EVENTS.map((evt) => {
      const hourVal = dstMode === 'SUMMER' ? evt.utcHourSummer : evt.utcHourWinter;
      const timeStr = dstMode === 'SUMMER' ? evt.timeStringSummer : evt.timeStringWinter;
      const eventTotalSeconds = Math.round(hourVal * 3600);

      const secondsDiff = eventTotalSeconds - currentTotalSeconds;
      const isActiveNow = Math.abs(secondsDiff) <= 15 * 60; // ±15 minutes window

      let secondsUntil = secondsDiff;
      if (secondsUntil < -15 * 60) {
        secondsUntil += 86400; // Tomorrow's cycle
      }

      return {
        ...evt,
        hourVal,
        timeStr,
        secondsUntil,
        isActiveNow,
        minutesUntil: Math.round(secondsUntil / 60),
      };
    });

    events.sort((a, b) => a.secondsUntil - b.secondsUntil);
    const nextEvent = events[0] || null;

    return {
      nextEvent,
      allEvents: events,
    };
  },

  /**
   * Funding & Liquidation Volatility Index calculation
   */
  getFundingVolatilityAnalysis(fundingRate: number): {
    isExtreme: boolean;
    level: 'NORMAL' | 'ELEVATED' | 'EXTREME';
    riskSide: 'NEUTRAL' | 'LONG_SQUEEZE_RISK' | 'SHORT_SQUEEZE_RISK';
    label: string;
    warningText: string;
  } {
    const absRate = Math.abs(fundingRate);

    if (absRate >= 0.0004) { // >= +0.04% or <= -0.04%
      const riskSide = fundingRate > 0 ? 'LONG_SQUEEZE_RISK' : 'SHORT_SQUEEZE_RISK';
      return {
        isExtreme: true,
        level: 'EXTREME',
        riskSide,
        label: fundingRate > 0 ? '🔥 ПЕРЕГРЕВ ЛОНГОВ' : '🔥 ПЕРЕГРЕВ ШОРТОВ',
        warningText: fundingRate > 0
          ? 'Фандинг перегрет в лонг (>+0.04%). Высокая вероятность лонгового сквиза перед окном списания!'
          : 'Фандинг сильно отрицательный (<-0.04%). Риск шорт-сквиза при отскоке цены вверх!',
      };
    }

    if (absRate >= 0.0002) { // >= +0.02%
      const riskSide = fundingRate > 0 ? 'LONG_SQUEEZE_RISK' : 'SHORT_SQUEEZE_RISK';
      return {
        isExtreme: false,
        level: 'ELEVATED',
        riskSide,
        label: fundingRate > 0 ? '⚠️ Лонги платят' : '⚠️ Шорты платят',
        warningText: 'Повышенная ставка фандинга. Следите за давлением на расчетных часах (00:00, 08:00, 16:00 UTC).',
      };
    }

    return {
      isExtreme: false,
      level: 'NORMAL',
      riskSide: 'NEUTRAL',
      label: 'Баланс деривативов',
      warningText: 'Ставка финансирования в пределах нормы. Риск аномального сквиза минимален.',
    };
  },
};

