import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  ArrowUpDown,
  Flame,
  Activity,
  Copy,
  Check,
  Zap,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Send,
  Plus
} from 'lucide-react';

export interface MexcLivePair {
  symbol: string;
  baseAsset: string;
  fullName: string;
  lastPrice: number;
  priceChangePct: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  volume24hBase: number;
  bidPrice: number;
  askPrice: number;
  spreadPct: number;
  contractAddress: string;
  isEvm: boolean;
  isSolana: boolean;
  isMeme: boolean;
  conceptPlates: string[];
  isSpotTradingAllowed: boolean;
}

interface Props {
  onOpenAuditForToken?: (contract: string, chain?: string, symbol?: string) => void;
  onSendToTerminal?: (symbol: string) => void;
  onAddToPipeline?: (candidate: { symbol: string; baseAsset: string; contractAddress: string; price: number; name?: string }) => void;
  pipelineContracts?: Set<string>;
}

// Module-level in-memory client cache so switching tabs is instantaneous (0.00s delay)
let cachedMexcData: MexcLivePair[] | null = null;
let cachedMexcStats = {
  totalPairs: 0,
  totalUsdt: 0,
  totalWithCa: 0,
  totalEvm0x: 0,
  totalMeme: 0,
};
let cachedMexcTimestamp: Date | null = null;
let lastFetchTimeMs = 0;
const CACHE_TTL_MS = 25000; // 25 seconds cache TTL

export const MexcGlobalLiveScreener: React.FC<Props> = ({
  onOpenAuditForToken,
  onSendToTerminal,
  onAddToPipeline,
  pipelineContracts,
}) => {
  // Initialize state from in-memory cache if available
  const [data, setData] = useState<MexcLivePair[]>(() => cachedMexcData || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedMexcData);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => cachedMexcTimestamp);
  const [stats, setStats] = useState<{
    totalPairs: number;
    totalUsdt: number;
    totalWithCa: number;
    totalEvm0x: number;
    totalMeme: number;
  }>(() => cachedMexcStats);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterContractType, setFilterContractType] = useState<'ALL' | 'EVM_ONLY' | 'SOLANA_ONLY' | 'WITH_CA_ONLY' | 'NO_CA'>('EVM_ONLY');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'MEME' | 'AI' | 'INNOVATION' | 'GAINERS' | 'LOSERS'>('ALL');
  const [minVolumeUsd, setMinVolumeUsd] = useState<number>(10000); // Default $10k volume
  const [minPriceChange, setMinPriceChange] = useState<string>('ALL'); // ALL, POSITIVE, +5%, +15%, +30%
  const [maxSpreadPct, setMaxSpreadPct] = useState<number>(5); // max 5% spread

  // Sorting
  const [sortField, setSortField] = useState<keyof MexcLivePair>('volume24hUsd');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Clipboard
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Fetch full live snapshot with client-side cache awareness
  const fetchMarketData = useCallback(async (isManual = false) => {
    const now = Date.now();
    // If not manual, and we fetched recently within TTL, skip network call
    if (!isManual && cachedMexcData && now - lastFetchTimeMs < CACHE_TTL_MS) {
      setData(cachedMexcData);
      setStats(cachedMexcStats);
      setLastUpdated(cachedMexcTimestamp);
      setIsLoading(false);
      return;
    }

    try {
      if (isManual || !cachedMexcData) {
        setIsLoading(true);
      }
      setError(null);
      
      let res: Response | null = null;
      let json: any = null;
      
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await fetch('/api/mexc/live-screener');
          if (r.ok) {
            const j = await r.json();
            if (Array.isArray(j.data)) {
              res = r;
              json = j;
              break;
            }
          }
        } catch {
          // wait 800ms before retry
          if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      if (!json || !Array.isArray(json.data)) {
        throw new Error('Не удалось получить данные с MEXC API');
      }

      const newStats = {
        totalPairs: json.totalPairs || json.data.length,
        totalUsdt: json.totalUsdt || json.data.length,
        totalWithCa: json.totalWithCa || 0,
        totalEvm0x: json.totalEvm0x || 0,
        totalMeme: json.totalMeme || 0,
      };
      const newTimestamp = new Date(json.timestamp || Date.now());

      // Save to component state
      setData(json.data);
      setStats(newStats);
      setLastUpdated(newTimestamp);

      // Update module-level cache for instant tab restoration
      cachedMexcData = json.data;
      cachedMexcStats = newStats;
      cachedMexcTimestamp = newTimestamp;
      lastFetchTimeMs = Date.now();
    } catch (err: any) {
      console.warn('[MEXC Screener Warning]', err);
      if (!cachedMexcData || cachedMexcData.length === 0) {
        setError(err.message || 'Ошибка загрузки данных MEXC');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + interval poll every 10 seconds
  useEffect(() => {
    fetchMarketData();
    const timer = setInterval(() => {
      fetchMarketData();
    }, 10000);
    return () => clearInterval(timer);
  }, [fetchMarketData]);

  // Handle Sort
  const handleSort = (field: keyof MexcLivePair) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Filtered and Sorted Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSymbol = item.symbol.toLowerCase().includes(q);
        const matchBase = item.baseAsset.toLowerCase().includes(q);
        const matchName = item.fullName.toLowerCase().includes(q);
        const matchCa = item.contractAddress.toLowerCase().includes(q);
        if (!matchSymbol && !matchBase && !matchName && !matchCa) {
          return false;
        }
      }

      // 2. Contract Type
      if (filterContractType === 'EVM_ONLY') {
        if (!item.isEvm) return false;
      } else if (filterContractType === 'SOLANA_ONLY') {
        if (!item.isSolana) return false;
      } else if (filterContractType === 'WITH_CA_ONLY') {
        if (!item.contractAddress) return false;
      } else if (filterContractType === 'NO_CA') {
        if (item.contractAddress) return false;
      }

      // 3. Category / Tag
      if (filterCategory === 'MEME') {
        if (!item.isMeme) return false;
      } else if (filterCategory === 'AI') {
        const hasAi = item.conceptPlates.some(p => p.toLowerCase().includes('ai'));
        if (!hasAi) return false;
      } else if (filterCategory === 'INNOVATION') {
        const hasInnov = item.conceptPlates.some(p => p.toLowerCase().includes('innovation'));
        if (!hasInnov) return false;
      } else if (filterCategory === 'GAINERS') {
        if (item.priceChangePct <= 0) return false;
      } else if (filterCategory === 'LOSERS') {
        if (item.priceChangePct >= 0) return false;
      }

      // 4. Min Volume
      if (item.volume24hUsd < minVolumeUsd) {
        return false;
      }

      // 5. Min Price Change
      if (minPriceChange === 'POSITIVE' && item.priceChangePct <= 0) {
        return false;
      }
      if (minPriceChange === '+5%' && item.priceChangePct < 5) {
        return false;
      }
      if (minPriceChange === '+15%' && item.priceChangePct < 15) {
        return false;
      }
      if (minPriceChange === '+30%' && item.priceChangePct < 30) {
        return false;
      }

      // 6. Max Spread
      if (maxSpreadPct > 0 && item.spreadPct > maxSpreadPct) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = ((bVal as string) || '').toLowerCase();
        return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  }, [
    data,
    searchQuery,
    filterContractType,
    filterCategory,
    minVolumeUsd,
    minPriceChange,
    maxSpreadPct,
    sortField,
    sortDirection,
  ]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Quick preset filters
  const applyPreset = (preset: 'BSC_MEMES' | 'HIGH_VOL' | 'TOP_PUMP' | 'NEW_GEMS') => {
    if (preset === 'BSC_MEMES') {
      setFilterContractType('EVM_ONLY');
      setFilterCategory('MEME');
      setMinVolumeUsd(10000);
      setMinPriceChange('ALL');
      setSearchQuery('');
    } else if (preset === 'HIGH_VOL') {
      setFilterContractType('ALL');
      setFilterCategory('ALL');
      setMinVolumeUsd(250000);
      setMinPriceChange('ALL');
      setSortField('volume24hUsd');
      setSortDirection('desc');
    } else if (preset === 'TOP_PUMP') {
      setFilterContractType('ALL');
      setFilterCategory('ALL');
      setMinVolumeUsd(20000);
      setMinPriceChange('+15%');
      setSortField('priceChangePct');
      setSortDirection('desc');
    } else if (preset === 'NEW_GEMS') {
      setFilterContractType('EVM_ONLY');
      setFilterCategory('ALL');
      setMinVolumeUsd(5000);
      setMinPriceChange('POSITIVE');
      setSortField('volume24hUsd');
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Stats & Status */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                MEXC Global Info
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Скринер Спекулятивных Пар ({stats.totalPairs.toLocaleString()} пар)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Прямой поток данных с API биржи MEXC: цены, динамика, стакан, спреды и ончейн-контракты.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Всего USDT пар</div>
              <div className="text-sm font-bold text-white font-mono">{stats.totalUsdt.toLocaleString()}</div>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-amber-500/30 text-center min-w-[90px]">
              <div className="text-[10px] text-amber-300/80 uppercase font-mono flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>EVM 0x (BSC)</span>
              </div>
              <div className="text-sm font-bold text-amber-400 font-mono">{stats.totalEvm0x}</div>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-pink-500/30 text-center min-w-[90px]">
              <div className="text-[10px] text-pink-300/80 uppercase font-mono flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-pink-400" />
                <span>Meme Теги</span>
              </div>
              <div className="text-sm font-bold text-pink-400 font-mono">{stats.totalMeme}</div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => fetchMarketData(true)}
              className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
              title="Принудительно обновить список пар"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Обновить</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            Пресеты:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('BSC_MEMES')}
            className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>BSC Memes (0x... + Meme)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('TOP_PUMP')}
            className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Top Pump (+15% и объём &gt; $20k)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('HIGH_VOL')}
            className="px-2.5 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-bold transition flex items-center gap-1"
          >
            <Activity className="w-3 h-3 text-blue-400" />
            <span>High Volume (&gt; $250k оборот)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('NEW_GEMS')}
            className="px-2.5 py-1 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-bold transition flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-purple-400" />
            <span>EVM Gems (Низкая база, рост)</span>
          </button>

          {lastUpdated && (
            <span className="ml-auto text-[11px] text-slate-500 font-mono">
              Обновлено: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search by Symbol / Contract */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск (тикер, контракт 0x..., имя)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Contract Filter */}
          <div>
            <select
              value={filterContractType}
              onChange={(e) => {
                setFilterContractType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
            >
              <option value="EVM_ONLY">Сеть: Только EVM 0x... ({stats.totalEvm0x})</option>
              <option value="SOLANA_ONLY">Сеть: Только Solana</option>
              <option value="WITH_CA_ONLY">Любой ончейн контракт ({stats.totalWithCa})</option>
              <option value="ALL">Все монеты биржи ({stats.totalUsdt})</option>
              <option value="NO_CA">Без ончейн-контракта</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Категория: Все селекторы</option>
              <option value="MEME">Только MEME тег ({stats.totalMeme})</option>
              <option value="AI">AI & Machine Learning</option>
              <option value="INNOVATION">Innovation Zone</option>
              <option value="GAINERS">Только растущие (&gt; 0%)</option>
              <option value="LOSERS">Только падающие (&lt; 0%)</option>
            </select>
          </div>

          {/* Min Volume */}
          <div>
            <select
              value={minVolumeUsd}
              onChange={(e) => {
                setMinVolumeUsd(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value={0}>Оборот 24h: Любой ($0+)</option>
              <option value={5000}>Оборот: &gt; $5,000</option>
              <option value={10000}>Оборот: &gt; $10,000 (Фильтр мусора)</option>
              <option value={50000}>Оборот: &gt; $50,000 (Ликвидные)</option>
              <option value={200000}>Оборот: &gt; $200,000 (Топ)</option>
              <option value={1000000}>Оборот: &gt; $1,000,000 (Крупные)</option>
            </select>
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold font-mono">Найдено: {filteredData.length}</span>
            <span>из {data.length} монет</span>
            {filteredData.length < data.length && (
              <span className="text-amber-400 text-[11px]">
                (отсеяно фильтрами: {data.length - filteredData.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              Стр. <strong className="text-white">{currentPage}</strong> из <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 select-none">
            <tr>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('symbol')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Тикер / Название</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('lastPrice')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Цена USDT</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('priceChangePct')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>24h Изм. %</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('volume24hUsd')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Объём 24h</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => handleSort('spreadPct')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Спред (Ask-Bid)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </button>
              </th>
              <th className="py-2.5 px-3">Контракт (CA) / Сеть</th>
              <th className="py-2.5 px-3">Категории</th>
              <th className="py-2.5 px-3 text-right">Действия для Аудита</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading && data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                    <span>Загрузка полного среза MEXC (1 500+ пар)...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-6 h-6 text-slate-600" />
                    <span>Ни один токен не подошёл под текущие фильтры</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterContractType('ALL');
                        setFilterCategory('ALL');
                        setMinVolumeUsd(0);
                        setMinPriceChange('ALL');
                        setSearchQuery('');
                      }}
                      className="mt-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-xs"
                    >
                      Сбросить все фильтры
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const isPositive = item.priceChangePct >= 0;
                const isPump = item.priceChangePct >= 15;
                const isDump = item.priceChangePct <= -15;

                return (
                  <tr
                    key={item.symbol}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Symbol & Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                              {item.baseAsset}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">/USDT</span>
                            {item.isMeme && (
                              <span className="px-1 py-0.2 rounded bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[9px] font-bold">
                                MEME
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {item.fullName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 text-slate-200">
                      <div>
                        ${item.lastPrice >= 1
                          ? item.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                          : item.lastPrice.toFixed(item.lastPrice < 0.00001 ? 8 : 6)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        H: {item.high24h >= 1 ? item.high24h.toFixed(2) : item.high24h.toFixed(5)}
                      </div>
                    </td>

                    {/* 24h Change */}
                    <td className="py-2.5 px-3">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          isPump
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            : isPositive
                            ? 'text-emerald-400'
                            : isDump
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isPositive ? '+' : ''}{item.priceChangePct.toFixed(2)}%</span>
                      </div>
                    </td>

                    {/* 24h Volume */}
                    <td className="py-2.5 px-3">
                      <div className="text-slate-200 font-semibold">
                        ${item.volume24hUsd >= 1000000
                          ? `${(item.volume24hUsd / 1000000).toFixed(2)}M`
                          : `${(item.volume24hUsd / 1000).toFixed(1)}k`}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.volume24hBase > 1000000 ? `${(item.volume24hBase / 1000000).toFixed(1)}M` : item.volume24hBase.toFixed(0)} {item.baseAsset}
                      </div>
                    </td>

                    {/* Spread */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-xs ${
                          item.spreadPct < 0.2
                            ? 'text-emerald-400 font-medium'
                            : item.spreadPct < 1.0
                            ? 'text-slate-300'
                            : 'text-amber-400 font-bold'
                        }`}
                      >
                        {item.spreadPct.toFixed(2)}%
                      </span>
                    </td>

                    {/* Contract Address */}
                    <td className="py-2.5 px-3">
                      {item.contractAddress ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.isEvm
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {item.isEvm ? 'EVM 0x' : 'Solana'}
                          </span>
                          <span
                            className="text-slate-300 font-mono text-[11px] hover:underline cursor-pointer"
                            onClick={() => copyToClipboard(item.contractAddress)}
                            title="Кликните чтобы скопировать"
                          >
                            {item.contractAddress.slice(0, 6)}...{item.contractAddress.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.contractAddress)}
                            className="p-1 hover:text-white text-slate-500"
                            title="Скопировать контракт"
                          >
                            {copiedText === item.contractAddress ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Нет в MEXC API</span>
                      )}
                    </td>

                    {/* Concept Plates */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                        {item.conceptPlates.slice(0, 2).map((plate, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]"
                          >
                            {plate}
                          </span>
                        ))}
                        {item.conceptPlates.length > 2 && (
                          <span className="text-[9px] text-slate-500">
                            +{item.conceptPlates.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Add to Pipeline Funnel Board */}
                        {onAddToPipeline && item.contractAddress && (
                          <button
                            type="button"
                            onClick={() => onAddToPipeline({
                              symbol: item.symbol,
                              baseAsset: item.baseAsset,
                              contractAddress: item.contractAddress,
                              price: item.lastPrice,
                              name: item.fullName
                            })}
                            className={`p-1.5 rounded text-[11px] font-bold transition flex items-center justify-center ${
                              pipelineContracts?.has(item.contractAddress.toLowerCase())
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-amber-600/30 hover:bg-amber-500/50 text-amber-200 border border-amber-500/40 hover:border-amber-400'
                            }`}
                            title={
                              pipelineContracts?.has(item.contractAddress.toLowerCase())
                                ? 'Токен уже в 4-колонной Воронке'
                                : 'Добавить в Воронку Отбора (PancakeSwap)'
                            }
                            aria-label={
                              pipelineContracts?.has(item.contractAddress.toLowerCase())
                                ? 'Токен уже в Воронке'
                                : 'Добавить в Воронку'
                            }
                          >
                            {pipelineContracts?.has(item.contractAddress.toLowerCase()) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </button>
                        )}

                        {/* Send to Terminal */}
                        {onSendToTerminal && (
                          <button
                            type="button"
                            onClick={() => onSendToTerminal(item.symbol)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1"
                            title="Открыть график и стакан в терминале"
                          >
                            <Send className="w-3 h-3 text-amber-400" />
                            <span>Терминал</span>
                          </button>
                        )}

                        {/* Open On-Chain Audit */}
                        {item.contractAddress && onOpenAuditForToken && (
                          <button
                            type="button"
                            onClick={() => onOpenAuditForToken(item.contractAddress, item.isEvm ? 'bsc' : 'solana', item.baseAsset)}
                            className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[11px] transition shadow-sm flex items-center gap-1"
                            title="Прогнать через 5-слойный ончейн аудит (Order Flow, Пулы, Холдеры)"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Аудит</span>
                          </button>
                        )}

                        {/* Open MEXC Spot Web */}
                        <a
                          href={`https://www.mexc.com/exchange/${item.symbol.replace('USDT', '_USDT')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Открыть на MEXC Spot"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div>
          Показано с <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> по{' '}
          <strong className="text-white">{Math.min(currentPage * pageSize, filteredData.length)}</strong> из{' '}
          <strong className="text-white">{filteredData.length}</strong> отфильтрованных пар
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white font-mono text-xs"
          >
            В начало
          </button>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white font-mono text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Назад</span>
          </button>
          <span className="px-2 py-1 font-mono text-slate-300">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white font-mono text-xs flex items-center gap-1"
          >
            <span>Вперёд</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white font-mono text-xs"
          >
            В конец
          </button>
        </div>
      </div>
    </div>
  );
};
