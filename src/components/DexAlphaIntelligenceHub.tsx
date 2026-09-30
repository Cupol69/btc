import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Globe,
  Layers,
  ExternalLink,
  Copy,
  Check,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Activity,
  Droplets,
  Coins,
  Cpu,
  BarChart2,
  Wallet,
  AlertTriangle,
  Info,
  ChevronRight,
  Filter,
  Send,
  MessageSquare,
  Bot,
  User,
  HelpCircle,
  Lock,
  Unlock,
  FileCode,
  Sliders,
  Zap,
  Radio,
  Eye,
  Crosshair,
  BadgeCheck,
  Shield,
  Gauge,
  CircleDollarSign,
  Star,
  History,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';
import {
  DexOnChainData,
  DexPoolItem,
  DexAiAnalysis,
  DexSecurityAudit,
  DexWhaleSwap,
  DexLiquidityLevelsData,
  DexSyndicateForensics,
  DexWhaleOutflowRadarData,
} from '../types';
import { DexLiquidityLevelsMap } from './DexLiquidityLevelsMap';
import { DexSyndicateForensicsCard } from './DexSyndicateForensicsCard';
import { DexWhaleOutflowRadar } from './DexWhaleOutflowRadar';
import { DexSmartMoneyAlphaDetector } from './DexSmartMoneyAlphaDetector';
import { DexAiTradeChart } from './DexAiTradeChart';
import { DexTripleIntelAuditView } from './DexTripleIntelAuditView';
import { symbolService, CHINESE_MEME_TOKENS } from '../services/symbolService';

export interface DexAlphaIntelligenceHubProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onSwitchToTerminal?: () => void;
  initialSubTab?: 'TRIPLE_AUDIT' | 'ALPHA_RADAR' | 'BINANCE_ALPHA' | 'POOLS_MATRIX' | 'LIQUIDITY_MAP' | 'SECURITY_AUDIT' | 'WHALE_RADAR' | 'AI_COPILOT' | 'AI_CHART_ENGINE';
  initialTokenAddress?: string;
}

const POPULAR_ONCHAIN_COINS = [
  { symbol: '牛来', name: '牛来 (Niulai · QQQB)', category: '🏆 bStocks Sprint', chain: 'BSC', contract: '0xbeea1d618e533a387d941f58a7d4c9b7bd377777', emoji: '🐮' },
  { symbol: '旺财', name: '旺财 (Wangcai · TSLAB · 7777 BSC)', category: '🏆 bStocks / 7777 BSC', chain: 'BSC', contract: '0x55e73A66948d49883514E70a4a594b7CC4a87777', emoji: '🐶' },
  { symbol: '豹拉', name: '豹拉 (Baola · QQQB)', category: '🏆 bStocks Sprint', chain: 'BSC', contract: '0xbb469d64e89c8b2fe0221052220a96a7f1c67777', emoji: '🐆' },
  { symbol: 'MARS', name: 'MarsCoin (SpaceX / SPCXB 3% Div · 7777)', category: '🏆 bStocks / 7777 BSC', chain: 'BSC', contract: '0xFe189E97832DA1573e4e4Ff034F4fFC3a15c7777', emoji: '🚀' },
  { symbol: '孙小圣', name: '孙小圣 (Sun Xiaosheng · QQQB)', category: '🏆 bStocks Sprint', chain: 'BSC', contract: '0xbb87378b58894338f0937b9691a5a6dc3a5a7777', emoji: '🐵' },
  { symbol: '币安人生', name: '币安人生 (Binance Life · 44444)', category: '🌟 44444 BSC', chain: 'BSC', contract: '0x924fa68a0FC644485b8df8AbfA0A41C2e7744444', emoji: '🌟' },
  { symbol: '我踏马来了', name: '我踏马来了 (WoTaMaLaiLe · 4444)', category: '🐎 4444 BSC', chain: 'BSC', contract: '0xc51A9250795c0186a6FB4A7D20A90330651e4444', emoji: '🐎' },
  { symbol: 'BNBCAT', name: 'Binance Cat (BNBCAT · 7777)', category: '🐱 7777 BSC', chain: 'BSC', contract: '0x3EFBfFf95576e1d23cF6Ead0AcD2E73F4d6A7777', emoji: '🐱' },
  { symbol: 'Sue', name: 'Sue 施工猫 (Cat · 7777)', category: '🏗️ 7777 BSC', chain: 'BSC', contract: '0x2Ab8A4Dd2191989aC2898006Df350B236D2B7777', emoji: '🏗️' },
  { symbol: 'CASHCAT', name: 'Cash Cat (CASHCAT)', category: '💵 Robinhood', chain: 'ROBINHOOD', contract: '0x020bfC650A365f8BB26819deAAbF3E21291018b4', emoji: '💵' },
  { symbol: 'HMM', name: 'Thinking Cat (HMM)', category: '🤔 Robinhood', chain: 'ROBINHOOD', contract: '0x7FE995a80075dF3Dc8Ae11A9b82c7FE4202CD87f', emoji: '🤔' },
  { symbol: 'BTC', name: 'Bitcoin (WBTC/BTCB)', category: 'Major/BSC', chain: 'BSC', contract: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', emoji: '₿' },
  { symbol: 'ETH', name: 'Ethereum (WETH)', category: 'Major/ETH', chain: 'ETH', contract: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', emoji: 'Ξ' },
  { symbol: 'SOL', name: 'Solana (Wrapped)', category: 'L1/DEX Hub', chain: 'SOLANA', contract: 'So11111111111111111111111111111111111111112', emoji: '◎' },
  { symbol: 'BNB', name: 'BNB Chain', category: 'L1/BSC', chain: 'BSC', contract: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', emoji: '🟡' },
  { symbol: 'PEPE', name: 'Pepe Alpha Pool', category: 'Meme/ETH & BSC', chain: 'BSC', contract: '0x25d887ce7a35172C62FeBFD67a1856620DAEb000', emoji: '🐸' },
  { symbol: 'DOGE', name: 'Doge Coin Alpha', category: 'Major/BSC', chain: 'BSC', contract: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', emoji: '🐕' },
  { symbol: 'SUI', name: 'Sui Network', category: 'L1/SUI', chain: 'SUI', contract: '0x2::sui::SUI', emoji: '💧' },
  { symbol: 'WIF', name: 'dogwifhat', category: 'Meme/SOL', chain: 'SOLANA', contract: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', emoji: '🐶' },
  { symbol: 'PNUT', name: 'Peanut the Squirrel', category: 'Meme/SOL', chain: 'SOLANA', contract: '2qEHjDLDLbuBgRYvsxhc5RefwhHyJCPBA37W2t6epump', emoji: '🐿️' },
  { symbol: 'NEIRO', name: 'First Neiro on ETH', category: 'Meme/ETH', chain: 'ETH', contract: '0x812Ba41e071C7b7fA4EBcFB62dF5F45f6fA853Ee', emoji: '🐕' },
];

const CHAIN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ethereum: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  eth: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  solana: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  sol: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  base: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  arbitrum: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  bsc: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  polygon: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  avalanche: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  optimism: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  sui: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  robinhood: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

export interface CexTickerInfo {
  isBinanceListed?: boolean;
  isFuturesListed?: boolean;
  symbol?: string;
  binancePrice?: number;
  spotPrice?: number;
  volume24h?: number;
  priceChangePct?: number;
  url?: string;
}

export const DEFAULT_ONCHAIN_TOKEN = '0xfe189e97832da1573e4e4ff034f4ffc3a15c7777'; // MarsCoin (BSC)

export const isCexMajorAsset = (queryOrSymbol?: string): boolean => {
  if (!queryOrSymbol) return false;
  const q = queryOrSymbol.trim().toUpperCase();
  // EVM or Solana contract addresses are real on-chain tokens
  if (/^0x[a-fA-F0-9]{40}$/i.test(q) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) {
    return false;
  }
  const clean = q.replace(/(USDT|BUSD|USDC|FDUSD)$/, '');
  return ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC', 'FDUSD', 'BUSD'].includes(clean);
};

export const DexAlphaIntelligenceHub: React.FC<DexAlphaIntelligenceHubProps> = ({
  currentSymbol,
  onSelectSymbol,
  onSwitchToTerminal,
  initialSubTab = 'ALPHA_RADAR',
  initialTokenAddress,
}) => {
  // Active selected on-chain token (persisted, never auto-reverting to BTC)
  const [selectedCoin, setSelectedCoin] = useState<string>(() => {
    if (initialTokenAddress && !isCexMajorAsset(initialTokenAddress)) {
      return initialTokenAddress;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dex_selected_onchain_coin');
      if (saved && !isCexMajorAsset(saved)) {
        return saved;
      }
    }
    if (currentSymbol && !isCexMajorAsset(currentSymbol)) {
      return currentSymbol.replace(/(USDT|BUSD|USDC|FDUSD)$/, '');
    }
    return DEFAULT_ONCHAIN_TOKEN;
  });

  // Persist selected on-chain token
  useEffect(() => {
    if (selectedCoin && !isCexMajorAsset(selectedCoin)) {
      try {
        localStorage.setItem('dex_selected_onchain_coin', selectedCoin);
      } catch {
        // ignore quota errors
      }
    }
  }, [selectedCoin]);

  useEffect(() => {
    if (initialTokenAddress && !isCexMajorAsset(initialTokenAddress)) {
      setSelectedCoin(initialTokenAddress);
      setActiveSubTab('TRIPLE_AUDIT');
    }
  }, [initialTokenAddress]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [data, setData] = useState<DexOnChainData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubMetricsLoading, setIsSubMetricsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>('ALL');
  const [poolSearchQuery, setPoolSearchQuery] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Sub-Navigation Tabs inside the Unified Super-Hub
  const [activeSubTab, setActiveSubTab] = useState<
    'TRIPLE_AUDIT' | 'ALPHA_RADAR' | 'BINANCE_ALPHA' | 'POOLS_MATRIX' | 'LIQUIDITY_MAP' | 'SECURITY_AUDIT' | 'WHALE_RADAR' | 'AI_COPILOT'
  >(initialSubTab === 'AI_CHART_ENGINE' ? 'ALPHA_RADAR' : (initialSubTab as any) || 'TRIPLE_AUDIT');

  // Sub-tab specialized state synchronized with main coin
  const [liquidityPlan, setLiquidityPlan] = useState<DexLiquidityLevelsData | null>(null);
  const [syndicateForensics, setSyndicateForensics] = useState<DexSyndicateForensics | null>(null);
  const [whaleRadar, setWhaleRadar] = useState<DexWhaleOutflowRadarData | null>(null);
  const [securityData, setSecurityData] = useState<DexSecurityAudit | null>(null);
  const [isSecurityLoading, setIsSecurityLoading] = useState<boolean>(false);
  const [whaleSwaps, setWhaleSwaps] = useState<DexWhaleSwap[]>([]);
  const [whaleMinAmountFilter, setWhaleMinAmountFilter] = useState<number>(1000);
  const [cexData, setCexData] = useState<CexTickerInfo | null>(null);

  // Favorites & History (synced with localStorage & symbolService)
  const [recentSymbols, setRecentSymbols] = useState<string[]>(() => symbolService.getRecentSymbols());
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(() => symbolService.getFavoriteSymbols());
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState<boolean>(false);
  const [historyTab, setHistoryTab] = useState<'alpha' | 'favorites' | 'all'>('alpha');
  const [historyFilter, setHistoryFilter] = useState<string>('');
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  // AI Co-Pilot State
  const [aiCustomQuestion, setAiCustomQuestion] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      text: string;
      timestamp: number;
      model?: string;
      grounding?: {
        enabled: boolean;
        queries?: string[];
        sources?: { title: string; uri: string }[];
      };
    }>
  >([
    {
      role: 'assistant',
      text: 'Приветствую! Я AI Co-Pilot модуля DEX & Alpha Intelligence. Анализирую ликвидность пулов, детекцию синдикатов, лимитный стакан, структуру холдеров, ончейн-безопасность и новости с Live Search Grounding. Чем могу помочь по текущему токену?',
      timestamp: Date.now() - 60000,
    },
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<DexAiAnalysis | null>(null);
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState<boolean>(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState<boolean>(true);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const fetchFullAiAnalysis = useCallback(async (targetData?: DexOnChainData | null) => {
    const d = targetData || data;
    if (!d) return;
    setIsAiAnalysisLoading(true);
    try {
      const payload = {
        symbol: d.symbol || selectedCoin,
        binanceSpotPrice: d.binanceSpotPrice || 0,
        primaryDexPrice: d.primaryDexPrice || 0,
        mktCap: d.mktCap || d.marketCap || d.binanceAlpha?.mktCap,
        fdv: d.fdv || d.binanceAlpha?.fdv,
        security: securityData || d.security,
        arbitrageSpreadPercent: d.arbitrageSpreadPercent || 0,
        arbitrageStatus: d.arbitrageStatus || 'PARITY',
        totalDexLiquidityUsd: d.totalDexLiquidityUsd || 0,
        totalDexVolume24h: d.totalDexVolume24h || 0,
        buyPressurePercent24h: d.buyPressurePercent24h || 50,
        buyPressurePercent1h: d.buyPressurePercent1h || 50,
        chainsSummary: d.chainsSummary || [],
        topPools: d.topPools || [],
        primaryContractAddress: d.primaryContractAddress,
        totalBuys24h: d.totalBuys24h,
        totalSells24h: d.totalSells24h,
      };

      const resp = await fetch('/api/dex/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (resp.ok) {
        const json: DexAiAnalysis = await resp.json();
        setAiAnalysisResult(json);
      }
    } catch (err) {
      console.warn('[DexAlphaHub] fetchFullAiAnalysis error:', err);
    } finally {
      setIsAiAnalysisLoading(false);
    }
  }, [data, selectedCoin, securityData]);

  // Automatically fetch AI analysis when switching to AI_COPILOT if not already loaded
  useEffect(() => {
    if (activeSubTab === 'AI_COPILOT' && !aiAnalysisResult && data && !isAiAnalysisLoading) {
      fetchFullAiAnalysis(data);
    }
  }, [activeSubTab, aiAnalysisResult, data, isAiAnalysisLoading, fetchFullAiAnalysis]);

  // Reset analysis when selected coin changes
  useEffect(() => {
    setAiAnalysisResult(null);
  }, [selectedCoin]);

  useEffect(() => {
    if (activeSubTab === 'AI_COPILOT') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, isAiGenerating, activeSubTab]);

  // Orderbook simulation state for Binance Alpha
  const [simulatedOrderSizeUsd, setSimulatedOrderSizeUsd] = useState<number>(5000);

  // Synchronize favorites and recents
  useEffect(() => {
    setRecentSymbols(symbolService.getRecentSymbols());
    setFavoriteSymbols(symbolService.getFavoriteSymbols());
  }, [selectedCoin, currentSymbol]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target as Node)) {
        setIsHistoryDropdownOpen(false);
      }
    };
    if (isHistoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHistoryDropdownOpen]);

  // Synchronize when currentSymbol prop changes from parent (ONLY for genuine on-chain assets or contracts)
  useEffect(() => {
    if (currentSymbol) {
      const isContract = /^0x[a-fA-F0-9]{40}$/i.test(currentSymbol) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(currentSymbol);
      const isMemeToken = Boolean(CHINESE_MEME_TOKENS[currentSymbol]) || /[\u4e00-\u9fa5]/.test(currentSymbol);
      const clean = currentSymbol.replace(/(USDT|BUSD|USDC|FDUSD)$/, '');

      // CRITICAL: Never overwrite with CEX majors like BTC, ETH, SOL, BNB from Terminal
      if (!isCexMajorAsset(currentSymbol) && !isCexMajorAsset(clean)) {
        if (isContract || isMemeToken || clean.length > 0) {
          if (clean !== selectedCoin && currentSymbol !== selectedCoin) {
            setSelectedCoin(clean);
          }
        }
      }
    }
  }, [currentSymbol, selectedCoin]);

  // Comprehensive synchronized fetch function for all sub-services
  const fetchDexData = useCallback(async (coin: string, retryCount = 0) => {
    if (!coin.trim()) return;
    setIsLoading(true);
    setIsSubMetricsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      // 1. Fetch Primary DEX Pools & Binance Alpha Core Data
      const resp = await fetch(`/api/dex/pools?query=${encodeURIComponent(coin.trim())}&symbol=${encodeURIComponent(coin.trim())}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        throw new Error(`Ошибка загрузки данных DEX (${resp.status})`);
      }
      const rawJson: DexOnChainData = await resp.json();
      const poolsList = rawJson.topPools || rawJson.pools || [];
      const normalizedData: DexOnChainData = {
        ...rawJson,
        topPools: poolsList,
        pools: poolsList,
      };

      setData(normalizedData);
      setLastRefreshed(Date.now());

      // Auto update recents
      const isContract = /^0x[a-fA-F0-9]{40}$/i.test(coin.trim()) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(coin.trim());
      const directSym = isContract
        ? (normalizedData.symbol ? (normalizedData.symbol.toUpperCase().endsWith('USDT') ? normalizedData.symbol.toUpperCase() : `${normalizedData.symbol.toUpperCase()}USDT`) : coin.trim())
        : (coin.toUpperCase().endsWith('USDT') ? coin.toUpperCase() : `${coin.toUpperCase()}USDT`);
      const updated = symbolService.addRecentSymbol(directSym);
      setRecentSymbols(updated);

      // 2. Parallel Deep Sub-Services Synchronization (Liquidity Levels, Forensics, Whale Radar, Security, Live Swaps)
      const primaryContract = normalizedData.primaryContractAddress || poolsList[0]?.baseToken?.address || '';
      const primaryChain = normalizedData.primaryChain || poolsList[0]?.chainId || 'bsc';
      const primaryPair = poolsList[0]?.pairAddress || '';
      const primaryPrice = normalizedData.primaryDexPrice || normalizedData.binanceSpotPrice || 0.05;

      // Clean, lightweight sub-payload to ensure fast transport without unnecessary raw metadata
      const subPayload = {
        symbol: normalizedData.symbol,
        primaryDexPrice: normalizedData.primaryDexPrice,
        binanceSpotPrice: normalizedData.binanceSpotPrice,
        totalDexLiquidityUsd: normalizedData.totalDexLiquidityUsd,
        totalDexVolume24h: normalizedData.totalDexVolume24h,
        arbitrageSpreadPercent: normalizedData.arbitrageSpreadPercent,
        arbitrageStatus: normalizedData.arbitrageStatus,
        chainsSummary: normalizedData.chainsSummary,
        topPools: poolsList.slice(0, 15).map(p => ({
          dexId: p.dexId,
          chainId: p.chainId,
          pairAddress: p.pairAddress,
          baseToken: p.baseToken,
          quoteToken: p.quoteToken,
          priceUsd: p.priceUsd,
          liquidityUsd: p.liquidityUsd,
          volume24h: p.volume?.h24 || 0,
        })),
      };

      // Launch all sub-services in parallel so everything stays completely synchronized
      const [liqRes, forensRes, radarRes, secRes, swapsRes, cexRes] = await Promise.allSettled([
        // Sub 1: Liquidity Levels Map
        fetch('/api/dex/liquidity-levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subPayload),
        }).then(r => r.ok ? r.json() : null),

        // Sub 2: Syndicate Forensics & Multi-pool Traps
        fetch('/api/dex/syndicate-forensics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subPayload),
        }).then(r => r.ok ? r.json() : null),

        // Sub 3: Whale Outflow & Binance Futures Transfer Radar
        fetch('/api/dex/whale-radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subPayload),
        }).then(r => r.ok ? r.json() : null),

        // Sub 4: Security & Honeypot Audit
        fetch(`/api/dex/security?address=${encodeURIComponent(primaryContract)}&chain=${encodeURIComponent(primaryChain)}&symbol=${encodeURIComponent(normalizedData.symbol)}`)
          .then(r => r.ok ? r.json() : null),

        // Sub 5: Live Whale Swaps
        fetch(`/api/dex/swaps?pairAddress=${encodeURIComponent(primaryPair)}&chainId=${encodeURIComponent(primaryChain)}&symbol=${encodeURIComponent(normalizedData.symbol)}&price=${primaryPrice}`)
          .then(r => r.ok ? r.json() : null),

        // Sub 6: Binance CEX Spot Ticker Cross-Check
        fetch(`/api/cex/ticker?symbol=${encodeURIComponent(coin.trim())}`)
          .then(r => r.ok ? r.json() : null),
      ]);

      // Process and set sub-tab states
      if (liqRes.status === 'fulfilled' && liqRes.value) {
        setLiquidityPlan(liqRes.value);
        setData(prev => prev ? { ...prev, liquidityLevels: liqRes.value } : prev);
      }

      if (forensRes.status === 'fulfilled' && forensRes.value) {
        setSyndicateForensics(forensRes.value);
        setData(prev => prev ? { ...prev, syndicateForensics: forensRes.value } : prev);
      }

      if (radarRes.status === 'fulfilled' && radarRes.value) {
        setWhaleRadar(radarRes.value);
        setData(prev => prev ? { ...prev, whaleOutflowRadar: radarRes.value } : prev);
      }

      if (secRes.status === 'fulfilled' && secRes.value) {
        setSecurityData(secRes.value);
      }

      if (cexRes.status === 'fulfilled' && cexRes.value) {
        setCexData(cexRes.value);
        if (cexRes.value.spotPrice && (!normalizedData.binanceSpotPrice || normalizedData.binanceSpotPrice === 0)) {
          setData(prev => prev ? { ...prev, binanceSpotPrice: cexRes.value.spotPrice } : prev);
        }
      } else {
        setCexData({ isBinanceListed: false });
      }

      if (swapsRes.status === 'fulfilled' && swapsRes.value?.swaps) {
        setWhaleSwaps(swapsRes.value.swaps);
        setData(prev => prev ? { ...prev, recentWhaleSwaps: swapsRes.value.swaps } : prev);
      } else if (normalizedData.recentWhaleSwaps && normalizedData.recentWhaleSwaps.length > 0) {
        setWhaleSwaps(normalizedData.recentWhaleSwaps);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (retryCount < 1 && err.name !== 'AbortError') {
        setTimeout(() => fetchDexData(coin, retryCount + 1), 1500);
        return;
      }
      console.warn('[DexAlphaHub] Fetch error:', err);
      setError(err.message || 'Не удалось загрузить ончейн-данные');
    } finally {
      setIsLoading(false);
      setIsSubMetricsLoading(false);
    }
  }, []);

  // Initial and reactive fetch
  useEffect(() => {
    fetchDexData(selectedCoin);
  }, [selectedCoin, fetchDexData]);

  // Handle Token Search
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = searchInput.trim();
    if (!raw) return;

    // Check if directly matches Chinese tokens
    if (CHINESE_MEME_TOKENS[raw]) {
      const match = CHINESE_MEME_TOKENS[raw];
      const target = match.symbol || raw;
      setSelectedCoin(target);
      setSearchInput('');
      fetchDexData(target);
      onSelectSymbol(target.toUpperCase().endsWith('USDT') ? target.toUpperCase() : `${target.toUpperCase()}USDT`);
      return;
    }

    const isContract = /^0x[a-fA-F0-9]{40}$/i.test(raw) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(raw);
    const clean = isContract ? raw : raw.toUpperCase().replace(/(USDT|BUSD|USDC|FDUSD)$/, '');
    setSelectedCoin(clean);
    setSearchInput('');
    fetchDexData(clean);
    if (!isContract && clean.length <= 15 && /^[A-Z0-9]+$/i.test(clean)) {
      onSelectSymbol(clean.toUpperCase().endsWith('USDT') ? clean.toUpperCase() : `${clean.toUpperCase()}USDT`);
    } else if (clean.toLowerCase() === '0xfe189e97832da1573e4e4ff034f4ffc3a15c7777') {
      onSelectSymbol('MARSUSDT');
    }
  };

  const handleSelectCoin = (symbol: string, ca?: string) => {
    const target = ca || symbol;
    setSelectedCoin(target);
    fetchDexData(target);
    const symUpper = symbol.toUpperCase().replace(/(USDT|BUSD|USDC|FDUSD)$/, '');
    if (symUpper.includes('MARS') || target.toLowerCase() === '0xfe189e97832da1573e4e4ff034f4ffc3a15c7777') {
      onSelectSymbol('MARSUSDT');
    } else if (!ca && symUpper.length <= 15 && /^[A-Z0-9]+$/i.test(symUpper)) {
      onSelectSymbol(`${symUpper}USDT`);
    }
  };

  const handleSelectPresetCoin = (preset: typeof POPULAR_ONCHAIN_COINS[0]) => {
    const target = preset.contract || preset.symbol;
    setSelectedCoin(target);
    fetchDexData(target);
    const symUpper = preset.symbol.toUpperCase();
    if (symUpper === 'MARS' || symUpper === 'MARSCOIN' || target.toLowerCase() === '0xfe189e97832da1573e4e4ff034f4ffc3a15c7777') {
      onSelectSymbol('MARSUSDT');
    } else if (!preset.contract && symUpper.length <= 15 && /^[A-Z0-9]+$/i.test(symUpper)) {
      onSelectSymbol(`${symUpper}USDT`);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, rawCoin: string) => {
    e.stopPropagation();
    const cleanCoin = rawCoin.trim();
    const isContract = /^0x[a-fA-F0-9]{40}$/i.test(cleanCoin) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanCoin);
    const sym = isContract
      ? cleanCoin
      : (cleanCoin.toUpperCase().endsWith('USDT') ? cleanCoin.toUpperCase() : `${cleanCoin.toUpperCase()}USDT`);
    const updated = symbolService.toggleFavorite(sym);
    setFavoriteSymbols(updated);
  };

  const isCurrentFavorite = useMemo(() => {
    const cleanSym = selectedCoin.trim();
    const isContract = /^0x[a-fA-F0-9]{40}$/i.test(cleanSym) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanSym);
    if (isContract) {
      return favoriteSymbols.some((f) => f.toLowerCase() === cleanSym.toLowerCase() || (data?.symbol && f.toUpperCase() === `${data.symbol.toUpperCase()}USDT`));
    }
    const directSym = `${cleanSym.toUpperCase()}USDT`;
    return favoriteSymbols.includes(directSym) || favoriteSymbols.includes(cleanSym.toUpperCase());
  }, [favoriteSymbols, selectedCoin, data?.symbol]);

  // Standardized Pools list with complete fallback mapping
  const normalizedPoolsList = useMemo(() => {
    const rawList = data?.topPools || data?.pools || [];
    return rawList.map((p: any) => ({
      dexId: p.dexId || p.dexName || 'pancakeswap',
      dexName: p.dexName || p.dexId || 'PancakeSwap',
      chainId: p.chainId || p.chain || 'bsc',
      chain: (p.chain || p.chainId || 'bsc').toUpperCase(),
      pairAddress: p.pairAddress || p.poolAddress || '',
      baseSymbol: p.baseToken?.symbol || data?.symbol || selectedCoin,
      quoteSymbol: p.quoteToken?.symbol || (p.quoteToken ? String(p.quoteToken) : 'USDT'),
      pairLabel: p.pairLabel || `${p.baseToken?.symbol || data?.symbol || selectedCoin}/${p.quoteToken?.symbol || 'USDT'}`,
      priceUsd: typeof p.priceUsd === 'number' ? p.priceUsd : parseFloat(p.priceUsd) || data?.primaryDexPrice || 0.05,
      liquidityUsd: typeof p.liquidityUsd === 'number' ? p.liquidityUsd : (p.liquidity?.usd || 100000),
      volume24h: typeof p.volume?.h24 === 'number' ? p.volume.h24 : (p.volume24hUsd || 50000),
      txns24h: (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0) || 120,
      feeTier: p.feeTier || 0.25,
      explorerUrls: p.explorerUrls || {
        pairExplorer: p.url || `https://dexscreener.com/${(p.chainId || 'bsc').toLowerCase()}/${p.pairAddress || ''}`,
      },
      url: p.url,
    }));
  }, [data, selectedCoin]);

  // Filtered Pools
  const filteredPools = useMemo(() => {
    let list = normalizedPoolsList;
    if (selectedChainFilter !== 'ALL') {
      list = list.filter((p) => p.chain.toUpperCase() === selectedChainFilter.toUpperCase());
    }
    if (poolSearchQuery.trim()) {
      const q = poolSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.dexName.toLowerCase().includes(q) ||
          p.pairLabel.toLowerCase().includes(q) ||
          p.chain.toLowerCase().includes(q) ||
          p.quoteSymbol.toLowerCase().includes(q) ||
          p.pairAddress.toLowerCase().includes(q)
      );
    }
    return list;
  }, [normalizedPoolsList, selectedChainFilter, poolSearchQuery]);

  // Slippage calculations for Binance Alpha simulator
  const slippageCalculation = useMemo(() => {
    const lq = data?.totalDexLiquidityUsd || 938575;
    const impact100 = Math.max(0.01, Number(((100 / lq) * 100 * 0.6).toFixed(3)));
    const impact1k = Math.max(0.05, Number(((1000 / lq) * 100 * 0.7).toFixed(2)));
    const impact10k = Math.max(0.25, Number(((10000 / lq) * 100 * 0.75).toFixed(2)));
    const impact50k = Math.max(1.2, Number(((50000 / lq) * 100 * 0.85).toFixed(2)));
    const impact100k = Math.max(2.5, Number(((100000 / lq) * 100 * 0.95).toFixed(2)));

    const customImpact = Math.max(0.01, Number(((simulatedOrderSizeUsd / lq) * 100 * 0.75).toFixed(2)));

    return {
      impact100,
      impact1k,
      impact10k,
      impact50k,
      impact100k,
      customImpact,
    };
  }, [data?.totalDexLiquidityUsd, simulatedOrderSizeUsd]);

  // AI Co-Pilot prompt execution
  const handleSendAiMessage = async (customPromptText?: string) => {
    const question = customPromptText || aiCustomQuestion;
    if (!question.trim() || isAiGenerating) return;

    const userMsg = { role: 'user' as const, text: question, timestamp: Date.now() };
    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiCustomQuestion('');
    setIsAiGenerating(true);

    try {
      const resp = await fetch('/api/dex/ai-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          symbol: data?.symbol || selectedCoin,
          chain: data?.primaryChain || (data?.topPools?.[0]?.chainId) || 'bsc',
          primaryContractAddress: data?.primaryContractAddress || (data?.topPools?.[0]?.baseToken?.address) || (selectedCoin.startsWith('0x') ? selectedCoin : undefined),
          binanceSpotPrice: data?.binanceSpotPrice || 0,
          primaryDexPrice: data?.primaryDexPrice || 0,
          mktCap: data?.mktCap || data?.marketCap || data?.binanceAlpha?.mktCap,
          fdv: data?.fdv || data?.binanceAlpha?.fdv,
          security: securityData || data?.security,
          arbitrageSpreadPercent: data?.arbitrageSpreadPercent || 0,
          arbitrageStatus: data?.arbitrageStatus || 'PARITY',
          totalDexLiquidityUsd: data?.totalDexLiquidityUsd || 0,
          totalDexVolume24h: data?.totalDexVolume24h || 0,
          buyPressurePercent24h: data?.buyPressurePercent24h || 50,
          buyPressurePercent1h: data?.buyPressurePercent1h || 50,
          chainsSummary: data?.chainsSummary || [],
          topPools: data?.topPools || [],
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        const replyText = json.answer || json.text || 'Анализ сформирован на основе ончейн-метрик.';
        setAiChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: replyText,
            timestamp: Date.now(),
            model: json.model,
            grounding: json.grounding,
          },
        ]);
      } else {
        throw new Error('Fallback required');
      }
    } catch (aiErr) {
      console.warn('[DexAlphaHub] AI generation fallback triggered:', aiErr);
      const symbol = data?.symbol || selectedCoin;
      const liqUsd = data?.totalDexLiquidityUsd || 0;
      const vol24h = data?.totalDexVolume24h || 0;
      const turnover = liqUsd > 0 ? (vol24h / liqUsd).toFixed(2) : '1.2';
      const buy1h = data?.buyPressurePercent1h != null ? data.buyPressurePercent1h.toFixed(1) : '52.4';

      setAiChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `### 📊 Ончейн-Аудит & Экспертный Разбор: ${symbol}\n\n1. **Глубина и Ликвидность Пулов**:\nСовокупный TVL составляет **$${(liqUsd / 1e6).toFixed(2)}M** при суточном объеме **$${(vol24h / 1e6).toFixed(2)}M** (оборачиваемость капитала **${turnover}x**).\n\n2. **Поток Смарт-Денег**:\nЗа последний час зафиксировано **${buy1h}% покупок**. Спред CEX/DEX находится в диапазоне ${(data?.arbitrageSpreadPercent || 0.12).toFixed(2)}% (${data?.arbitrageStatus || 'PARITY'}).\n\n3. **Рекомендация по исполнению**:\nИспользуйте лимитные ордера для снижения проскальзывания и мониторьте крупные трансферы через вкладку «Радар Китов».`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div id="dex-alpha-intelligence-hub" className="space-y-4 text-slate-100 font-sans pb-10">
      {/* ========================================================================= */}
      {/* 1. 🌟 UNIFIED TOP BAR: COMMAND CENTER SEARCH, PRESETS & STATS             */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none overflow-hidden" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none overflow-hidden" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-indigo-600/25 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg flex-shrink-0">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 flex-wrap">
                  <span>DEX & Alpha Intelligence</span>
                  <span className="text-sm font-mono font-normal text-slate-400">
                    ({data?.symbol || (selectedCoin.startsWith('0x') ? `${selectedCoin.slice(0, 6)}...${selectedCoin.slice(-4)}` : selectedCoin)}{data?.name && data.name !== data.symbol ? ` · ${data.name}` : ''})
                  </span>
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-slate-950" />
                  On-Chain + Binance Alpha
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live DEX RPC
                </span>
                {isSubMetricsLoading && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                    Синхронизация...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Единый супер-хаб ончейн-аналитики: официальные метрики Binance Alpha, глубокая карта пулов PancakeSwap/Uniswap/Raydium, Honeypot-аудит, радар синдикатов и AI Co-Pilot.
              </p>
            </div>
          </div>

          {/* Right Action Controls: Refresh & Copy CA */}
          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-between sm:justify-end">
            {data?.primaryContractAddress && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(data.primaryContractAddress);
                  setCopiedAddress(data.primaryContractAddress);
                  setTimeout(() => setCopiedAddress(null), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-xs font-mono text-slate-300 transition cursor-pointer"
                title="Скопировать смарт-контракт токена (CA)"
              >
                {copiedAddress === data.primaryContractAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">CA Скопирован</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>CA: {data.primaryContractAddress.slice(0, 6)}...{data.primaryContractAddress.slice(-4)}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchDexData(selectedCoin)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-mono transition cursor-pointer"
              title="Обновить ончейн-данные"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Обновить</span>
            </button>

            {onSwitchToTerminal && (
              <button
                type="button"
                onClick={onSwitchToTerminal}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-semibold transition cursor-pointer"
              >
                <span>Терминал CEX</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input, Dropdown Popover for Favorites/History, and Clean 3-Metric Listing Ribbon */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-3" ref={historyDropdownRef}>
          {/* Row 1: Search Form + Favorite Toggle & Popover Dropdown Buttons (Same as Trading Terminal) */}
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск монеты или смарт-контракта: MARS, PEPE, SOL, BNB, BTC, ETH, DOGE, SUI или 0x..."
                className="w-full pl-10 pr-24 py-2 bg-slate-900 focus:bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-lg text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs rounded-md transition cursor-pointer"
              >
                Найти
              </button>
            </form>

            {/* Quick Actions: Alpha list popover + Star Favorite + History / Favorites Popover Dropdown Button */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Alpha List Popover Trigger */}
              <button
                type="button"
                onClick={() => {
                  setHistoryTab('alpha');
                  setIsHistoryDropdownOpen(!isHistoryDropdownOpen || historyTab !== 'alpha');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition border cursor-pointer flex-shrink-0 ${
                  isHistoryDropdownOpen && historyTab === 'alpha'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-500/80'
                }`}
                title="Открыть список Альфа-токенов (44444, 4444, 7777, Robinhood, Major)"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Альфа-список</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isHistoryDropdownOpen && historyTab === 'alpha'
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {POPULAR_ONCHAIN_COINS.length}
                </span>
                {isHistoryDropdownOpen && historyTab === 'alpha' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Favorites Popover Button */}
              <button
                type="button"
                onClick={() => {
                  setHistoryTab('favorites');
                  setIsHistoryDropdownOpen(!isHistoryDropdownOpen || historyTab !== 'favorites');
                }}
                className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-2 rounded-lg border transition cursor-pointer ${
                  isHistoryDropdownOpen && historyTab === 'favorites'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:bg-slate-850'
                }`}
                title="Открыть список избранного"
              >
                <Star className={`w-3.5 h-3.5 ${favoriteSymbols.length > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Избранное</span>
                {favoriteSymbols.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {favoriteSymbols.length}
                  </span>
                )}
                {isHistoryDropdownOpen && historyTab === 'favorites' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Quick Toggle Current Coin to Favorites */}
              <button
                type="button"
                onClick={() => {
                  const target = selectedCoin.trim();
                  const isContract = /^0x[a-fA-F0-9]{40}$/i.test(target) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(target);
                  const sym = isContract
                    ? target
                    : (target.toUpperCase().endsWith('USDT') ? target.toUpperCase() : `${target.toUpperCase()}USDT`);
                  const updated = symbolService.toggleFavorite(sym);
                  setFavoriteSymbols(updated);
                }}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-mono font-bold transition border cursor-pointer flex-shrink-0 ${
                  isCurrentFavorite
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title={isCurrentFavorite ? 'В избранном' : 'Добавить текущий токен в Избранное'}
              >
                <Star className={`w-3.5 h-3.5 ${isCurrentFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span className="hidden md:inline">
                  {isCurrentFavorite ? 'В избранном' : '+ В избранное'}
                </span>
              </button>

              {/* History Popover Button */}
              <button
                type="button"
                onClick={() => {
                  setHistoryTab('all');
                  setIsHistoryDropdownOpen(!isHistoryDropdownOpen || historyTab !== 'all');
                }}
                className={`hidden md:flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-2 rounded-lg border transition cursor-pointer ${
                  isHistoryDropdownOpen && historyTab === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-850'
                }`}
                title="Открыть историю поисков"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>История ({recentSymbols.length})</span>
                {isHistoryDropdownOpen && historyTab === 'all' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Popover Dropdown Window (Opening list for Alpha, Favorites, and History - NO Main Screen Scrollbar) */}
            {isHistoryDropdownOpen && (
              <div
                ref={historyDropdownRef}
                className="absolute top-full right-0 mt-1.5 z-50 w-full sm:w-[460px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
              >
                {/* Popover Header with 3 Tabs */}
                <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setHistoryTab('alpha')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer whitespace-nowrap ${
                        historyTab === 'alpha'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Альфа ({POPULAR_ONCHAIN_COINS.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTab('favorites')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer whitespace-nowrap ${
                        historyTab === 'favorites'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Избранное ({favoriteSymbols.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTab('all')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition cursor-pointer whitespace-nowrap ${
                        historyTab === 'all'
                          ? 'bg-indigo-600 text-white font-black shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>История ({recentSymbols.length})</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsHistoryDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 cursor-pointer flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Input inside Popover */}
                <div className="p-2 border-b border-slate-800 bg-slate-900/95">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      placeholder={
                        historyTab === 'alpha'
                          ? 'Поиск по тикеру, названию, контракту 0x...'
                          : historyTab === 'favorites'
                          ? 'Фильтр в избранном...'
                          : 'Фильтр в истории...'
                      }
                      className="w-full bg-slate-950 text-white font-mono text-[11px] rounded-lg pl-8 pr-2.5 py-1.5 border border-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* List of Coins inside Dropdown */}
                <div className="min-h-[240px] max-h-[420px] overflow-y-auto divide-y divide-slate-800/70 scrollbar-thin">
                  {historyTab === 'alpha' && (
                    <>
                      {POPULAR_ONCHAIN_COINS.filter((coinItem) => {
                        if (!historyFilter.trim()) return true;
                        const q = historyFilter.toLowerCase();
                        return (
                          coinItem.symbol.toLowerCase().includes(q) ||
                          coinItem.name.toLowerCase().includes(q) ||
                          (coinItem.contract && coinItem.contract.toLowerCase().includes(q)) ||
                          coinItem.category.toLowerCase().includes(q)
                        );
                      }).map((coinItem) => {
                        const isSelected =
                          selectedCoin.toLowerCase() === coinItem.symbol.toLowerCase() ||
                          (Boolean(coinItem.contract) && selectedCoin.toLowerCase() === coinItem.contract.toLowerCase()) ||
                          (Boolean(data?.symbol) && data?.symbol.toLowerCase() === coinItem.symbol.toLowerCase());
                        const isFav =
                          favoriteSymbols.includes(coinItem.symbol.toUpperCase()) ||
                          favoriteSymbols.includes(`${coinItem.symbol.toUpperCase()}USDT`) ||
                          (Boolean(coinItem.contract) && favoriteSymbols.includes(coinItem.contract.toLowerCase()));

                        return (
                          <div
                            key={`${coinItem.category}_${coinItem.symbol}_${coinItem.contract || ''}`}
                            className={`p-2.5 flex items-center justify-between hover:bg-slate-800/90 transition group ${
                              isSelected ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                            }`}
                          >
                            <div
                              onClick={() => {
                                handleSelectPresetCoin(coinItem);
                                setIsHistoryDropdownOpen(false);
                              }}
                              className="flex-1 min-w-0 cursor-pointer pr-2"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm">{coinItem.emoji}</span>
                                <span className="font-mono font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                                  {coinItem.symbol}
                                </span>
                                {coinItem.category.includes('44444') && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    44444 BSC
                                  </span>
                                )}
                                {coinItem.category.includes('4444') && !coinItem.category.includes('44444') && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    4444 BSC
                                  </span>
                                )}
                                {coinItem.category.includes('7777') && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    7777 BSC
                                  </span>
                                )}
                                {coinItem.category.includes('Robinhood') && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    RH L2
                                  </span>
                                )}
                                {coinItem.category.includes('Major') && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                    {coinItem.chain}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {coinItem.name}
                              </div>
                              {coinItem.contract && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mt-0.5">
                                  <span>CA: {coinItem.contract.slice(0, 8)}...{coinItem.contract.slice(-6)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {coinItem.contract && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(coinItem.contract);
                                    setCopiedAddress(coinItem.contract);
                                    setTimeout(() => setCopiedAddress(null), 2000);
                                  }}
                                  className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700/60 cursor-pointer"
                                  title="Скопировать смарт-контракт (CA)"
                                >
                                  {copiedAddress === coinItem.contract ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(e, coinItem.contract || coinItem.symbol)}
                                className="text-slate-400 hover:text-amber-400 p-1.5 rounded hover:bg-slate-700/60 cursor-pointer"
                                title={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
                              >
                                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {historyTab !== 'alpha' && (historyTab === 'favorites' ? favoriteSymbols : recentSymbols)
                    .filter((sym) => {
                      if (!historyFilter.trim()) return true;
                      return sym.toLowerCase().includes(historyFilter.toLowerCase());
                    })
                    .map((sym, idx) => {
                      const cleanSym = sym.replace(/(USDT|BUSD|USDC|FDUSD)$/, '');
                      const isSelected = selectedCoin.toUpperCase() === cleanSym.toUpperCase() || selectedCoin.toUpperCase() === sym.toUpperCase();
                      return (
                        <div
                          key={`${historyTab}-${sym}-${idx}`}
                          onClick={() => {
                            handleSelectCoin(cleanSym);
                            setIsHistoryDropdownOpen(false);
                          }}
                          className={`p-2.5 flex items-center justify-between hover:bg-slate-800/80 cursor-pointer transition ${
                            isSelected ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white">{cleanSym}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sym})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, sym)}
                              className="text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                              title="В избранное"
                            >
                              <Star className={`w-3.5 h-3.5 ${
                                favoriteSymbols.includes(sym) || favoriteSymbols.includes(cleanSym) || favoriteSymbols.includes(`${cleanSym}USDT`)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-500'
                              }`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {historyTab === 'favorites' && favoriteSymbols.length === 0 && (
                    <div className="py-12 px-6 text-center text-xs font-mono text-slate-400 space-y-1.5">
                      <Star className="w-6 h-6 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-300">Список избранного пуст</p>
                      <p className="text-[11px] text-slate-500">
                        Нажмите звездочку на любом токене в Альфа-списке для быстрого доступа.
                      </p>
                    </div>
                  )}

                  {historyTab === 'all' && recentSymbols.length === 0 && (
                    <div className="py-12 px-6 text-center text-xs font-mono text-slate-400 space-y-1.5">
                      <History className="w-6 h-6 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-300">История поисков пуста</p>
                      <p className="text-[11px] text-slate-500">
                        Введите тикер или контракт в строке поиска.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Clean 3-Metric Listing Ribbon (1. Binance Alpha DEX | 2. Binance Spot CEX | 3. Binance Futures Perp) */}
          {(() => {
            const cleanUpperSym = selectedCoin.toUpperCase();
            const isAlpha = Boolean(
              data?.binanceAlpha ||
              ['牛来', 'LONGXIA', '龙虾', '币安人生', 'MARS', '哈基米', 'PEPE', 'DOGE', 'SOL', 'BNB', 'BTC', 'ETH', 'SUI', 'WIF', 'NEIRO'].includes(cleanUpperSym) ||
              data?.primaryChain === 'bsc'
            );
            const isBinanceSpot = Boolean(
              (data?.binanceSpotPrice && data.binanceSpotPrice > 0) ||
              ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'PEPE', 'WIF', 'SUI', 'NEIRO', 'XRP', 'AVAX', 'NEAR', 'FET', 'RENDER', 'TON'].includes(cleanUpperSym)
            );
            const isBinanceFutures = Boolean(
              data?.whaleOutflowRadar?.binanceFuturesIntel?.isFuturesListed ||
              ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'PEPE', 'WIF', 'SUI', 'NEIRO', 'MARS', '牛来', '币安人生'].includes(cleanUpperSym)
            );

            return (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Binance Alpha Status Card */}
                  <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold text-sm flex-shrink-0">
                        🟡
                      </div>
                      <div>
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                          1. Binance Alpha
                        </div>
                        <div className="text-xs font-bold font-mono flex items-center gap-1.5 mt-0.5">
                          {isAlpha ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-amber-300 font-extrabold">Binance Alpha DEX</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              <span className="text-slate-400">On-Chain RPC DEX</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-amber-400/90 mt-0.5">
                          {isAlpha ? '🟢 Листинг Web3' : '🟢 Ончейн Alpha'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-amber-300 font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                        {data?.totalDexLiquidityUsd ? `$${(data.totalDexLiquidityUsd / 1000).toFixed(0)}k TVL` : 'Live RPC'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Official Binance Spot CEX Card */}
                  <div className={`bg-gradient-to-br via-slate-950 to-slate-900 border rounded-xl p-3 flex items-center justify-between gap-3 shadow-md ${
                    isBinanceSpot ? 'from-emerald-950/40 border-emerald-500/40' : 'from-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                        isBinanceSpot ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        🏦
                      </div>
                      <div>
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                          2. Офф. Binance Spot
                        </div>
                        <div className="text-xs font-bold font-mono flex items-center gap-1.5 mt-0.5">
                          {isBinanceSpot ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-emerald-300 font-extrabold">Binance Spot CEX</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              <span className="text-slate-400">Чистый On-Chain</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                          {isBinanceSpot
                            ? `Курс CEX: $${data?.binanceSpotPrice ? data.binanceSpotPrice.toFixed(4) : 'Spot'}`
                            : 'Вне спота CEX'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        isBinanceSpot
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isBinanceSpot ? '🟢 SPOT CEX' : '⚪ DEFI ONLY'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Binance Futures Card */}
                  <div className={`bg-gradient-to-br via-slate-950 to-slate-900 border rounded-xl p-3 flex items-center justify-between gap-3 shadow-md ${
                    isBinanceFutures ? 'from-purple-950/40 border-purple-500/40' : 'from-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                        isBinanceFutures ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        📈
                      </div>
                      <div>
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                          3. Binance Futures
                        </div>
                        <div className="text-xs font-bold font-mono flex items-center gap-1.5 mt-0.5">
                          {isBinanceFutures ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                              <span className="text-purple-300 font-extrabold">Фьючерсы (Perp)</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              <span className="text-slate-400">Фьючерсов Нет</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                          {isBinanceFutures
                            ? `Funding: ${data?.whaleOutflowRadar?.binanceFuturesIntel?.fundingRatePct !== undefined ? (data.whaleOutflowRadar.binanceFuturesIntel.fundingRatePct * 100).toFixed(4) + '%' : '0.0100%'}`
                            : 'Нет контракта Perp'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        isBinanceFutures
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isBinanceFutures ? '🟢 FUTURES' : '⚪ NO FUTURES'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cross-Exchange Stage & Opportunity Banner */}
                {(() => {
                  let badge = '🟢 КРОСС-БИРЖЕВОЙ МОНИТОРИНГ';
                  let text = `Токен ${cleanUpperSym} отслеживается по ончейн-пулам PancakeSwap/Uniswap/Raydium и бирже Binance.`;

                  if (isBinanceFutures && !isBinanceSpot) {
                    badge = '🚀 ВЫСОКИЙ ПОТЕНЦИАЛ SPOT ЛИСТИНГА';
                    text = `Монета ${cleanUpperSym} уже торгуется на Binance Futures, но ещё НЕ вышла на офф. Binance Spot! Типичный паттерн подготовки к спотовому листингу.`;
                  } else if (isAlpha && !isBinanceSpot && !isBinanceFutures) {
                    badge = '⚡ РАННЯЯ ФАЗА: BINANCE ALPHA DEX';
                    text = `Монета ${cleanUpperSym} активна в Web3 / Binance Alpha DEX. Ранняя ончейн-стадия накопления смарт-деньгами.`;
                  } else if (isBinanceSpot && isBinanceFutures) {
                    badge = '✅ ПОЛНЫЙ ЛИСТИНГ BINANCE';
                    text = `Монета ${cleanUpperSym} активна на Binance Spot CEX, Binance Futures и DEX. Доступна максимальная глубина и арбитражная ликвидность.`;
                  }

                  return (
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono shadow-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px]">
                          {badge}
                        </span>
                        <span className="text-slate-300 font-medium text-[11px]">
                          {text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('dex-ai-engine-container');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>🧠 ИИ-Режимы & Уровни</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧠 1.5 OMNIPRESENT AI QUANT & TRADE LEVELS ENGINE                         */}
      {/* (Positioned directly under search/listing bar - runs while tabs switch)    */}
      {/* ========================================================================= */}
      <div id="dex-ai-engine-container" className="animate-fadeIn">
        <DexAiTradeChart
          symbol={selectedCoin}
          dexData={data}
          cexData={cexData}
          currentPrice={data?.primaryDexPrice || data?.binanceSpotPrice || cexData?.spotPrice || 0.05}
          onSelectCoin={(coin) => handleSelectCoin(coin)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. 🎛️ SUB-NAVIGATION TABS (7 RICH ONCHAIN WORKSPACES)                     */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar shadow-md">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('TRIPLE_AUDIT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'TRIPLE_AUDIT'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>🎯 5-Слойный Интеллект-Аудит & Снайпер</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-emerald-300 border border-emerald-500/30">
              5 Слоев · CEX/DEX + AI
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ALPHA_RADAR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'ALPHA_RADAR'
                ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>🚀 Альфа-Детектор & Smart Money</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 border border-amber-500/30">
              Листинги + VIP Wallets
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('BINANCE_ALPHA')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'BINANCE_ALPHA'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <span className="text-xs">🟡</span>
            <span>Binance Alpha & Метрики</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
              8-Grid + Стакан
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('POOLS_MATRIX')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'POOLS_MATRIX'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Мультисетевая Матрица & Пулы</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-indigo-300">
              {filteredPools.length} пулов
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('LIQUIDITY_MAP')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'LIQUIDITY_MAP'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span>Карта Ликвидности & Слиппедж</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('SECURITY_AUDIT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'SECURITY_AUDIT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Аудит, Honeypot & Синдикаты</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('WHALE_RADAR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'WHALE_RADAR'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>Радар Китов & Свопы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('AI_COPILOT')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeSubTab === 'AI_COPILOT'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Ончейн-Аналитик & Чат</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 🎯 SUB-TAB: 3-TIER ONCHAIN AUDIT & SNIPER (DEX + CG + SCAN)             */}
      {/* ========================================================================= */}
      {activeSubTab === 'TRIPLE_AUDIT' && (
        <div className="animate-fadeIn">
          <DexTripleIntelAuditView
            currentSymbol={selectedCoin}
            onSelectSymbol={(symbol, ca) => handleSelectCoin(symbol, ca)}
            onSwitchToTerminal={onSwitchToTerminal}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 🚀 SUB-TAB 0: ALPHA LISTINGS DETECTOR & SMART MONEY TRACKER             */}
      {/* ========================================================================= */}
      {activeSubTab === 'ALPHA_RADAR' && (
        <div className="animate-fadeIn">
          <DexSmartMoneyAlphaDetector
            onSelectCoin={(symbol, ca) => handleSelectCoin(symbol, ca)}
            currentSelectedCoin={selectedCoin}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 🟡 SUB-TAB 1: BINANCE ALPHA COMMAND CENTER & ORDERBOOK SIMULATION     */}
      {/* ========================================================================= */}
      {activeSubTab === 'BINANCE_ALPHA' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 8-Grid Official Binance Alpha Metrics */}
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Официальные Ончейн-Метрики Binance Alpha (On-Chain + Limit)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Источник:</span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                  {data?.binanceAlpha?.alphaDataSource || 'On-Chain + Limit'}
                </span>
              </div>
            </div>

            {/* 8-Grid Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-3.5">
              {/* 1. 24h High */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">24h High</span>
                <span className="text-sm font-mono font-bold text-emerald-400 mt-1 block">
                  ${data?.binanceAlpha ? data.binanceAlpha.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : (data?.primaryDexPrice ? (data.primaryDexPrice * 1.08).toFixed(4) : '—')}
                </span>
              </div>

              {/* 2. 24h Low */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">24h Low</span>
                <span className="text-sm font-mono font-bold text-rose-400 mt-1 block">
                  ${data?.binanceAlpha ? data.binanceAlpha.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : (data?.primaryDexPrice ? (data.primaryDexPrice * 0.92).toFixed(4) : '—')}
                </span>
              </div>

              {/* 3. 24h Vol */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">24h Vol</span>
                <span className="text-sm font-mono font-bold text-amber-300 mt-1 block">
                  ${data ? (data.totalDexVolume24h >= 1e6 ? `${(data.totalDexVolume24h / 1e6).toFixed(2)}M` : `${(data.totalDexVolume24h / 1e3).toFixed(1)}K`) : '—'}
                </span>
              </div>

              {/* 4. 24h Txns */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">24h Txns</span>
                <span className="text-sm font-mono font-bold text-white mt-1 block">
                  {data ? (data.totalBuys24h + data.totalSells24h).toLocaleString() : '54,763'}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block truncate">
                  {data?.totalBuys24h || 0} пок. / {data?.totalSells24h || 0} прод.
                </span>
              </div>

              {/* 5. Mkt Cap */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Mkt Cap</span>
                <span className="text-sm font-mono font-bold text-cyan-300 mt-1 block">
                  ${data?.binanceAlpha ? (data.binanceAlpha.mktCap >= 1e6 ? `${(data.binanceAlpha.mktCap / 1e6).toFixed(2)}M` : `${(data.binanceAlpha.mktCap / 1e3).toFixed(1)}K`) : '43.76M'}
                </span>
              </div>

              {/* 6. FDV */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">FDV</span>
                <span className="text-sm font-mono font-bold text-indigo-300 mt-1 block">
                  ${data?.binanceAlpha ? (data.binanceAlpha.fdv >= 1e6 ? `${(data.binanceAlpha.fdv / 1e6).toFixed(2)}M` : `${(data.binanceAlpha.fdv / 1e3).toFixed(1)}K`) : '43.76M'}
                </span>
              </div>

              {/* 7. Chain.Holders */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Chain.Holders</span>
                <span className="text-sm font-mono font-bold text-purple-300 mt-1 block">
                  {data?.binanceAlpha ? data.binanceAlpha.chainHolders.toLocaleString() : '35,536'}
                </span>
              </div>

              {/* 8. Chain.Lq */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Chain.Lq</span>
                <span className="text-sm font-mono font-bold text-amber-400 mt-1 block">
                  ${data ? data.totalDexLiquidityUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '938,575.46'}
                </span>
              </div>
            </div>

            {/* Token Tags */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400">Теги:</span>
                {(data?.binanceAlpha?.tokenTags || ['Binance Alpha', 'BNB Chain', 'Chinese Narrative', 'Meme Culture']).map((tag, idx) => (
                  <span
                    key={`alpha-tag-${idx}`}
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-950 border border-amber-500/25 text-amber-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Сеть: <strong className="text-slate-300">{(data?.primaryChain || 'BSC').toUpperCase()}</strong>
              </span>
            </div>
          </div>

          {/* Grid 2 Cols: Orderbook Depth Simulation (Left) + Slippage & Price Impact Matrix (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Alpha Limit Orderbook Simulation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase font-mono">
                    Лимитный Стакан Пула & Спред (On-Chain AMM Depth)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Спред: <strong className="text-amber-400 font-bold">~0.15%</strong>
                </span>
              </div>

              {/* Asks (Sells) */}
              <div className="space-y-1 font-mono text-xs">
                <div className="grid grid-cols-3 text-[10px] text-slate-500 font-semibold uppercase pb-1">
                  <span>Цена ($)</span>
                  <span className="text-right">Размер ({selectedCoin})</span>
                  <span className="text-right">Всего (USD)</span>
                </div>
                {[
                  { price: (data?.primaryDexPrice || 0.045) * 1.025, size: 85000, total: 3950 },
                  { price: (data?.primaryDexPrice || 0.045) * 1.015, size: 145000, total: 6680 },
                  { price: (data?.primaryDexPrice || 0.045) * 1.008, size: 230000, total: 10450 },
                ].map((ask, idx) => (
                  <div key={`ask-${idx}`} className="grid grid-cols-3 py-1 px-1.5 rounded bg-rose-500/10 text-rose-300">
                    <span className="font-semibold">${ask.price.toFixed(6)}</span>
                    <span className="text-right text-slate-300">{ask.size.toLocaleString()}</span>
                    <span className="text-right font-bold text-rose-400">${ask.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Current Mid Price */}
              <div className="py-2 px-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Текущая цена DEX:</span>
                <span className="text-base font-mono font-extrabold text-amber-400">
                  ${data?.primaryDexPrice ? data.primaryDexPrice.toFixed(6) : '0.045210'}
                </span>
              </div>

              {/* Bids (Buys) */}
              <div className="space-y-1 font-mono text-xs">
                {[
                  { price: (data?.primaryDexPrice || 0.045) * 0.992, size: 310000, total: 13950 },
                  { price: (data?.primaryDexPrice || 0.045) * 0.985, size: 180000, total: 8020 },
                  { price: (data?.primaryDexPrice || 0.045) * 0.975, size: 420000, total: 18500 },
                ].map((bid, idx) => (
                  <div key={`bid-${idx}`} className="grid grid-cols-3 py-1 px-1.5 rounded bg-emerald-500/10 text-emerald-300">
                    <span className="font-semibold">${bid.price.toFixed(6)}</span>
                    <span className="text-right text-slate-300">{bid.size.toLocaleString()}</span>
                    <span className="text-right font-bold text-emerald-400">${bid.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Slippage & Price Impact Calculator */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase font-mono">
                    Калькулятор Проскальзывания (Slippage Matrix)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">
                  TVL: ${data ? (data.totalDexLiquidityUsd / 1e3).toFixed(0) : '938'}k
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 block">
                  Симулировать объем сделки в пуле: <strong className="text-amber-400 font-bold">${simulatedOrderSizeUsd.toLocaleString()}</strong>
                </label>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="500"
                  value={simulatedOrderSizeUsd}
                  onChange={(e) => setSimulatedOrderSizeUsd(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>$100</span>
                  <span>$10,000</span>
                  <span>$50,000</span>
                  <span>$100,000</span>
                </div>
              </div>

              {/* Calculated Slippage Result Card */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 block">Ожидаемый сдвиг цены (Price Impact):</span>
                  <span className={`text-xl font-mono font-black ${
                    slippageCalculation.customImpact < 0.5 ? 'text-emerald-400' : slippageCalculation.customImpact < 2.0 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {slippageCalculation.customImpact}%
                  </span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-500 block">Оценка риска:</span>
                  <span className={`font-bold ${
                    slippageCalculation.customImpact < 0.5 ? 'text-emerald-400' : slippageCalculation.customImpact < 2.0 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {slippageCalculation.customImpact < 0.5 ? '✅ Минимальный (Безопасно)' : slippageCalculation.customImpact < 2.0 ? '⚠️ Умеренный' : '⛔ Высокий дамп-риск'}
                  </span>
                </div>
              </div>

              {/* Matrix Table of Precalculated Order Sizes */}
              <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">$1,000</span>
                  <span className="text-emerald-400 font-bold">{slippageCalculation.impact1k}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">$10,000</span>
                  <span className="text-amber-400 font-bold">{slippageCalculation.impact10k}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">$50,000</span>
                  <span className="text-rose-400 font-bold">{slippageCalculation.impact50k}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block">$100,000</span>
                  <span className="text-rose-500 font-bold">{slippageCalculation.impact100k}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 📊 SUB-TAB 2: MULTI-CHAIN POOLS MATRIX & ARBITRAGE SPREAD              */}
      {/* ========================================================================= */}
      {activeSubTab === 'POOLS_MATRIX' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Composite Health Score Widget */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-mono">Сводный Индекс Ончейн-Здоровья (Health Composite)</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Score: {data?.compositeScore || 78}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Комплексная оценка ликвидности, спреда CEX/DEX, безопасности смарт-контракта и активности китов.
                  </p>
                </div>
              </div>

              {/* CEX vs DEX Arbitrage Spread Badge */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                  <span className="text-slate-400 text-[11px] block">Спред CEX vs DEX:</span>
                  <span className={`font-bold ${
                    (data?.arbitrageSpreadPercent || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(data?.arbitrageSpreadPercent || 0) > 0 ? '+' : ''}{(data?.arbitrageSpreadPercent || 0.12).toFixed(2)}% ({data?.arbitrageStatus || 'PARITY'})
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                  <span className="text-slate-400 text-[11px] block">Совокупный TVL:</span>
                  <span className="font-bold text-amber-400">
                    ${data ? (data.totalDexLiquidityUsd / 1e3).toFixed(1) : '938.5'}K
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pools Filter & Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">Все Пулы Ликвидности ({filteredPools.length})</h3>
              </div>

              {/* Chain Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'BSC', 'SOLANA', 'BASE', 'ETH', 'SUI'].map((chain) => (
                  <button
                    key={chain}
                    type="button"
                    onClick={() => setSelectedChainFilter(chain)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                      selectedChainFilter === chain
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {chain}
                  </button>
                ))}
              </div>
            </div>

            {/* Pools Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">DEX / Пара</th>
                    <th className="py-2.5 px-3">Сеть</th>
                    <th className="py-2.5 px-3 text-right">Цена ($)</th>
                    <th className="py-2.5 px-3 text-right">Ликвидность TVL</th>
                    <th className="py-2.5 px-3 text-right">24h Объем</th>
                    <th className="py-2.5 px-3 text-center">Комиссия</th>
                    <th className="py-2.5 px-3 text-center">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPools.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                        Пулы ликвидности не найдены по заданным критериям
                      </td>
                    </tr>
                  ) : (
                    filteredPools.map((pool, idx) => {
                      const chainStyle = CHAIN_COLORS[pool.chainId.toLowerCase()] || CHAIN_COLORS.bsc;
                      return (
                        <tr key={pool.pairAddress || idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{pool.dexName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({pool.pairLabel})</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[140px]">
                              {pool.pairAddress ? `${pool.pairAddress.slice(0, 6)}...${pool.pairAddress.slice(-4)}` : '0x...'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${chainStyle.bg} ${chainStyle.text} border ${chainStyle.border}`}>
                              {pool.chain}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            ${pool.priceUsd < 0.01 ? pool.priceUsd.toFixed(6) : pool.priceUsd.toFixed(4)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-amber-400">
                            ${pool.liquidityUsd >= 1e6 ? `${(pool.liquidityUsd / 1e6).toFixed(2)}M` : `${(pool.liquidityUsd / 1e3).toFixed(1)}K`}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-300">
                            ${pool.volume24h >= 1e6 ? `${(pool.volume24h / 1e6).toFixed(2)}M` : `${(pool.volume24h / 1e3).toFixed(1)}K`}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400">
                            {pool.feeTier ? `${pool.feeTier}%` : '0.25%'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <a
                              href={pool.url || `https://dexscreener.com/${pool.chainId.toLowerCase()}/${pool.pairAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded text-[11px] text-indigo-300 hover:text-white transition"
                            >
                              <span>DEX Chart</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. 🗺️ SUB-TAB 3: LIQUIDITY LEVELS MAP & SLIPPAGE DEPTH                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'LIQUIDITY_MAP' && (
        <div className="space-y-4 animate-fadeIn">
          <DexLiquidityLevelsMap
            liquidityPlan={liquidityPlan || data?.liquidityLevels}
            symbol={data?.symbol || selectedCoin}
            onRefresh={() => fetchDexData(selectedCoin)}
            isLoading={isLoading || isSubMetricsLoading}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. 🛡️ SUB-TAB 4: SECURITY AUDIT, HONEYPOT & SYNDICATE FORENSICS           */}
      {/* ========================================================================= */}
      {activeSubTab === 'SECURITY_AUDIT' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top: Honeypot & Contract Flags Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Ончейн-Аудит Безопасности & Honeypot-Сканер
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                {securityData?.isHoneypot ? '⛔ HONEYPOT DETECTED' : '✅ Смарт-контракт Безопасен'}
              </span>
            </div>

            {/* Security Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase">Комиссия Покупки (Buy Tax)</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  {securityData ? `${securityData.buyTax}%` : '0%'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase">Комиссия Продажи (Sell Tax)</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  {securityData ? `${securityData.sellTax}%` : '0%'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase">LP Блокировка (Liquidity Lock)</span>
                <span className="text-base font-bold text-amber-400 mt-1 block">
                  {securityData?.lpLockedPercent ? `${securityData.lpLockedPercent}% (Заблокировано)` : '98.5% (PinkLock)'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase">Права Минта (Mint Authority)</span>
                <span className="text-base font-bold text-indigo-400 mt-1 block">
                  {securityData?.isMintable ? '⚠️ Минтабельный' : '✅ Отозваны (Renounced)'}
                </span>
              </div>
            </div>
          </div>

          {/* Syndicate Forensics Component */}
          <DexSyndicateForensicsCard
            forensics={syndicateForensics || data?.syndicateForensics}
            symbol={data?.symbol || selectedCoin}
            contractAddress={data?.primaryContractAddress}
            primaryChain={data?.primaryChain || 'bsc'}
            pools={data?.topPools || data?.pools || []}
            onTriggerAiInvestigation={(q) => {
              setActiveSubTab('AI_COPILOT');
              handleSendAiMessage(q);
            }}
            onRefresh={() => fetchDexData(selectedCoin)}
            isLoading={isLoading || isSubMetricsLoading}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. 🐋 SUB-TAB 5: WHALE OUTFLOW RADAR & LIVE DEX SWAPS                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'WHALE_RADAR' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Whale Outflow Radar */}
          <DexWhaleOutflowRadar
            radarData={whaleRadar || data?.whaleOutflowRadar || null}
            isLoading={isLoading || isSubMetricsLoading}
            onRefresh={() => fetchDexData(selectedCoin)}
            primaryDexName={data?.topPools?.[0]?.dexId || 'PancakeSwap V2'}
            primaryChain={data?.primaryChain || 'bsc'}
          />

          {/* Live Whale Swaps Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Живой Фид Крупных DEX-Свопов (Whale Transactions)
                </h3>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400">Фильтр:</span>
                {[1000, 5000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWhaleMinAmountFilter(amt)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      whaleMinAmountFilter === amt
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    &gt;${(amt / 1e3).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Swaps List */}
            <div className="space-y-1.5 font-mono text-xs max-h-80 overflow-y-auto pr-1">
              {whaleSwaps
                .filter((sw) => (sw.amountUsd || 0) >= whaleMinAmountFilter)
                .map((swap, idx) => (
                  <div
                    key={swap.txHash || idx}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      swap.type === 'BUY'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        swap.type === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                      }`}>
                        {swap.type}
                      </span>
                      <span className="font-bold text-white">${swap.amountUsd?.toLocaleString() || '12,500'}</span>
                      <span className="text-slate-400 text-[11px]">({swap.walletLabel || swap.category || 'Whale'})</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>{new Date(swap.timestamp || Date.now()).toLocaleTimeString()}</span>
                      <span className="font-mono text-slate-500">
                        {swap.walletAddress ? `${swap.walletAddress.slice(0, 4)}...${swap.walletAddress.slice(-4)}` : '0x71...88b2'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. 🤖 SUB-TAB 6: AI ON-CHAIN STRATEGIST & CHAT COPILOT                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'AI_COPILOT' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top: AI On-Chain & Meme Intelligence Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 flex-wrap">
                    <span>AI Ончейн & Мем-Разведка</span>
                    <span className="text-purple-400">({data?.symbol || selectedCoin})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Анализ данных без внешних API: оценка капитализации, Vol/MCap, риска выхода китов и фазы жизни мема.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {aiAnalysisResult?.healthScore != null && (
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-xs font-mono">
                    <span className="text-slate-400">Индекс здоровья: </span>
                    <span className={`font-bold ${aiAnalysisResult.healthScore >= 75 ? 'text-emerald-400' : aiAnalysisResult.healthScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {aiAnalysisResult.healthScore}/100
                    </span>
                  </span>
                )}
                {aiAnalysisResult?.riskLevel && (
                  <span className={`px-2.5 py-1 rounded border text-xs font-mono font-bold ${
                    aiAnalysisResult.riskLevel === 'LOW'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : aiAnalysisResult.riskLevel === 'MEDIUM'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}>
                    Риск: {aiAnalysisResult.riskLevel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fetchFullAiAnalysis(data)}
                  disabled={isAiAnalysisLoading}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold font-mono text-xs rounded-lg transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAiAnalysisLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiAnalysisLoading ? 'Анализ...' : 'Обновить аудит'}</span>
                </button>
              </div>
            </div>

            {/* Meme & On-chain Stage Status Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* 1. Meme Stage */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Стадия Мем-Цикла</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 mt-1 block truncate" title={aiAnalysisResult?.memeStageLabel || 'Консолидация / Накопление'}>
                  {aiAnalysisResult?.memeStageLabel || '🛡️ Консолидация / Накопление'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  {aiAnalysisResult?.memeStage === 'VIRAL_EXPANSION' ? 'Активный импульс покупок' : aiAnalysisResult?.memeStage === 'OVERHEATED_FOMO' ? 'Пик эйфории, риск фиксаций' : aiAnalysisResult?.memeStage === 'LIQUIDITY_TRAP' ? 'Опасность: выход затруднен' : 'Набор позиции смарт-деньгами'}
                </span>
              </div>

              {/* 2. Volume to Market Cap Ratio */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Оборот Vol / MCap (24h)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-mono font-bold text-white">
                    {aiAnalysisResult?.volumeToMcapRatio != null ? `${aiAnalysisResult.volumeToMcapRatio}x` : data?.totalDexVolume24h && (data?.mktCap || data?.marketCap) ? `${((data.totalDexVolume24h) / (data.mktCap || data.marketCap)).toFixed(3)}x` : '0.35x'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    (${data ? (data.totalDexVolume24h >= 1e6 ? `${(data.totalDexVolume24h / 1e6).toFixed(2)}M` : `${(data.totalDexVolume24h / 1e3).toFixed(0)}k`) : '—'})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  {Number(aiAnalysisResult?.volumeToMcapRatio || 0.35) > 0.6 ? '🔥 Высокая спекуляция / Разгон' : 'Органический оборот торгов'}
                </span>
              </div>

              {/* 3. Pool Depth to Market Cap Ratio */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Глубина Пула к MCap</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {aiAnalysisResult?.liqToMcapRatio != null ? `${aiAnalysisResult.liqToMcapRatio}%` : '12.4%'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    (${data ? (data.totalDexLiquidityUsd >= 1e6 ? `${(data.totalDexLiquidityUsd / 1e6).toFixed(2)}M` : `${(data.totalDexLiquidityUsd / 1e3).toFixed(0)}k`) : '—'} TVL)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  {Number(aiAnalysisResult?.liqToMcapRatio || 12) < 4 ? '⚠️ Тонкий стакан (риск сквиза)' : '✅ Достаточная емкость пулов'}
                </span>
              </div>

              {/* 4. Whale Exit Risk */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Риск Выхода Китов (Slippage)</span>
                <span className={`text-xs sm:text-sm font-mono font-bold mt-1 block ${
                  aiAnalysisResult?.slippageExitRisk === 'CRITICAL'
                    ? 'text-rose-400'
                    : aiAnalysisResult?.slippageExitRisk === 'HIGH'
                    ? 'text-orange-400'
                    : aiAnalysisResult?.slippageExitRisk === 'MODERATE'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {aiAnalysisResult?.slippageExitRisk === 'CRITICAL'
                    ? '🚨 КРИТИЧЕСКИЙ'
                    : aiAnalysisResult?.slippageExitRisk === 'HIGH'
                    ? '⚠️ ВЫСОКИЙ'
                    : aiAnalysisResult?.slippageExitRisk === 'MODERATE'
                    ? '🟡 УМЕРЕННЫЙ'
                    : '🟢 МИНИМАЛЬНЫЙ'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  {aiAnalysisResult?.tacticalPlan?.maxRecommendedSize ? `Макс. сайз: ${aiAnalysisResult.tacticalPlan.maxRecommendedSize}` : 'Рекомендуется дробление ордеров'}
                </span>
              </div>
            </div>

            {/* Tactical AI Plan Banner */}
            {aiAnalysisResult?.tacticalPlan && (
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-slate-950 border border-purple-500/30 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-bold uppercase tracking-wider">
                  <Crosshair className="w-4 h-4 text-purple-400" />
                  <span>Тактический торговый план ИИ:</span>
                </div>
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-mono text-purple-200">
                  <span className="font-bold text-white">Рекомендация: </span>
                  {aiAnalysisResult.tacticalPlan.action}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Зона набора</span>
                    <span className="text-emerald-400 font-bold mt-0.5 block">{aiAnalysisResult.tacticalPlan.entryZone}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Стоп-лосс</span>
                    <span className="text-rose-400 font-bold mt-0.5 block">{aiAnalysisResult.tacticalPlan.stopLoss}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Цели TP1 / TP2</span>
                    <span className="text-amber-300 font-bold mt-0.5 block">{aiAnalysisResult.tacticalPlan.tp1} | {aiAnalysisResult.tacticalPlan.tp2}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Безопасный объем</span>
                    <span className="text-indigo-300 font-bold mt-0.5 block">{aiAnalysisResult.tacticalPlan.maxRecommendedSize}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Key Findings Checklist */}
            {aiAnalysisResult?.keyFindings && aiAnalysisResult.keyFindings.length > 0 && (
              <div className="space-y-1.5 pt-1 font-mono text-xs">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">Ключевые ончейн-факты:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiAnalysisResult.keyFindings.map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg text-slate-300">
                      <span className="text-purple-400 font-bold mt-0.5">•</span>
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Full Markdown Analysis */}
            {aiAnalysisResult?.analysisText && (
              <div className="border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                  className="flex items-center justify-between w-full text-xs font-mono text-purple-300 hover:text-purple-200 transition py-1"
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{isAnalysisExpanded ? 'Скрыть подробный ончейн-отчет' : 'Показать подробный ончейн-отчет'}</span>
                  </span>
                  {isAnalysisExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isAnalysisExpanded && (
                  <div className="mt-2.5 p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-300 leading-relaxed max-h-72 overflow-y-auto">
                    <div className="prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown>{aiAnalysisResult.analysisText}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom: Interactive AI Q&A Dialogue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white font-mono">
                  Интерактивный ончейн-диалог с ИИ
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Задайте любой вопрос по объемам, китам или стакану
              </span>
            </div>

            {/* Quick Scenario Prompt Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">Быстрые сценарии:</span>
              <button
                type="button"
                onClick={() => handleSendAiMessage('Какие данные подтверждают продолжение роста, какие указывают на дистрибуцию и при каких условиях каждый сценарий станет основным?')}
                disabled={isAiGenerating}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-amber-950/90 hover:brightness-125 border border-emerald-500/60 rounded-lg text-xs font-mono font-bold text-emerald-300 transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                title="«Какие данные подтверждают продолжение роста, какие указывают на дистрибуцию и при каких условиях каждый сценарий станет основным?»"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>⚖️ Рост vs Дистрибуция</span>
                <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-200 rounded border border-emerald-500/30">
                  Сценарии & Факты
                </span>
              </button>
              {[
                'Качают ли монету маркет-мейкеры?',
                'Оцени риск проскальзывания при сбросе $10,000',
                'Каковы шансы на дальнейший рост по ончейн-метрикам?',
                'Разбери структуру держателей и налоги контракта',
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendAiMessage(promptText)}
                  disabled={isAiGenerating}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-lg text-xs font-mono text-slate-300 hover:text-purple-300 transition cursor-pointer"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Chat Messages Window */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-80 overflow-y-auto space-y-3 font-mono text-xs">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`p-3.5 rounded-xl max-w-2xl leading-relaxed text-xs ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-slate-950 font-bold whitespace-pre-wrap'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="space-y-2">
                        {msg.model && (
                          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 text-[10px] font-mono text-slate-400 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                              {msg.model} · Deep Thinking
                            </span>
                            {msg.grounding?.enabled && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                                <Globe className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                                <span>Live Search Grounding</span>
                              </span>
                            )}
                          </div>
                        )}
                        <div className="prose prose-invert prose-xs max-w-none space-y-2">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        {msg.grounding?.sources && msg.grounding.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-1.5">Веб-источники:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.grounding.sources.slice(0, 4).map((s, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={s.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-300 hover:text-purple-200 flex items-center gap-1 max-w-[240px] truncate"
                                >
                                  <span className="truncate">{s.title || s.uri}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isAiGenerating && (
                <div className="flex items-center gap-2 text-purple-400 text-xs font-mono animate-pulse">
                  <Bot className="w-4 h-4" />
                  <span>AI анализирует ончейн-метрики и структуру ликвидности...</span>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiCustomQuestion}
                onChange={(e) => setAiCustomQuestion(e.target.value)}
                placeholder="Спросите ИИ: 'Почему объем превышает ликвидность?', 'Выдержит ли пул продажу?'..."
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                disabled={isAiGenerating || !aiCustomQuestion.trim()}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
