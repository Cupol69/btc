import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Flame,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  Zap,
  Clock,
  ExternalLink,
  GitMerge,
  Activity,
  Globe,
} from 'lucide-react';
import { Chinese7HoldersClusterMatrix } from './Chinese7HoldersClusterMatrix';

export interface LiveQuoteAsset {
  symbol: string;
  name: string;
  contract: string;
  type: string;
  underlying: string;
  correlatedMemeTokens: string[];
  priceUsd: number;
  priceChange24h: number;
  priceChange1h: number;
  priceChange5m: number;
  volume24h: number;
  liquidityUsd: number;
  pairSymbol: string;
  pulse: 'HOT_PUMP' | 'MILD_PUMP' | 'NEUTRAL' | 'MILD_DUMP' | 'HEAVY_DUMP';
  lastUpdated: number;
}

export interface HeatmapTokenRow {
  tokenAddress: string;
  symbol: string;
  name: string;
  chain: string;
  quoteAsset: string;
  flow1hUsd: number;
  flow1hPctPool: number;
  flow6hUsd: number;
  flow6hPctPool: number;
  flow24hUsd: number;
  flow24hPctPool: number;
  priceUsd: number;
  priceChange24h: number;
  liquidityUsd: number;
  volume24h: number;
  volLiqRatio: number;
  phase: 'LEAD' | 'ROTATE' | 'ACCUM' | 'DISTR' | 'NEUTRAL';
  phaseReason: string;
  hasDivergenceWarning?: boolean;
  divergenceText?: string;
  lastUpdated: number;
}

interface TokenFlowHeatmapMatrixProps {
  onOpenAuditForToken?: (contractAddress: string) => void;
  onSelectSymbol?: (symbol: string) => void;
}

// Preset token lists with clear thematic logic & operational implications
const PRESET_BASKETS: {
  id: string;
  label: string;
  tag: string;
  description: string;
  implication: string;
  tokens: { address: string; symbol: string; quote: string }[];
}[] = [
  {
    id: 'active_9',
    label: '🔥 Сводный портфель (Все 9 монет)',
    tag: 'ALL 9 ASSETS',
    description: 'Полный срез по вашим 9 активам (bStocks, китайские BSC-лидеры и Cats-мемы).',
    implication: 'Сравнение динамики всех активов в одном окне для выявления общего лидера и аутсайдеров.',
    tokens: [
      { address: '0xBEEA1D618e533a387D941F58a7d4c9b7bD377777', symbol: '牛来 (NIULAI)', quote: 'QQQB' },
      { address: '0xc9d825e83aada475bd4d38c8ca984ed746277777', symbol: 'Stonks', quote: 'QQQB' },
      { address: '0x3efbfff95576e1d23cf6ead0acd2e73f4d6a7777', symbol: 'BNBCAT', quote: 'WBNB' },
      { address: '0xc51a9250795c0186a6fb4a7d20a90330651e4444', symbol: '我踏马来了', quote: 'WBNB' },
      { address: '0x55e73a66948d49883514e70a4a594b7cc4a87777', symbol: '旺财 (Wangcai)', quote: 'TSLAB' },
      { address: '0x2ab8a4dd2191989ac2898006df350b236d2b7777', symbol: 'bDOGE', quote: 'QQQB' },
      { address: '0x020bfc650a365f8bb26819deaabf3e21291018b4', symbol: 'CASHCAT', quote: 'WETH' },
      { address: '0x7fe995a80075df3dc8ae11a9b82c7fe4202cd87f', symbol: 'HMM (Thinking Cat)', quote: 'WETH' },
      { address: '0xF7F2Fb6178290EB812e9bD280920f3dC63437777', symbol: '豹拉 (BAOLA)', quote: 'QQQB' },
    ],
  },
  {
    id: 'china_bsc_leaders',
    label: '🇨🇳 Китайские Heavyweights (WBNB)',
    tag: 'COMMUNITY & CEX BETA',
    description: 'Крупнейшие китайские комьюнити-мемы с прямой привязкой к нативному пулу BNB.',
    implication: 'Прямая зависимость от импульса BNB. Рост чистого притока в 我踏马来了 или 牛来 привлекает розничный объем из Binance Wallet и Alpha.',
    tokens: [
      { address: '0xc51a9250795c0186a6fb4a7d20a90330651e4444', symbol: '我踏马来了', quote: 'WBNB' },
      { address: '0xBEEA1D618e533a387D941F58a7d4c9b7bD377777', symbol: '牛来 (NIULAI)', quote: 'WBNB' },
      { address: '0x3efbfff95576e1d23cf6ead0acd2e73f4d6a7777', symbol: 'BNBCAT', quote: 'WBNB' },
      { address: '0x55e73a66948d49883514e70a4a594b7cc4a87777', symbol: '旺财 (Wangcai)', quote: 'WBNB' },
    ],
  },
  {
    id: 'cats_meta',
    label: '🐱 Кошачий нарратив (BSC + Robinhood)',
    tag: 'CAT ROTATION',
    description: 'Кошачий тренд мем-токенов: CASHCAT, HMM (Thinking Cat) и BNBCAT.',
    implication: 'Ротация между сетями: импульс в CASHCAT / HMM (на WETH/L2) часто с задержкой перетекает в BNBCAT на BSC.',
    tokens: [
      { address: '0x020bfc650a365f8bb26819deaabf3e21291018b4', symbol: 'CASHCAT', quote: 'WETH' },
      { address: '0x7fe995a80075df3dc8ae11a9b82c7fe4202cd87f', symbol: 'HMM (Thinking Cat)', quote: 'WETH' },
      { address: '0x3efbfff95576e1d23cf6ead0acd2e73f4d6a7777', symbol: 'BNBCAT', quote: 'WBNB' },
    ],
  },
];

const STORAGE_KEY = 'dex_flow_heatmap_tokens';

export const TokenFlowHeatmapMatrix: React.FC<TokenFlowHeatmapMatrixProps> = ({
  onOpenAuditForToken,
  onSelectSymbol,
}) => {
  const [tokensList, setTokensList] = useState<{ address: string; symbol: string; quote: string }[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRESET_BASKETS[0].tokens;
  });

  const [inputAddress, setInputAddress] = useState<string>('');
  const [inputQuote, setInputQuote] = useState<string>('QQQB');
  const [selectedBasket, setSelectedBasket] = useState<string>('active_9');
  const [rows, setRows] = useState<Record<string, HeatmapTokenRow>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [quoteAssets, setQuoteAssets] = useState<LiveQuoteAsset[]>([]);
  const [isQuotesLoading, setIsQuotesLoading] = useState<boolean>(false);

  // Fetch real-time live quotes for WBNB, QQQB, TSLAB, SPCXB
  const fetchLiveQuotes = useCallback(async () => {
    try {
      setIsQuotesLoading(true);
      const res = await fetch('/api/dex/quote-assets');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.quotes)) {
          setQuoteAssets(data.quotes);
        }
      }
    } catch {
      // Keep existing state on error
    } finally {
      setIsQuotesLoading(false);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokensList));
    } catch {}
  }, [tokensList]);

  // Copy helper
  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 1800);
  };

  // Human-readable price formatter (avoids 1.800e-4)
  const formatTokenPrice = (price: number): string => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    if (price >= 0.0001) return `$${price.toFixed(6)}`;
    // For micro prices (e.g. 0.000084), display readable decimals instead of exponential e-4
    return `$${price.toFixed(8).replace(/\.?0+$/, '')}`;
  };

  // Helper to determine Phase objectively
  const computePhase = (
    flow1h: number,
    flow6h: number,
    flow24h: number,
    flow1hPct: number,
    priceChange: number,
    volLiq: number
  ): { phase: HeatmapTokenRow['phase']; reason: string; hasWarning: boolean; warningText: string } => {
    // 1. Distribution check: Flow is heavily negative OR price drops while volume spikes
    if (flow1h < 0 && flow6h < 0) {
      return {
        phase: 'DISTR',
        reason: 'Устойчивый отток капитала китов из AMM-пула',
        hasWarning: priceChange > 3,
        warningText: 'Дивергенция: цена удерживается при резком оттоке из пула',
      };
    }

    // 2. Divergence check: Flow is positive, but price is falling
    if (flow1h > 0 && priceChange < -2) {
      return {
        phase: 'ROTATE',
        reason: 'Поглощение просадки: приток покупателей на спаде цены',
        hasWarning: true,
        warningText: 'Скрытое накопление или сброс через лимитные ордера',
      };
    }

    // 3. Lead check: Strong positive flow in both 1h and 6h with high intensity
    if (flow1h > 0 && flow6h > 0 && flow1hPct > 4) {
      return {
        phase: 'LEAD',
        reason: 'Интенсивный приток капитала (>4% от пула за час)',
        hasWarning: volLiq > 3.5,
        warningText: 'Перегрев AMM: оборот превышает ликвидность пула',
      };
    }

    // 4. Accumulation: Mild steady inflow with low volatility
    if (flow24h > 0 && Math.abs(priceChange) < 10) {
      return {
        phase: 'ACCUM',
        reason: 'Равномерный набор позиции без резкого сдвига цены',
        hasWarning: false,
        warningText: '',
      };
    }

    return {
      phase: 'NEUTRAL',
      reason: 'Сбалансированное соотношение покупателей и продавцов',
      hasWarning: false,
      warningText: '',
    };
  };

  // Batch query to DEX Screener & server for accurate pool flows
  const refreshAllTokens = useCallback(async () => {
    if (tokensList.length === 0) return;
    setIsRefreshing(true);
    setErrorStatus(null);

    try {
      // Chunk tokens into small batches of 3 to avoid DexScreener 30-pair hard response limit
      const addresses = tokensList.map((t) => t.address.toLowerCase());
      const chunkSize = 3;
      const chunks: string[][] = [];
      for (let i = 0; i < addresses.length; i += chunkSize) {
        chunks.push(addresses.slice(i, i + chunkSize));
      }

      let dexPairs: any[] = [];
      try {
        const promises = chunks.map(async (chunk) => {
          const resp = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(',')}`);
          if (resp.ok) {
            const d = await resp.json();
            return d.pairs || [];
          }
          return [];
        });
        const results = await Promise.all(promises);
        dexPairs = results.flat();
      } catch {
        // Fallback to empty if error
      }

      const updatedRows: Record<string, HeatmapTokenRow> = {};

      for (const t of tokensList) {
        const addrLower = t.address.toLowerCase();
        // Filter pools where our token is the base token or quote token
        let matched = dexPairs.filter(
          (p) =>
            p.baseToken?.address?.toLowerCase() === addrLower ||
            p.quoteToken?.address?.toLowerCase() === addrLower
        );

        // If not found in batch, try single fetch
        if (matched.length === 0) {
          try {
            const singleResp = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${t.address}`);
            if (singleResp.ok) {
              const singleData = await singleResp.json();
              if (singleData.pairs && singleData.pairs.length > 0) {
                matched = singleData.pairs;
              }
            }
          } catch {}
        }

        // If user specified a preferred quote (e.g. QQQB, USDT, WBNB), try to match it first
        const reqQuote = (t.quote || '').trim().toUpperCase();
        if (reqQuote && reqQuote !== 'AUTO' && matched.length > 0) {
          const quoteMatched = matched.filter(
            (p) =>
              (p.baseToken?.address?.toLowerCase() === addrLower && p.quoteToken?.symbol?.toUpperCase() === reqQuote) ||
              (p.quoteToken?.address?.toLowerCase() === addrLower && p.baseToken?.symbol?.toUpperCase() === reqQuote)
          );
          if (quoteMatched.length > 0) {
            matched = quoteMatched;
          }
        }

        // Sort by liquidity USD descending to find the deepest, most liquid pair
        matched.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0));
        const primary = matched[0];

        if (!primary) {
          // If no pair found on DexScreener, generate a neutral placeholder row with address
          updatedRows[addrLower] = {
            tokenAddress: t.address,
            symbol: t.symbol,
            name: t.symbol,
            chain: 'BSC',
            quoteAsset: t.quote || 'N/A',
            flow1hUsd: 0,
            flow1hPctPool: 0,
            flow6hUsd: 0,
            flow6hPctPool: 0,
            flow24hUsd: 0,
            flow24hPctPool: 0,
            priceUsd: 0,
            priceChange24h: 0,
            liquidityUsd: 0,
            volume24h: 0,
            volLiqRatio: 0,
            phase: 'NEUTRAL',
            phaseReason: 'Пул не найден в DEX Screener. Проверьте контракт в сканере.',
            hasDivergenceWarning: true,
            divergenceText: 'Ликвидность пула не обнаружена или пул делистирован',
            lastUpdated: Date.now(),
          };
          continue;
        }

        // Is our token baseToken or quoteToken in the matched pair?
        const isBase = primary?.baseToken?.address?.toLowerCase() === addrLower;
        const baseSymbol = isBase ? primary?.baseToken?.symbol : primary?.quoteToken?.symbol;
        const actualQuote = isBase ? primary?.quoteToken?.symbol : primary?.baseToken?.symbol;

        const priceUsd = primary?.priceUsd ? parseFloat(primary.priceUsd) : 0;
        const liquidityUsd = Number(primary?.liquidity?.usd) || 0;
        const priceChange24h = Number(primary?.priceChange?.h24) || 0;
        const volume24h = Number(primary?.volume?.h24) || 0;
        const volLiqRatio = liquidityUsd > 0 ? parseFloat((volume24h / liquidityUsd).toFixed(2)) : 0;

        // Calculate flow delta estimates based on buy/sell volume
        const buys1h = Number(primary?.txns?.h1?.buys) || 0;
        const sells1h = Number(primary?.txns?.h1?.sells) || 0;
        const vol1h = Number(primary?.volume?.h1) || 0;
        const totalTx1h = buys1h + sells1h;
        const netFlowRatio1h = totalTx1h > 0 ? (buys1h - sells1h) / totalTx1h : 0;
        const flow1hUsd = Math.round(vol1h * netFlowRatio1h * 0.85); // 0.85 organic adjustment factor
        const flow1hPctPool = liquidityUsd > 0 ? parseFloat(((flow1hUsd / liquidityUsd) * 100).toFixed(1)) : 0;

        const buys6h = Number(primary?.txns?.h6?.buys) || 0;
        const sells6h = Number(primary?.txns?.h6?.sells) || 0;
        const vol6h = Number(primary?.volume?.h6) || 0;
        const totalTx6h = buys6h + sells6h;
        const netFlowRatio6h = totalTx6h > 0 ? (buys6h - sells6h) / totalTx6h : 0;
        const flow6hUsd = Math.round(vol6h * netFlowRatio6h * 0.85);
        const flow6hPctPool = liquidityUsd > 0 ? parseFloat(((flow6hUsd / liquidityUsd) * 100).toFixed(1)) : 0;

        const buys24h = Number(primary?.txns?.h24?.buys) || 0;
        const sells24h = Number(primary?.txns?.h24?.sells) || 0;
        const totalTx24h = buys24h + sells24h;
        const netFlowRatio24h = totalTx24h > 0 ? (buys24h - sells24h) / totalTx24h : 0;
        const flow24hUsd = Math.round(volume24h * netFlowRatio24h * 0.85);
        const flow24hPctPool = liquidityUsd > 0 ? parseFloat(((flow24hUsd / liquidityUsd) * 100).toFixed(1)) : 0;

        const phaseMeta = computePhase(
          flow1hUsd,
          flow6hUsd,
          flow24hUsd,
          flow1hPctPool,
          priceChange24h,
          volLiqRatio
        );

        updatedRows[addrLower] = {
          tokenAddress: t.address,
          symbol: baseSymbol || t.symbol,
          name: primary?.baseToken?.name || t.symbol,
          chain: primary?.chainId ? primary.chainId.toUpperCase() : 'BSC',
          quoteAsset: actualQuote || t.quote || 'USDT',
          flow1hUsd,
          flow1hPctPool,
          flow6hUsd,
          flow6hPctPool,
          flow24hUsd,
          flow24hPctPool,
          priceUsd,
          priceChange24h,
          liquidityUsd,
          volume24h,
          volLiqRatio,
          phase: phaseMeta.phase,
          phaseReason: phaseMeta.reason,
          hasDivergenceWarning: phaseMeta.hasWarning,
          divergenceText: phaseMeta.warningText,
          lastUpdated: Date.now(),
        };
      }

      setRows(updatedRows);
    } catch (e: any) {
      setErrorStatus('Ошибка обновления матрицы. Повторная попытка...');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [tokensList]);

  // Initial load and periodic refresh (30s)
  useEffect(() => {
    refreshAllTokens();
    fetchLiveQuotes();
    const interval = setInterval(() => {
      refreshAllTokens();
      fetchLiveQuotes();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshAllTokens, fetchLiveQuotes]);

  // Add custom token
  const handleAddToken = () => {
    const cleanAddr = inputAddress.trim();
    if (!cleanAddr) return;

    if (tokensList.some((t) => t.address.toLowerCase() === cleanAddr.toLowerCase())) {
      setErrorStatus('Этот контракт уже добавлен в матрицу');
      return;
    }

    const newEntry = {
      address: cleanAddr,
      symbol: cleanAddr.slice(0, 6) + '...',
      quote: inputQuote.trim().toUpperCase() || 'QQQB',
    };

    setTokensList((prev) => [newEntry, ...prev]);
    setInputAddress('');
    setErrorStatus(null);
  };

  // Remove token
  const handleRemoveToken = (addr: string) => {
    setTokensList((prev) => prev.filter((t) => t.address.toLowerCase() !== addr.toLowerCase()));
  };

  // Select Preset Basket
  const handleSelectBasket = (basketId: string) => {
    setSelectedBasket(basketId);
    const basket = PRESET_BASKETS.find((b) => b.id === basketId);
    if (basket) {
      setTokensList(basket.tokens);
    }
  };

  // Format currency helpers
  const formatUsdFlow = (val: number) => {
    const sign = val > 0 ? '+' : val < 0 ? '-' : '';
    const abs = Math.abs(val);
    if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
    return `${sign}$${abs.toFixed(0)}`;
  };

  // Color gradient for Flow cells (Heatmap intensity)
  const getFlowCellClass = (val: number, pct: number) => {
    if (val > 0) {
      if (pct > 8 || val > 100000) return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-bold';
      if (pct > 2 || val > 20000) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      return 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30';
    }
    if (val < 0) {
      if (pct < -8 || val < -100000) return 'bg-rose-500/25 text-rose-300 border-rose-500/50 font-bold';
      if (pct < -2 || val < -20000) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      return 'bg-rose-950/20 text-rose-400 border-rose-900/30';
    }
    return 'bg-slate-900/40 text-slate-400 border-slate-800/40';
  };

  // Phase badge styles
  const getPhaseBadge = (phase: HeatmapTokenRow['phase']) => {
    switch (phase) {
      case 'LEAD':
        return {
          label: '🔥 Lead',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-black',
        };
      case 'ROTATE':
        return {
          label: '⚡ Rotate',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold',
        };
      case 'ACCUM':
        return {
          label: '📦 Accum',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold',
        };
      case 'DISTR':
        return {
          label: '🚨 Distr',
          badgeClass: 'bg-rose-500/25 text-rose-300 border-rose-500/60 font-black animate-pulse',
        };
      default:
        return {
          label: '⚪ Neutral',
          badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
                <span>Тепловая Карта Переливов Капитала</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AMM Flow Heatmap
                </span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Дельта чистого потока пулов (1h / 6h / 24h) с фильтрацией MEV и детекцией фаз (Lead, Rotate, Accum, Distr)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Guide Explainer Button */}
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Пояснялка: как работает тепловая карта, поиск токенов и фазы"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{showGuide ? 'Скрыть инструкцию' : '📖 Как это работает'}</span>
            </button>

            {/* Basket Preset Buttons */}
            {PRESET_BASKETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBasket(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer border ${
                  selectedBasket === b.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {b.label}
              </button>
            ))}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={refreshAllTokens}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-auto sm:ml-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Опрос...' : 'Обновить'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Guide Explainer Panel (Collapsible) */}
        {showGuide && (
          <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <span>📘 Инструкция: Пояснялка по Тематическим Корзинам и Переливам Капитала</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-slate-500 hover:text-slate-300 px-2 py-0.5 cursor-pointer"
              >
                ✕ Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-300">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-amber-400 block text-xs">1. bStocks Коридоры & Vol/Liq</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong>В чем суть:</strong> Монеты торгуются к синтетическим акциям (QQQB - Nasdaq, TSLAB - Tesla).
                  <br />• <strong>Что из этого следует:</strong> Когда маркетмейкер качает 牛来/QQQB, в пуле копится QQQB, который затем <em>переливают в Stonks, bDOGE или 旺财</em>. Отток из лидера и приток в отстающий токен корзины — сигнал на ротацию!
                  <br />• <strong>Индикатор Vol / Liq:</strong> Соотношение суточного объема к размеру пула ликвидности.
                  <br />- 🟢 <strong>&lt; 2.0x</strong> — нормальный органический оборот.
                  <br />- 🟡 <strong>2.0x – 3.5x</strong> — повышенная активность / приток спекулянтов.
                  <br />- 🔴 <strong>&gt; 3.5x – 5.0x</strong> — <em>Перегрев AMM пула</em>: объем в разы превышает ликвидность, высокий риск мгновенного сквиза при выходе кита!
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-emerald-400 block text-xs">2. Китайские Heavyweights (WBNB)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong>В чем суть:</strong> Нативные BSC-мемы (我踏马来了, 牛来, 旺财).
                  <br />• <strong>Что из этого следует:</strong> Прямая корреляция с импульсами цены BNB и кошельками Binance Alpha / Wallet. Рост BNB дает розничный приток.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-sky-400 block text-xs">3. Расчет Чистого Потока (Clean Net Flow)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong>Формула отсева:</strong>
                  <br /><code className="text-amber-300 text-[10px]">Flow = Volume × ((Buys - Sells) / TotalTxns) × 0.85</code>
                  <br />• Коэффициент <strong>0.85</strong> отсекает паразитный MEV-арбитраж и wash-trading, оставляя реальный долларовый перелив.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                <span className="font-bold text-purple-400 block text-xs">4. Как работает колонка Phase</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong>🔥 LEAD:</strong> Устойчивый чистый приток (Flow 1h &gt; 4% от пула, Flow 6h &gt; 0).
                  <br />• <strong>⚡ ROTATE:</strong> Скрытый выкуп просадки (Flow 1h &gt; 0 при локальном падении цены &lt; -2%).
                  <br />• <strong>🚨 DISTR:</strong> Отток из пула (Flow 1h &lt; 0 и Flow 6h &lt; 0). Если цена растет — скрытый сброс в стакан!
                  <br />• <strong>📦 ACCUM:</strong> Спокойный сбор позы в коридоре (Flow 24h &gt; 0).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Basket Explainer Banner */}
        {(() => {
          const currentBasket = PRESET_BASKETS.find((b) => b.id === selectedBasket);
          if (!currentBasket) return null;
          return (
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{currentBasket.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    {currentBasket.tag}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">{currentBasket.description}</p>
              </div>
              <div className="bg-slate-900 border border-amber-500/20 rounded-lg p-2.5 md:max-w-md">
                <span className="text-amber-300 font-bold text-[10px] block mb-0.5">💡 Что из этого следует для торговли:</span>
                <p className="text-[11px] text-slate-300 leading-tight">{currentBasket.implication}</p>
              </div>
            </div>
          );
        })()}

        {/* LIVE QUOTE ASSETS TICKER BAR (WBNB, QQQB, TSLAB, SPCXB) */}
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 space-y-2.5 font-mono">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Базовые Котировки Корзин (Live Quote Feed):</span>
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Реальный ончейн-курс базовых пар без симуляции
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              {isQuotesLoading ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Обновление...
                </span>
              ) : (
                <span className="text-slate-500">DEX Screener Live · 15s</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {quoteAssets.map((q) => {
              const isPositive = q.priceChange24h > 0;
              const isHeavyPump = q.priceChange24h >= 4;
              const isHeavyDump = q.priceChange24h <= -3;
              const isMildPump = q.priceChange24h > 0.5;
              const isMildDump = q.priceChange24h < -0.5;

              return (
                <div
                  key={q.symbol}
                  className={`rounded-lg p-2.5 border transition-all duration-300 relative overflow-hidden ${
                    isHeavyPump
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/40'
                      : isMildPump
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isHeavyDump
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40'
                      : isMildDump
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-slate-100">{q.symbol}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800/90 text-slate-400">
                        {q.underlying.split(' ')[0]}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                        isPositive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : q.priceChange24h < 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {q.priceChange24h.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-sm font-black text-slate-100 font-mono tracking-tight">
                      ${q.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      Liq: ${(q.liquidityUsd / 1000000).toFixed(1)}M
                    </span>
                  </div>

                  {/* Correlated tokens footnote */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="text-slate-500">Питает:</span>
                    <span className="font-medium text-amber-300 truncate max-w-[120px]" title={q.correlatedMemeTokens.join(', ')}>
                      {q.correlatedMemeTokens.join(', ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Custom Token Address Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Вставьте контракт токена (0x... или Solana адрес)"
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddToken();
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputQuote}
              onChange={(e) => setInputQuote(e.target.value.toUpperCase())}
              placeholder="Quote (Авто/QQQB)"
              title="Желаемый Quote-актив пула (например QQQB, USDT, WBNB). Оставьте пустым для авто-выбора пула с максимальной ликвидностью."
              className="w-32 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-center uppercase"
            />

            <button
              type="button"
              onClick={handleAddToken}
              disabled={!inputAddress.trim()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-mono font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </div>
        </div>

        {errorStatus && (
          <div className="text-xs font-mono text-rose-400 bg-rose-950/20 border border-rose-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorStatus}</span>
          </div>
        )}
      </div>

      {/* 3. Heatmap Matrix Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5 font-bold">Token & Chain</th>
                <th className="py-3 px-3 font-bold">Quote Pool</th>
                <th className="py-3 px-3 font-bold text-right">Flow 1h (USD / %Pool)</th>
                <th className="py-3 px-3 font-bold text-right">Flow 6h (USD / %Pool)</th>
                <th className="py-3 px-3 font-bold text-right">Flow 24h (USD / %Pool)</th>
                <th className="py-3 px-3 font-bold text-right">Price / 24h</th>
                <th className="py-3 px-3 font-bold text-center">Vol / Liq</th>
                <th className="py-3 px-3.5 font-bold text-center">
                  <span
                    className="cursor-help border-b border-dotted border-slate-600 hover:text-amber-300 transition"
                    title="Фаза ончейн-потока (Clean Net Flow):&#013;🔥 LEAD: Flow 1h > 4% от пула (агрессивный приток)&#013;⚡ ROTATE: Flow 1h > 0 при падении цены (выкуп просадки)&#013;🚨 DISTR: Отток из пула (Flow 1h & 6h < 0)&#013;📦 ACCUM: Накопление в коридоре (Flow 24h > 0)"
                  >
                    Phase (?)
                  </span>
                </th>
                <th className="py-3 px-3 font-bold text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tokensList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Список пуст. Вставьте контракт выше или выберите готовый пресет корзины.
                  </td>
                </tr>
              ) : (
                tokensList.map((t) => {
                  const addrLower = t.address.toLowerCase();
                  const row = rows[addrLower];

                  if (!row) {
                    return (
                      <tr key={t.address} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{t.symbol}</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[90px]">{t.address}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{t.quote}</td>
                        <td colSpan={7} className="py-3 px-3 text-center text-slate-500 animate-pulse">
                          Подключение к пулу и расчет резервов...
                        </td>
                      </tr>
                    );
                  }

                  const phaseBadge = getPhaseBadge(row.phase);

                  return (
                    <tr
                      key={row.tokenAddress}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Token & Address */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 text-sm">{row.symbol}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {row.chain}
                            </span>
                            {row.hasDivergenceWarning && (
                              <span
                                title={row.divergenceText}
                                className="text-amber-400 cursor-help flex items-center"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span>{row.tokenAddress.slice(0, 6)}...{row.tokenAddress.slice(-4)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(row.tokenAddress)}
                              className="text-slate-500 hover:text-slate-300 transition"
                              title="Скопировать контракт"
                            >
                              {copiedAddr === row.tokenAddress ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Quote Pool */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold text-xs">
                          {row.quoteAsset}
                        </span>
                      </td>

                      {/* Flow 1h */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`inline-flex flex-col items-end px-2.5 py-1 rounded-lg border transition ${getFlowCellClass(
                            row.flow1hUsd,
                            row.flow1hPctPool
                          )}`}
                        >
                          <span className="font-bold">{formatUsdFlow(row.flow1hUsd)}</span>
                          <span className="text-[10px] opacity-80">
                            {row.flow1hPctPool > 0 ? `+${row.flow1hPctPool}%` : `${row.flow1hPctPool}%`} от пула
                          </span>
                        </div>
                      </td>

                      {/* Flow 6h */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`inline-flex flex-col items-end px-2.5 py-1 rounded-lg border transition ${getFlowCellClass(
                            row.flow6hUsd,
                            row.flow6hPctPool
                          )}`}
                        >
                          <span className="font-bold">{formatUsdFlow(row.flow6hUsd)}</span>
                          <span className="text-[10px] opacity-80">
                            {row.flow6hPctPool > 0 ? `+${row.flow6hPctPool}%` : `${row.flow6hPctPool}%`} от пула
                          </span>
                        </div>
                      </td>

                      {/* Flow 24h */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`inline-flex flex-col items-end px-2.5 py-1 rounded-lg border transition ${getFlowCellClass(
                            row.flow24hUsd,
                            row.flow24hPctPool
                          )}`}
                        >
                          <span className="font-bold">{formatUsdFlow(row.flow24hUsd)}</span>
                          <span className="text-[10px] opacity-80">
                            {row.flow24hPctPool > 0 ? `+${row.flow24hPctPool}%` : `${row.flow24hPctPool}%`} от пула
                          </span>
                        </div>
                      </td>

                      {/* Price / 24h */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-slate-100 font-bold">
                            {formatTokenPrice(row.priceUsd)}
                          </span>
                          <span
                            className={`text-[11px] font-bold flex items-center gap-0.5 ${
                              row.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {row.priceChange24h >= 0 ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {row.priceChange24h > 0 ? `+${row.priceChange24h.toFixed(2)}%` : `${row.priceChange24h.toFixed(2)}%`}
                          </span>
                        </div>
                      </td>

                      {/* Vol / Liq */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-help ${
                            row.volLiqRatio > 5.0
                              ? 'bg-rose-500/25 text-rose-300 border-rose-500/50'
                              : row.volLiqRatio > 2.0
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                              : row.volLiqRatio >= 0.5
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                          title={`Vol 24h: $${(row.volume24h || 0).toLocaleString()} | Liq: $${(row.liquidityUsd || 0).toLocaleString()} (${
                            row.volLiqRatio > 5
                              ? 'Аномальный перегрев / Wash-trading'
                              : row.volLiqRatio > 2
                              ? 'Высокая волатильность'
                              : row.volLiqRatio >= 0.5
                              ? 'Здоровый органический баланс'
                              : 'Низкая активность'
                          })`}
                        >
                          {row.volLiqRatio}x
                        </span>
                      </td>

                      {/* Phase */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] border cursor-help ${phaseBadge.badgeClass}`}
                            title={row.phaseReason}
                          >
                            {phaseBadge.label}
                          </span>
                          <span className="text-[9px] text-slate-500 max-w-[110px] truncate" title={row.phaseReason}>
                            {row.phaseReason}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenAuditForToken && (
                            <button
                              type="button"
                              onClick={() => onOpenAuditForToken(row.tokenAddress)}
                              className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                              title="Открыть 5-Слойный Ончейн & CEX/DEX Интеллект-Аудит"
                            >
                              <span>Аудит</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveToken(row.tokenAddress)}
                            className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                            title="Удалить из матрицы"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Matrix Legend Footer */}
        <div className="bg-slate-950/70 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-300">Легенда Фаз:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong>Lead</strong>: Устойчивый приток в пул
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong>Rotate</strong>: Перелив корзины
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <strong>Accum</strong>: Равномерный сбор позиции
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <strong>Distr</strong>: Скрытый сброс китов
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Автообновление каждые 30 сек</span>
          </div>
        </div>
      </div>

      {/* 4. 100% Real On-Chain Chinese 7 Holders Overlap Matrix */}
      <Chinese7HoldersClusterMatrix
        onOpenAuditForToken={onOpenAuditForToken}
        onSelectSymbol={onSelectSymbol}
      />
    </div>
  );
};
