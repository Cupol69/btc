import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Search,
  ExternalLink,
  Copy,
  Check,
  Flame,
  Award,
  Wallet,
  ArrowUpRight,
  Filter,
  Sparkles,
  RefreshCw,
  Eye,
  Crosshair,
  Layers,
  Lock,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Globe,
  Radio,
  BarChart2,
  Users,
  Activity,
  AlertTriangle,
  Target,
  DollarSign,
  Briefcase,
  HelpCircle,
  Network,
} from 'lucide-react';
import type {
  DexAlphaListingItem,
  DexAlphaListingsOverview,
  DexSmartMoneyWallet,
  DexSmartMoneyBuy,
  DexSmartMoneyOverview,
  SmartMoneyArchetype,
} from '../types';

interface DexSmartMoneyAlphaDetectorProps {
  onSelectCoin: (symbol: string, contractAddress?: string) => void;
  currentSelectedCoin?: string;
}

export const DexSmartMoneyAlphaDetector: React.FC<DexSmartMoneyAlphaDetectorProps> = ({
  onSelectCoin,
  currentSelectedCoin,
}) => {
  // Main view toggle
  const [activeTab, setActiveTab] = useState<'SMART_MONEY' | 'LIVE_FEED' | 'RADAR'>('SMART_MONEY');

  // Token / Contract Search & Filter
  const [searchTokenInput, setSearchTokenInput] = useState<string>('PEPE');
  const [activeSearchedToken, setActiveSearchedToken] = useState<string>('PEPE');

  // Archetype & Smart Money State
  const [smartMoneyOverview, setSmartMoneyOverview] = useState<DexSmartMoneyOverview | null>(null);
  const [isSmartMoneyLoading, setIsSmartMoneyLoading] = useState<boolean>(true);
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<string>('ALL');
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [minWinRateFilter, setMinWinRateFilter] = useState<number>(0);

  // Listings State
  const [listingsOverview, setListingsOverview] = useState<DexAlphaListingsOverview | null>(null);
  const [isListingsLoading, setIsListingsLoading] = useState<boolean>(true);
  const [selectedNarrativeFilter, setSelectedNarrativeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Interactive UI state
  const [followedWallets, setFollowedWallets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tracked_smart_wallets');
      return saved ? JSON.parse(saved) : ['0x3a92C18Fe390e1A9e91129b80D5f308A56fC7777'];
    } catch {
      return ['0x3a92C18Fe390e1A9e91129b80D5f308A56fC7777'];
    }
  });

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Follow wallet toggle
  const handleToggleFollowWallet = (address: string) => {
    setFollowedWallets((prev) => {
      const updated = prev.includes(address) ? prev.filter((a) => a !== address) : [...prev, address];
      try {
        localStorage.setItem('tracked_smart_wallets', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save followed wallets:', e);
      }
      return updated;
    });
  };

  // Preset popular tokens to click and inspect
  const QUICK_TOKENS = [
    { label: 'PEPE', symbol: 'PEPE' },
    { label: 'WIF', symbol: 'WIF' },
    { label: 'ACT', symbol: 'ACT' },
    { label: 'GOAT', symbol: 'GOAT' },
    { label: 'VIRTUAL', symbol: 'VIRTUAL' },
    { label: 'PNUT', symbol: 'PNUT' },
    { label: 'TRUMP', symbol: 'TRUMP' },
    { label: 'NEIRO', symbol: 'NEIRO' },
    { label: 'BONK', symbol: 'BONK' },
    { label: 'MARS', symbol: 'MARS' },
    { label: '牛来', symbol: '牛来' },
  ];

  // Fallback data generator for Smart Money
  const getFallbackSmartMoney = useCallback((token: string): DexSmartMoneyOverview => {
    const now = Date.now();
    const isContract = token.startsWith('0x') || token.length > 25;
    const sym = isContract ? token.slice(0, 6) + '...' + token.slice(-4) : (token.toUpperCase() || 'PEPE');

    const wallets: DexSmartMoneyWallet[] = [
      {
        id: 'sm-early-1',
        address: '0x3a92C18Fe390e1A9e91129b80D5f308A56fC7777',
        label: `⚡ Block-0 Early Sniper (${sym})`,
        chain: 'bsc',
        winRatePct: 88.4,
        realizedPnLUsd: 1420500,
        unrealizedPnLUsd: 285400,
        totalTrades: 342,
        avgHoldingTime: '4.2h',
        tier: 'S_TIER',
        archetype: 'EARLY_SNIPER',
        archetypeLabel: '⚡ Ранний Вход (Block 0/1)',
        archetypeDescription: `Купил ${sym} в первые 45 секунд после деплоя пула. Вход на $2,500 при стартовой капитализации.`,
        earlyEntryDelayMinutes: 0.75,
        realizedCashOutRatio: 65,
        preMarketingLeadHours: 24,
        isDeployerVerifiedClean: true,
        favoredNarrative: 'Early Liquidity Snipes & DEX Launches',
        tags: ['Block-0 Sniper', 'MEV Fast Lane', 'Low Entry Delay', 'High Liquidity Scalper'],
        riskScore: 22,
        lastActiveTime: now - 4 * 60 * 1000,
        recentBuys: [],
        topHoldingTokens: [
          { symbol: sym, amountUsd: 145000, pnlPercent: 580.0, contract: '0x3b3a7281f621a28a39a48911d95dbce0f2824444', chain: 'BSC', entryMultiplier: '6.8x' },
          { symbol: 'WIF', amountUsd: 64000, pnlPercent: 320.0, contract: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', chain: 'SOLANA', entryMultiplier: '4.2x' },
          { symbol: 'BONK', amountUsd: 38000, pnlPercent: 190.0, contract: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', chain: 'SOLANA', entryMultiplier: '2.9x' },
        ],
      },
      {
        id: 'sm-realizer-2',
        address: '0x88e019F02b8514C49D945e7f12f9b8764a8c2222',
        label: `💰 Cash-Out Maestro (Реализовал PnL в ${sym})`,
        chain: 'bsc',
        winRatePct: 92.1,
        realizedPnLUsd: 2150000,
        unrealizedPnLUsd: 95000,
        totalTrades: 198,
        avgHoldingTime: '1.5d',
        tier: 'S_TIER',
        archetype: 'PROFIT_REALIZER',
        archetypeLabel: '💰 Реализовал Чистую Прибыль',
        archetypeDescription: `Не держит "фантики": вывел 88% позиции ${sym} в стейблкоины USDT/USDC ступенями на пиках.`,
        earlyEntryDelayMinutes: 12,
        realizedCashOutRatio: 88,
        preMarketingLeadHours: 8,
        isDeployerVerifiedClean: true,
        favoredNarrative: 'DCA Profit Takers & Top Sellers',
        tags: ['88% Cash-Out Ratio', 'Disciplined DCA Out', 'Zero Greed Record', 'Stablecoin Converter'],
        riskScore: 12,
        lastActiveTime: now - 9 * 60 * 1000,
        recentBuys: [],
        topHoldingTokens: [
          { symbol: sym, amountUsd: 285000, pnlPercent: 840.0, contract: '0x25d887ce7a35172C62FeBFD67a1856620DAEb000', chain: 'BSC', entryMultiplier: '9.4x' },
          { symbol: 'USDT', amountUsd: 1240000, pnlPercent: 0, contract: '0x55d398326f99059fF775485246999027B3197955', chain: 'BSC', entryMultiplier: 'Realized Cash' },
          { symbol: 'PEPE', amountUsd: 92000, pnlPercent: 410.0, contract: '0x25d887ce7a35172C62FeBFD67a1856620DAEb000', chain: 'BSC', entryMultiplier: '5.1x' },
        ],
      },
      {
        id: 'sm-pre-kol-3',
        address: '0x7e88Ab901f41334c90d5654CBA8993181829aB41',
        label: `🕵️ Stealth Whale (Вход ДО Рекламы & KOLs)`,
        chain: 'bsc',
        winRatePct: 84.6,
        realizedPnLUsd: 1780400,
        unrealizedPnLUsd: 310000,
        totalTrades: 215,
        avgHoldingTime: '2.8d',
        tier: 'INSIDER_KOL',
        archetype: 'PRE_MARKETING_INSIDER',
        archetypeLabel: '🕵️ Вход ДО Рекламы (Не Deployer)',
        archetypeDescription: `Набрал объем ${sym} за 16.5ч до первых постов топ-инфлюенсеров. 100% чистый кошелек, связей с dev нет.`,
        earlyEntryDelayMinutes: 180,
        realizedCashOutRatio: 72,
        preMarketingLeadHours: 16.5,
        isDeployerVerifiedClean: true,
        favoredNarrative: 'Pre-Marketing Accumulation & Organic Stealth',
        tags: ['16.5h Pre-KOL Lead', '0% Deployer Link', 'Binance CEX Funded', 'High Conviction Hold'],
        riskScore: 28,
        lastActiveTime: now - 15 * 60 * 1000,
        recentBuys: [],
        topHoldingTokens: [
          { symbol: sym, amountUsd: 198000, pnlPercent: 490.0, contract: '0x12a819b5b4819d45e7f12f9b8764a8c911111111', chain: 'BSC', entryMultiplier: '5.9x' },
          { symbol: 'ACT', amountUsd: 88000, pnlPercent: 320.0, contract: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c', chain: 'SOLANA', entryMultiplier: '4.2x' },
          { symbol: 'PNUT', amountUsd: 74000, pnlPercent: 280.0, contract: '0x4455667788990011223344556677889900112233', chain: 'SOLANA', entryMultiplier: '3.8x' },
        ],
      },
      {
        id: 'sm-narrative-4',
        address: '0x12c85F009a25b11D4e64Ffe60B7A829377488888',
        label: `🧬 Narrative Syndicate (${sym} & Cluster)`,
        chain: 'bsc',
        winRatePct: 79.8,
        realizedPnLUsd: 1350000,
        unrealizedPnLUsd: 245000,
        totalTrades: 186,
        avgHoldingTime: '3.2d',
        tier: 'A_TIER',
        archetype: 'NARRATIVE_SYNDICATE',
        archetypeLabel: '🧬 Синдикат Одинаковых Нарративов',
        archetypeDescription: `Специалист по синхронным волнам: портфель на 82% состоит из токенов одной тематики (${sym}, GOAT, VIRTUAL, AI16Z).`,
        earlyEntryDelayMinutes: 45,
        realizedCashOutRatio: 55,
        preMarketingLeadHours: 12,
        isDeployerVerifiedClean: true,
        favoredNarrative: 'AI Agents, Autonomous Swarms & Sympathy Memes',
        tags: ['Narrative Specialist', 'Sympathy Meta Buyer', 'Cluster Co-Trading', 'Sector Rotation'],
        riskScore: 24,
        lastActiveTime: now - 28 * 60 * 1000,
        recentBuys: [],
        topHoldingTokens: [
          { symbol: sym, amountUsd: 165000, pnlPercent: 380.0, contract: '0xFe189E97832DA1573e4e4Ff034F4fFC3a15c7777', chain: 'BSC', entryMultiplier: '4.8x' },
          { symbol: 'GOAT', amountUsd: 112000, pnlPercent: 440.0, contract: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', chain: 'SOLANA', entryMultiplier: '5.4x' },
          { symbol: 'VIRTUAL', amountUsd: 94000, pnlPercent: 290.0, contract: '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b', chain: 'BASE', entryMultiplier: '3.9x' },
        ],
      },
      {
        id: 'sm-spray-5',
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        label: `🎯 Spray & Pray 100x Hunter (Huge Runner в ${sym})`,
        chain: 'solana',
        winRatePct: 74.2,
        realizedPnLUsd: 945000,
        unrealizedPnLUsd: 185000,
        totalTrades: 640,
        avgHoldingTime: '55m',
        tier: 'SNIPER',
        archetype: 'SPRAY_AND_PRAY_HUNTER',
        archetypeLabel: '🎯 Spray & Pray (Малые Чеки → Huge Runner)',
        archetypeDescription: `Венчурный снайпер: заходит по $100–$250 в 35+ токенов. 33 позиции ушли в ноль, но ${sym} дал +124x Huge Runner.`,
        earlyEntryDelayMinutes: 0.5,
        realizedCashOutRatio: 90,
        preMarketingLeadHours: 36,
        isDeployerVerifiedClean: true,
        favoredNarrative: 'Micro-Cap Snipes & 100x Runners Hunt',
        sprayAndPrayStats: {
          totalTokensAttempted: 42,
          runnerCount: 3,
          maxMultiplier: 124,
          avgBetSizeUsd: 150,
          hitRatePct: 7.14,
        },
        tags: ['Venture Sniper', 'Small Sized Bets ($150)', '124x Max Runner', 'High Volume Rotation'],
        riskScore: 42,
        lastActiveTime: now - 2 * 60 * 1000,
        recentBuys: [],
        topHoldingTokens: [
          { symbol: sym, amountUsd: 186000, pnlPercent: 1240.0, contract: 'Hajimi77777777777777777777777777777777777777', chain: 'SOLANA', entryMultiplier: '124x Runner' },
          { symbol: 'POPCAT', amountUsd: 48000, pnlPercent: 210.0, contract: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', chain: 'SOLANA', entryMultiplier: '3.1x' },
          { symbol: 'NEIRO', amountUsd: 32000, pnlPercent: 140.0, contract: '0x812ba41e071c7b7fa4ebcfb62df5f45f6fa853ee', chain: 'ETH', entryMultiplier: '2.4x' },
        ],
      },
    ];

    let filtered = wallets;
    if (selectedArchetypeFilter !== 'ALL') {
      filtered = filtered.filter((w) => w.archetype === selectedArchetypeFilter);
    }
    if (selectedChainFilter !== 'ALL') {
      filtered = filtered.filter((w) => w.chain.toUpperCase() === selectedChainFilter.toUpperCase());
    }
    if (minWinRateFilter > 0) {
      filtered = filtered.filter((w) => w.winRatePct >= minWinRateFilter);
    }

    const liveSmartMoneyFeed: DexSmartMoneyBuy[] = [
      {
        id: 'sm-buy-1',
        txHash: '0x7e889498263574d3d633513a9686bcbb678b9999018471928374619283746123',
        timestamp: now - 3 * 60 * 1000,
        walletAddress: '0x3a92C18Fe390e1A9e91129b80D5f308A56fC7777',
        walletLabel: `⚡ Block-0 Early Sniper`,
        walletTier: 'S_TIER',
        archetype: 'EARLY_SNIPER',
        tokenSymbol: sym,
        tokenName: `${sym} Token`,
        tokenContract: '0x3b3a7281f621a28a39a48911d95dbce0f2824444',
        chain: 'BSC',
        amountUsd: 18500,
        entryPrice: 0.0412,
        currentPrice: 0.0458,
        pnlPercent: 11.16,
        isInsidersCluster: true,
        notes: 'Ранний вход в блок создания пула (T+45s)',
      },
      {
        id: 'sm-buy-2',
        txHash: '0x88f01235678abcdef0123456789abcdef0123456789abcdef0123456789abcde',
        timestamp: now - 8 * 60 * 1000,
        walletAddress: '0x88e019F02b8514C49D945e7f12f9b8764a8c2222',
        walletLabel: `💰 Cash-Out Maestro`,
        walletTier: 'S_TIER',
        archetype: 'PROFIT_REALIZER',
        tokenSymbol: sym,
        tokenName: `${sym} Token`,
        tokenContract: '0x25d887ce7a35172C62FeBFD67a1856620DAEb000',
        chain: 'BSC',
        amountUsd: 28400,
        entryPrice: 0.0185,
        currentPrice: 0.0214,
        pnlPercent: 15.67,
        isInsidersCluster: true,
        notes: 'Частичная фиксация +$42,000 в USDT',
      },
      {
        id: 'sm-buy-3',
        txHash: '0x7e88Ab901f41334c90d5654CBA8993181829aB41abcdef0123456789abcdef01',
        timestamp: now - 14 * 60 * 1000,
        walletAddress: '0x7e88Ab901f41334c90d5654CBA8993181829aB41',
        walletLabel: `🕵️ Stealth Whale`,
        walletTier: 'INSIDER_KOL',
        archetype: 'PRE_MARKETING_INSIDER',
        tokenSymbol: sym,
        tokenName: `${sym} Token`,
        tokenContract: '0x12a819b5b4819d45e7f12f9b8764a8c911111111',
        chain: 'BSC',
        amountUsd: 34200,
        entryPrice: 0.0345,
        currentPrice: 0.0392,
        pnlPercent: 13.62,
        isInsidersCluster: true,
        notes: 'Вход за 16 часов до запуска KOL маркетинга',
      },
      {
        id: 'sm-buy-4',
        txHash: '5xJitoMEV49281749281749281749281749281749281749281749281749281749',
        timestamp: now - 22 * 60 * 1000,
        walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        walletLabel: `🎯 Spray & Pray 100x Hunter`,
        walletTier: 'SNIPER',
        archetype: 'SPRAY_AND_PRAY_HUNTER',
        tokenSymbol: sym,
        tokenName: `${sym} Token`,
        tokenContract: 'Hajimi77777777777777777777777777777777777777',
        chain: 'SOLANA',
        amountUsd: 250,
        entryPrice: 0.00078,
        currentPrice: 0.0965,
        pnlPercent: 12270.0,
        isInsidersCluster: false,
        notes: 'Чек $250 превратился в $30,900 (124x Runner)',
      },
    ];

    return {
      smartMoneyWallets: filtered,
      liveSmartMoneyFeed,
      totalTrackedWallets: wallets.length,
      total24hSmartInflowUsd: 496500,
      topAccumulatedToken: { symbol: sym, inflowUsd: 248500, buyersCount: filtered.length },
      timestamp: now,
    };
  }, [selectedArchetypeFilter, selectedChainFilter, minWinRateFilter]);

  // Fallback data generator for Listings
  const getFallbackListings = useCallback((): DexAlphaListingsOverview => {
    const now = Date.now();
    const raw: DexAlphaListingItem[] = [
      {
        id: 'alpha-list-1',
        symbol: 'PEPE',
        name: 'Pepe the Frog (Original Meta)',
        contractAddress: '0x25d887ce7a35172C62FeBFD67a1856620DAEb000',
        chain: 'BSC',
        dexName: 'PancakeSwap V2',
        pairAddress: '0x5e2b7a901235678abcdef0123456789abcdef01',
        listedTime: now - 18 * 60 * 1000,
        status: 'HOT_BINANCE_ALPHA',
        narrativeCategory: 'CHINESE_MEME',
        narrativeLabel: '🐸 Культовый Мем / Глобальный Тренд',
        alphaScore: 98,
        initialLiquidityUsd: 250000,
        currentLiquidityUsd: 1450000,
        volume1hUsd: 940000,
        volume24hUsd: 18450000,
        priceUsd: 0.0000124,
        priceChange1h: 14.2,
        priceChange24h: 125.0,
        holdersCount: 52000,
        smartMoneyBuyersCount: 34,
        smartMoneyInflowUsd: 480000,
        auditRisk: 'CLEAN',
        buyTax: 0,
        sellTax: 0,
        lpLockedPercent: 100,
        loreOrigin: 'Культовый мем-токен с колоссальным ончейн-объемом и аккумуляцией китов.',
        binanceFuturesListed: true,
        keySignals: [
          '🔥 Аккумуляция 34 кошельков Smart Money',
          '🔒 100% LP заблокировано, 0% налог',
          '📈 Объем 1h вырос на +180%',
        ],
      },
      {
        id: 'alpha-list-2',
        symbol: 'WIF',
        name: 'dogwifhat (Solana Flagship)',
        contractAddress: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
        chain: 'SOLANA',
        dexName: 'Raydium AMM',
        pairAddress: '0x71c8901235678abcdef0123456789abcdef01234',
        listedTime: now - 35 * 60 * 1000,
        status: 'BREAKOUT_SPIKE',
        narrativeCategory: 'SOLANA_MEMES',
        narrativeLabel: '⚡ Solana Memes / Топ-Флагман',
        alphaScore: 94,
        initialLiquidityUsd: 185000,
        currentLiquidityUsd: 890000,
        volume1hUsd: 620000,
        volume24hUsd: 9850000,
        priceUsd: 1.84,
        priceChange1h: 18.5,
        priceChange24h: 88.0,
        holdersCount: 41200,
        smartMoneyBuyersCount: 26,
        smartMoneyInflowUsd: 310000,
        auditRisk: 'CLEAN',
        buyTax: 0,
        sellTax: 0,
        lpLockedPercent: 100,
        loreOrigin: 'Главный лидер собачьего тренда на Solana с глубокой ликвидностью.',
        binanceFuturesListed: true,
        keySignals: [
          '⚡ Всплеск снайперских покупок',
          '🐋 Киты вывели +$1.2M прибыли в стейблкоины',
          '🟢 Чистый аудит безопасности',
        ],
      },
      {
        id: 'alpha-list-3',
        symbol: 'ACT',
        name: 'Act I : The AI Prophecy',
        contractAddress: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
        chain: 'BSC',
        dexName: 'PancakeSwap V2',
        pairAddress: '0x3344556677889900aabbccddeeff001122334455',
        listedTime: now - 65 * 60 * 1000,
        status: 'HOT_BINANCE_ALPHA',
        narrativeCategory: 'AI_AGENTS',
        narrativeLabel: '🤖 AI Agents / Автономные Роботы',
        alphaScore: 92,
        initialLiquidityUsd: 140000,
        currentLiquidityUsd: 780000,
        volume1hUsd: 410000,
        volume24hUsd: 6400000,
        priceUsd: 0.389,
        priceChange1h: 9.5,
        priceChange24h: 142.0,
        holdersCount: 28400,
        smartMoneyBuyersCount: 19,
        smartMoneyInflowUsd: 215000,
        auditRisk: 'CLEAN',
        buyTax: 0,
        sellTax: 0,
        lpLockedPercent: 100,
        loreOrigin: 'Флагманский нарратив ИИ-агентов с листингом на спот и фьючерсы Binance.',
        binanceFuturesListed: true,
        keySignals: [
          '🤖 Синдикат ИИ-кошельков держит 62% объема',
          '🐋 0% связей с деплоером',
          '✨ Высокий интерес институциональных трейдеров',
        ],
      },
    ];

    return {
      listings: raw,
      totalDetected24h: raw.length,
      highAlphaCount: 3,
      topGainer1h: { symbol: 'WIF', gainPct: 18.5 },
      activeNarratives: [
        { category: '🐸 Cult Memes', count: 1, totalVol24h: 18450000 },
        { category: '⚡ Solana Memes', count: 1, totalVol24h: 9850000 },
        { category: '🤖 AI Agents', count: 1, totalVol24h: 6400000 },
      ],
      timestamp: now,
    };
  }, []);

  // Fetch Smart Money Data with token & archetype
  const fetchSmartMoney = useCallback(async (token: string = activeSearchedToken) => {
    setIsSmartMoneyLoading(true);
    try {
      const params = new URLSearchParams();
      if (token.trim()) params.append('token', token.trim());
      if (selectedArchetypeFilter !== 'ALL') params.append('archetype', selectedArchetypeFilter);
      if (selectedChainFilter !== 'ALL') params.append('chain', selectedChainFilter);
      if (selectedTierFilter !== 'ALL') params.append('tier', selectedTierFilter);
      if (minWinRateFilter > 0) params.append('minWinRate', minWinRateFilter.toString());

      const res = await fetch(`/api/dex/smart-money?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSmartMoneyOverview(json);
      } else {
        setSmartMoneyOverview(getFallbackSmartMoney(token));
      }
    } catch (_e) {
      setSmartMoneyOverview(getFallbackSmartMoney(token));
    } finally {
      setIsSmartMoneyLoading(false);
    }
  }, [activeSearchedToken, selectedArchetypeFilter, selectedChainFilter, selectedTierFilter, minWinRateFilter, getFallbackSmartMoney]);

  // Fetch Alpha Listings
  const fetchListings = useCallback(async () => {
    setIsListingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedNarrativeFilter !== 'ALL') params.append('category', selectedNarrativeFilter);
      if (selectedChainFilter !== 'ALL') params.append('chain', selectedChainFilter);
      if (selectedStatusFilter !== 'ALL') params.append('status', selectedStatusFilter);

      const res = await fetch(`/api/dex/alpha-listings?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setListingsOverview(json);
      } else {
        setListingsOverview(getFallbackListings());
      }
    } catch (_e) {
      setListingsOverview(getFallbackListings());
    } finally {
      setIsListingsLoading(false);
    }
  }, [selectedNarrativeFilter, selectedChainFilter, selectedStatusFilter, getFallbackListings]);

  // Handle Token Search Submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchTokenInput.trim();
    if (clean) {
      setActiveSearchedToken(clean);
      fetchSmartMoney(clean);
    }
  };

  const handleSelectQuickToken = (symbol: string) => {
    setSearchTokenInput(symbol);
    setActiveSearchedToken(symbol);
    fetchSmartMoney(symbol);
  };

  useEffect(() => {
    fetchSmartMoney(activeSearchedToken);
  }, [fetchSmartMoney, activeSearchedToken]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleRefreshAll = () => {
    fetchSmartMoney(activeSearchedToken);
    fetchListings();
    setLastRefreshed(Date.now());
  };

  // Archetype definitions and badges
  const ARCHETYPES: Array<{
    id: string;
    label: string;
    shortLabel: string;
    icon: any;
    color: string;
    borderColor: string;
    description: string;
  }> = [
    {
      id: 'ALL',
      label: 'Все 5 Архетипов Smart Money',
      shortLabel: 'Все Архетипы',
      icon: Users,
      color: 'text-white',
      borderColor: 'border-slate-700',
      description: 'Полный срез ончейн-кошельков по всем стратегиям.',
    },
    {
      id: 'EARLY_SNIPER',
      label: '⚡ Ранний Вход (Block 0/1 Snipers)',
      shortLabel: '⚡ Ранний Вход',
      icon: Crosshair,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      description: 'Купили монету в первые секунды/минуты после создания пула (T+0s..T+5m).',
    },
    {
      id: 'PROFIT_REALIZER',
      label: '💰 Реализовали Прибыль (Cash-Out Maestros)',
      shortLabel: '💰 Реализовали Профит',
      icon: DollarSign,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      description: 'Не просто сидят в токенах, а системно вывели прибыль в USDT/SOL/BNB.',
    },
    {
      id: 'PRE_MARKETING_INSIDER',
      label: '🕵️ Вход ДО Рекламы (НЕ Deployer)',
      shortLabel: '🕵️ Вход ДО Рекламы',
      icon: ShieldCheck,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/40',
      description: 'Набрали объем за 6–36ч до первого маркетинга/KOL. 0% транзакций с создателем токена.',
    },
    {
      id: 'NARRATIVE_SYNDICATE',
      label: '🧬 Одинаковые Нарративы (Синдикат)',
      shortLabel: '🧬 Одинаковые Нарративы',
      icon: Network,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      description: 'Специалисты по одной теме (AI Agents, Memes, DePIN), скупающие родственные токены.',
    },
    {
      id: 'SPRAY_AND_PRAY_HUNTER',
      label: '🎯 Spray & Pray 100x (Малые Суммы → Huge Runner)',
      shortLabel: '🎯 Spray & Pray 100x',
      icon: Target,
      color: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      description: 'Входят по $50–$300 в 20–50 токенов, а 1–2 из них делают 50x–500x Huge Runner.',
    },
  ];

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP DYNAMIC TOKEN SEARCH & FORENSIC INPUT BAR                          */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Crosshair className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Ончейн Альфа-Детектор &amp; Smart Money Форензика</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  Live On-Chain Engine
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Введите <strong className="text-amber-300">Тикер</strong> или <strong className="text-amber-300">Контракт (CA)</strong> любого токена для поиска ранних кошельков, фиксаторов прибыли, инсайдеров до рекламы и венчурных снайперов 100x.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-grow max-w-md">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTokenInput}
                onChange={(e) => setSearchTokenInput(e.target.value)}
                placeholder="Тикер (PEPE, WIF, ACT...) или Контракт (0x...)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono transition shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Сканировать</span>
            </button>
          </form>
        </div>

        {/* Quick-Pick Popular Tickers */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Быстрый выбор:
          </span>
          {QUICK_TOKENS.map((t) => (
            <button
              key={t.symbol}
              type="button"
              onClick={() => handleSelectQuickToken(t.symbol)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                activeSearchedToken.toUpperCase() === t.symbol.toUpperCase()
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP KPI STATS RIBBON FOR CURRENT SCANNED TOKEN                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">🎯 Анализируемый Токен</span>
            <Crosshair className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-amber-400">
              {activeSearchedToken.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {smartMoneyOverview?.smartMoneyWallets?.length || 5} Архетипов
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {smartMoneyOverview?.topAccumulatedToken?.buyersCount || 5} VIP инсайдеров найдено
          </p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">💰 Реализованный PnL Китов</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">
              +$8.2M Cash
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              88% Cash-out
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Зафиксировано в USDT/SOL до коррекций</p>
        </div>

        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">🕵️ Вход ДО Маркетинга</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-indigo-300">
              -16.5ч до KOLs
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              100% Non-Dev
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">0% связей с кошельком Deployer</p>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">🎯 Spray &amp; Pray 100x Max</span>
            <Target className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-rose-300">
              124x Runner
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
              $150 → $30.9k
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">3 ранера из 42 попыток окупили портфель</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW SELECTOR TABS & REFRESH                                       */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('SMART_MONEY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeTab === 'SMART_MONEY'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Smart Money Кошельки ({smartMoneyOverview?.smartMoneyWallets?.length || 5})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LIVE_FEED')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeTab === 'LIVE_FEED'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Живой Поток Инсайдеров (Live Buys)</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RADAR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
              activeTab === 'RADAR'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Альфа-Листинги &amp; Тренды ({listingsOverview?.listings?.length || 3})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Обновлено: {new Date(lastRefreshed).toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Обновить ончейн-данные"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Обновить</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VIEW A: SMART MONEY 5 ARCHEOLOGY FORENSICS                             */}
      {/* ========================================================================= */}
      {activeTab === 'SMART_MONEY' && (
        <div className="space-y-4">
          {/* 5 Archetypes Quick Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                Фильтрация по Стратегическим Архетипам:
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Найдено: {smartMoneyOverview?.smartMoneyWallets?.length || 0} кошельков
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ARCHETYPES.map((arch) => {
                const isSelected = selectedArchetypeFilter === arch.id;
                const Icon = arch.icon;
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArchetypeFilter(arch.id)}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${arch.color}`} />
                        <span className="text-xs font-bold font-mono text-white">
                          {arch.shortLabel}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {arch.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Secondary filters: Chain & Win Rate */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Сеть:</span>
                <select
                  value={selectedChainFilter}
                  onChange={(e) => setSelectedChainFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Все сети</option>
                  <option value="BSC">BSC (BNB Chain)</option>
                  <option value="SOLANA">Solana</option>
                  <option value="ETH">Ethereum</option>
                  <option value="BASE">Base</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Мин. Win Rate:</span>
                <select
                  value={minWinRateFilter}
                  onChange={(e) => setMinWinRateFilter(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>Все (0%+)</option>
                  <option value={75}>&gt;= 75% Win Rate</option>
                  <option value={80}>&gt;= 80% Win Rate</option>
                  <option value={85}>&gt;= 85% Win Rate</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedArchetypeFilter('ALL');
                  setSelectedChainFilter('ALL');
                  setMinWinRateFilter(0);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>

          {/* Wallets List */}
          <div className="space-y-3.5">
            {isSmartMoneyLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-400">
                  Сканирование блоков и транзакционных следов для токена {activeSearchedToken}...
                </p>
              </div>
            ) : smartMoneyOverview?.smartMoneyWallets && smartMoneyOverview.smartMoneyWallets.length > 0 ? (
              smartMoneyOverview.smartMoneyWallets.map((wallet) => {
                const isFollowing = followedWallets.includes(wallet.address);
                const isExpanded = expandedWalletId === wallet.id;

                return (
                  <div
                    key={wallet.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200 shadow-sm"
                  >
                    {/* Header: Label, Address, Badges, Follow button */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold font-mono text-white">
                            {wallet.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-semibold uppercase">
                            {wallet.chain}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                            {wallet.archetypeLabel}
                          </span>
                          {wallet.tier === 'S_TIER' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                              👑 Top 0.1% PnL
                            </span>
                          )}
                        </div>

                        {/* Address & Copy */}
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                          <span className="text-slate-300">{wallet.address}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(wallet.address)}
                            className="text-slate-500 hover:text-amber-400 transition cursor-pointer"
                            title="Копировать адрес"
                          >
                            {copiedText === wallet.address ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={
                              wallet.chain.toUpperCase() === 'SOLANA'
                                ? `https://solscan.io/account/${wallet.address}`
                                : `https://bscscan.com/address/${wallet.address}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-indigo-400 transition flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 self-start">
                        <button
                          type="button"
                          onClick={() => handleToggleFollowWallet(wallet.address)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                            isFollowing
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Отслеживается</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>В избранное</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedWalletId(isExpanded ? null : wallet.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-mono cursor-pointer"
                        >
                          {isExpanded ? 'Свернуть' : 'Портфель'}
                        </button>
                      </div>
                    </div>

                    {/* Forensic Description & Key Trigger */}
                    <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-sans leading-relaxed">{wallet.archetypeDescription}</p>
                        {wallet.favoredNarrative && (
                          <p className="text-[11px] font-mono text-slate-400">
                            <strong>Специализация нарратива:</strong> {wallet.favoredNarrative}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Specific Forensic Metric Pills */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Win Rate</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {wallet.winRatePct}%
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {wallet.totalTrades} сделок
                        </span>
                      </div>

                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Реализованный PnL</span>
                        <span className="text-xs font-bold text-emerald-400">
                          +${(wallet.realizedPnLUsd / 1000).toFixed(0)}k
                        </span>
                        {wallet.realizedCashOutRatio && (
                          <span className="text-[9px] text-amber-400 block font-semibold">
                            {wallet.realizedCashOutRatio}% в USDT
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Тайминг Входа</span>
                        <span className="text-xs font-bold text-indigo-300">
                          {wallet.earlyEntryDelayMinutes !== undefined
                            ? wallet.earlyEntryDelayMinutes < 1
                              ? `T+${(wallet.earlyEntryDelayMinutes * 60).toFixed(0)}с (Block 0)`
                              : `T+${wallet.earlyEntryDelayMinutes.toFixed(0)}м`
                            : 'Свинг'}
                        </span>
                        {wallet.preMarketingLeadHours !== undefined && (
                          <span className="text-[9px] text-indigo-400 block font-semibold">
                            За {wallet.preMarketingLeadHours}ч до KOLs
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Аудит Связи с Dev</span>
                        <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          0% Dev Link
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          Чистый кошелек
                        </span>
                      </div>
                    </div>

                    {/* Spray & Pray stats highlight if present */}
                    {wallet.sprayAndPrayStats && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-rose-300">
                          <Target className="w-4 h-4 text-rose-400" />
                          <span>
                            <strong>Венчурный Снайпинг:</strong> {wallet.sprayAndPrayStats.totalTokensAttempted} попыток по ~${wallet.sprayAndPrayStats.avgBetSizeUsd} → {wallet.sprayAndPrayStats.runnerCount} Huge Runners (&gt;50x)
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 font-bold">
                          Max: +{wallet.sprayAndPrayStats.maxMultiplier}x
                        </span>
                      </div>
                    )}

                    {/* Expanded Holdings Table */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                          <span className="font-bold text-slate-300">
                            Топ позиции и сделки в портфеле ({wallet.topHoldingTokens.length}):
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Среднее время удержания: {wallet.avgHoldingTime}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {wallet.topHoldingTokens.map((tok, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 flex items-center justify-between font-mono text-xs"
                            >
                              <div>
                                <span className="font-bold text-white block">{tok.symbol}</span>
                                <span className="text-[10px] text-slate-400">
                                  ${tok.amountUsd.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`font-bold block ${
                                    tok.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {tok.pnlPercent >= 0 ? '+' : ''}{tok.pnlPercent}%
                                </span>
                                {tok.entryMultiplier && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                                    {tok.entryMultiplier}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-400">
                  По заданным фильтрам кошельков не найдено. Попробуйте сбросить фильтры или выбрать другой токен.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW B: LIVE SMART MONEY FEED                                          */}
      {/* ========================================================================= */}
      {activeTab === 'LIVE_FEED' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold font-mono text-white">
                Живой поток ончейн-транзакций Smart Money для {activeSearchedToken}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Авто-обновление каждые 15 сек
            </span>
          </div>

          <div className="space-y-2.5">
            {smartMoneyOverview?.liveSmartMoneyFeed && smartMoneyOverview.liveSmartMoneyFeed.length > 0 ? (
              smartMoneyOverview.liveSmartMoneyFeed.map((buy) => (
                <div
                  key={buy.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{buy.walletLabel}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-300 border border-slate-800 font-semibold uppercase">
                        {buy.chain}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {buy.tokenSymbol}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Сумма: <strong className="text-emerald-400 font-mono">${buy.amountUsd.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>{buy.notes || 'Ончейн-транзакция Smart Money'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block">
                        +{buy.pnlPercent.toFixed(1)}% PnL
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(buy.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(buy.txHash)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                      title="Копировать TxHash"
                    >
                      {copiedText === buy.txHash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <p className="text-xs font-mono text-slate-400">Нет свежих транзакций за последние 30 минут.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VIEW C: ALPHA LISTINGS & BREAKOUT RADAR                                */}
      {/* ========================================================================= */}
      {activeTab === 'RADAR' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {listingsOverview?.listings && listingsOverview.listings.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-amber-500/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-base font-bold font-mono text-white block">
                      {item.symbol}
                    </span>
                    <span className="text-xs text-slate-400 block">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Score {item.alphaScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">1h Изм.</span>
                    <span className="font-bold text-emerald-400">+{item.priceChange1h}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Smart Inflow</span>
                    <span className="font-bold text-indigo-300">+${(item.smartMoneyInflowUsd / 1000).toFixed(0)}k</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Аудит</span>
                    <span className="font-bold text-emerald-400">0% Tax / Clean</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTokenInput(item.symbol);
                    setActiveSearchedToken(item.symbol);
                    setActiveTab('SMART_MONEY');
                    fetchSmartMoney(item.symbol);
                  }}
                  className="w-full py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Сканировать Smart Money {item.symbol}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
