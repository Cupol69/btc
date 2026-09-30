import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Filter,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Droplet,
  Flame,
  Clock,
  Info,
  Award,
  AlertTriangle,
  ChevronRight,
  Copy,
  Check,
  Lock,
  Unlock,
  Send,
  Plus,
  RefreshCw,
  ArrowLeftRight,
  Trash2
} from 'lucide-react';

import { INITIAL_PIPELINE_TOKENS, FunnelStage, MemeTokenCandidate } from '../data/memePipelineTokens';
import { MexcGlobalLiveScreener } from './MexcGlobalLiveScreener';
import { PipelineCard } from './PipelineCard';
export type { FunnelStage, MemeTokenCandidate };

interface Props {
  onOpenAuditForToken?: (contract: string, chain?: string, symbol?: string) => void;
  onSendToTerminal?: (symbol: string) => void;
}

const STORAGE_KEY = 'mexc_bsc_funnel_board_v6';

export type BasketCategory = 'ALL' | 'BASKET_1_DELTA_SNIPER' | 'BASKET_2_SECTOR_ALPHA' | 'BASKET_3_CEX_INSTITUTIONAL';

export const getCandidateBasket = (c: MemeTokenCandidate): 'BASKET_1_DELTA_SNIPER' | 'BASKET_2_SECTOR_ALPHA' | 'BASKET_3_CEX_INSTITUTIONAL' => {
  // Basket 3: CEX Institutional / Tier-1 Global / FDV >= $100M or TVL >= $2M
  if (
    (c.fdvUsd && c.fdvUsd >= 100_000_000) ||
    (c.dexLiquidityUsd && c.dexLiquidityUsd >= 2_000_000) ||
    (c.category && (c.category.toLowerCase().includes('tier-1') || c.category.toLowerCase().includes('global') || c.category.toLowerCase().includes('top-100')))
  ) {
    return 'BASKET_3_CEX_INSTITUTIONAL';
  }
  // Basket 2: Sector Alpha / AI-memes / bStocks / Mid-caps (FDV >= $5M or TVL >= $100k or bStocks/stock/AI category)
  if (
    (c.fdvUsd && c.fdvUsd >= 5_000_000) ||
    (c.dexLiquidityUsd && c.dexLiquidityUsd >= 100_000) ||
    (c.category && (c.category.toLowerCase().includes('stock') || c.category.toLowerCase().includes('ai') || c.category.toLowerCase().includes('alpha')))
  ) {
    return 'BASKET_2_SECTOR_ALPHA';
  }
  // Basket 1: Delta Sniper / Microcaps (< $5M FDV, fresh tokens, micro-pools)
  return 'BASKET_1_DELTA_SNIPER';
};

const STAGE_TITLES: Record<FunnelStage, string> = {
  STAGE_1_PRESCREEN: '1. Экспресс-отбор',
  STAGE_2_DEEP_AUDIT: '2. Глубокий ончейн',
  STAGE_3_FINAL_VERIFIED: '3. Финал / Одобрено',
  REJECTED: 'Отсеяны'
};

export const MemeFilterRadar: React.FC<Props> = ({ onOpenAuditForToken, onSendToTerminal }) => {
  const [radarSubTab, setRadarSubTab] = useState<'MEXC_LIVE_SCREENER' | 'PIPELINE_FUNNEL'>('MEXC_LIVE_SCREENER');
  const [selectedBasket, setSelectedBasket] = useState<BasketCategory>('ALL');

  // Local storage persisted state for candidates
  const [candidates, setCandidates] = useState<MemeTokenCandidate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Validate and sanitize every stored item
          const valid = parsed.filter(
            (c): c is MemeTokenCandidate => Boolean(c && typeof c === 'object' && (c.name || c.symbol) && c.contract)
          ).map((c) => ({
            ...c,
            name: c.name || c.symbol || 'Unknown Token',
            symbol: c.symbol || c.name || 'UNKNOWN',
            contract: c.contract || '',
            chain: c.chain || 'bsc',
            stage: c.stage || 'STAGE_1_PRESCREEN',
          }));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved candidates', e);
    }
    return INITIAL_PIPELINE_TOKENS;
  });

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.error('Failed to save candidates', e);
    }
  }, [candidates]);

  const [activeStageFilter, setActiveStageFilter] = useState<'ALL' | FunnelStage>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [customInputContract, setCustomInputContract] = useState('');
  const [customInputSymbol, setCustomInputSymbol] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [checkingPoolTokenId, setCheckingPoolTokenId] = useState<string | null>(null);

  // Toast notification system
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(prev => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(text);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  // Set of lowercase contract addresses for screener badge
  const pipelineContracts = useMemo(() => {
    return new Set(candidates.map(c => c.contract.toLowerCase()));
  }, [candidates]);

  // Stage transition handler with ZERO LIQUIDITY RESTRICTION
  const handlePromoteStage = useCallback((tokenId: string, targetStage: FunnelStage, customNote?: string) => {
    const candidate = candidates.find(c => c.id === tokenId);
    if (!candidate) return;

    // RULE OF ZERO LIQUIDITY:
    // "за исключением совсем без пулов и ликвидности"
    const isZeroLiquidity = !candidate.dexPoolFound || candidate.dexLiquidityUsd === 0 || candidate.dexLiquidityUsd < 1000;

    if (isZeroLiquidity && targetStage !== 'REJECTED') {
      showToast(
        'error',
        `🚫 БЛОКИРОВКА ПЕРЕНОСА: У токена «${candidate.symbol}» отсутствует подтверждённый пул на DEX ($0 TVL). Вход на $11 невозможен! Перемещение в активные колонки строго запрещено.`
      );
      return;
    }

    setCandidates(prev =>
      prev.map(c => {
        if (c.id !== tokenId) return c;
        return {
          ...c,
          stage: targetStage,
          deepAuditVerdict:
            targetStage === 'STAGE_3_FINAL_VERIFIED'
              ? c.deepAuditVerdict || `Переведён в Финал трейдером: подтверждён пул $${(c.dexLiquidityUsd / 1000).toFixed(1)}k, импакт $11 = ${c.impact11Usd.toFixed(4)}%.`
              : c.deepAuditVerdict,
          rejectionReason:
            targetStage === 'REJECTED'
              ? customNote || c.rejectionReason || 'Ручной отсев трейдера'
              : undefined,
          timestamp: 'Перемещено вручную'
        };
      })
    );

    showToast('success', `✓ Токен «${candidate.symbol}» перемещён в колонку «${STAGE_TITLES[targetStage]}»`);
  }, [candidates, showToast]);

  // Real-time on-demand DEX pool check for zero-liquidity tokens
  const handleCheckLiveDexPool = useCallback(async (tokenId: string) => {
    const candidate = candidates.find(c => c.id === tokenId);
    if (!candidate) return;

    setCheckingPoolTokenId(tokenId);
    showToast('info', `Проверка ончейн-пулов DEX для «${candidate.symbol}» (${candidate.contract.slice(0, 10)}...)...`);

    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${candidate.contract}`);
      const data = await res.json();
      const allPairs = data.pairs || [];
      // 1. Prefer BSC if exists, otherwise fallback to any EVM / native chain pair sorted by highest TVL
      const bscPairs = allPairs
        .filter((pair: any) => pair.chainId === 'bsc')
        .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      
      const targetPairs = bscPairs.length > 0 
        ? bscPairs 
        : allPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        
      const p = targetPairs[0];

      if (!p || (p.liquidity?.usd || 0) < 1000) {
        showToast(
          'error',
          `⛔ Пул всё ещё отсутствует ($0 TVL). Актив «${candidate.symbol}» остаётся заблокирован в Отсеве.`
        );
      } else {
        const detectedChain = p.chainId || 'bsc';
        const totalTvl = targetPairs.reduce((acc: number, pair: any) => acc + (pair.liquidity?.usd || 0), 0);
        const liq = totalTvl > 0 ? totalTvl : (p.liquidity?.usd || 0);
        const vol = targetPairs.reduce((acc: number, pair: any) => acc + (pair.volume?.h24 || 0), 0);
        const buys = targetPairs.reduce((acc: number, pair: any) => acc + (pair.txns?.h24?.buys || 0), 0);
        const sells = targetPairs.reduce((acc: number, pair: any) => acc + (pair.txns?.h24?.sells || 0), 0);
        const total = buys + sells;
        const buyPct = total > 0 ? (buys / total) * 100 : 50;
        const fdv = p.fdv || 0;
        const mult = liq > 0 ? fdv / liq : 0;
        const impact = liq > 0 ? (11 / liq) * 100 : 0;

        const collectedPools = targetPairs.slice(0, 4).map((bp: any) => ({
          dexId: bp.dexId || 'dex',
          pairAddress: bp.pairAddress,
          quoteSymbol: bp.quoteToken?.symbol || 'USDT',
          liquidityUsd: bp.liquidity?.usd || 0,
          volume24hUsd: bp.volume?.h24 || 0,
          priceUsd: parseFloat(bp.priceUsd) || 0
        }));

        setCandidates(prev =>
          prev.map(c => {
            if (c.id !== tokenId) return c;
            return {
              ...c,
              chain: detectedChain,
              dexPoolFound: true,
              dexLiquidityUsd: liq,
              volume24hUsd: vol,
              txns24h: total,
              buyPercent: parseFloat(buyPct.toFixed(1)),
              priceUsd: parseFloat(p.priceUsd) || c.priceUsd,
              priceChange24h: p.priceChange?.h24 || 0,
              fdvUsd: fdv,
              multiplierFdvTvl: parseFloat(mult.toFixed(1)),
              impact11Usd: parseFloat(impact.toFixed(5)),
              poolPairs: collectedPools.length > 0 ? collectedPools : c.poolPairs,
              rejectionReason: `Пул найден в сети ${detectedChain.toUpperCase()} ($${(liq / 1000).toFixed(1)}k TVL). Токен разблокирован для перемещения в воронку!`,
              timestamp: 'Ончейн обновлен'
            };
          })
        );

        showToast(
          'success',
          `🎉 ОБНАРУЖЕН ПУЛ (${detectedChain.toUpperCase()})! Ликвидность: $${(liq / 1000).toFixed(1)}k TVL. Токен «${candidate.symbol}» РАЗБЛОКИРОВАН!`
        );
      }
    } catch (err) {
      showToast('error', `Ошибка сети при проверке DexScreener для «${candidate.symbol}». Попробуйте ещё раз.`);
    } finally {
      setCheckingPoolTokenId(null);
    }
  }, [candidates, showToast]);

  // Add from MEXC Live Screener to Pipeline
  const handleAddFromScreener = useCallback(async (item: {
    symbol: string;
    baseAsset: string;
    contractAddress: string;
    price: number;
    name?: string;
  }) => {
    const existing = candidates.find(
      c => c.contract.toLowerCase() === item.contractAddress.toLowerCase()
    );
    if (existing) {
      showToast(
        'info',
        `Токен «${item.baseAsset}» уже находится в воронке (Колонка: «${STAGE_TITLES[existing.stage]}»)`
      );
      return;
    }

    showToast('info', `Запрос ончейн данных DEX для «${item.baseAsset}» (${item.contractAddress.slice(0, 8)}...)...`);

    const tempId = `mexc-${item.baseAsset.toLowerCase()}-${Date.now()}`;
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${item.contractAddress}`);
      const data = await res.json();
      const allPairs = data.pairs || [];
      const bscPairs = allPairs
        .filter((p: any) => p.chainId === 'bsc')
        .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      
      const targetPairs = bscPairs.length > 0 
        ? bscPairs 
        : allPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        
      const p = targetPairs[0] || null;

      let newCandidate: MemeTokenCandidate;
      if (!p || (p.liquidity?.usd || 0) < 1000) {
        newCandidate = {
          id: tempId,
          name: item.name || item.baseAsset,
          symbol: item.baseAsset,
          contract: item.contractAddress,
          chain: 'bsc',
          category: 'MEXC Live Import',
          stage: 'REJECTED',
          rejectionReason: !p
            ? 'Добавлен из MEXC: пул на DEX не найден ($0 TVL). Заблокирован.'
            : 'Критически низкая ликвидность пула (< $1,000 TVL)',
          dexPoolFound: false,
          dexLiquidityUsd: p?.liquidity?.usd || 0,
          volume24hUsd: p?.volume?.h24 || 0,
          txns24h: 0,
          buyPercent: 0,
          priceUsd: item.price || 0,
          priceChange24h: 0,
          fdvUsd: 0,
          multiplierFdvTvl: 0,
          impact11Usd: 100,
          timestamp: 'Импорт MEXC'
        };
      } else {
        const detectedChain = p.chainId || 'bsc';
        const collectedPools = targetPairs.slice(0, 5).map((bp: any) => ({
          dexId: bp.dexId || 'dex',
          pairAddress: bp.pairAddress,
          quoteSymbol: bp.quoteToken?.symbol || 'USDT',
          liquidityUsd: bp.liquidity?.usd || 0,
          volume24hUsd: bp.volume?.h24 || 0,
          priceUsd: parseFloat(bp.priceUsd) || 0
        }));

        // Calculate aggregated TVL across all pools
        const totalTvl = targetPairs.reduce((acc: number, bp: any) => acc + (bp.liquidity?.usd || 0), 0);
        const liq = totalTvl > 0 ? totalTvl : (p.liquidity?.usd || 0);
        const vol = targetPairs.reduce((acc: number, bp: any) => acc + (bp.volume?.h24 || 0), 0);
        const buys = targetPairs.reduce((acc: number, bp: any) => acc + (bp.txns?.h24?.buys || 0), 0);
        const sells = targetPairs.reduce((acc: number, bp: any) => acc + (bp.txns?.h24?.sells || 0), 0);
        const total = buys + sells;
        const buyPct = total > 0 ? (buys / total) * 100 : 50;
        const fdv = p.fdv || 0;
        const mult = liq > 0 ? fdv / liq : 0;
        const impact = liq > 0 ? (11 / liq) * 100 : 0;

        let initialStage: FunnelStage = 'STAGE_1_PRESCREEN';
        if (liq >= 120000 && vol >= 100000 && buyPct >= 50) {
          initialStage = 'STAGE_3_FINAL_VERIFIED';
        } else if (liq >= 25000) {
          initialStage = 'STAGE_2_DEEP_AUDIT';
        }

        newCandidate = {
          id: tempId,
          name: p.baseToken?.name || item.name || item.baseAsset,
          symbol: p.baseToken?.symbol || item.baseAsset,
          contract: p.baseToken?.address || item.contractAddress,
          chain: detectedChain,
          category: 'MEXC Live Import',
          stage: initialStage,
          passHighlight: `Импорт из MEXC (${detectedChain.toUpperCase()}): TVL $${(liq / 1000).toFixed(1)}k (${collectedPools.length > 1 ? `${collectedPools.length} пула` : p.dexId}), 24h Vol $${(vol / 1000).toFixed(1)}k`,
          deepAuditVerdict:
            initialStage === 'STAGE_3_FINAL_VERIFIED'
              ? `Подтверждён пул PancakeSwap $${(liq / 1000).toFixed(1)}k (${collectedPools.length} пула), минимальный импакт ${impact.toFixed(4)}%. Готов к сделке.`
              : undefined,
          dexPoolFound: true,
          dexLiquidityUsd: liq,
          volume24hUsd: vol,
          txns24h: total,
          buyPercent: parseFloat(buyPct.toFixed(1)),
          priceUsd: parseFloat(p.priceUsd) || item.price || 0,
          priceChange24h: p.priceChange?.h24 || 0,
          priceChange1h: p.priceChange?.h1 || 0,
          fdvUsd: fdv,
          multiplierFdvTvl: parseFloat(mult.toFixed(1)),
          impact11Usd: parseFloat(impact.toFixed(5)),
          poolPairs: collectedPools.length > 0 ? collectedPools : undefined,
          finalScore: initialStage === 'STAGE_3_FINAL_VERIFIED' ? 88 : 76,
          manipulationRisk: liq > 100000 ? 'LOW' : 'MEDIUM',
          timestamp: 'Импорт MEXC'
        };
      }

      setCandidates(prev => [newCandidate, ...prev]);
      showToast(
        'success',
        `✓ Токен «${item.baseAsset}» добавлен в воронку! Колонка: «${STAGE_TITLES[newCandidate.stage]}»`
      );
    } catch (err) {
      showToast('error', `Ошибка при запросе DEX для «${item.baseAsset}»`);
    }
  }, [candidates, showToast]);

  // Basket distribution counts
  const basketCounts = useMemo(() => {
    return {
      ALL: candidates.length,
      BASKET_1_DELTA_SNIPER: candidates.filter(c => getCandidateBasket(c) === 'BASKET_1_DELTA_SNIPER').length,
      BASKET_2_SECTOR_ALPHA: candidates.filter(c => getCandidateBasket(c) === 'BASKET_2_SECTOR_ALPHA').length,
      BASKET_3_CEX_INSTITUTIONAL: candidates.filter(c => getCandidateBasket(c) === 'BASKET_3_CEX_INSTITUTIONAL').length,
    };
  }, [candidates]);

  // Filtered lists (strictly BSC & 3-Basket Asset Routing)
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (!c) return false;
      const matchBasket = selectedBasket === 'ALL' || getCandidateBasket(c) === selectedBasket;
      const matchStage = activeStageFilter === 'ALL' || c.stage === activeStageFilter;
      const searchTarget = searchTerm.trim().toLowerCase();
      const matchSearch =
        searchTarget === '' ||
        (c.symbol || '').toLowerCase().includes(searchTarget) ||
        (c.name || '').toLowerCase().includes(searchTarget) ||
        (c.contract || '').toLowerCase().includes(searchTarget);
      return matchBasket && matchStage && matchSearch;
    });
  }, [candidates, selectedBasket, activeStageFilter, searchTerm]);

  // Stage columns
  const stage1List = useMemo(() => filteredCandidates.filter(c => c.stage === 'STAGE_1_PRESCREEN'), [filteredCandidates]);
  const stage2List = useMemo(() => filteredCandidates.filter(c => c.stage === 'STAGE_2_DEEP_AUDIT'), [filteredCandidates]);
  const stage3List = useMemo(() => filteredCandidates.filter(c => c.stage === 'STAGE_3_FINAL_VERIFIED'), [filteredCandidates]);
  const rejectedList = useMemo(() => filteredCandidates.filter(c => c.stage === 'REJECTED'), [filteredCandidates]);

  const [isAutoAuditingAll, setIsAutoAuditingAll] = useState(false);
  const [autoAuditProgress, setAutoAuditProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // Dynamic automatic re-evaluation engine across all 4 stages
  const runFullAutoPipelineScan = async () => {
    if (isAutoAuditingAll) return;
    setIsAutoAuditingAll(true);

    const updatedCandidates = [...candidates];
    const total = updatedCandidates.length;

    for (let i = 0; i < total; i++) {
      const item = updatedCandidates[i];
      if (!item) continue;
      setAutoAuditProgress({ current: i + 1, total, name: item.symbol || item.name || 'Unknown' });

      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${item.contract}`);
        const data = await res.json();
        const allPairs = data.pairs || [];
        const bscPairs = allPairs
          .filter((pair: any) => pair.chainId === 'bsc')
          .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const p = bscPairs[0] || (allPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null);

        if (!p || (p.liquidity?.usd || 0) < 5000) {
          if (item.stage !== 'REJECTED') {
            updatedCandidates[i] = {
              ...item,
              stage: 'REJECTED',
              rejectionReason: !p ? 'Пул на DEX отозван или не найден ($0 TVL)' : 'Критически низкий пул (< $5k TVL)',
              dexPoolFound: !!p,
              dexLiquidityUsd: p?.liquidity?.usd || 0,
              timestamp: 'Авто-скан'
            };
          }
        } else {
          const liq = p.liquidity?.usd || 0;
          const vol = p.volume?.h24 || 0;
          const vol1 = p.volume?.h1 || 0;
          const buys = p.txns?.h24?.buys || 0;
          const sells = p.txns?.h24?.sells || 0;
          const totalTx = buys + sells;
          const buyPct = totalTx > 0 ? (buys / totalTx) * 100 : 50;
          const buys1 = p.txns?.h1?.buys || 0;
          const sells1 = p.txns?.h1?.sells || 0;
          const totalTx1 = buys1 + sells1;
          const buyPct1 = totalTx1 > 0 ? (buys1 / totalTx1) * 100 : 50;
          const fdv = p.fdv || 0;
          const mult = liq > 0 ? fdv / liq : 0;
          const impact = liq > 0 ? (11 / liq) * 100 : 0;
          const price = parseFloat(p.priceUsd) || 0;
          const priceChange24h = p.priceChange?.h24 || 0;
          const priceChange1h = p.priceChange?.h1 || 0;

          let nextStage: FunnelStage = item.stage;
          let verdict = item.deepAuditVerdict;
          let reason = item.rejectionReason;

          if (liq < 15000 || (buyPct1 < 30 && totalTx1 > 10) || (buyPct < 38 && totalTx > 50)) {
            nextStage = 'REJECTED';
            reason = `Авто-отсев: агрессивные продажи (1h Buys ${buyPct1.toFixed(1)}%, 24h Buys ${buyPct.toFixed(1)}%) или сжатие пула ($${(liq / 1000).toFixed(1)}k)`;
          } else if (item.stage === 'REJECTED' && liq >= 40000 && vol >= 20000 && buyPct >= 45) {
            nextStage = 'STAGE_1_PRESCREEN';
            reason = undefined;
            verdict = 'Токен ожил: пул восстановлен, начались органические покупки.';
          } else if (liq >= 120000 && vol >= 150000 && buyPct >= 52 && (buyPct1 >= 50 || vol1 > 5000)) {
            nextStage = 'STAGE_3_FINAL_VERIFIED';
            verdict = `ПРОШЁЛ В ФИНАЛ: Пул $${(liq / 1000).toFixed(1)}k, 24h Vol $${(vol / 1000).toFixed(1)}k, 1h Buys ${buyPct1.toFixed(1)}%, импакт $11 = ${impact.toFixed(4)}%.`;
            reason = undefined;
          } else if (liq >= 25000 && (vol >= 5000 || totalTx >= 50)) {
            if (item.stage === 'STAGE_1_PRESCREEN') {
              nextStage = 'STAGE_2_DEEP_AUDIT';
              verdict = `Поднят на глубокий аудит: TVL $${(liq / 1000).toFixed(1)}k, ${totalTx} сделок, ${buyPct.toFixed(1)}% покупок.`;
            }
          }

          updatedCandidates[i] = {
            ...item,
            stage: nextStage,
            dexPoolFound: true,
            dexLiquidityUsd: liq,
            volume24hUsd: vol,
            txns24h: totalTx,
            buyPercent: parseFloat(buyPct.toFixed(1)),
            priceUsd: price,
            priceChange24h,
            priceChange1h,
            fdvUsd: fdv,
            multiplierFdvTvl: parseFloat(mult.toFixed(1)),
            impact11Usd: parseFloat(impact.toFixed(5)),
            deepAuditVerdict: verdict,
            rejectionReason: reason,
            passHighlight: `Пул $${(liq / 1000).toFixed(1)}k, Vol $${(vol / 1000).toFixed(1)}k, 1h Buys ${buyPct1.toFixed(1)}%`,
            timestamp: 'Авто-обновлено'
          };
        }
      } catch (err) {
        console.error('Audit failed for', item.contract, err);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    setCandidates(updatedCandidates);
    setIsAutoAuditingAll(false);
    setAutoAuditProgress(null);
    showToast('success', `Авто-прогон воронки завершён: проверено ${total} активов на PancakeSwap.`);
  };

  // Quick manual add by contract
  const handleQuickAddAndScan = async () => {
    const inputVal = customInputContract.trim();
    if (!inputVal) return;

    setIsSubmittingCustom(true);
    const tempId = `custom-bsc-${Date.now()}`;
    const newCand: MemeTokenCandidate = {
      id: tempId,
      name: customInputSymbol || inputVal.slice(0, 8),
      symbol: customInputSymbol || 'MEME',
      contract: inputVal,
      chain: 'bsc',
      category: 'PancakeSwap Custom',
      stage: 'STAGE_1_PRESCREEN',
      passHighlight: 'В очереди на ончейн-аудит...',
      dexPoolFound: false,
      dexLiquidityUsd: 0,
      volume24hUsd: 0,
      txns24h: 0,
      buyPercent: 0,
      priceUsd: 0,
      priceChange24h: 0,
      fdvUsd: 0,
      multiplierFdvTvl: 0,
      impact11Usd: 0,
      timestamp: 'Только что'
    };

    setCandidates(prev => [newCand, ...prev]);

    try {
      const isEvm = inputVal.startsWith('0x') && inputVal.length === 42;
      let url = isEvm
        ? `https://api.dexscreener.com/latest/dex/tokens/${inputVal}`
        : `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(inputVal)}`;

      const res = await fetch(url);
      const data = await res.json();
      const allPairs = data.pairs || [];

      let p = null;
      let targetContract = inputVal;

      if (isEvm) {
        const bscPairs = allPairs
          .filter((pair: any) => pair.chainId === 'bsc')
          .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        p = bscPairs[0] || allPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null;
        if (p?.baseToken?.address) targetContract = p.baseToken.address;
      } else {
        const bscPairs = allPairs
          .filter((pair: any) => pair.chainId === 'bsc')
          .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        p = bscPairs[0] || allPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null;
        if (p?.baseToken?.address) targetContract = p.baseToken.address;
      }

      if (!p || (p.liquidity?.usd || 0) < 1000) {
        setCandidates(prev =>
          prev.map(item =>
            item.id === newCand.id
              ? {
                  ...item,
                  contract: targetContract,
                  stage: 'REJECTED',
                  rejectionReason: !p
                    ? `Пул на DEX для «${inputVal}» не найден ($0 TVL). Заблокирован.`
                    : `Критически низкая ликвидность пула (< $1,000 TVL: всего $${Math.round(p.liquidity?.usd || 0)})`,
                  dexPoolFound: false,
                  dexLiquidityUsd: p?.liquidity?.usd || 0
                }
              : item
          )
        );
        showToast('error', `Токен «${inputVal}» добавлен в Отсев: нет пула на DEX ($0 TVL).`);
      } else {
        const detectedChain = p.chainId || 'bsc';
        const targetPairs = allPairs
          .filter((pair: any) => pair.chainId === detectedChain)
          .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const totalTvl = targetPairs.reduce((acc: number, bp: any) => acc + (bp.liquidity?.usd || 0), 0);
        const liq = totalTvl > 0 ? totalTvl : (p.liquidity?.usd || 0);
        const vol = targetPairs.reduce((acc: number, bp: any) => acc + (bp.volume?.h24 || 0), 0);
        const buys = targetPairs.reduce((acc: number, bp: any) => acc + (bp.txns?.h24?.buys || 0), 0);
        const sells = targetPairs.reduce((acc: number, bp: any) => acc + (bp.txns?.h24?.sells || 0), 0);
        const total = buys + sells;
        const buyPct = total > 0 ? (buys / total) * 100 : 50;
        const fdv = p.fdv || 0;
        const mult = liq > 0 ? fdv / liq : 0;
        const impact = liq > 0 ? (11 / liq) * 100 : 0;

        let decidedStage: FunnelStage = 'STAGE_1_PRESCREEN';
        if (vol >= 500000 && liq >= 150000 && buyPct >= 52) {
          decidedStage = 'STAGE_3_FINAL_VERIFIED';
        } else if (vol >= 50000 && liq >= 50000) {
          decidedStage = 'STAGE_2_DEEP_AUDIT';
        } else if (vol < 5000 || liq < 15000 || buyPct < 40) {
          decidedStage = 'REJECTED';
        }

        const collectedPools = targetPairs
          .slice(0, 4)
          .map((bp: any) => ({
            dexId: bp.dexId || 'dex',
            pairAddress: bp.pairAddress,
            quoteSymbol: bp.quoteToken?.symbol || 'BNB',
            liquidityUsd: bp.liquidity?.usd || 0,
            volume24hUsd: bp.volume?.h24 || 0,
            priceUsd: parseFloat(bp.priceUsd) || 0
          }));

        setCandidates(prev =>
          prev.map(item =>
            item.id === newCand.id
              ? {
                  ...item,
                  name: p.baseToken?.name || item.name,
                  symbol: p.baseToken?.symbol || item.symbol,
                  contract: p.baseToken?.address || targetContract,
                  chain: detectedChain,
                  stage: decidedStage,
                  passHighlight: `Найден пул [${detectedChain.toUpperCase()}] $${(liq / 1000).toFixed(1)}k TVL (${collectedPools.length > 1 ? `${collectedPools.length} пула` : p.dexId}), 24h Vol $${(vol / 1000).toFixed(1)}k`,
                  deepAuditVerdict:
                    decidedStage === 'STAGE_3_FINAL_VERIFIED'
                      ? `Живой пул (${detectedChain.toUpperCase()}) $${(liq / 1000).toFixed(1)}k, высокий оборот $${(vol / 1000).toFixed(1)}k, импакт ${impact.toFixed(4)}%. Допущен в финал.`
                      : undefined,
                  rejectionReason:
                    decidedStage === 'REJECTED'
                      ? `Слабый суточный объём ($${(vol / 1000).toFixed(1)}k) или преобладание продаж (${(100 - buyPct).toFixed(1)}% sells)`
                      : undefined,
                  dexPoolFound: true,
                  dexLiquidityUsd: liq,
                  volume24hUsd: vol,
                  txns24h: total,
                  buyPercent: parseFloat(buyPct.toFixed(1)),
                  priceUsd: parseFloat(p.priceUsd) || 0,
                  priceChange24h: p.priceChange?.h24 || 0,
                  priceChange1h: p.priceChange?.h1 || 0,
                  fdvUsd: fdv,
                  multiplierFdvTvl: parseFloat(mult.toFixed(1)),
                  impact11Usd: parseFloat(impact.toFixed(5)),
                  poolPairs: collectedPools.length > 0 ? collectedPools : undefined,
                  finalScore: decidedStage === 'STAGE_3_FINAL_VERIFIED' ? 85 : 75,
                  manipulationRisk: 'LOW'
                }
              : item
          )
        );
        showToast('success', `Токен «${p.baseToken?.symbol || inputVal}» (${detectedChain.toUpperCase()}) добавлен в «${STAGE_TITLES[decidedStage]}»`);
      }
    } catch (e) {
      setCandidates(prev =>
        prev.map(item =>
          item.id === newCand.id
            ? { ...item, stage: 'REJECTED', rejectionReason: 'Ошибка связи с ончейн-нодой DEX' }
            : item
        )
      );
      showToast('error', `Ошибка проверки DEX для «${inputVal}»`);
    } finally {
      setIsSubmittingCustom(false);
      setCustomInputContract('');
      setCustomInputSymbol('');
    }
  };

  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // Fast live refresh of prices, liquidity, and 24h volume for all tokens in pipeline without altering stages
  const handleRefreshAllPrices = async () => {
    if (isUpdatingPrices || candidates.length === 0) return;
    setIsUpdatingPrices(true);
    showToast('info', 'Обновление актуальных котировок и пулов со смарт-контрактов PancakeSwap...');

    try {
      // DexScreener supports querying up to 30 tokens in comma-separated query: /tokens/addr1,addr2,...
      const uniqueContracts = Array.from(new Set(candidates.map(c => c.contract.toLowerCase())));
      const chunkSize = 25;
      const priceMap = new Map<string, any>();
      const allPoolsMap = new Map<string, any[]>();

      for (let i = 0; i < uniqueContracts.length; i += chunkSize) {
        const chunk = uniqueContracts.slice(i, i + chunkSize);
        try {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(',')}`);
          const data = await res.json();
          const pairs = data.pairs || [];
          for (const p of pairs) {
            const baseAddr = p.baseToken?.address?.toLowerCase();
            if (!baseAddr) continue;
            
            // Collect pools
            if ((p.liquidity?.usd || 0) >= 500) {
              const list = allPoolsMap.get(baseAddr) || [];
              list.push({
                dexId: p.dexId || 'dex',
                pairAddress: p.pairAddress,
                quoteSymbol: p.quoteToken?.symbol || 'USDT',
                liquidityUsd: p.liquidity?.usd || 0,
                volume24hUsd: p.volume?.h24 || 0,
                priceUsd: parseFloat(p.priceUsd) || 0
              });
              allPoolsMap.set(baseAddr, list);
            }

            const existing = priceMap.get(baseAddr);
            const currentLiq = p.liquidity?.usd || 0;
            if (!existing || currentLiq > (existing.liquidity?.usd || 0)) {
              priceMap.set(baseAddr, p);
            }
          }
        } catch (e) {
          console.error('Failed chunk price update', e);
        }
      }

      setCandidates(prev =>
        prev.map(c => {
          const addr = c.contract.toLowerCase();
          const p = priceMap.get(addr);
          if (!p) return c;
          const liq = p.liquidity?.usd || 0;
          const vol = p.volume?.h24 || 0;
          const price = parseFloat(p.priceUsd) || c.priceUsd;
          const fdv = p.fdv || c.fdvUsd;
          const mult = liq > 0 ? fdv / liq : c.multiplierFdvTvl;
          const impact = liq > 0 ? (11 / liq) * 100 : c.impact11Usd;
          const buys = p.txns?.h24?.buys || 0;
          const sells = p.txns?.h24?.sells || 0;
          const total = buys + sells;
          const buyPct = total > 0 ? (buys / total) * 100 : c.buyPercent;
          const pools = allPoolsMap.get(addr);

          return {
            ...c,
            priceUsd: price,
            priceChange24h: p.priceChange?.h24 ?? c.priceChange24h,
            priceChange1h: p.priceChange?.h1 ?? c.priceChange1h,
            dexLiquidityUsd: liq > 0 ? liq : c.dexLiquidityUsd,
            volume24hUsd: vol > 0 ? vol : c.volume24hUsd,
            dexPoolFound: liq >= 1000 ? true : c.dexPoolFound,
            buyPercent: parseFloat(buyPct.toFixed(1)),
            fdvUsd: fdv,
            multiplierFdvTvl: parseFloat(mult.toFixed(1)),
            impact11Usd: parseFloat(impact.toFixed(5)),
            poolPairs: pools && pools.length > 0 ? pools.sort((a, b) => b.liquidityUsd - a.liquidityUsd).slice(0, 4) : c.poolPairs,
            timestamp: 'Котировки обновлены'
          };
        })
      );

      showToast('success', '✓ Все котировки, пулы и объёмы успешно синхронизированы с DEX!');
    } catch (err) {
      showToast('error', 'Ошибка обновления цен с DEX');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleResetToBaseline = () => {
    if (window.confirm('Сбросить воронку к исходным проверенным 5 токенам (4, LOBSTER, NIULAI, 4STOCK, SIREN)?')) {
      setCandidates(INITIAL_PIPELINE_TOKENS);
      localStorage.removeItem(STORAGE_KEY);
      showToast('info', 'Воронка сброшена к эталонным проверенным токенам.');
    }
  };

  // Delete a single token from the pipeline
  const handleDeleteToken = useCallback((tokenId: string) => {
    const target = candidates.find(c => c.id === tokenId);
    if (!target) return;
    setCandidates(prev => prev.filter(c => c.id !== tokenId));
    showToast('info', `Токен «${target.symbol}» удалён из воронки.`);
  }, [candidates, showToast]);

  // Delete all tokens belonging to a specific column/stage
  const handleDeleteColumnTokens = useCallback((stage: FunnelStage) => {
    const count = candidates.filter(c => c.stage === stage).length;
    if (count === 0) {
      showToast('info', `В колонке «${STAGE_TITLES[stage]}» нет токенов для удаления.`);
      return;
    }
    if (window.confirm(`Удалить все токены (${count} шт.) из колонки «${STAGE_TITLES[stage]}»?`)) {
      setCandidates(prev => prev.filter(c => c.stage !== stage));
      showToast('success', `Удалено ${count} токенов из колонки «${STAGE_TITLES[stage]}».`);
    }
  }, [candidates, showToast]);

  // Clear ALL tokens from the pipeline
  const handleClearAllTokens = useCallback(() => {
    if (candidates.length === 0) {
      showToast('info', 'Воронка уже пуста.');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите полностью очистить ВСЮ воронку (${candidates.length} активов)?`)) {
      setCandidates([]);
      localStorage.removeItem(STORAGE_KEY);
      showToast('info', 'Все токены удалены из воронки.');
    }
  }, [candidates, showToast]);

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-3.5 rounded-xl shadow-2xl border text-xs font-sans flex items-start justify-between gap-3 transition-all animate-bounce duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : 'bg-blue-950/95 border-blue-500/50 text-blue-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
            <span className="leading-snug">{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Super Header Tab Switcher */}
      <div className="flex items-center justify-between gap-3 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setRadarSubTab('MEXC_LIVE_SCREENER')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              radarSubTab === 'MEXC_LIVE_SCREENER'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>MEXC Live-Скринер (1 579+ пар)</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950/80 text-amber-300 text-[10px] font-mono border border-amber-500/30">
              1 Запрос / База
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRadarSubTab('PIPELINE_FUNNEL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              radarSubTab === 'PIPELINE_FUNNEL'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>BSC Воронка Отбора (4 Колонки)</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950/80 text-amber-300 text-[10px] font-mono border border-amber-500/30">
              Перемещение & Отсев
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Динамическая воронка: {candidates.length} токенов в памяти</span>
        </div>
      </div>

      {/* SubTab 1: MEXC Global Live Screener with "+ В Воронку" Hook */}
      {radarSubTab === 'MEXC_LIVE_SCREENER' && (
        <MexcGlobalLiveScreener
          onOpenAuditForToken={onOpenAuditForToken}
          onSendToTerminal={onSendToTerminal}
          onAddToPipeline={handleAddFromScreener}
          pipelineContracts={pipelineContracts}
        />
      )}

      {/* SubTab 2: BSC 4-Stage Pipeline Funnel */}
      {radarSubTab === 'PIPELINE_FUNNEL' && (
        <>
          {/* Top Banner: Pipeline Strategy */}
          <div className="p-4 rounded-xl bg-slate-900/95 border border-amber-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Filter className="w-5 h-5" />
                  </span>
                  <h1 className="text-lg font-bold text-white tracking-wide">
                    4-Колонная Воронка Отбора BSC (PancakeSwap & Four.meme)
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Стратегия $11 / DEX & CEX
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed">
                  Активы могут свободно перемещаться между всеми 4 колонками в зависимости от развития событий. 
                  <strong className="text-rose-300"> Исключение:</strong> токены без пулов и ликвидности (<span className="text-rose-400">$0 TVL</span>) строго заблокированы в колонке «Отсеяны» для защиты депозита $11!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUpdatingPrices || isAutoAuditingAll}
                  onClick={handleRefreshAllPrices}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                  title="Обновить актуальные цены, TVL и объёмы для всех токенов в воронке"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingPrices ? 'Синхронизация...' : 'Обновить цены'}</span>
                </button>
                <button
                  type="button"
                  disabled={isAutoAuditingAll}
                  onClick={runFullAutoPipelineScan}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                    isAutoAuditingAll
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {isAutoAuditingAll ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      <span>Сканирование ({autoAuditProgress?.current}/{autoAuditProgress?.total}: {autoAuditProgress?.name})...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Авто-прогон всей воронки (4 этапа)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClearAllTokens}
                  disabled={candidates.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900/90 border border-rose-600/50 text-rose-300 hover:text-white text-xs flex items-center gap-1.5 transition disabled:opacity-40"
                  title="Полностью очистить все токены из воронки"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Удалить всё</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToBaseline}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
                  title="Сбросить состояние к эталонным 5 токенам"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить</span>
                </button>
              </div>
            </div>

            {/* Live Auto-Scan Progress Bar */}
            {autoAuditProgress && (
              <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-amber-500/40">
                <div className="flex items-center justify-between text-[11px] mb-1 text-slate-300">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    Автоматическая перепроверка пулов и Order Flow: <strong>{autoAuditProgress.name}</strong>
                  </span>
                  <span>
                    {autoAuditProgress.current} из {autoAuditProgress.total} (
                    {Math.round((autoAuditProgress.current / autoAuditProgress.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(autoAuditProgress.current / autoAuditProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Add Custom Token */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">⚡ Добавить токен в воронку:</span>
              <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded font-bold">
                EVM DEX (BSC, Robinhood, Base, ETH)
              </span>
              <input
                type="text"
                placeholder="Контракт (0x...) ИЛИ Тикер (CASHCAT, 4, LOBSTER, NIULAI)"
                value={customInputContract}
                onChange={(e) => setCustomInputContract(e.target.value)}
                className="flex-1 min-w-[280px] bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Тикер (опц.)"
                value={customInputSymbol}
                onChange={(e) => setCustomInputSymbol(e.target.value)}
                className="w-24 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                disabled={isSubmittingCustom || !customInputContract.trim()}
                onClick={handleQuickAddAndScan}
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1"
              >
                {isSubmittingCustom ? <Activity className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                <span>Добавить и Проверить DEX</span>
              </button>
            </div>
          </div>

          {/* ARCHITECTURE OF 3 BASKETS: STRATEGIC ASSET ROUTING BAR */}
          <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Архитектура «3 Корзин» (Asset Routing):
                </span>
                <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
                  Разделение риск-профиля микрокапов, секторного альта и институциональных токенов
                </span>
              </div>

              {/* Counter status */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="text-slate-500">Показано:</span>
                <span className="text-amber-300 font-bold">{filteredCandidates.length}</span>
                <span className="text-slate-500">из {candidates.length}</span>
              </div>
            </div>

            {/* 4 Category Filter Tabs with dynamic counts and badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* ALL */}
              <button
                type="button"
                onClick={() => setSelectedBasket('ALL')}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  selectedBasket === 'ALL'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate">🌐 Все активы</div>
                  <div className="text-[9px] text-slate-500">Сквозной сводный вид</div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedBasket === 'ALL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {basketCounts.ALL}
                </span>
              </button>

              {/* BASKET 1: DELTA SNIPER (< $5M) */}
              <button
                type="button"
                onClick={() => setSelectedBasket('BASKET_1_DELTA_SNIPER')}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  selectedBasket === 'BASKET_1_DELTA_SNIPER'
                    ? 'bg-amber-500/20 border-amber-500/70 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-amber-300 truncate">🎯 Корзина 1: Снайпер</div>
                  <div className="text-[9px] text-slate-500 truncate">&lt; $5M MCap • Защита $11</div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedBasket === 'BASKET_1_DELTA_SNIPER' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {basketCounts.BASKET_1_DELTA_SNIPER}
                </span>
              </button>

              {/* BASKET 2: SECTOR ALPHA ($5M - $100M) */}
              <button
                type="button"
                onClick={() => setSelectedBasket('BASKET_2_SECTOR_ALPHA')}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  selectedBasket === 'BASKET_2_SECTOR_ALPHA'
                    ? 'bg-cyan-500/20 border-cyan-500/70 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-cyan-300 truncate">🚀 Корзина 2: Альфа</div>
                  <div className="text-[9px] text-slate-500 truncate">$5M–$100M • AI & bStocks</div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedBasket === 'BASKET_2_SECTOR_ALPHA' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {basketCounts.BASKET_2_SECTOR_ALPHA}
                </span>
              </button>

              {/* BASKET 3: CEX INSTITUTIONAL (> $100M) */}
              <button
                type="button"
                onClick={() => setSelectedBasket('BASKET_3_CEX_INSTITUTIONAL')}
                className={`p-2 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  selectedBasket === 'BASKET_3_CEX_INSTITUTIONAL'
                    ? 'bg-purple-500/20 border-purple-500/70 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-purple-300 truncate">🏛️ Корзина 3: CEX Институционал</div>
                  <div className="text-[9px] text-slate-500 truncate">&gt; $100M • PEPE/FLOKI</div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedBasket === 'BASKET_3_CEX_INSTITUTIONAL' ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}>
                  {basketCounts.BASKET_3_CEX_INSTITUTIONAL}
                </span>
              </button>
            </div>

            {/* Strategic Explainer for Active Basket */}
            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] leading-relaxed">
              {selectedBasket === 'ALL' && (
                <div className="flex items-start gap-2 text-slate-300">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Сводный вид всех 3 корзин:</strong> В воронке объединены микрокапы (<span className="text-amber-400">Дельта-Снайпер</span>), мид-капы и bStocks (<span className="text-cyan-400">Секторный Альфа</span>) и институциональные гиганты (<span className="text-purple-400">CEX Институционал</span>). Выберите корзину выше для фокусировки на её профиле риска.
                  </span>
                </div>
              )}
              {selectedBasket === 'BASKET_1_DELTA_SNIPER' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Фокус Корзины 1 (Дельта-Снайпер, &lt; $5M MCap):</span>
                  </div>
                  <p className="text-slate-400">
                    • <strong>Главный риск:</strong> Honeypot, пустые пулы ($0 TVL), налог &gt; 5%, скрытый минт разработчика.
                    <br />• <strong>Как смотреть пулы:</strong> Обязателен расчет импакта на $11 (<span className="text-emerald-400">&lt; 0.1%</span>), проверка котировочного актива (USDT/WBNB vs GOOGLB/QQQB) и блокировка при отсутствии ликвидности.
                  </p>
                </div>
              )}
              {selectedBasket === 'BASKET_2_SECTOR_ALPHA' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Coins className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Фокус Корзины 2 (Секторный Альфа, $5M–$100M MCap):</span>
                  </div>
                  <p className="text-slate-400">
                    • <strong>Главный риск:</strong> Скрытая разгрузка ранних китов (Hidden Distribution), истощение нарратива, дрейф сессий (для bStocks токенизированных акций).
                    <br />• <strong>Как смотреть пулы:</strong> Анализ 27 методов роста, приток уникальных покупателей, кластеризация адресов Bitquery и стресс-тест на просадку BTC на -5%.
                  </p>
                </div>
              )}
              {selectedBasket === 'BASKET_3_CEX_INSTITUTIONAL' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span>Фокус Корзины 3 (CEX Институционал / PEPE / FLOKI / BABYDOGE &gt; $100M):</span>
                  </div>
                  <p className="text-slate-400">
                    • <strong>Почему ОБЯЗАТЕЛЬНО смотреть пулы даже у PEPE:</strong> Канонический пул на DEX (PancakeSwap/Uniswap) — это первичный оракул цены. Когда кит продает $10M–$50M на DEX, биржевые арбитражеры мгновенно переносят дамп в стакан Binance/MEXC. Проверка пула также защищает от сотен клонов (<span className="text-rose-400">Ticker Collision</span>).
                    <br />• <strong>Дополнительный CEX-фокус:</strong> Соотношение DEX/CEX ликвидности, Funding Rate, каскады ликвидаций и дивергенция Spot CVD vs Futures CVD.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Filter and Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 rounded-lg px-2.5 py-1.5 border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300 font-bold">Всего в воронке:</span>
                <span className="text-white font-mono font-bold">{candidates.length} активов</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {(['ALL', 'STAGE_1_PRESCREEN', 'STAGE_2_DEEP_AUDIT', 'STAGE_3_FINAL_VERIFIED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setActiveStageFilter(st)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      activeStageFilter === st
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'Все'
                      : st === 'STAGE_1_PRESCREEN'
                      ? `1. Экспресс (${stage1List.length})`
                      : st === 'STAGE_2_DEEP_AUDIT'
                      ? `2. Аудит (${stage2List.length})`
                      : st === 'STAGE_3_FINAL_VERIFIED'
                      ? `3. Финал (${stage3List.length})`
                      : `Отсев (${rejectedList.length})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по тикеру / CA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-48"
              />
            </div>
          </div>

          {/* 4-COLUMN WORKBENCH / FUNNEL VIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {/* COLUMN 1: ЭКСПРЕСС-ОТБОР */}
            <div className="space-y-2.5 flex flex-col">
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <h3 className="font-bold text-amber-300 text-xs">1. ЭКСПРЕСС-ОТБОР ({stage1List.length})</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-400/80">Первичный фильтр</span>
                  {stage1List.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteColumnTokens('STAGE_1_PRESCREEN')}
                      className="p-1 rounded bg-amber-950/60 hover:bg-rose-900/60 text-amber-400/80 hover:text-rose-300 transition"
                      title="Очистить колонку Экспресс-отбор"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 flex-1">
                {stage1List.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                    Нет токенов на 1-м этапе
                  </div>
                ) : (
                  stage1List.map((token) => (
                    <PipelineCard
                      key={token.id}
                      token={token}
                      onPromoteStage={handlePromoteStage}
                      onCheckLiveDexPool={handleCheckLiveDexPool}
                      onOpenAuditForToken={onOpenAuditForToken}
                      onSendToTerminal={onSendToTerminal}
                      onDeleteToken={handleDeleteToken}
                      copiedContract={copiedContract}
                      onCopy={handleCopy}
                      isCheckingPool={checkingPoolTokenId === token.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 2: ГЛУБОКИЙ АУДИТ & ORDER FLOW */}
            <div className="space-y-2.5 flex flex-col">
              <div className="p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-blue-300 text-xs">2. ГЛУБОКИЙ ОНЧЕЙН ({stage2List.length})</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-blue-400/80">Order Flow & Холдеры</span>
                  {stage2List.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteColumnTokens('STAGE_2_DEEP_AUDIT')}
                      className="p-1 rounded bg-blue-950/60 hover:bg-rose-900/60 text-blue-400/80 hover:text-rose-300 transition"
                      title="Очистить колонку Глубокий ончейн"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 flex-1">
                {stage2List.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                    Нет токенов на глубоком аудите
                  </div>
                ) : (
                  stage2List.map((token) => (
                    <PipelineCard
                      key={token.id}
                      token={token}
                      onPromoteStage={handlePromoteStage}
                      onCheckLiveDexPool={handleCheckLiveDexPool}
                      onOpenAuditForToken={onOpenAuditForToken}
                      onSendToTerminal={onSendToTerminal}
                      onDeleteToken={handleDeleteToken}
                      copiedContract={copiedContract}
                      onCopy={handleCopy}
                      isCheckingPool={checkingPoolTokenId === token.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 3: ФИНАЛИСТЫ (ВЕРИФИЦИРОВАНЫ И ОДОБРЕНЫ) */}
            <div className="space-y-2.5 flex flex-col">
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-emerald-300 text-xs">3. ФИНАЛ / ОДОБРЕНО ({stage3List.length})</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-300">Готовы к сделке</span>
                  {stage3List.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteColumnTokens('STAGE_3_FINAL_VERIFIED')}
                      className="p-1 rounded bg-emerald-950/60 hover:bg-rose-900/60 text-emerald-400/80 hover:text-rose-300 transition"
                      title="Очистить колонку Финал"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 flex-1">
                {stage3List.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                    Нет финалистов
                  </div>
                ) : (
                  stage3List.map((token) => (
                    <PipelineCard
                      key={token.id}
                      token={token}
                      onPromoteStage={handlePromoteStage}
                      onCheckLiveDexPool={handleCheckLiveDexPool}
                      onOpenAuditForToken={onOpenAuditForToken}
                      onSendToTerminal={onSendToTerminal}
                      onDeleteToken={handleDeleteToken}
                      copiedContract={copiedContract}
                      onCopy={handleCopy}
                      isCheckingPool={checkingPoolTokenId === token.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 4: ОТСЕЯНЫ (БРАК, ФАНТОМЫ, ЗАКРЫТЫЕ ПУЛЫ) */}
            <div className="space-y-2.5 flex flex-col">
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-rose-300 text-xs">4. ОТСЕЯНЫ ({rejectedList.length})</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-rose-400/80">Риск & Брак</span>
                  {rejectedList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteColumnTokens('REJECTED')}
                      className="p-1 rounded bg-rose-950/60 hover:bg-rose-900/90 text-rose-400 hover:text-white transition"
                      title="Очистить колонку Отсеяны"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 flex-1 max-h-[850px] overflow-y-auto pr-1">
                {rejectedList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                    Отсеянных токенов нет
                  </div>
                ) : (
                  rejectedList.map((token) => (
                    <PipelineCard
                      key={token.id}
                      token={token}
                      onPromoteStage={handlePromoteStage}
                      onCheckLiveDexPool={handleCheckLiveDexPool}
                      onOpenAuditForToken={onOpenAuditForToken}
                      onSendToTerminal={onSendToTerminal}
                      onDeleteToken={handleDeleteToken}
                      copiedContract={copiedContract}
                      onCopy={handleCopy}
                      isCheckingPool={checkingPoolTokenId === token.id}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Strategic Rules Box */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Правила перемещения и риск-менеджмента воронки</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                <strong className="text-emerald-300 block mb-1">✓ Свободное перемещение с ликвидностью:</strong>
                Любой актив с подтвержденным пулом на DEX (например <strong>4, LOBSTER, NIULAI, 4STOCK, SIREN</strong>) можно переносить в любую из 4 колонок («Экспресс», «Аудит», «Финал», «Отсев») одним кликом по кнопкам внизу карточки.
              </div>
              <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30">
                <strong className="text-rose-300 block mb-1">🚫 Блокировка активов без пулов ($0 TVL):</strong>
                Если контракт не имеет торговой пары на PancakeSwap или TVL &lt; $1k, кнопки перемещения в 1, 2 и 3 колонки блокируются замком 🔒. Для разблокировки нажмите кнопку <em>«🔄 Проверить появление пула на DEX»</em>.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

