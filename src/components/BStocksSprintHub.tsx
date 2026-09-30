import React, { useState, useEffect, useMemo } from 'react';
import { TokenFlowHeatmapMatrix } from './TokenFlowHeatmapMatrix';
import {
  Trophy,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Zap,
  Layers,
  Activity,
  RefreshCw,
  AlertTriangle,
  Coins,
  Scale,
  Award,
  ChevronRight,
  HelpCircle,
  BarChart2,
  DollarSign,
  Cpu
} from 'lucide-react';

export interface BStocksSprintHubProps {
  onOpenAuditForToken?: (contractAddress: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

interface BStockAnchor {
  symbol: string;
  name: string;
  contract: string;
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
  pairAddress: string;
  priceChange24h: number;
}

interface ContenderToken {
  id: string;
  name: string;
  symbol: string;
  contract: string;
  targetBStock: string;
  platform: string;
  launchType: string;
  narrative: string;
  specialMechanic: string;
  rank: number;
  priceUsd: number;
  priceChange24h: number;
  priceChange6h: number;
  priceChange1h: number;
  priceChange5m: number;
  marketCap: number;
  fdv: number;
  totalLiquidityUsd: number;
  totalVolume24h: number;
  totalTxns24h: number;
  totalBuys24h: number;
  totalSells24h: number;
  buyRatioPercent: number;
  primaryPairAddress: string;
  dexId: string;
  bstockPair: {
    pairAddress: string;
    dexId: string;
    quoteSymbol: string;
    quoteAddress: string;
    priceUsd: number;
    priceNative: string;
    liquidityUsd: number;
    volume24h: number;
    txns24h: number;
  } | null;
  usdtPair: {
    pairAddress: string;
    quoteSymbol: string;
    priceUsd: number;
    liquidityUsd: number;
    volume24h: number;
  } | null;
  arbitrageSpreadPct: number | null;
  sizingSimulation: {
    size1k: { impactPct: number; status: string };
    size10k: { impactPct: number; status: string };
    size50k: { impactPct: number; status: string };
  };
  competitionScore: number;
}

interface SprintData {
  status: string;
  timestamp: number;
  competition: {
    title: string;
    organizers: string[];
    totalPrizePoolUsd: number;
    categories: Array<{ name: string; prizeUsd: number; description: string }>;
    rulesSummary: string;
    activeSeason: string;
  };
  bStocksAnchors: Record<string, BStockAnchor>;
  leaderboard: ContenderToken[];
  summaryStats: {
    totalTrackedVolume24h: number;
    totalTrackedLiquidityUsd: number;
    totalTrackedTxns24h: number;
    activeContendersCount: number;
  };
}

export const BStocksSprintHub: React.FC<BStocksSprintHubProps> = ({
  onOpenAuditForToken,
  onSelectSymbol,
}) => {
  const [sprintData, setSprintData] = useState<SprintData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<1000 | 10000 | 50000>(1000);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'ALL' | 'QQQB' | 'TSLAB' | 'SPCXB'>('ALL');
  const [expandedTokenId, setExpandedTokenId] = useState<string | null>('marscoin');
  const [activeSubModule, setActiveSubModule] = useState<'RADAR' | 'LEADERBOARD'>('RADAR');

  const fetchSprintData = async (force: boolean = false) => {
    try {
      if (force) setIsRefreshing(true);
      else if (!sprintData) setIsLoading(true);

      const res = await fetch(`/api/bstocks/sprint-matrix?force=${force}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.status === 'success' || data.leaderboard)) {
          setSprintData(data);
          setError(null);
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn('[BStocksSprintHub] Fetch notice (recovering automatically):', err?.message || err);
      if (!sprintData) {
        setError('Инициализация данных спринта bStocks. Повтор запроса...');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchSprintData(false);

    // Periodic background refresh without force-bypassing cache
    const interval = setInterval(() => {
      if (isMounted) {
        fetchSprintData(false);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(text);
    setTimeout(() => setCopiedContract(null), 2500);
  };

  const filteredTokens = useMemo(() => {
    if (!sprintData?.leaderboard) return [];
    if (selectedCategoryTab === 'ALL') return sprintData.leaderboard;
    return sprintData.leaderboard.filter(t => t.targetBStock === selectedCategoryTab);
  }, [sprintData, selectedCategoryTab]);

  return (
    <div className="space-y-5 animate-fadeIn font-sans">
      {/* 1. TOP LIQUIDITY MATRIX BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-amber-500/30 p-5 sm:p-7 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                ON-CHAIN CAPITAL FLOW & ROUTING ENGINE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                WBNB & USDT Gateways + bStocks
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ● LIVE BSC RPC
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              «Матрица Ликвидности & Свопов Капитала»
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse hidden sm:inline" />
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Ончейн-мониторинг движения ликвидности («Кто куда переливает»): отслеживание перемещения капитала между внешними шлюзами (<span className="text-emerald-300 font-mono font-bold">USDT, WBNB</span>) и токенизированными корзинами (<span className="text-cyan-300 font-mono font-bold">QQQB, TSLAB, SPCXB</span>). 
              Детекция ротации китов из флагманов в сателлиты по резервам <span className="text-amber-300 font-mono">PancakeSwap getReserves()</span> до отображения на графиках.
            </p>

            {/* Core On-Chain Gateway Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-mono">Шлюзы маршрутизации:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/30">USDT Gateway</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-xs font-mono font-semibold border border-amber-500/30">WBNB Layer-1 Bridge ($1.8M LP)</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs font-mono font-semibold border border-cyan-500/30">PancakeSwap v2/v3</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 text-xs font-mono font-semibold border border-purple-500/30">BSC On-Chain RPC</span>
            </div>
          </div>

          {/* Real-time Liquidity & Velocity Card */}
          <div className="flex-shrink-0 bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 sm:p-5 text-right flex flex-col justify-between shadow-xl min-w-[260px]">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center justify-end gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Ликвидность Экосистемы
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-400 mt-1">
                ${((sprintData?.summaryStats.totalTrackedLiquidityUsd || 4050000) / 1000000).toFixed(2)}M
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Общий TVL пулов QQQB + TSLAB + SPCXB + WBNB
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Объём 24h:</span>
              <span className="text-amber-400 font-semibold">${((sprintData?.summaryStats.totalTrackedVolume24h || 1200000) / 1000).toFixed(0)}k USD</span>
            </div>

            <div className="mt-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => fetchSprintData(true)}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Опрос нод BSC...' : 'Обновить потоки'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1.5. Submodule Switcher: Flow Heatmap vs Token Routing Matrix */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
        <button
          id="submodule-tab-radar"
          type="button"
          onClick={() => setActiveSubModule('RADAR')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            activeSubModule === 'RADAR'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Тепловая Карта Переливов (Flow Heatmap)</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Live 1h / 6h / 24h
          </span>
        </button>

        <button
          id="submodule-tab-leaderboard"
          type="button"
          onClick={() => setActiveSubModule('LEADERBOARD')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
            activeSubModule === 'LEADERBOARD'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Матрица Ликвидности & Свопов Токенов</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-300 border border-cyan-500/30">
            5 Токенов + 3 Корзины
          </span>
        </button>
      </div>

      {activeSubModule === 'RADAR' ? (
        <TokenFlowHeatmapMatrix
          onOpenAuditForToken={onOpenAuditForToken}
          onSelectSymbol={onSelectSymbol}
        />
      ) : (
        <div className="space-y-5">
      {/* 2. THREE ANCHOR BSTOCKS STRIP: QQQB, TSLAB, SPCXB */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">
              Базовые Активы Котировки (bStocks RWA / Tokenized Equities)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Токенизированные ценные бумаги США на PancakeSwap / BNB Chain
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sprintData?.bStocksAnchors && Object.values(sprintData.bStocksAnchors).map((b) => (
            <div
              key={b.symbol}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-md group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-mono text-white group-hover:text-amber-400 transition-colors">
                      {b.symbol}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      BEP-20 RWA
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-1">{b.name}</div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-mono text-white">
                    ${b.priceUsd >= 1 ? b.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : b.priceUsd.toFixed(4)}
                  </div>
                  <div className={`text-[11px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                    b.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {b.priceChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {b.priceChange24h >= 0 ? '+' : ''}{b.priceChange24h.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Ликвидность пула:</span>
                  <span className="text-slate-200 font-semibold">${(b.liquidityUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Объем 24ч:</span>
                  <span className="text-slate-200 font-semibold">${(b.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="truncate max-w-[150px]">{b.contract.slice(0, 8)}...{b.contract.slice(-6)}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(b.contract)}
                  className="p-1 hover:text-amber-400 transition"
                  title="Скопировать контракт"
                >
                  {copiedContract === b.contract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SPRINT LEADERBOARD & INTERACTIVE MATRIX HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Матрица Ликвидности и Ротации Токенов (Топ Пулы PancakeSwap)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              (Суточный объём: ${sprintData?.summaryStats ? (sprintData.summaryStats.totalTrackedVolume24h / 1_000_000).toFixed(2) + 'M' : '...'})
            </span>
          </div>

          {/* Category Filter & Sizing selector */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter by target bStock */}
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-mono">
              {(['ALL', 'QQQB', 'TSLAB', 'SPCXB'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryTab(cat)}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    selectedCategoryTab === cat
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'Все пулы' : cat}
                </button>
              ))}
            </div>

            {/* Position size test slider / toggle */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs font-mono">
              <span className="text-[10px] text-slate-400 font-semibold">Сайзинг:</span>
              {([1000, 10000, 50000] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`px-2 py-0.5 rounded transition ${
                    selectedSize === size
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ${size >= 1000 ? `${size / 1000}k` : size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENDER CARDS LIST */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              Загрузка ончейн-метрик распределения капитала bStocks...
            </div>
          ) : filteredTokens.map((token) => {
            const isExpanded = expandedTokenId === token.id;
            const sim = selectedSize === 1000 ? token.sizingSimulation.size1k :
                        selectedSize === 10000 ? token.sizingSimulation.size10k :
                        token.sizingSimulation.size50k;

            return (
              <div
                key={token.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all overflow-hidden"
              >
                {/* Main Card Header Bar */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank, Name, Symbol, Target Pair */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm ${
                      token.rank === 1 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' :
                      token.rank === 2 ? 'bg-slate-300 text-slate-950' :
                      token.rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{token.rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black font-mono text-white">
                          {token.name}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          / {token.targetBStock}
                        </span>
                        {token.specialMechanic.includes('3%') && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            💸 3% Дивиденд в SPCXB
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {token.platform}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                        <span>Контракт:</span>
                        <span className="text-slate-300">{token.contract.slice(0, 6)}...{token.contract.slice(-6)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(token.contract)}
                          className="hover:text-amber-400 transition"
                          title="Скопировать адрес контракта"
                        >
                          {copiedContract === token.contract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`https://bscscan.com/token/${token.contract}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-400 transition"
                          title="Открыть на BSCScan"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Real-time Price & Changes across timeframes */}
                  <div className="flex items-center gap-5 flex-wrap">
                    <div>
                      <div className="text-xs text-slate-400 font-mono">Текущая цена USD:</div>
                      <div className="text-lg font-bold font-mono text-white">
                        ${token.priceUsd >= 1 ? token.priceUsd.toFixed(4) : token.priceUsd.toFixed(7)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">24h:</span>
                        <span className={`font-semibold ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">1h:</span>
                        <span className={`font-semibold ${token.priceChange1h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {token.priceChange1h >= 0 ? '+' : ''}{token.priceChange1h.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">5m:</span>
                        <span className={`font-semibold ${token.priceChange5m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {token.priceChange5m >= 0 ? '+' : ''}{token.priceChange5m.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Sizing impact badge for chosen size */}
                    <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                      <div className="text-[10px] text-slate-400">Проскальзывание (${selectedSize >= 1000 ? `${selectedSize/1000}k` : selectedSize}):</div>
                      <div className={`font-bold flex items-center gap-1 ${
                        sim.status === 'SAFE_DEPTH' ? 'text-emerald-400' :
                        sim.status === 'MEDIUM_SLIPPAGE' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {sim.impactPct > 0 ? `~${sim.impactPct}%` : '<0.1%'}
                        {sim.status === 'SAFE_DEPTH' && <Check className="w-3 h-3" />}
                        {sim.status === 'HIGH_SLIPPAGE' && <AlertTriangle className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {/* Launch 5-Layer Intel Audit Button */}
                    <button
                      type="button"
                      onClick={() => onOpenAuditForToken && onOpenAuditForToken(token.contract)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs font-mono shadow-md hover:from-amber-400 hover:to-yellow-400 transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>5-Слойный Аудит</span>
                    </button>

                    {/* Expand/Collapse details */}
                    <button
                      type="button"
                      onClick={() => setExpandedTokenId(isExpanded ? null : token.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      title={isExpanded ? 'Свернуть детали' : 'Подробная аналитика пары'}
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Forensic & Dual-Pool Matrix */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-900/40 space-y-4">
                    {/* Narrative & Special Mechanics */}
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                      <div className="text-amber-400 font-bold font-mono mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Нарратив и механика соревнования:
                      </div>
                      <div className="text-slate-300 leading-relaxed">
                        {token.narrative}. <span className="text-slate-400">Специфика пула:</span> <span className="text-emerald-300 font-mono font-medium">{token.specialMechanic}</span>.
                      </div>
                    </div>

                    {/* Dual-pool comparison (bStocks Pool vs USDT Pool) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* bStock Pair details */}
                      <div className="bg-slate-950 p-3.5 rounded-lg border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            Основной пул: {token.name} / {token.targetBStock}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            PancakeSwap
                          </span>
                        </div>

                        {token.bstockPair ? (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Цена в пуле USD:</span>
                              <span className="text-white font-bold">${token.bstockPair.priceUsd ? token.bstockPair.priceUsd.toFixed(6) : '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Ликвидность:</span>
                              <span className="text-emerald-400 font-bold">${(token.bstockPair.liquidityUsd).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Суточный объем:</span>
                              <span className="text-slate-200">${(token.bstockPair.volume24h).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Транзакций 24ч:</span>
                              <span className="text-slate-200">{token.bstockPair.txns24h} txs</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 font-mono py-2">
                            Пул bStock формируется сообществом / Flap бондинг-кривая
                          </div>
                        )}

                        {token.bstockPair && (
                          <div className="pt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-900">
                            <span>Pair: {token.bstockPair.pairAddress.slice(0, 10)}...</span>
                            <a
                              href={`https://dexscreener.com/bsc/${token.bstockPair.pairAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:underline flex items-center gap-1"
                            >
                              DexScreener <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* USDT / Secondary Pair details */}
                      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            Сравнительный пул: {token.name} / {token.usdtPair ? token.usdtPair.quoteSymbol : 'USDT/WBNB'}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Arbitrage Anchor
                          </span>
                        </div>

                        {token.usdtPair ? (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Цена в пуле USD:</span>
                              <span className="text-white font-bold">${token.usdtPair.priceUsd ? token.usdtPair.priceUsd.toFixed(6) : '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Ликвидность:</span>
                              <span className="text-slate-300 font-semibold">${(token.usdtPair.liquidityUsd).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Суточный объем:</span>
                              <span className="text-slate-200">${(token.usdtPair.volume24h).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Арбитражный спред:</span>
                              <span className={`font-bold ${
                                token.arbitrageSpreadPct === null ? 'text-slate-400' :
                                Math.abs(token.arbitrageSpreadPct) < 1 ? 'text-emerald-400' :
                                Math.abs(token.arbitrageSpreadPct) < 3 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {token.arbitrageSpreadPct !== null ? `${token.arbitrageSpreadPct > 0 ? '+' : ''}${token.arbitrageSpreadPct}%` : 'Синхронно'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 font-mono py-2">
                            Пул котируется исключительно в паре с {token.targetBStock}
                          </div>
                        )}

                        {token.usdtPair && (
                          <div className="pt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-900">
                            <span>Pair: {token.usdtPair.pairAddress.slice(0, 10)}...</span>
                            <a
                              href={`https://dexscreener.com/bsc/${token.usdtPair.pairAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              DexScreener <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comprehensive Sizing Depth Matrix */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-blue-400" />
                          Анализ влияния ордера на цену (Price Impact & Slippage в пуле {token.targetBStock}):
                        </span>
                        <span className="text-[10px] text-slate-500">По правилу AGENTS_md: сайзинг $1k, $10k, $50k</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Вход $1,000</div>
                          <div className={`font-bold mt-0.5 ${
                            token.sizingSimulation.size1k.impactPct > 5 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {token.sizingSimulation.size1k.impactPct}%
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{token.sizingSimulation.size1k.status}</div>
                        </div>

                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Вход $10,000</div>
                          <div className={`font-bold mt-0.5 ${
                            token.sizingSimulation.size10k.impactPct > 15 ? 'text-rose-400' :
                            token.sizingSimulation.size10k.impactPct > 5 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {token.sizingSimulation.size10k.impactPct}%
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{token.sizingSimulation.size10k.status}</div>
                        </div>

                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Вход $50,000</div>
                          <div className={`font-bold mt-0.5 ${
                            token.sizingSimulation.size50k.impactPct > 15 ? 'text-rose-400' :
                            token.sizingSimulation.size50k.impactPct > 5 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {token.sizingSimulation.size50k.impactPct}%
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{token.sizingSimulation.size50k.status}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ON-CHAIN CAPITAL FLOW ARCHITECTURE & WBNB ROUTING RULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* On-Chain Flow Topology */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm">
            <Zap className="w-4 h-4 text-emerald-400" />
            Топология Маршрутизации Капитала («Кто куда переливает»)
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 font-sans leading-relaxed">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-bold text-emerald-300 font-mono flex items-center justify-between">
                <span>1. Внешний шлюз: USDT & WBNB Gateways</span>
                <span className="text-[10px] text-slate-400 font-normal">Layer-1 Ingress</span>
              </div>
              <p className="text-slate-400 mt-0.5">
                Капитал заходит через PancakeSwap пулы <span className="text-slate-200 font-mono">QQQB/USDT</span>, <span className="text-slate-200 font-mono">QQQB/WBNB</span> и <span className="text-slate-200 font-mono">SPCXB/WBNB ($1.8M)</span>. Рост резерва WBNB в шлюзе bStocks свидетельствует о притоке нативного капитала BSC.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-bold text-cyan-300 font-mono flex items-center justify-between">
                <span>2. Внутрикорзинная ротация (Флагман ➔ Сателлиты)</span>
                <span className="text-[10px] text-slate-400 font-normal">Сообщающиеся сосуды</span>
              </div>
              <p className="text-slate-400 mt-0.5">
                Киты не выходят в фиат: они фиксируют прибыль флагмана (<span className="text-amber-300 font-mono">牛来</span>) напрямую в <span className="text-cyan-300 font-mono">QQQB</span> и мгновенно выкупают сателлиты (<span className="text-cyan-300 font-mono">豹拉, 孙小圣</span>), где стакан тоньше и потенциал пампа выше.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-bold text-amber-300 font-mono flex items-center justify-between">
                <span>3. WBNB Арбитражные Треугольники</span>
                <span className="text-[10px] text-slate-400 font-normal">BNB ↔ bStock ↔ Мем</span>
              </div>
              <p className="text-slate-400 mt-0.5">
                Арбитражные боты синхронизируют пулы между <span className="text-slate-200 font-mono">Токен/bStock</span> и <span className="text-slate-200 font-mono">Токен/WBNB</span>. Разница в резервах показывает, выводят ли профит обратно в BNB или реинвестируют в bStocks.
              </p>
            </div>
          </div>
        </div>

        {/* Risk & Invalidation Guidelines */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-sm">
            <ShieldAlert className="w-4 h-4" />
            Критерии Риска и Invalidation (AGENTS.md & GEMINI.md)
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-sans leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-mono font-bold">•</span>
              <p>
                <span className="font-semibold text-slate-200">Двойной риск базового актива:</span> Токены, котируемые в bStocks, зависят как от цены самого мема, так и от курса токенизированной акции (Tesla, Invesco QQQ, SpaceX). При падении фондового рынка США покупательная способность пула снижается.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-mono font-bold">•</span>
              <p>
                <span className="font-semibold text-slate-200">MarsCoin 3% Tax Slippage:</span> Каждая транзакция покупки/продажи MarsCoin облагается налогом 3%, который автоматически накапливается и распределяется холдерам в токенах SPCXB. При симуляциях сайзинга ($1k, $10k, $50k) обязательно учитывайте налог + проскальзывание пула.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-mono font-bold">•</span>
              <p>
                <span className="font-semibold text-slate-200">Условие отмены бычьего сценария (Invalidation):</span> Сброс балансов частных Top-10 адресов более чем на 15% за 24 часа, падение ликвидности пула bStocks ниже $30,000 или критический арбитражный дисконт {'>'} 8% относительно USDT пары.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};
