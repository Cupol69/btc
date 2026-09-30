import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Activity,
  Layers,
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  Bot,
  User,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Sliders,
  ChevronRight,
  MessageSquare,
  Sun,
  Moon,
  AlertTriangle,
  Radio,
  Calendar,
  Compass,
  Bell,
  BellOff,
  Cpu,
} from 'lucide-react';
import {
  sessionService,
  GLOBAL_SESSIONS,
  SESSION_TIMELINE_EVENTS,
  MarketSession,
  SessionStatus,
  InstitutionalPivots,
  SessionTimelineEvent,
  DstMode,
  BtcRegimeInfo,
} from '../services/sessionService';
import { soundService } from '../services/soundService';
import { Kline } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  model?: string;
}

interface SessionMatrixMapProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  klines: Kline[];
  currentPrice: number;
  onSwitchToTerminalTab?: () => void;
}

// Inline Markdown parser for fast and crisp styling
function formatInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-slate-950 text-amber-300 font-mono text-[11px] border border-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const MarkdownMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 font-sans leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-amber-300 mt-2 mb-1">
              {formatInline(trimmed.replace('#### ', ''))}
            </h4>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-xs font-bold text-white border-b border-slate-750/70 pb-1 mt-2 mb-1.5">
              {formatInline(trimmed.replace('### ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-sm font-bold text-white border-b border-slate-750 pb-1 mt-2.5 mb-1.5">
              {formatInline(trimmed.replace('## ', ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('---')) {
          return <hr key={idx} className="border-slate-800 my-2" />;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5 text-slate-300">
              <span className="text-amber-400 font-bold mt-0.5">•</span>
              <div className="flex-1">{formatInline(trimmed.replace(/^[-*]\s+/, ''))}</div>
            </div>
          );
        }
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5 text-slate-300">
              <span className="text-blue-400 font-mono font-bold">{numMatch[1]}.</span>
              <div className="flex-1">{formatInline(numMatch[2])}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-300">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const SessionMatrixMap: React.FC<SessionMatrixMapProps> = ({
  currentSymbol,
  onSelectSymbol,
  klines,
  currentPrice,
  onSwitchToTerminalTab,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedSessionId, setSelectedSessionId] = useState<string>('london');
  const [manualDstMode, setManualDstMode] = useState<DstMode | 'AUTO'>('AUTO');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // AI Co-Pilot Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Effective DST mode
  const effectiveDstMode = useMemo<DstMode>(() => {
    if (manualDstMode === 'AUTO') {
      return sessionService.detectDstMode(currentTime);
    }
    return manualDstMode;
  }, [manualDstMode, currentTime]);

  const sessionStatuses = useMemo(() => {
    return sessionService.getSessionStatuses(currentTime, effectiveDstMode);
  }, [currentTime, effectiveDstMode]);

  const currentPhase = useMemo(() => {
    return sessionService.getCurrentMarketPhase(currentTime, effectiveDstMode);
  }, [currentTime, effectiveDstMode]);

  const institutionalPivots: InstitutionalPivots = useMemo(() => {
    return sessionService.calculateInstitutionalPivots(klines, currentPrice);
  }, [klines, currentPrice]);

  // BTC Regime for Altcoins & Memes
  const btcRegimeInfo: BtcRegimeInfo = useMemo(() => {
    return sessionService.calculateBtcRegime(currentTime, institutionalPivots, effectiveDstMode);
  }, [currentTime, institutionalPivots, effectiveDstMode]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundService.isEnabled());

  // CME Weekend & TradFi Closure status
  const weekendCmeStatus = useMemo(() => {
    return sessionService.isWeekendCmeClosed(currentTime, effectiveDstMode);
  }, [currentTime, effectiveDstMode]);

  const selectedSession = useMemo(() => {
    return (
      GLOBAL_SESSIONS.find((s) => s.id === selectedSessionId) ||
      GLOBAL_SESSIONS[1]
    );
  }, [selectedSessionId]);

  const selectedSessionStatus = useMemo(() => {
    return sessionStatuses.find((s) => s.session.id === selectedSessionId);
  }, [sessionStatuses, selectedSessionId]);

  const utcTimeFormatted = useMemo(() => {
    const h = String(currentTime.getUTCHours()).padStart(2, '0');
    const m = String(currentTime.getUTCMinutes()).padStart(2, '0');
    const s = String(currentTime.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s} UTC`;
  }, [currentTime]);

  const mskTimeFormatted = useMemo(() => {
    return currentTime.toLocaleTimeString('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [currentTime]);

  // Current day progress in percentage (0 to 100%) for the 24h timeline indicator
  const currentUtcProgress = useMemo(() => {
    const utcHours = currentTime.getUTCHours();
    const utcMinutes = currentTime.getUTCMinutes();
    const utcSeconds = currentTime.getUTCSeconds();
    const totalSeconds = utcHours * 3600 + utcMinutes * 60 + utcSeconds;
    return (totalSeconds / 86400) * 100;
  }, [currentTime]);

  // Dynamic calculations for all timeline events relative to live currentTime (1-second tick)
  const eventsWithRelativeTime = useMemo(() => {
    const currentTotalSeconds =
      currentTime.getUTCHours() * 3600 +
      currentTime.getUTCMinutes() * 60 +
      currentTime.getUTCSeconds();

    return SESSION_TIMELINE_EVENTS.map((evt) => {
      const hourVal = effectiveDstMode === 'SUMMER' ? evt.utcHourSummer : evt.utcHourWinter;
      const timeStr = effectiveDstMode === 'SUMMER' ? evt.timeStringSummer : evt.timeStringWinter;
      const leftPct = (hourVal / 24) * 100;
      const eventTotalSeconds = Math.round(hourVal * 3600);

      const secondsDiff = eventTotalSeconds - currentTotalSeconds;
      // Active event window: ±15 minutes
      const isActiveNow = Math.abs(secondsDiff) <= 15 * 60;

      let secondsUntil = secondsDiff;
      if (secondsUntil < -15 * 60) {
        secondsUntil += 86400; // Next occurrence in tomorrow's cycle
      }

      const hasPassedToday = secondsDiff < -15 * 60;
      const passedSecondsAgo = hasPassedToday ? currentTotalSeconds - eventTotalSeconds : 0;

      return {
        ...evt,
        hourVal,
        timeStr,
        leftPct,
        secondsUntil,
        isActiveNow,
        hasPassedToday,
        passedSecondsAgo,
      };
    });
  }, [currentTime, effectiveDstMode]);

  // Find the next upcoming institutional event on the timeline
  const nextUpcomingEvent = useMemo(() => {
    if (eventsWithRelativeTime.length === 0) return null;
    const sorted = [...eventsWithRelativeTime].sort((a, b) => a.secondsUntil - b.secondsUntil);
    return sorted[0] || null;
  }, [eventsWithRelativeTime]);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    if (hours > 0) return `${hours}ч ${minutes}м ${seconds}с`;
    if (minutes > 0) return `${minutes}м ${seconds}с`;
    return `${seconds}с`;
  };

  const formatPassedTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}ч ${minutes}м назад`;
    return `${minutes}м назад`;
  };

  // Initialize welcoming AI Co-Pilot message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'assistant',
          text: `👋 Приветствую! Я ваш **AI × Trader Co-Pilot** — институциональный сессионный аналитик структуры рынка, ликвидности и перелива капитала (BTC Spillover).

⏱️ **ВРЕМЯ:** \`${utcTimeFormatted}\` | Режим DST: **${effectiveDstMode === 'SUMMER' ? '☀️ US EDT / UK BST (Лето)' : '❄️ US EST / UK GMT (Зима)'}**
🧭 **ТЕКУЩАЯ СЕССИОННАЯ ФАЗА:** ${currentPhase.phaseName}
🐉 **BTC REGIME ДЛЯ АЛЬТОВ/МЕМОВ:** **\`${btcRegimeInfo.statusBadge}\`** — ${btcRegimeInfo.title}

📍 **Институциональные ориентиры по ${currentSymbol}:**
- **Midnight UTC Open:** $${institutionalPivots.midnightOpen.toFixed(2)} (Рынок в зоне: **\`${institutionalPivots.marketZone}\`**)
- **Asian Range (00:00–08:00 UTC):** $${institutionalPivots.asianLow.toFixed(2)} — $${institutionalPivots.asianHigh.toFixed(2)}
- **Вчерашний диапазон (PDH/PDL):** $${institutionalPivots.pdl.toFixed(2)} — $${institutionalPivots.pdh.toFixed(2)}
- **50% Equilibrium:** $${institutionalPivots.equilibrium50.toFixed(2)}

Кликните на любой **маркер событий** на временной шкале или выберите **Модуль анализа (A–F)** ниже для детального разбора!`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [currentSymbol, institutionalPivots.midnightOpen, effectiveDstMode]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Send query to AI Co-Pilot
  const handleSendQuery = async (queryText?: string) => {
    const promptToSend = (queryText || inputQuery).trim();
    if (!promptToSend || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAiLoading(true);

    try {
      const payload = {
        question: promptToSend,
        context: {
          symbol: currentSymbol,
          currentPrice,
          dstMode: effectiveDstMode,
          btcRegime: btcRegimeInfo.regimeCode,
          pdh: institutionalPivots.pdh,
          pdl: institutionalPivots.pdl,
          asianHigh: institutionalPivots.asianHigh,
          asianLow: institutionalPivots.asianLow,
          midnightOpen: institutionalPivots.midnightOpen,
          equilibrium50: institutionalPivots.equilibrium50,
          marketZone: institutionalPivots.marketZone,
          currentPhase: currentPhase.phaseName,
          cvdDelta: (institutionalPivots as any).cvdNetDeltaUsd || 0,
          fundingRate: '0.0100%',
          maxPainStrike: Math.round((currentPrice || 80000) / 1000) * 1000,
          weeklyMaxPain: Math.round((currentPrice || 80000) / 1000) * 1000,
          monthlyMaxPain: Math.round(((currentPrice || 80000) * 0.97) / 2500) * 2500,
          minutesToNext: btcRegimeInfo.minutesToNextEvent,
          isWeekend: weekendCmeStatus.isClosed,
          isCme24x7Active: weekendCmeStatus.isCme24x7Active,
          cmeStatusText: weekendCmeStatus.reason,
        },
      };

      const res = await fetch('/api/ai/session-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Анализ завершен.',
        timestamp: Date.now(),
        model: data.model,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Не удалось получить ответ: ${err.message || 'Ошибка соединения'}. Попробуйте еще раз.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Module Action Chips (Master + Modules A-F)
  const moduleChips = [
    {
      id: 'master',
      badge: '🧭 MASTER',
      label: 'Полный сессионный Master-синтез',
      prompt: `Проведи полный сессионный Master-синтез по ${currentSymbol}: сессионная структура, дельта стакана и ликвидационные пулы, опционные уровни Deribit ($79k / $75k), 4H сценарный прогноз с точными триггерами и Invalidation.`,
      color: 'border-amber-500/50 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20',
    },
    {
      id: 'module-a',
      badge: '🏎️ МОДУЛЬ A',
      label: 'Кто сейчас за рулём?',
      prompt: `Модуль A: Кто сейчас за рулём рынка по ${currentSymbol}? Текущая активная сессия, расстановка сил между алгоритмами Wall St, маркет-мейкерами и розницей, баланс рыночной дельты Taker CVD в зоне ${institutionalPivots.marketZone}.`,
      color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20',
    },
    {
      id: 'module-b',
      badge: '⚡ МОДУЛЬ B',
      label: 'Asian Range & Judas Swing',
      prompt: `Модуль B: Оцени структуру ликвидности Asian Range (High: $${institutionalPivots.asianHigh.toFixed(2)}, Low: $${institutionalPivots.asianLow.toFixed(2)}), Midnight Open ($${institutionalPivots.midnightOpen.toFixed(2)}) и вероятность ложного выноса ликвидности (Judas Swing) по ${currentSymbol}.`,
      color: 'border-blue-500/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20',
    },
    {
      id: 'module-c',
      badge: '📊 МОДУЛЬ C',
      label: 'Деривативы, OI & Опционы',
      prompt: `Модуль C: Деривативы и опционы: детально разбери ставку фандинга, открытый интерес (OI), позиции маркет-мейкеров и опционные магниты Deribit Weekly Max Pain ($79 000) и Monthly Max Pain ($75 000) по ${currentSymbol}.`,
      color: 'border-purple-500/40 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20',
    },
    {
      id: 'module-d',
      badge: '🏛️ МОДУЛЬ D',
      label: 'Макро, Spot ETF & Wall St',
      prompt: `Модуль D: Макро-драйверы и Wall Street: оцени влияние расписания макроэкономических данных США (CPI/FOMC), корреляцию с Nasdaq и потоки капитала спотовых Bitcoin ETF на текущую сессию ${currentSymbol}.`,
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20',
    },
    {
      id: 'module-e',
      badge: '🐉 МОДУЛЬ E',
      label: 'Мост к BSC & Китай-мемам (牛来)',
      prompt: `Модуль E: Оцени сессионный мост ликвидности (BTC Regime: ${btcRegimeInfo.title}) для китайских BSC-токенов (牛来, CASHCAT, TSLAB, QQQB). Благоприятна ли текущая фаза для ротации капитала и притока китов?`,
      color: 'border-rose-500/40 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20',
    },
    {
      id: 'module-f',
      badge: '🎯 МОДУЛЬ F',
      label: '4H Сценарий & Kill-Fact',
      prompt: `Модуль F: Сформулируй 4-часовой тактический сценарий (Bull / Base / Bear) по ${currentSymbol}, конкретные условия триггеров, уровень отмены (Invalidation) и критический Kill-Fact, полностью ломающий идею.`,
      color: 'border-amber-400/50 text-amber-200 bg-amber-400/10 hover:bg-amber-400/20',
    },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner: AI × Trader Co-Pilot Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-blue-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>AI × Trader Nexus</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Institutional 24h Matrix & Co-Pilot
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              24-часовая карта мировых сессий, автоматический учет сезонного времени (DST), 16+ критических точек ликвидности (CME, FOMC, Asian Fix),
              детектор BTC Regime для альтов и мемов, а также встроенный Co-Pilot.
            </p>
          </div>

          {/* Right: Live UTC Clock, DST Mode Switcher & Current Market Phase */}
          <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-750 px-4 py-2.5 rounded-xl shadow-inner flex-wrap">
            {/* UTC & MSK Clock */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Биржевое время</span>
              <span className="text-sm font-mono font-bold text-amber-400 flex items-center justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {utcTimeFormatted}
              </span>
              <span className="text-[10px] font-mono text-slate-400">MSK: {mskTimeFormatted}</span>
            </div>

            <div className="h-9 w-px bg-slate-800 hidden sm:block" />

            {/* DST Selector Badge */}
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Сезонное время (DST)</span>
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  onClick={() => setManualDstMode('AUTO')}
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition ${
                    manualDstMode === 'AUTO'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                  title="Автоматическое определение по календарю"
                >
                  AUTO
                </button>
                <button
                  onClick={() => setManualDstMode('SUMMER')}
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition flex items-center gap-1 ${
                    effectiveDstMode === 'SUMMER' && manualDstMode !== 'AUTO'
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                      : effectiveDstMode === 'SUMMER'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                  title="Летнее время (US EDT / UK BST) — NYSE 13:30 UTC"
                >
                  <Sun className="w-2.5 h-2.5" />
                  <span>ЛЕТО</span>
                </button>
                <button
                  onClick={() => setManualDstMode('WINTER')}
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition flex items-center gap-1 ${
                    effectiveDstMode === 'WINTER' && manualDstMode !== 'AUTO'
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400'
                      : effectiveDstMode === 'WINTER'
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                  title="Зимнее время (US EST / UK GMT) — NYSE 14:30 UTC"
                >
                  <Moon className="w-2.5 h-2.5" />
                  <span>ЗИМА</span>
                </button>
              </div>
            </div>

            <div className="h-9 w-px bg-slate-800 hidden sm:block" />

            {/* Current Phase */}
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Фаза ликвидности</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {currentPhase.activeOverlap || currentPhase.phaseName.split('(')[0]}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Волатильность: <span className="text-amber-300 font-bold">{currentPhase.volatility}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BTC Regime for Altcoins & Memes Status Bar */}
      {(() => {
        const badgeStyle =
          btcRegimeInfo.regimeCode === 'GREEN_LIGHT_MEMES'
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
            : btcRegimeInfo.regimeCode === 'DEAD_ZONE_WARNING'
            ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
            : btcRegimeInfo.regimeCode === 'WAIT_NY'
            ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
            : btcRegimeInfo.regimeCode === 'MACRO_PAUSE'
            ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
            : 'border-blue-500/50 bg-blue-500/15 text-blue-300';

        const regimeQuestion = `Разбери текущий институциональный режим BTC (${btcRegimeInfo.title}) и его влияние на перелив капитала в альткоины и BSC-мемы. Каковы ключевые риски и триггеры отмены?`;

        return (
          <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg border ${badgeStyle} flex items-center justify-center`}>
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">BTC Regime (Spillover Radar):</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
                    {btcRegimeInfo.statusBadge}
                  </span>
                  <span className="text-xs font-semibold text-white">{btcRegimeInfo.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl">
                  {btcRegimeInfo.summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Рекомендация деска</span>
                <span className="text-xs font-mono font-semibold text-amber-300">
                  {btcRegimeInfo.recommendedAction}
                </span>
              </div>
              <button
                onClick={() => handleSendQuery(regimeQuestion)}
                disabled={isAiLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Разобрать режим</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Weekend CME 24/7 & TradFi Status Banner if active */}
      {weekendCmeStatus.isClosed && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white uppercase">🟢 CME Group 24/7: Торги активны без классических гэпов</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  Globex 24/7
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  Spot ETF Closed
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                С конца мая 2026 CME торгует фьючерсами BTC/ETH круглосуточно. Однако спотовые ETF (IBIT) и TradFi закрыты до понедельника.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase">Структура ликвидности</span>
            <span className="text-amber-300 font-bold">Тонкий стакан (Без TradFi)</span>
          </div>
        </div>
      )}

      {/* 24-Hour Interactive Session Timeline & Vertical Event Markers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Интерактивная 24-часовая шкала с институциональными маркерами событий (UTC)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Audio alert toggle */}
            <button
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
              title={soundEnabled ? 'Звуковые алерты институциональных событий ВКЛ' : 'Звуковые алерты институциональных событий ВЫКЛ'}
            >
              {soundEnabled ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold">Алерты: ВКЛ</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] text-slate-500">Алерты: ВЫКЛ</span>
                </>
              )}
            </button>

            {nextUpcomingEvent && (
              <div
                onClick={() => {
                  setSelectedEventId(nextUpcomingEvent.id);
                  handleSendQuery(nextUpcomingEvent.moduleQuestion);
                }}
                title="Кликните для перехода к событию"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer transition shadow text-xs font-mono"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] text-slate-400 font-sans">Ближайшее:</span>
                <span className="font-bold truncate max-w-[160px]">{nextUpcomingEvent.title}</span>
                <span className="text-white font-bold bg-amber-500/25 px-1.5 py-0.5 rounded border border-amber-500/30 text-[11px]">
                  через {formatCountdown(nextUpcomingEvent.secondsUntil)}
                </span>
              </div>
            )}
            <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
              Кликните по маркеру (▼) для мгновенного запроса к AI Co-Pilot
            </span>
          </div>
        </div>

        {/* The Timeline Ribbon Container */}
        <div className="relative pt-7 pb-4 select-none">
          {/* Time axis marks (00:00 to 24:00) */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1 px-1">
            <span>00:00</span>
            <span>03:00</span>
            <span>06:00</span>
            <span>09:00</span>
            <span>12:00</span>
            <span>15:00</span>
            <span>18:00</span>
            <span>21:00</span>
            <span>24:00</span>
          </div>

          {/* 24h Base Track */}
          <div className="relative h-14 bg-slate-950 rounded-xl border border-slate-800 overflow-visible flex items-center shadow-inner">
            {/* Grid dividers every 3 hours */}
            {[12.5, 25, 37.5, 50, 62.5, 75, 87.5].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 w-px bg-slate-800/80 z-0"
                style={{ left: `${pct}%` }}
              />
            ))}

            {/* 1. Tokyo / Asia: 00:00 - 09:00 UTC (0% to 37.5%) */}
            <div
              onClick={() => setSelectedSessionId('tokyo')}
              className={`absolute top-1.5 bottom-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all z-10 border ${
                selectedSessionId === 'tokyo'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/30'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
              }`}
              style={{ left: '0.5%', width: '37%' }}
            >
              <span className="text-[11px] font-bold font-mono truncate px-1">
                🌏 Азия (00:00–09:00)
              </span>
            </div>

            {/* 2. London / Europe: 07:00 - 16:00 UTC (29.16% to 66.66%) */}
            <div
              onClick={() => setSelectedSessionId('london')}
              className={`absolute top-1.5 bottom-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all z-10 border ${
                selectedSessionId === 'london'
                  ? 'bg-blue-500/30 border-blue-400 text-blue-100 ring-2 ring-blue-500/30'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
              }`}
              style={{ left: '29.16%', width: '37.5%' }}
            >
              <span className="text-[11px] font-bold font-mono truncate px-1">
                🏛️ Лондон (07:00–16:00)
              </span>
            </div>

            {/* 3. New York / USA: (Summer: 12:00–21:00 UTC / Winter: 13:00–22:00 UTC) */}
            <div
              onClick={() => setSelectedSessionId('newyork')}
              className={`absolute top-1.5 bottom-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all z-10 border ${
                selectedSessionId === 'newyork'
                  ? 'bg-amber-500/30 border-amber-400 text-amber-100 ring-2 ring-amber-500/30'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              style={{
                left: effectiveDstMode === 'SUMMER' ? '50%' : '54.16%',
                width: '37.5%',
              }}
            >
              <span className="text-[11px] font-bold font-mono truncate px-1">
                🗽 Нью-Йорк ({effectiveDstMode === 'SUMMER' ? '12:00–21:00' : '13:00–22:00'})
              </span>
            </div>

            {/* 4. Golden Overlap Highlight: 12:00 - 16:00 UTC */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-400/40 pointer-events-none z-20 flex items-end justify-center pb-0.5"
              style={{
                left: effectiveDstMode === 'SUMMER' ? '50%' : '54.16%',
                width: effectiveDstMode === 'SUMMER' ? '16.66%' : '12.5%',
              }}
            >
              <span className="text-[9px] font-mono text-emerald-400 font-bold bg-slate-950/90 px-1 rounded">
                ⚡ Overlap (65% Vol)
              </span>
            </div>

            {/* 5. Sydney / Oceania: 21:00 - 06:00 UTC */}
            <div
              onClick={() => setSelectedSessionId('sydney')}
              className={`absolute top-1.5 bottom-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all z-10 border ${
                selectedSessionId === 'sydney'
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/30'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              style={{ left: '87.5%', width: '12%' }}
            >
              <span className="text-[10px] font-bold font-mono truncate px-1">
                🦘 Сидней
              </span>
            </div>

            {/* Vertical Timeline Event Markers (16+ Key points with dynamic live status) */}
            {eventsWithRelativeTime.map((evt) => {
              const hourVal = evt.hourVal;
              const timeStr = evt.timeStr;
              const leftPct = evt.leftPct;
              const isSelected = selectedEventId === evt.id;
              const isNext = nextUpcomingEvent?.id === evt.id;
              const isActive = evt.isActiveNow;

              const categoryIcon =
                evt.category === 'FUNDING'
                  ? '⚡'
                  : evt.category === 'MACRO'
                  ? '📊'
                  : evt.category === 'SESSION_OPEN'
                  ? '🔔'
                  : evt.category === 'SESSION_CLOSE'
                  ? '🏁'
                  : evt.category === 'EXPIRY'
                  ? '⌛'
                  : evt.category === 'CME'
                  ? '🏛️'
                  : evt.category === 'DEAD_ZONE'
                  ? '⚠️'
                  : evt.category === 'ETF_FLOWS'
                  ? '🌊'
                  : '📍';

              const isCritical = evt.category === 'MACRO' || evt.category === 'CME' || evt.category === 'DEAD_ZONE';

              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    handleSendQuery(evt.moduleQuestion);
                  }}
                  className="absolute top-0 bottom-0 z-25 flex flex-col items-center cursor-pointer group w-6 -ml-3"
                  style={{ left: `${leftPct}%` }}
                >
                  {/* Pin Flag at Top */}
                  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[8px] font-mono font-bold whitespace-nowrap transition-all shadow-md flex items-center gap-0.5 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 scale-110 z-40 ring-2 ring-amber-400/50 shadow-[0_0_10px_#f59e0b]'
                      : isActive
                      ? 'bg-rose-500 text-white animate-pulse z-35 ring-2 ring-rose-400 shadow-[0_0_8px_#f43f5e]'
                      : isNext
                      ? 'bg-amber-400 text-slate-950 font-black z-35 ring-2 ring-amber-300 shadow-[0_0_10px_#f59e0b] scale-105'
                      : 'bg-slate-900/90 border border-slate-750 text-slate-300 group-hover:bg-amber-500/20 group-hover:text-amber-200 group-hover:border-amber-500/40'
                  }`}>
                    <span>{categoryIcon}</span>
                    <span>{timeStr.split(' ')[0]}</span>
                    {isActive ? (
                      <span className="text-[7px] text-white uppercase bg-rose-700/80 px-0.5 rounded">NOW</span>
                    ) : isNext ? (
                      <span className="text-[7px] text-slate-950 uppercase bg-amber-300 px-0.5 rounded font-black">NEXT</span>
                    ) : null}
                  </div>

                  {/* Vertical Line */}
                  <div className={`w-0.5 h-full transition-all ${
                    isSelected
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : isActive
                      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
                      : isNext
                      ? 'bg-amber-400/90 shadow-[0_0_6px_#f59e0b]'
                      : isCritical
                      ? 'bg-rose-500/50 group-hover:bg-rose-400'
                      : 'bg-slate-700/60 group-hover:bg-amber-400/80'
                  }`} />

                  {/* Tooltip on Hover */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-40 min-w-[220px] pointer-events-auto pt-2">
                    <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700 hover:border-amber-500/60 rounded-lg p-2.5 shadow-2xl text-[10px] font-sans text-left space-y-1.5 transition">
                      <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-1">
                        <div className="flex items-center gap-1 font-bold text-amber-300 font-mono text-[11px]">
                          <span>{categoryIcon}</span>
                          <span>{evt.title}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[9px] bg-slate-900 px-1 py-0.2 rounded border border-slate-800">
                          {timeStr}
                        </span>
                      </div>

                      {/* Live Dynamic Countdown Status Tag */}
                      <div className="flex items-center gap-1.5 font-mono text-[9px]">
                        {isActive ? (
                          <span className="text-rose-400 font-bold bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                            🔥 ИДЕТ СЕЙЧАС (окно ±15м)
                          </span>
                        ) : isNext ? (
                          <span className="text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                            🔔 БЛИЖАЙШЕЕ: через {formatCountdown(evt.secondsUntil)}
                          </span>
                        ) : evt.hasPassedToday ? (
                          <span className="text-slate-400 bg-slate-850 px-1.5 py-0.5 rounded">
                            ✅ Прошло {formatPassedTime(evt.passedSecondsAgo)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                            ⏳ До события: {formatCountdown(evt.secondsUntil)}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-300 leading-tight text-[10px]">{evt.description}</p>

                      <div className="pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventId(evt.id);
                            handleSendQuery(evt.moduleQuestion);
                          }}
                          className="w-full py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer transition shadow"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Запустить AI-разбор</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live UTC Current Time Vertical Marker Needle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-35 pointer-events-none shadow-[0_0_10px_#f43f5e]"
              style={{ left: `${currentUtcProgress}%` }}
            >
              <div className="absolute -bottom-6 -left-8 bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md border border-rose-400/50">
                NOW {utcTimeFormatted.split(' ')[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Session Status Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {sessionStatuses.map(({ session, isActive, timeRemainingText, nextEventText }) => {
            const isSelected = selectedSessionId === session.id;
            return (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-850 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : isActive
                    ? 'bg-slate-900 border-slate-750 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: session.color }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">{session.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-mono text-slate-400">{nextEventText}</span>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isActive ? 'АКТИВНА' : 'ОФФЛАЙН'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: AI Co-Pilot Chat (Left 2 cols) + Institutional Pivots (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: AI Session Co-Pilot Interactive Chat */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between min-h-[560px]">
          {/* Header of Chat */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>AI Session Co-Pilot</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                    Live Chat
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Аналитик структуры сессий, снятия ликвидности & Smart Money ({currentSymbol})
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setMessages([]);
                setTimeout(() => {
                  setMessages([
                    {
                      id: `welcome-${Date.now()}`,
                      sender: 'assistant',
                      text: `Диалог перезапущен. Я готов разобрать сессию и структуру ликвидности по **${currentSymbol}**!`,
                      timestamp: Date.now(),
                    },
                  ]);
                }, 100);
              }}
              className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Очистить</span>
            </button>
          </div>

          {/* Module Action Chips (Master + Modules A–F) */}
          <div className="space-y-1.5 mb-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
              <span>Быстрые модули институционального анализа:</span>
              <span className="text-amber-400 font-semibold">{moduleChips.length} готовых сценариев</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {moduleChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleSendQuery(chip.prompt)}
                  disabled={isAiLoading}
                  className={`px-2 py-1.5 rounded-lg border text-left text-xs font-mono transition flex flex-col justify-between gap-0.5 disabled:opacity-50 cursor-pointer shadow-sm group ${chip.color}`}
                >
                  <span className="font-bold text-[10px] tracking-wide">{chip.badge}</span>
                  <span className="text-[11px] text-slate-200 truncate group-hover:text-white">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px] min-h-[260px] custom-scrollbar">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex-shrink-0 flex items-center justify-center text-blue-400 mt-1 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-tr-none'
                        : 'bg-slate-850 border border-slate-750 text-slate-200 rounded-tl-none space-y-2'
                    }`}
                  >
                    <MarkdownMessage text={msg.text} />

                    {!isUser && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          {msg.model?.includes('gemini') || msg.model?.includes('Gemini') ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {msg.model.replace('gemini-', 'Gemini ').replace('-preview', '')}
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium flex items-center gap-1">
                              <Cpu className="w-2.5 h-2.5" />
                              {msg.model === 'institutional-math-core-v2' ? 'Institutional Math Core v2.0' : (msg.model || 'Institutional Core v2.0')}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="hover:text-slate-300 flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Скопировано</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Копировать</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex-shrink-0 flex items-center justify-center text-amber-400 mt-1 shadow-sm">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isAiLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex-shrink-0 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-850 border border-slate-750 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>AI Co-Pilot анализирует сессионную ликвидность, деривативы и дельту {currentSymbol}...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Спросите AI Co-Pilot о сессиях, уровнях или поведении ${currentSymbol}...`}
              className="flex-1 bg-slate-950 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-sans"
            />
            <button
              type="submit"
              disabled={isAiLoading || !inputQuery.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            >
              <span>Спросить</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Col: Institutional Reference Pivots & Selected Session Card */}
        <div className="space-y-4">
          {/* 1. Institutional Reference Levels (Asian Range, PDH/PDL, Midnight UTC Open) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Опорные Уровни Дня ({currentSymbol})</h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  institutionalPivots.marketZone === 'PREMIUM'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : institutionalPivots.marketZone === 'DISCOUNT'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                Зона: {institutionalPivots.marketZone}
              </span>
            </div>

            {/* Pivot Values Grid */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-850/60 border border-slate-800">
                <span className="text-rose-400 font-semibold">PDH (High Вчера):</span>
                <span className="text-white font-bold">${institutionalPivots.pdh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-850/60 border border-slate-800">
                <span className="text-cyan-400 font-semibold">Asian High (00-08 UTC):</span>
                <span className="text-white font-bold">${institutionalPivots.asianHigh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-amber-500/30">
                <span className="text-amber-400 font-semibold">Midnight UTC Open (00:00):</span>
                <span className="text-amber-300 font-bold">${institutionalPivots.midnightOpen.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-850/60 border border-slate-800">
                <span className="text-cyan-400 font-semibold">Asian Low (00-08 UTC):</span>
                <span className="text-white font-bold">${institutionalPivots.asianLow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-850/60 border border-slate-800">
                <span className="text-emerald-400 font-semibold">PDL (Low Вчера):</span>
                <span className="text-white font-bold">${institutionalPivots.pdl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-850/40 border border-slate-800 text-slate-400">
                <span>50% Equilibrium (EQ):</span>
                <span className="text-slate-300 font-semibold">${institutionalPivots.equilibrium50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Co-Pilot Insight Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-xs text-blue-200 leading-relaxed">
              <span className="font-semibold block text-blue-300 mb-1">Смещение ликвидности:</span>
              {institutionalPivots.coPilotInsight}
            </div>

            {/* Quick Action: Back to Terminal */}
            {onSwitchToTerminalTab && (
              <button
                type="button"
                onClick={onSwitchToTerminalTab}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Открыть график {currentSymbol} в Терминале</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Selected Session Details & Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedSession.color }}
                />
                <h3 className="text-sm font-bold text-white">{selectedSession.name}</h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  selectedSessionStatus?.isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {selectedSessionStatus?.isActive ? 'LIVE NOW' : 'OFFLINE'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedSession.description}
            </p>

            <div className="bg-slate-850/80 border border-slate-750 p-3 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Тактический фокус:</span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {selectedSession.coPilotNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

