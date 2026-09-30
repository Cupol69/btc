import React, { useEffect, useState, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Radio,
  BarChart3,
  Search,
  AlertCircle,
  Maximize2,
  Minimize2,
  Monitor,
  Globe,
  SlidersHorizontal,
  Star,
  Palette,
  Check,
  ChevronDown,
  Sparkles,
  Flame,
  Cpu,
  Trophy,
  Activity,
  Bell,
  BellOff,
  Clock,
  ShieldAlert,
  Share2,
} from 'lucide-react';
import { Ticker24h, PremiumIndex } from '../types';
import { rateLimiter } from '../services/rateLimiter';
import { binanceWs } from '../services/binanceWs';
import { symbolService, CHINESE_MEME_TOKENS } from '../services/symbolService';
import { sessionService } from '../services/sessionService';
import { soundService } from '../services/soundService';
import { LiveFeedsStatusLights } from './LiveFeedsStatusLights';
import { RobinhoodChainExplorerModal } from './RobinhoodChainExplorerModal';

export type DashboardTab = 'TERMINAL' | 'MEME_FILTER' | 'DEX_ALPHA_HUB' | 'BINANCE_ALPHA' | 'SESSIONS_MAP' | 'DEX_ONCHAIN' | 'BSTOCKS_SPRINT' | 'KNOWLEDGE_GRAPH';
export type ThemeKey = 'british' | 'bohemian' | 'onyx' | 'cyber' | 'nordic' | 'desert' | 'tokyo' | 'emerald';

interface ThemeOption {
  id: ThemeKey;
  name: string;
  tag: string;
  previewDot: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'british',
    name: '🇬🇧 Английский Джентльменский',
    tag: 'British Racing Green & Brass',
    previewDot: 'bg-[#1a4d33] border-[#d4af37]',
  },
  {
    id: 'bohemian',
    name: '🍷 Богема & Коньяк',
    tag: 'Burgundy & Warm Amber',
    previewDot: 'bg-[#7b1d47] border-[#e59b4c]',
  },
  {
    id: 'onyx',
    name: '🌑 Титановый Монохром',
    tag: 'Stealth Onyx & Platinum',
    previewDot: 'bg-[#1c1f28] border-[#94a3b8]',
  },
  {
    id: 'cyber',
    name: '🔵 Cyber Navy',
    tag: 'Classic Dark Slate & Indigo',
    previewDot: 'bg-indigo-600 border-cyan-400',
  },
  {
    id: 'nordic',
    name: '❄️ Скандинавский Ледник',
    tag: 'Deep Arctic Slate & Frost Cyan',
    previewDot: 'bg-[#0b1926] border-[#38bdf8]',
  },
  {
    id: 'desert',
    name: '🏜️ Пустынный Янтарь',
    tag: 'Warm Terracotta & Dune Gold',
    previewDot: 'bg-[#26150b] border-[#f59e0b]',
  },
  {
    id: 'tokyo',
    name: '🌸 Токио Неон',
    tag: 'Midnight Obsidian & Synthwave Violet',
    previewDot: 'bg-[#1a0f2e] border-[#ec4899]',
  },
  {
    id: 'emerald',
    name: '🟢 Терминал Bloomberg',
    tag: 'Phosphor Green & Cyber Matrix',
    previewDot: 'bg-[#061a10] border-[#10b981]',
  },
];

interface HeaderProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  ticker: Ticker24h | null;
  premiumIndex: PremiumIndex | null;
  hasFutures: boolean;
  activeInterval: string;
  onIntervalChange: (interval: string) => void;
  onManualRefresh: () => void;
  isLoading: boolean;
  onSearchError?: (msg: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isWidescreen?: boolean;
  onToggleWidescreen?: () => void;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  onOpenMcpModal?: () => void;
  onSwitchToSite?: () => void;
}

export const TIMEFRAMES = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
];

export const Header: React.FC<HeaderProps> = ({
  currentSymbol,
  onSymbolChange,
  ticker,
  premiumIndex,
  hasFutures,
  activeInterval,
  onIntervalChange,
  onManualRefresh,
  isLoading,
  onSearchError,
  isFullscreen = false,
  onToggleFullscreen,
  isWidescreen = true,
  onToggleWidescreen,
  activeTab = 'TERMINAL',
  onTabChange,
  onOpenMcpModal,
  onSwitchToSite,
}) => {
  const [rateStatus, setRateStatus] = useState(rateLimiter.getStatus());
  const [wsStatus, setWsStatus] = useState({ spot: false, futures: false });
  const [isFavorite, setIsFavorite] = useState<boolean>(() => symbolService.isFavorite('BTCUSDT'));
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('british');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundService.isEnabled());
  const [isRobinhoodModalOpen, setIsRobinhoodModalOpen] = useState<boolean>(false);

  // 1-second tick for live clock, countdowns, and background sound alert triggers
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const eventInfo = sessionService.getNextInstitutionalEventInfo(now);
      if (eventInfo.nextEvent) {
        soundService.checkAndTriggerEventAudio(
          eventInfo.nextEvent.id,
          eventInfo.nextEvent.secondsUntil,
          eventInfo.nextEvent.isActiveNow
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Dedicated Bitcoin State (always displayed in top bar)
  const [btcTicker, setBtcTicker] = useState<Ticker24h | null>(() => {
    if (ticker && (ticker.symbol === 'BTCUSDT' || ticker.symbol === 'BTC')) {
      return ticker;
    }
    return null;
  });
  const [btcPremiumIndex, setBtcPremiumIndex] = useState<PremiumIndex | null>(() => {
    if (premiumIndex && (premiumIndex.symbol === 'BTCUSDT' || premiumIndex.symbol === 'BTC')) {
      return premiumIndex;
    }
    return null;
  });

  useEffect(() => {
    if (ticker && (ticker.symbol === 'BTCUSDT' || ticker.symbol === 'BTC')) {
      setBtcTicker(ticker);
    }
  }, [ticker]);

  useEffect(() => {
    if (premiumIndex && (premiumIndex.symbol === 'BTCUSDT' || premiumIndex.symbol === 'BTC')) {
      setBtcPremiumIndex(premiumIndex);
    }
  }, [premiumIndex]);

  // Dedicated continuous sync for Bitcoin (BTCUSDT) in the header
  useEffect(() => {
    let isMounted = true;
    const fetchBtcData = async () => {
      try {
        const [tRes, pRes] = await Promise.allSettled([
          fetch('/api/ticker/24hr?symbol=BTCUSDT').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/futures/premiumIndex?symbol=BTCUSDT').then((r) => (r.ok ? r.json() : null)),
        ]);
        if (!isMounted) return;
        if (tRes.status === 'fulfilled' && tRes.value && !tRes.value.error) {
          setBtcTicker(tRes.value);
        }
        if (pRes.status === 'fulfilled' && pRes.value && !pRes.value.error) {
          setBtcPremiumIndex(pRes.value);
        }
      } catch (e) {
        console.warn('[Header] Failed to fetch live BTC header metrics:', e);
      }
    };

    fetchBtcData();
    const interval = setInterval(fetchBtcData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('terminal_theme') as ThemeKey;
    const isValidTheme = THEMES.some((t) => t.id === saved);
    const themeToUse = isValidTheme ? saved : 'british';
    setCurrentTheme(themeToUse);
    document.documentElement.setAttribute('data-theme', themeToUse);
  }, []);

  const handleThemeSelect = (themeId: ThemeKey) => {
    setCurrentTheme(themeId);
    localStorage.setItem('terminal_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    setIsThemeMenuOpen(false);
  };

  useEffect(() => {
    setIsFavorite(symbolService.isFavorite('BTCUSDT'));
  }, []);

  const handleToggleFavorite = () => {
    const updated = symbolService.toggleFavorite('BTCUSDT');
    setIsFavorite(updated.includes('BTCUSDT'));
  };

  useEffect(() => {
    const unsubRate = rateLimiter.subscribe((status) => {
      setRateStatus(status);
    });
    const unsubWs = binanceWs.onConnectionChange((status) => {
      setWsStatus(status);
    });
    return () => {
      unsubRate();
      unsubWs();
    };
  }, []);

  // Bitcoin display metrics calculation
  const activeBtcTicker = btcTicker || (ticker && (ticker.symbol === 'BTCUSDT' || ticker.symbol === 'BTC') ? ticker : null);
  const activeBtcPremium = btcPremiumIndex || (premiumIndex && (premiumIndex.symbol === 'BTCUSDT' || premiumIndex.symbol === 'BTC') ? premiumIndex : null);

  const btcPrice = activeBtcTicker ? parseFloat(activeBtcTicker.lastPrice) : (activeBtcPremium ? parseFloat(activeBtcPremium.markPrice) : (ticker ? parseFloat(ticker.lastPrice) : 0));
  const btcChangePercent = activeBtcTicker ? parseFloat(activeBtcTicker.priceChangePercent) : (ticker ? parseFloat(ticker.priceChangePercent) : 0);
  const isBtcPositive = btcChangePercent >= 0;
  const btcHigh24h = activeBtcTicker ? parseFloat(activeBtcTicker.highPrice) : (ticker ? parseFloat(ticker.highPrice) : 0);
  const btcLow24h = activeBtcTicker ? parseFloat(activeBtcTicker.lowPrice) : (ticker ? parseFloat(ticker.lowPrice) : 0);
  const btcVolume24hUsd = activeBtcTicker ? parseFloat(activeBtcTicker.quoteVolume) : (ticker ? parseFloat(ticker.quoteVolume) : 0);
  const btcFundingRate = activeBtcPremium ? parseFloat(activeBtcPremium.lastFundingRate) * 100 : (premiumIndex ? parseFloat(premiumIndex.lastFundingRate) * 100 : 0.01);

  // Institutional Timeline & Volatility calculations
  const nextEventInfo = useMemo(() => {
    return sessionService.getNextInstitutionalEventInfo(currentTime);
  }, [currentTime]);

  const weekendInfo = useMemo(() => {
    return sessionService.isWeekendCmeClosed(currentTime);
  }, [currentTime]);

  const fundingVolatility = useMemo(() => {
    return sessionService.getFundingVolatilityAnalysis((btcFundingRate || 0) / 100);
  }, [btcFundingRate]);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
    if (minutes > 0) return `${minutes}м ${seconds}с`;
    return `${seconds}с`;
  };

  // Next funding countdown calculation
  const btcNextFundingTime = activeBtcPremium?.nextFundingTime ? activeBtcPremium.nextFundingTime : (premiumIndex?.nextFundingTime || 0);
  const btcMinutesToFunding = btcNextFundingTime > Date.now() ? Math.round((btcNextFundingTime - Date.now()) / 60000) : 0;

  const usedWeightPercent = Math.min(100, Math.round((rateStatus.usedWeight / rateStatus.maxWeight) * 100));

  return (
    <header id="dashboard-header" className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      {/* Top Banner */}
      <div className={`${isWidescreen ? 'max-w-[2100px]' : 'max-w-7xl'} mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 transition-all duration-300`}>
        {/* Left: Compact Branding & Always-Visible Institutional Intelligence Statuses */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">Binance Analytics</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xl:block leading-none mt-0.5">Derivatives & Session Intelligence</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Institutional Intelligence & Alert Nexus (Always Visible on Top) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Weekend / CME status OR Active Event Status */}
            {weekendInfo.isCmeMaintenance ? (
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('SESSIONS_MAP')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono cursor-pointer hover:bg-rose-500/25 transition shadow-sm"
                title={`${weekendInfo.reason}. Нажмите для открытия AI × Trader Nexus.`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span className="font-bold whitespace-nowrap">⚙️ CME Globex Maint (2ч)</span>
                <span className="text-[10px] text-slate-400 hidden 2xl:inline">{weekendInfo.nextOpenText}</span>
              </button>
            ) : weekendInfo.isClosed ? (
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('SESSIONS_MAP')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono cursor-pointer hover:bg-emerald-500/20 transition shadow-sm"
                title={`${weekendInfo.reason}. Нажмите для открытия AI × Trader Nexus.`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold whitespace-nowrap">🟢 CME 24/7 (Без гэпов)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold hidden xl:inline">
                  ETF OFF
                </span>
              </button>
            ) : nextEventInfo.nextEvent?.isActiveNow ? (
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('SESSIONS_MAP')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-mono cursor-pointer hover:bg-rose-500/30 transition shadow-sm animate-pulse"
                title="Событие идет сейчас (окно ±15м)! Нажмите для перехода в Nexus."
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold whitespace-nowrap">🔥 {nextEventInfo.nextEvent.title}</span>
                <span className="bg-rose-600 text-white font-black text-[9px] px-1 py-0.2 rounded">СЕЙЧАС</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('SESSIONS_MAP')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono cursor-pointer hover:bg-blue-500/20 transition shadow-sm group"
                title="Нажмите для перехода в AI × Trader Nexus"
              >
                <Clock className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-12 transition-transform" />
                <span className="text-slate-400 hidden sm:inline">Ближайшее:</span>
                <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">{nextEventInfo.nextEvent?.title}</span>
                <span className="text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30 text-[11px] whitespace-nowrap">
                  через {formatCountdown(nextEventInfo.nextEvent?.secondsUntil || 0)}
                </span>
              </button>
            )}

            {/* Funding Squeeze Risk pill if elevated/extreme */}
            {fundingVolatility.isExtreme && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono animate-pulse"
                title={fundingVolatility.warningText}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold whitespace-nowrap">{fundingVolatility.label}</span>
              </div>
            )}

            {/* Audio alerts toggle button */}
            <button
              id="header-sound-toggle-btn"
              type="button"
              onClick={() => {
                const next = soundService.toggle();
                setSoundEnabled(next);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'Звуковые алерты институциональных событий ВКЛ (клик для выключения)' : 'Звуковые алерты институциональных событий ВЫКЛ (клик для включения)'}
            >
              {soundEnabled ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline text-[11px] font-semibold">Алерты: ВКЛ</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline text-[11px] text-slate-500">Алерты: ВЫКЛ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center: Live Bitcoin (BTC) Price & Key Metrics (Always displays Bitcoin) */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-baseline gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-750">
                BTC
              </span>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`p-1 rounded transition cursor-pointer ${
                  isFavorite
                    ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                    : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                }`}
                title={isFavorite ? 'Убрать BTC из избранного' : 'Добавить BTC в избранное (⭐)'}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <span className="text-xs text-slate-300 font-sans font-medium hidden sm:inline">
                Bitcoin
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold font-mono text-white">
              ${btcPrice != null && !isNaN(btcPrice) && btcPrice > 0 ? (btcPrice >= 1 ? btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : btcPrice.toFixed(5)) : '—'}
            </span>
            <span
              className={`inline-flex items-center text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                isBtcPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isBtcPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {isBtcPositive ? '+' : ''}{btcChangePercent.toFixed(2)}%
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400 border-l border-slate-800 pl-4">
            <div>
              <span className="text-slate-500 block text-[10px]">24h High/Low</span>
              <span className="text-slate-300">
                ${(btcHigh24h || 0) >= 1 ? (btcHigh24h || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (btcHigh24h || 0).toFixed(5)} / ${(btcLow24h || 0) >= 1 ? (btcLow24h || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (btcLow24h || 0).toFixed(5)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">24h Volume</span>
              <span className="text-slate-300">${(btcVolume24hUsd / 1_000_000).toFixed(1)}M</span>
            </div>
            {btcFundingRate !== 0 || activeBtcPremium ? (
              <div>
                <span className="text-slate-500 block text-[10px]">Funding Rate (8h)</span>
                <span className={btcFundingRate >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {btcFundingRate >= 0 ? '+' : ''}{btcFundingRate.toFixed(4)}%
                  <span className="text-[10px] text-slate-500 ml-1 font-normal">({btcMinutesToFunding}m)</span>
                </span>
              </div>
            ) : (
              <div className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-[10px] text-amber-300 font-mono">
                Spot Only
              </div>
            )}
          </div>
        </div>

        {/* Right: WS, Rate Limit & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {/* Direct SoSoValue Spot ETF Live Tracker (External verified source without cache/delays) */}
          <a
            href="https://sosovalue.com/assets/etf/us-btc-spot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-750 border border-emerald-500/30 hover:border-emerald-500/60 text-[11px] font-mono text-slate-200 transition group"
            title="Открыть верифицированные живые потоки Spot ETF США на SoSoValue без локального кэша и задержек"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400 group-hover:text-slate-200">SoSoValue:</span>
            <span className="font-bold text-emerald-400">Spot ETF ↗</span>
          </a>

          {/* RobinScan (Robinhood Chain Explorer by Etherscan) */}
          <button
            type="button"
            onClick={() => setIsRobinhoodModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 transition cursor-pointer"
            title="RobinScan — официальный блок-эксплорер сети Robinhood Chain (Arbitrum Orbit L2, Chain ID 4663) от команды Etherscan"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold hidden sm:inline">RobinScan</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-bold">Etherscan</span>
          </button>

          {/* Rate limit pill */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300"
            title={`Binance Rate Limit: ${rateStatus.usedWeight} / ${rateStatus.maxWeight} weight/min (Section 4)`}
          >
            <Zap className={`w-3 h-3 ${usedWeightPercent > 70 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400 hidden sm:inline">Weight:</span>
            <span className={`font-semibold ${usedWeightPercent > 70 ? 'text-rose-400' : 'text-slate-200'}`}>
              {rateStatus.usedWeight}
            </span>
            <span className="text-slate-500">/6k</span>
          </div>

          {/* Live Feeds & Infrastructure Status Lights (Bitquery, Binance, DEX, GoPlus, Etherscan, MCP, AI) */}
          <LiveFeedsStatusLights onOpenMcpModal={onOpenMcpModal} />

          {/* Interactive WS Connection Indicator with Instant Reconnect */}
          <button
            id="header-ws-reconnect-btn"
            type="button"
            onClick={() => {
              binanceWs.reconnectNow();
              onManualRefresh();
            }}
            title={wsStatus.spot ? 'WebSocket активен (нажмите для ручного перезапуска стримов)' : 'WebSocket отключен. Нажмите для переподключения'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition ${
              wsStatus.spot
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <Radio className={`w-3 h-3 ${wsStatus.spot ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="font-semibold">{wsStatus.spot ? 'WS LIVE' : 'WS RECONNECT'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wsStatus.spot ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Theme Switcher Button */}
          <div className="relative">
            <button
              id="header-theme-btn"
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs font-mono"
              title="Сменить тему оформления"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {THEMES.find((t) => t.id === currentTheme)?.name?.split(' ')[0] || 'Тема'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 max-h-[420px] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 font-mono">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>🎨 Стиль Оформления</span>
                  <span className="text-[9px] text-amber-400 font-bold">8 тем</span>
                </div>

                {THEMES.map((th) => {
                  const isSelected = th.id === currentTheme;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleThemeSelect(th.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 text-white border border-slate-600'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border ${th.previewDot}`} />
                        <div>
                          <div className="text-xs font-bold">{th.name}</div>
                          <div className="text-[10px] text-slate-400">{th.tag}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            id="header-refresh-btn"
            onClick={onManualRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50"
            title="Обновить данные REST API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Widescreen Toggle Button (27" Layout) */}
          {onToggleWidescreen && (
            <button
              id="header-widescreen-btn"
              type="button"
              onClick={onToggleWidescreen}
              className={`p-1.5 rounded-lg border transition ${
                isWidescreen
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
              }`}
              title={isWidescreen ? 'Широкий экран (27″) активен (клик для компактного)' : 'Включить широкий экран (27″ Ultra-Wide)'}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle Button */}
          {onToggleFullscreen && (
            <button
              id="header-fullscreen-btn"
              type="button"
              onClick={onToggleFullscreen}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition text-xs font-mono font-medium ${
                isFullscreen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200 hover:text-white'
              }`}
              title={isFullscreen ? 'Выйти из полноэкранного режима (Esc / Клик)' : 'На весь экран (27″ Fullscreen)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Свернуть</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline text-amber-400">На весь экран</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar: Terminal, AI × Trader Nexus (Sessions & World Map), Screener Radar */}
      {onTabChange && (
        <div className="border-t border-slate-800/80 bg-slate-950/80 px-3 sm:px-6">
          <div className={`${isWidescreen ? 'max-w-[2100px]' : 'max-w-7xl'} mx-auto flex items-center justify-between gap-2 overflow-x-auto py-1.5 no-scrollbar`}>
            <div className="flex items-center gap-1.5">
              <button
                id="tab-btn-terminal"
                type="button"
                onClick={() => onTabChange('TERMINAL')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                  activeTab === 'TERMINAL'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>1. Терминал</span>
              </button>

              <button
                id="tab-btn-meme-filter"
                type="button"
                onClick={() => onTabChange('MEME_FILTER')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all relative ${
                  activeTab === 'MEME_FILTER'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <span className="text-xs">🎯</span>
                <span>2. MEXC Global</span>
              </button>

              <button
                id="tab-btn-dex-alpha-hub"
                type="button"
                onClick={() => onTabChange('DEX_ALPHA_HUB')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all relative ${
                  activeTab === 'DEX_ALPHA_HUB' || activeTab === 'BINANCE_ALPHA' || activeTab === 'DEX_ONCHAIN'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-extrabold'
                    : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                <span className="text-xs">⚡</span>
                <span>3. DEX & Alpha</span>
              </button>

              <button
                id="tab-btn-bstocks-sprint"
                type="button"
                onClick={() => onTabChange('BSTOCKS_SPRINT')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all relative ${
                  activeTab === 'BSTOCKS_SPRINT'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                    : 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Матрица Ликвидности</span>
              </button>

              <button
                id="tab-btn-sessions"
                type="button"
                onClick={() => onTabChange('SESSIONS_MAP')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all relative ${
                  activeTab === 'SESSIONS_MAP'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/60'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>5. Карта</span>
              </button>

              <button
                id="tab-btn-knowledge-graph"
                type="button"
                onClick={() => onTabChange('KNOWLEDGE_GRAPH')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all relative ${
                  activeTab === 'KNOWLEDGE_GRAPH'
                    ? 'bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 font-black'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>6. Диск</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* RobinScan (Robinhood Chain L2 Explorer by Etherscan) Modal */}
      <RobinhoodChainExplorerModal
        isOpen={isRobinhoodModalOpen}
        onClose={() => setIsRobinhoodModalOpen(false)}
      />
    </header>
  );
};
