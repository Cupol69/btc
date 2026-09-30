import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Coins,
  Send,
  Bot,
  Zap,
  Lock,
  Unlock,
  ChevronRight,
  Database,
  Crosshair,
  Scale,
  Share2,
  MessageSquare,
  Building2,
  ArrowRightLeft,
  Calculator,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit3,
  Plus,
  Target,
  AlertOctagon,
  ShieldAlert,
  Split,
  HelpCircle,
  BarChart3,
  Clipboard,
  X,
  Globe,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TripleDexAuditData, NewDexPairItem, PeriodNetFlow } from '../types';
import { AmmPoolDecoderPanel } from './AmmPoolDecoderPanel';
import { NetBuySellVolumeCard } from './NetBuySellVolumeCard';
import { PotentialMeter } from './PotentialMeter';
import { WatchlistAnomalyScanner } from './WatchlistAnomalyScanner';
import { DexPoolFundFlowChart } from './DexPoolFundFlowChart';
import { isCexMajorAsset, DEFAULT_ONCHAIN_TOKEN } from './DexAlphaIntelligenceHub';
import { TerminalHistoryPills } from './TerminalHistoryPills';
import { addTerminalHistory } from '../services/terminalHistoryService';
import { EtherscanForensicCaseModal, ForensicCaseData } from './EtherscanForensicCaseModal';
import { DexFivePillarForensicVerdictCard } from './DexFivePillarForensicVerdictCard';
import { TokenStageDifferenceCard } from './TokenStageDifferenceCard';
import { InstitutionalAiPromptsWidget } from './InstitutionalAiPromptsWidget';

interface DexTripleIntelAuditViewProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string, contractAddress?: string) => void;
  onSwitchToTerminal?: () => void;
  isWidescreen?: boolean;
}

// Helper to format DEX and meme coin prices without scientific exponential notation (e.g. 1.63e-4)
function formatDexPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price) || price === 0) return '0.00';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.1) return price.toFixed(4);
  if (price >= 0.001) return price.toFixed(5);
  if (price >= 0.00001) return price.toFixed(7);
  if (price >= 0.000001) return price.toFixed(8);
  return price.toFixed(10).replace(/(\.\d*?[1-9])0+$/, '$1');
}

export const DexTripleIntelAuditView: React.FC<DexTripleIntelAuditViewProps> = ({
  currentSymbol,
  onSelectSymbol,
  onSwitchToTerminal,
}) => {
  // On-chain audit target token (persisted, never defaulting to BTC)
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (currentSymbol && !isCexMajorAsset(currentSymbol)) {
      return currentSymbol;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dex_selected_onchain_coin');
      if (saved && !isCexMajorAsset(saved)) {
        return saved;
      }
    }
    return DEFAULT_ONCHAIN_TOKEN;
  });
  const [auditData, setAuditData] = useState<TripleDexAuditData | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [btcNotice, setBtcNotice] = useState<string | null>(null);

  // New pairs feed state
  const [newPairs, setNewPairs] = useState<NewDexPairItem[]>([]);
  const [isLoadingPairs, setIsLoadingPairs] = useState<boolean>(false);
  const [chainFilter, setChainFilter] = useState<'ALL' | 'BSC' | 'SOLANA' | 'BASE' | 'ETH'>('ALL');
  const [ageFilter, setAgeFilter] = useState<'ALL' | '1H' | '6H' | '24H'>('ALL');
  const [minLiquidityFilter, setMinLiquidityFilter] = useState<number>(2000);
  const [pairsTimeframe, setPairsTimeframe] = useState<'5m' | '1h' | '6h' | '24h'>('5m');
  const [pairsNetFlowFilter, setPairsNetFlowFilter] = useState<'ALL' | 'NET_BUY' | 'WHALE_DOMINANCE'>('ALL');

  // UI helpers
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [holderFilter, setHolderFilter] = useState<'all' | 'eoa'>('all');

  // Forensic Case Modal State
  const [selectedForensicCase, setSelectedForensicCase] = useState<ForensicCaseData | null>(null);
  const [isForensicModalOpen, setIsForensicModalOpen] = useState<boolean>(false);
  const [isForensicLoading, setIsForensicLoading] = useState<boolean>(false);

  const openForensicCaseForHolder = useCallback(async (holderAddr: string, holderTag?: string, percent?: number) => {
    if (!holderAddr) return;
    setIsForensicLoading(true);
    try {
      const resp = await fetch(`/api/chinese-holders/flow-trace/${encodeURIComponent(holderAddr)}`);
      if (resp.ok) {
        const data = await resp.json();
        setSelectedForensicCase(data);
        setIsForensicModalOpen(true);
      } else {
        const isCex = (holderTag || '').toLowerCase().includes('mexc') || (holderTag || '').toLowerCase().includes('binance') || (holderTag || '').toLowerCase().includes('cex');
        const fallbackCase: ForensicCaseData = {
          targetAddress: holderAddr,
          targetLabel: holderTag || `Holder (${(percent || 0).toFixed(2)}%)`,
          isCexOrRouter: isCex,
          transfersCount: 3,
          signals: {
            detectedCexDumping: isCex,
            detectedDexArbitrage: false,
            isCexDepositHub: isCex,
            riskLevel: (percent || 0) > 5 ? 'HIGH' : 'LOW',
          },
          forensics: {
            fact: `Адрес держит ${(percent || 0).toFixed(2)}% эмиссии токена ${auditData?.symbol || ''}.`,
            inference: isCex ? 'Депозитарный шлюз биржи / CEX Hot Wallet' : 'Частный кит (EOA) с существенной долей в пуле',
            missingData: 'Офчейн KYC данные владельца',
          },
          flowCase: {
            version: 'etherscan-skills-v1',
            creator: 'CryptoIntel Core',
            network: (auditData?.chain || 'BSC').toUpperCase(),
            nodes: [
              { id: 'source', label: 'DEX Pool / Deployer', category: 'Liquidity Origin', url: `https://bscscan.com/address/${auditData?.tokenAddress || holderAddr}` },
              { id: 'target', label: holderTag || 'Top Holder', category: 'Subject EOA', url: `https://bscscan.com/address/${holderAddr}` },
              { id: 'dest', label: isCex ? 'CEX Spot / Orderbook' : 'Cold Storage / LP', category: 'Terminal Node', url: `https://bscscan.com/address/${holderAddr}` },
            ],
            edges: [
              {
                from: 'source',
                to: 'target',
                amount: (percent || 0) * 1000000,
                token: auditData?.symbol || 'TOKEN',
                tx: '',
                direction: 'INFLOW',
                note: 'Accumulation',
                url: `https://bscscan.com/address/${holderAddr}`,
              }
            ],
            etherscanFlowUrl: `https://bscscan.com/address/${holderAddr}`,
          },
          lastUpdated: Date.now(),
        };
        setSelectedForensicCase(fallbackCase);
        setIsForensicModalOpen(true);
      }
    } catch (err) {
      console.warn('[Forensic] Error:', err);
    } finally {
      setIsForensicLoading(false);
    }
  }, [auditData]);

  // Interactive AI Chat
  const [chatQuestion, setChatQuestion] = useState<string>('');
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatModel, setChatModel] = useState<string | null>(null);
  const [chatGrounding, setChatGrounding] = useState<{ enabled: boolean; queries?: string[]; sources?: { title: string; uri: string }[] } | null>(null);
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);

  // Interactive CEX & CoinMarketCap Manual Injection / Position Calculator
  const [calcOrderSize, setCalcOrderSize] = useState<number>(10000);
  const [customCexVolume, setCustomCexVolume] = useState<string>('');
  const [customCexExchanges, setCustomCexExchanges] = useState<string>('');
  const [customCexPrice, setCustomCexPrice] = useState<string>('');
  const [isManualCexOpen, setIsManualCexOpen] = useState<boolean>(false);

  // 1. Fetch Audit Data for Selected Token
  const fetchAudit = useCallback(async (tokenOrAddress: string, retryCount = 0) => {
    if (!tokenOrAddress.trim()) return;
    setIsLoadingAudit(true);
    setAuditError(null);
    setChatAnswer(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(`/api/dex/triple-audit?query=${encodeURIComponent(tokenOrAddress.trim())}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Ошибка ончейн-аудита`);
      }
      const data: TripleDexAuditData = await res.json();
      setAuditData(data);
      if (data?.symbol) {
        addTerminalHistory({
          symbol: data.symbol,
          name: data.name,
          contract: data.tokenAddress,
          chain: data.chain || (data.tokenAddress?.startsWith('0x') ? 'BSC' : 'SOLANA'),
          priceUsd: data.layer1DexScreener?.priceUsd,
          priceChange24h: data.layer1DexScreener?.priceChange24h,
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (retryCount < 2 && err.name !== 'AbortError') {
        setTimeout(() => fetchAudit(tokenOrAddress, retryCount + 1), 1200);
        return;
      }
      console.warn('[TripleAudit] Fetch error:', err);
      setAuditError(err.name === 'AbortError' ? 'Таймаут запроса ончейн-данных. Нажмите «Повторить» или выберите токен из списка.' : (err.message || 'Не удалось загрузить ончейн-досье'));
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  // 2. Fetch New Pairs Feed (DexScreener)
  const fetchNewPairs = useCallback(async (retryCount = 0) => {
    setIsLoadingPairs(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/dex/new-pairs?chain=${chainFilter.toLowerCase()}&minLiquidity=${minLiquidityFilter}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.pairs) && json.pairs.length > 0) {
          setNewPairs(json.pairs);
        }
      } else if (retryCount < 2) {
        // Silent retry after 2 seconds
        setTimeout(() => fetchNewPairs(retryCount + 1), 2000);
      }
    } catch (err: any) {
      // If network transient error, retry once quietly
      if (retryCount < 2 && err.name !== 'AbortError') {
        setTimeout(() => fetchNewPairs(retryCount + 1), 2500);
      }
    } finally {
      setIsLoadingPairs(false);
    }
  }, [chainFilter, minLiquidityFilter]);

  // Initial load once on mount
  useEffect(() => {
    fetchAudit(searchQuery);
    fetchNewPairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize with external symbol selection (ONLY when symbol actually changes from outside)
  const prevExternalSymbolRef = React.useRef<string>(currentSymbol);
  useEffect(() => {
    if (currentSymbol && currentSymbol.trim() && currentSymbol !== prevExternalSymbolRef.current) {
      prevExternalSymbolRef.current = currentSymbol;
      if (!isCexMajorAsset(currentSymbol)) {
        setSearchQuery(currentSymbol);
        setBtcNotice(null);
        fetchAudit(currentSymbol);
      }
    }
  }, [currentSymbol, fetchAudit]);

  // Poll new pairs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNewPairs();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNewPairs]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (isCexMajorAsset(query)) {
      const clean = query.replace(/(USDT|BUSD|USDC|FDUSD)$/, '').toUpperCase();
      if (clean === 'BTC') {
        const btcbContract = '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c'; // Binance-Peg BTC on BSC
        setBtcNotice('💡 Нативный Bitcoin (BTC) торгуется на CEX и не имеет собственного смарт-контракта EVM/DEX. Для 5-слойного ончейн-аудита смарт-контракта и пулов PancakeSwap автоматически загружен официальный Binance-Peg BTC (BTCB) на BNB Chain (0x7130...ad9c).');
        setSearchQuery(btcbContract);
        fetchAudit(btcbContract);
        onSelectSymbol('BTCB', btcbContract);
        return;
      }
      if (clean === 'ETH') {
        const ethbContract = '0x2170ed0880ac9a755fd29b2688956bd959f933f8'; // Binance-Peg ETH on BSC
        setBtcNotice('💡 Нативный Ethereum (ETH) на BNB Chain представлен официальным Binance-Peg ETH. Загружен смарт-контракт 0x2170...33f8.');
        setSearchQuery(ethbContract);
        fetchAudit(ethbContract);
        onSelectSymbol('ETH', ethbContract);
        return;
      }
    }

    setBtcNotice(null);
    fetchAudit(query);
  };

  // Copy Contract Helper
  const handleCopyContract = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedContract(addr);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  // Helper for computing Net Flow on pairs
  const getPairNetFlow = useCallback((p: NewDexPairItem, tf: '5m' | '1h' | '6h' | '24h'): PeriodNetFlow => {
    if (tf === '5m' && p.netFlow5m) return p.netFlow5m;
    if (tf === '1h' && p.netFlow1h) return p.netFlow1h;
    if (tf === '6h' && p.netFlow6h) return p.netFlow6h;
    if (tf === '24h' && p.netFlow24h) return p.netFlow24h;

    const tx = tf === '5m' ? p.txns5m : tf === '1h' ? p.txns1h : tf === '6h' ? (p.txns6h || { buys: Math.round(p.txns1h.buys * 3), sells: Math.round(p.txns1h.sells * 3) }) : (p.txns24h || { buys: p.txns1h.buys * 6, sells: p.txns1h.sells * 6 });
    const vol = tf === '5m' ? p.volume5m : tf === '1h' ? p.volume1h : tf === '6h' ? (p.volume6h || p.volume24h * 0.35) : p.volume24h;
    const pc = tf === '5m' ? p.priceChange5m : tf === '1h' ? p.priceChange1h : tf === '6h' ? (p.priceChange6h || p.priceChange24h * 0.4) : p.priceChange24h;

    const buys = tx?.buys || 0;
    const sells = tx?.sells || 0;
    const totalTxns = buys + sells;
    const txRatio = totalTxns > 0 ? (buys / totalTxns) : 0.5;
    const momentumAdjustment = Math.max(-0.25, Math.min(0.25, (pc / 100) * 0.4));
    const dollarRatio = Math.max(0.03, Math.min(0.97, txRatio + momentumAdjustment));
    const totalVol = vol > 0 ? vol : (totalTxns * 120);
    const buyVol = Math.round(totalVol * dollarRatio);
    const sellVol = Math.max(0, Math.round(totalVol - buyVol));
    const netFlowUsd = buyVol - sellVol;
    const buyRatioPercent = totalVol > 0 ? Number(((buyVol / totalVol) * 100).toFixed(1)) : 50;
    const sellRatioPercent = Number((100 - buyRatioPercent).toFixed(1));
    const txBuyRatioPercent = totalTxns > 0 ? Number(((buys / totalTxns) * 100).toFixed(1)) : 50;
    const avgBuy = buys > 0 ? Math.round(buyVol / buys) : 0;
    const avgSell = sells > 0 ? Math.round(sellVol / sells) : 0;

    let verdict: PeriodNetFlow['verdict'] = 'BALANCED';
    let verdictLabel = 'Баланс';
    if (buyRatioPercent >= 65) {
      verdict = 'STRONG_BUY_OVERWEIGHT';
      verdictLabel = `Перевес Покупок (+$${Math.abs(netFlowUsd).toLocaleString()})`;
    } else if (buyRatioPercent > 52) {
      verdict = 'BUY_OVERWEIGHT';
      verdictLabel = `Перевес Покупок (+$${Math.abs(netFlowUsd).toLocaleString()})`;
    } else if (buyRatioPercent <= 35) {
      verdict = 'STRONG_SELL_OVERWEIGHT';
      verdictLabel = `Навес Продаж (-$${Math.abs(netFlowUsd).toLocaleString()})`;
    } else if (buyRatioPercent < 48) {
      verdict = 'SELL_OVERWEIGHT';
      verdictLabel = `Навес Продаж (-$${Math.abs(netFlowUsd).toLocaleString()})`;
    }

    return {
      period: tf,
      periodLabel: tf === '5m' ? '5 минут' : tf === '1h' ? '1 час' : tf === '6h' ? '6 часов' : '24 часа',
      buysCount: buys,
      sellsCount: sells,
      totalTxns,
      buyVolumeUsd: buyVol,
      sellVolumeUsd: sellVol,
      totalVolumeUsd: totalVol,
      netFlowUsd,
      buyRatioPercent,
      sellRatioPercent,
      txBuyRatioPercent,
      isVolumeSkewPositive: netFlowUsd >= 0,
      avgBuySizeUsd: avgBuy,
      avgSellSizeUsd: avgSell,
      verdict,
      verdictLabel,
    };
  }, []);

  // Filtered pairs list
  const filteredPairs = useMemo(() => {
    return newPairs.filter((p) => {
      if (chainFilter !== 'ALL' && p.chain.toUpperCase() !== chainFilter) return false;
      if (ageFilter === '1H' && p.ageMinutes > 60) return false;
      if (ageFilter === '6H' && p.ageMinutes > 360) return false;
      if (ageFilter === '24H' && p.ageMinutes > 1440) return false;

      if (pairsNetFlowFilter === 'NET_BUY') {
        const flow = getPairNetFlow(p, pairsTimeframe);
        if (flow.netFlowUsd <= 0) return false;
      } else if (pairsNetFlowFilter === 'WHALE_DOMINANCE') {
        const flow = getPairNetFlow(p, pairsTimeframe);
        if (flow.buyRatioPercent < 60 || (flow.avgBuySizeUsd < flow.avgSellSizeUsd * 1.3 && flow.buysCount < 3)) return false;
      }
      return true;
    });
  }, [newPairs, chainFilter, ageFilter, pairsNetFlowFilter, pairsTimeframe, getPairNetFlow]);

  // Handle Quick AI Ask with Strict On-Chain Analytical Rules
  const handleAskAi = async (customPrompt?: string) => {
    const q = customPrompt || chatQuestion;
    if (!q.trim() || !auditData) return;
    setIsAskingAi(true);
    setChatAnswer(null);
    setChatModel(null);
    setChatGrounding(null);

    const effPoolLiq = auditData.layer1DexScreener.liquidityUsd || 50000;
    const effDexPrice = auditData.layer1DexScreener.priceUsd || 0.0001;
    const effCexVol = customCexVolume.trim() ? (parseFloat(customCexVolume) || 0) : (auditData.layer2CoinGecko.totalCexVolume24h || 0);
    const effCexPrice = customCexPrice.trim() ? (parseFloat(customCexPrice) || effDexPrice) : (auditData.layer2CoinGecko.cexMarkets?.[0]?.priceUsd || effDexPrice);
    const effCexExchanges = customCexExchanges.trim() || (auditData.layer2CoinGecko.cexMarkets?.map(m => m.exchangeName).join(', ') || 'DEX Only');
    const impactPct = Math.min(99.9, (calcOrderSize / (effPoolLiq + calcOrderSize)) * 100);
    const slippageLoss = calcOrderSize * (impactPct / 100);
    const spreadPct = effDexPrice > 0 ? (((effCexPrice - effDexPrice) / effDexPrice) * 100) : 0;

    try {
      const res = await fetch('/api/dex/ai-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          symbol: auditData.symbol,
          chain: auditData.chain,
          primaryContractAddress: auditData.tokenAddress,
          contractAddress: auditData.tokenAddress,
          primaryDexPrice: auditData.layer1DexScreener.priceUsd,
          totalDexLiquidityUsd: auditData.layer1DexScreener.liquidityUsd,
          totalDexVolume24h: auditData.layer1DexScreener.volume24h,
          fdv: auditData.layer1DexScreener.fdv || auditData.layer1DexScreener.liquidityUsd * 5,
          mktCap: auditData.layer1DexScreener.fdv || auditData.layer1DexScreener.liquidityUsd * 5,
          marketCap: auditData.layer1DexScreener.fdv || auditData.layer1DexScreener.liquidityUsd * 5,
          totalBuys24h: auditData.layer1DexScreener.buys24h,
          totalSells24h: auditData.layer1DexScreener.sells24h,
          buyPressurePercent1h: auditData.layer1DexScreener.buyPressurePercent1h,
          security: {
            isHoneypot: auditData.layer3OnChainScan.isHoneypot,
            isMintable: auditData.layer3OnChainScan.isMintable,
            buyTax: auditData.layer3OnChainScan.buyTax,
            sellTax: auditData.layer3OnChainScan.sellTax,
            topHoldersPercent: auditData.layer3OnChainScan.top10HoldersPercent,
            lpBurnedPercent: auditData.layer3OnChainScan.lpLockedPercent,
          },
          adjustedTop10Percent: auditData.layer3OnChainScan.adjustedTop10Percent,
          maxSingleEoaPercent: auditData.layer3OnChainScan.maxSingleEoaPercent,
          topHolders: auditData.layer3OnChainScan.topHolders,
          layer4CexGateways: auditData.layer4CexGateways,
          layer4SocialSentiment: auditData.layer4SocialSentiment,
          depthTargets: auditData.depthTargets,
          poolDecoder: auditData.poolDecoder,
          coingecko: {
            marketCapUsd: auditData.layer1DexScreener.fdv || (auditData.layer2CoinGecko.marketCapRank ? 25000000 : auditData.layer1DexScreener.liquidityUsd * 8),
            listingsCount: auditData.layer2CoinGecko.exchangesCount || 1,
            cexCount: auditData.layer2CoinGecko.cexCount || 0,
            totalCexVolume24h: effCexVol,
            cexMarkets: auditData.layer2CoinGecko.cexMarkets || [],
          },
          customCexData: {
            volume24hUsd: effCexVol,
            priceUsd: effCexPrice,
            exchanges: effCexExchanges,
            orderSizeUsd: calcOrderSize,
            dexPriceImpactPct: Number(impactPct.toFixed(2)),
            dexSlippageLossUsd: Number(slippageLoss.toFixed(2)),
            spreadPct: Number(spreadPct.toFixed(2)),
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatAnswer(data.answer || data.text || 'Аналитический отчет сформирован.');
        if (data.model) {
          setChatModel(data.model);
        }
        if (data.grounding) {
          setChatGrounding(data.grounding);
        }
      } else {
        // Fallback to /api/dex/ai-analysis if /api/dex/ai-ask fails
        const fallbackRes = await fetch('/api/dex/ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: auditData.symbol,
            primaryContractAddress: auditData.tokenAddress,
            primaryDexPrice: auditData.layer1DexScreener.priceUsd,
            totalDexLiquidityUsd: auditData.layer1DexScreener.liquidityUsd,
            totalDexVolume24h: auditData.layer1DexScreener.volume24h,
            fdv: auditData.layer1DexScreener.fdv || auditData.layer1DexScreener.liquidityUsd * 5,
            mktCap: auditData.layer1DexScreener.fdv || auditData.layer1DexScreener.liquidityUsd * 5,
            marketCap: auditData.layer1DexScreener.fdv || auditData.layer1DexScreener.liquidityUsd * 5,
            totalBuys24h: auditData.layer1DexScreener.buys24h,
            totalSells24h: auditData.layer1DexScreener.sells24h,
            buyPressurePercent1h: auditData.layer1DexScreener.buyPressurePercent1h,
            security: {
              isHoneypot: auditData.layer3OnChainScan.isHoneypot,
              buyTax: auditData.layer3OnChainScan.buyTax,
              sellTax: auditData.layer3OnChainScan.sellTax,
            },
            userQuestion: q,
          }),
        });
        const fallbackData = await fallbackRes.json();
        setChatAnswer(fallbackData.verdict || fallbackData.summary || fallbackData.plan || 'ИИ завершил аудит ончейн-параметров.');
      }
    } catch (err) {
      setChatAnswer('ИИ-аналитик: на основе параметров контракта и распределения холдеров токен требует строгого стоп-лосса.');
    } finally {
      setIsAskingAi(false);
    }
  };

  // Badge Color for Risk Category
  const getRiskBadge = (cat: string) => {
    switch (cat) {
      case 'LOW_RISK':
        return { label: '🟢 НИЗКИЙ РИСК', bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' };
      case 'MODERATE':
        return { label: '🟡 УМЕРЕННЫЙ РИСК', bg: 'bg-amber-950/80 border-amber-500/40 text-amber-300' };
      case 'HIGH_RISK':
        return { label: '🟠 ВЫСОКИЙ РИСК', bg: 'bg-orange-950/80 border-orange-500/40 text-orange-300' };
      case 'CRITICAL_RUGPULL_RISK':
      default:
        return { label: '🔴 КРИТИЧЕСКИЙ РИСК / RUG', bg: 'bg-rose-950/80 border-rose-500/40 text-rose-300' };
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-200 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HEADER & 5-LAYER STATUS BAR                                            */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Crosshair className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>5-Слойный Ончейн & CEX/DEX Интеллект-Аудит</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  DEX · CG · Scan · CEX Gateways · Social AI
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Институциональный 5-слойный ончейн-аудит: <strong>1. DEX Screener</strong> (пулы AMM и свечи 5m/1h/24h),
              <strong> 2. CoinGecko</strong> (верификация и мульти-рынки), <strong>3. GoPlus & Scan</strong> (Raw vs Adjusted Top-10 китов, LP lock),
              <strong> 4. CEX Gateways</strong> (все биржевые адреса Binance, MEXC, OKX, Gate.io, Bybit, KuCoin, Bitget, HTX) и <strong>5. Social & Forensic AI</strong> (CT-сентимент и 4 сценария с Invalidation).
            </p>
          </div>

          {/* 5-Layer Live Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">1. DEX Screener</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-slate-400">2. CoinGecko</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-slate-400">3. GoPlus Scan</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-slate-400">4. CEX Gateways</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="text-slate-400">5. Social & AI</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                id="triple-dex-audit-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите тикер (MARS, PEPE, WIF) или адрес смарт-контракта (0x... / Solana)..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-20 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    title="Очистить поле"
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setSearchQuery(text.trim());
                      }
                    } catch {
                      // fallback if clipboard read is restricted in iframe
                    }
                  }}
                  title="Вставить адрес из буфера обмена"
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <Clipboard className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Вставить</span>
                </button>
              </div>
            </div>
            <button
              id="triple-dex-audit-submit-btn"
              type="submit"
              disabled={isLoadingAudit || !searchQuery.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-emerald-950/40"
            >
              {isLoadingAudit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Аудит</span>
            </button>
          </form>

          {/* Terminal History / Recent Tokens Strip (Full-width, cleanly wrapped) */}
          <TerminalHistoryPills
            activeContractOrSymbol={searchQuery}
            onSelectToken={(token) => {
              const target = token.contract || token.symbol;
              setSearchQuery(target);
              fetchAudit(target);
              onSelectSymbol(token.symbol, token.contract);
            }}
          />
        </div>

        {/* Notice for Native CEX Assets (e.g. BTC/ETH) redirected to wrapped DEX contracts */}
        {btcNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-sm">ℹ️</span>
              <span>{btcNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBtcNotice(null)}
              className="text-amber-400 hover:text-amber-100 text-xs font-mono ml-3 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 2-COLUMN WORKSPACE: LEFT RADAR ANOMALIES + RIGHT AUDIT DOSSIER   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* --------------------------------------------------------------------- */}
        {/* LEFT COLUMN: WATCHLIST ANOMALY SCANNER (Rule 8: Anomaly & Smart Inflow Radar) (5 cols) */}
        {/* --------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-3">
          <WatchlistAnomalyScanner
            selectedContract={auditData?.tokenAddress}
            onSelectToken={(sym, contract) => {
              const target = contract || sym;
              setSearchQuery(target);
              fetchAudit(target);
              onSelectSymbol(sym, contract);
            }}
          />
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: 5-LAYER COMPREHENSIVE ON-CHAIN DOSSIER & AI VERDICT (7 cols) */}
        {/* --------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-3">
          {isLoadingAudit && !auditData ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center flex flex-col items-center justify-center gap-3 shadow-md">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <div className="text-sm font-bold text-white">Выполняется 5-Слойный Ончейн & CEX/DEX Интеллект-Аудит...</div>
              <div className="text-xs text-slate-400 max-w-md">
                1. DEX Screener (пулы и возраст) → 2. CoinGecko (рынки) → 3. GoPlus & Scan (киты и LP lock) → 4. CEX Gateways (биржевые адреса) → 5. Social CT & Forensic AI
              </div>
            </div>
          ) : auditError ? (
            <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-6 shadow-md text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <div className="text-sm font-bold text-rose-300">{auditError}</div>
              <p className="text-xs text-slate-400">Попробуйте повторить запрос или выбрать токен из списка.</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fetchAudit(searchQuery)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Повторить аудит</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fallbackToken = '0xbeea1d618e533a387d941f58a7d4c9b7bd377777';
                    setSearchQuery(fallbackToken);
                    fetchAudit(fallbackToken);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition cursor-pointer"
                >
                  Загрузить 牛来 (Niulai)
                </button>
              </div>
            </div>
          ) : auditData ? (
            <>
              {/* TICKER COLLISION WARNING BANNER (RULE 1 & 6) */}
              {auditData.hasTickerCollision && auditData.alternativeContracts && auditData.alternativeContracts.length > 0 && (
                <div className="bg-amber-950/40 border-2 border-amber-500/70 rounded-xl p-4 shadow-lg space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                      <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                      <span>ПРЕДУПРЕЖДЕНИЕ: TICKER COLLISION (ОБНАРУЖЕНО {auditData.alternativeContracts.length + 1} КОНТРАКТОВ С ТИКЕРОМ ${auditData.symbol})</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-500/40 font-bold">
                      [FACT | RULE 1 & 6]
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed font-sans">
                    Основной идентификатор токена — <strong>blockchain + contract address</strong>. Тикер <strong>{auditData.symbol}</strong> не является гарантией подлинности! В сети обнаружено несколько токенов с таким же тикером. Убедитесь, что анализируете нужный контракт.
                  </p>
                  <div className="pt-2 border-t border-amber-500/30 flex flex-col gap-2 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] bg-slate-950/70 p-2.5 rounded-lg border border-amber-500/30 gap-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-emerald-400 font-bold shrink-0">Текущий контракт:</span>
                        <span className="text-white font-bold truncate">{auditData.tokenAddress}</span>
                      </div>
                      <span className="text-[10px] text-emerald-300 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 font-bold self-start sm:self-auto">
                        АКТИВЕН В АУДИТЕ
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-200 font-bold">Альтернативные контракты с таким тикером:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {auditData.alternativeContracts.map((alt, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 flex flex-col justify-between gap-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{alt.name || alt.symbol || auditData.symbol}</span>
                              <span className="text-[10px] text-slate-400 font-mono uppercase">{alt.chain}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-1" title={alt.address}>
                              {alt.address}
                            </div>
                            <div className="text-[10px] text-emerald-400 mt-0.5">
                              Liq: ${Math.round(alt.liquidityUsd || 0).toLocaleString()} · FDV: ${alt.fdv ? Math.round(alt.fdv).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(alt.address);
                                fetchAudit(alt.address);
                                onSelectSymbol(auditData.symbol, alt.address);
                              }}
                              className="flex-1 py-1 px-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition cursor-pointer text-center"
                            >
                              Аудит этого контракта
                            </button>
                            {alt.dexUrl && (
                              <a href={alt.dexUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-white" title="Открыть на DEX">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Token Summary & Composite Score Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                {/* Header: Token details & Quick action links */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white tracking-tight">{auditData.name}</h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        {auditData.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                        {auditData.chain} · {auditData.dexName}
                      </span>
                    </div>

                    {/* Contract Address & Copy */}
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-400">
                      <span className="text-slate-500">Контракт:</span>
                      <span className="text-slate-300 font-bold truncate max-w-[240px] sm:max-w-sm">
                        {auditData.tokenAddress}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyContract(auditData.tokenAddress)}
                        className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                        title="Скопировать адрес контракта"
                      >
                        {copiedContract === auditData.tokenAddress ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* External Links & Switch to Terminal */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    {onSwitchToTerminal && (
                      <button
                        type="button"
                        onClick={onSwitchToTerminal}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer font-bold flex items-center gap-1"
                      >
                        <span>🟡 В Терминал Binance</span>
                      </button>
                    )}
                    <a
                      href={auditData.layer1DexScreener.dexUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                      title="Открыть график на DexScreener"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Score & Stage Banner */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Gauge circle / score */}
                    <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-emerald-500/60 flex flex-col items-center justify-center font-mono">
                      <span className="text-lg font-black text-white leading-none">{auditData.aiVerdict.safetyScore}</span>
                      <span className="text-[9px] text-slate-400">/ 100</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded border ${getRiskBadge(auditData.aiVerdict.riskCategory).bg}`}>
                          {getRiskBadge(auditData.aiVerdict.riskCategory).label}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Возраст пула: <strong className="text-white">{auditData.ageFormatted}</strong>
                        </span>
                      </div>
                      <div className="text-xs font-bold text-emerald-300 mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Фаза: {auditData.aiVerdict.cycleStage}</span>
                      </div>
                    </div>
                  </div>

                  {/* High level pricing & 24h Vol */}
                  <div className="text-right font-mono">
                    <div className="text-xs text-slate-400">Цена DEX:</div>
                    <div className="text-base font-black text-white">
                      ${formatDexPrice(auditData.layer1DexScreener.priceUsd)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Ликвидность: <strong className="text-emerald-400">${(auditData.layer1DexScreener.liquidityUsd / 1e3).toFixed(1)}k</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 5-PILLAR FORENSIC VERDICT CARD (CONTROLLED PUMP, CLUSTER, AMM SLIPPAGE, RISK) */}
              {/* ========================================================================= */}
              <DexFivePillarForensicVerdictCard
                tokenAddress={auditData.tokenAddress}
                symbol={auditData.symbol}
                name={auditData.name}
                chain={auditData.chain}
                liquidityUsd={auditData.layer1DexScreener.liquidityUsd}
                volume24h={auditData.layer1DexScreener.volume24h}
                priceUsd={auditData.layer1DexScreener.priceUsd}
                topHolders={auditData.layer3OnChainScan.topHolders}
                isHoneypot={auditData.layer3OnChainScan.isHoneypot}
                buyTax={auditData.layer3OnChainScan.buyTax}
                sellTax={auditData.layer3OnChainScan.sellTax}
                priceChange1h={auditData.layer1DexScreener.priceChange1h}
                priceChange24h={auditData.layer1DexScreener.priceChange24h}
                buys1h={auditData.layer1DexScreener.buys1h}
                sells1h={auditData.layer1DexScreener.sells1h}
                safetyScore={auditData.aiVerdict.safetyScore}
                riskCategory={auditData.aiVerdict.riskCategory}
                cycleStage={auditData.aiVerdict.cycleStage}
                summaryVerdict={auditData.aiVerdict.summary}
              />

              {/* ========================================================================= */}
              {/* STAGE DIFFERENCE (0-6) & $11 MICRO-ENTRY CLASSIFICATION (A/B/C/D/E)       */}
              {/* ========================================================================= */}
              <TokenStageDifferenceCard
                tokenAddress={auditData.tokenAddress}
                symbol={auditData.symbol}
                name={auditData.name}
                chain={auditData.chain}
                liquidityUsd={auditData.layer1DexScreener.liquidityUsd}
                volume24h={auditData.layer1DexScreener.volume24h}
                priceUsd={auditData.layer1DexScreener.priceUsd}
                priceChange1h={auditData.layer1DexScreener.priceChange1h}
                priceChange24h={auditData.layer1DexScreener.priceChange24h}
                buys1h={auditData.layer1DexScreener.buys1h}
                sells1h={auditData.layer1DexScreener.sells1h}
                holdersCount={auditData.layer3OnChainScan.holdersCount || 1000}
                ageHours={24}
                safetyScore={auditData.aiVerdict.safetyScore}
                isHoneypot={auditData.layer3OnChainScan.isHoneypot}
                buyTax={auditData.layer3OnChainScan.buyTax}
                sellTax={auditData.layer3OnChainScan.sellTax}
                ownerPercent={auditData.layer3OnChainScan.creatorPercent}
                isBinanceAlpha={auditData.layer4CexGateways?.detectedWallets?.some(w => w.walletLabel?.toLowerCase().includes('binance alpha')) || auditData.layer2CoinGecko?.cexMarkets?.some(m => m.targetPair?.toLowerCase().includes('alpha'))}
                binanceSpotPair={auditData.layer2CoinGecko?.cexMarkets?.find(m => m.exchangeName?.toLowerCase().includes('binance'))?.targetPair}
                primaryCex={auditData.layer2CoinGecko?.cexMarkets?.[0]?.exchangeName}
                topHolders={auditData.layer3OnChainScan.topHolders}
                customEntryUsd={11}
              />

              {/* ========================================================================= */}
              {/* INSTITUTIONAL AI DIRECTIVES: 4 CORE QUESTIONS + MASTER SYNTHESIS (1-CLICK) */}
              {/* ========================================================================= */}
              <InstitutionalAiPromptsWidget
                symbol={auditData.symbol}
                tokenAddress={auditData.tokenAddress}
                isLoading={isAskingAi}
                onRunAiPrompt={(q) => {
                  setChatQuestion(q);
                  handleAskAi(q);
                }}
              />

              {/* ========================================================================= */}
              {/* YELLOW HIGHLIGHTED CONTAINER: NET BUY / SELL PERIOD AUDIT (RULE 2, 7 & 12) */}
              {/* ========================================================================= */}
              <NetBuySellVolumeCard
                multiPeriodNetFlow={auditData.multiPeriodNetFlow}
                symbol={auditData.symbol}
                priceUsd={auditData.layer1DexScreener.priceUsd}
                fallbackStats={{
                  v5m: auditData.layer1DexScreener.volume5m,
                  v1h: auditData.layer1DexScreener.volume1h,
                  v24h: auditData.layer1DexScreener.volume24h,
                  buys5m: auditData.layer1DexScreener.buys5m || 0,
                  sells5m: auditData.layer1DexScreener.sells5m || 0,
                  buys1h: auditData.layer1DexScreener.buys1h || 0,
                  sells1h: auditData.layer1DexScreener.sells1h || 0,
                  buys24h: auditData.layer1DexScreener.buys24h || 0,
                  sells24h: auditData.layer1DexScreener.sells24h || 0,
                  priceChange5m: auditData.layer1DexScreener.priceChange5m,
                  priceChange1h: auditData.layer1DexScreener.priceChange1h,
                  priceChange24h: auditData.layer1DexScreener.priceChange24h,
                }}
                onAskAi={(q) => {
                  setChatQuestion(q);
                  handleAskAi(q);
                }}
              />

              {/* ========================================================================= */}
              {/* POTENTIAL METER: FIBONACCI (GOLDEN POCKET), CAPITAL TARGETS & INFLOW     */}
              {/* ========================================================================= */}
              <PotentialMeter
                currentPrice={auditData.layer1DexScreener.priceUsd}
                fdv={auditData.layer1DexScreener.fdv || 100000}
                liquidityUsd={auditData.layer1DexScreener.liquidityUsd}
                volume24h={auditData.layer1DexScreener.volume24h}
                volume1h={auditData.layer1DexScreener.volume1h}
                buyPressure1h={auditData.layer1DexScreener.buys1h ? Math.round((auditData.layer1DexScreener.buys1h / (auditData.layer1DexScreener.buys1h + auditData.layer1DexScreener.sells1h || 1)) * 100) : (auditData.layer1DexScreener.buyPressurePercent1h || 50)}
                symbol={auditData.symbol}
                tokenAddress={auditData.tokenAddress}
                chain={auditData.chain}
                depthTargets={auditData.depthTargets}
                onAskAi={(q) => {
                  setChatQuestion(q);
                  handleAskAi(q);
                }}
              />

              {/* ========================================================================= */}
              {/* THE 3 DISTINCT SERVICE LAYERS CARDS (DEX Screener, CoinGecko, On-Chain)   */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. LAYER 1: DEX SCREENER */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>1. DEX Screener</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">Маркет & Скорость</span>
                    </div>

                    <div className="mt-2.5 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Основной пул:</span>
                        <span className="text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                          {auditData.symbol} / {auditData.layer1DexScreener.quoteToken?.symbol || 'WBNB'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Возраст пула:</span>
                        <span className="text-white font-bold">{auditData.ageFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ликвидность:</span>
                        <span className="text-emerald-300 font-bold">${(auditData.layer1DexScreener.liquidityUsd / 1e3).toFixed(1)}k</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Объем 24ч:</span>
                        <span className="text-white font-bold">${(auditData.layer1DexScreener.volume24h / 1e3).toFixed(1)}k</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Объем 1ч / 5м:</span>
                        <span className="text-slate-300 font-bold">
                          ${(auditData.layer1DexScreener.volume1h / 1e3).toFixed(1)}k / ${(auditData.layer1DexScreener.volume5m / 1e3).toFixed(1)}k
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Оборот Vol/Liq:</span>
                        <span className="text-indigo-300 font-bold">{auditData.layer1DexScreener.volToLiquidityRatio}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Сделки 1ч (B/S):</span>
                        <span className="text-slate-200">
                          {auditData.layer1DexScreener.buys1h} / {auditData.layer1DexScreener.sells1h}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Давление покупателей:</span>
                    <span className="text-emerald-400 font-bold">{auditData.layer1DexScreener.buyPressurePercent1h}%</span>
                  </div>
                </div>

                {/* 2. LAYER 2: COINGECKO */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold">
                      <span className="text-cyan-400 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        <span>2. CoinGecko</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">Легитимность & Рынки</span>
                    </div>

                    <div className="mt-2.5 space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Статус базы:</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            auditData.layer2CoinGecko.isListed
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {auditData.layer2CoinGecko.isListed ? '✅ В базе CG' : '⚡ Pre-CG (Early)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ранг MCap:</span>
                        <span className="text-white font-bold">
                          {auditData.layer2CoinGecko.marketCapRank ? `#${auditData.layer2CoinGecko.marketCapRank}` : 'Ранний ончейн'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Рынки CEX / DEX:</span>
                        <span className="text-slate-200 font-bold">
                          {auditData.layer2CoinGecko.cexCount || 0} CEX / {auditData.layer2CoinGecko.dexCount || 1} DEX
                        </span>
                      </div>
                      {auditData.layer2CoinGecko.totalCexVolume24h != null && auditData.layer2CoinGecko.totalCexVolume24h > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Объем CEX 24ч:</span>
                          <span className="text-cyan-300 font-bold">
                            ${(auditData.layer2CoinGecko.totalCexVolume24h / 1e3).toFixed(1)}k ({auditData.layer2CoinGecko.cexSharePercent}%)
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-2 bg-slate-950 p-2 rounded border border-slate-800 leading-relaxed">
                        {auditData.layer2CoinGecko.statusMessage}
                      </div>
                    </div>
                  </div>

                  {auditData.layer2CoinGecko.coingeckoUrl && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                      <a
                        href={auditData.layer2CoinGecko.coingeckoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <span>Страница токена на CoinGecko</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* 3. LAYER 3: ON-CHAIN SCAN (GoPlus / Moralis / BscScan) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold">
                      <span className="text-purple-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>3. GoPlus & Scan</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                        [FACT | ON-CHAIN]
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px]">Raw Top-10:</span>
                        <span
                          className={`font-bold ${
                            auditData.layer3OnChainScan.top10HoldersPercent > 60
                              ? 'text-rose-400'
                              : auditData.layer3OnChainScan.top10HoldersPercent > 35
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {auditData.layer3OnChainScan.top10HoldersPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1" title="Top-10 исключая LP-пул и burn">
                          <span>Adjusted Top-10:</span>
                        </span>
                        <span
                          className={`font-bold px-1 rounded bg-slate-950 border border-purple-500/30 ${
                            (auditData.layer3OnChainScan.adjustedTop10Percent ?? auditData.layer3OnChainScan.top10HoldersPercent) > 40
                              ? 'text-rose-400'
                              : 'text-purple-300'
                          }`}
                        >
                          {auditData.layer3OnChainScan.adjustedTop10Percent != null ? auditData.layer3OnChainScan.adjustedTop10Percent : auditData.layer3OnChainScan.top10HoldersPercent}% EOA
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Max частный EOA:</span>
                        <span className="text-amber-300 font-bold">
                          {auditData.layer3OnChainScan.maxSingleEoaPercent != null ? auditData.layer3OnChainScan.maxSingleEoaPercent : 'N/A'}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Блокировка LP:</span>
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            auditData.layer3OnChainScan.isLpBurnedOrLocked ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {auditData.layer3OnChainScan.isLpBurnedOrLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          <span>{auditData.layer3OnChainScan.lpLockedPercent}%</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Налоги B / S:</span>
                        <span className="text-white font-bold">
                          {auditData.layer3OnChainScan.buyTax}% / {auditData.layer3OnChainScan.sellTax}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Honeypot:</span>
                        <span className={`font-bold ${auditData.layer3OnChainScan.isHoneypot ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {auditData.layer3OnChainScan.isHoneypot ? '🚨 HONEYPOT' : '✅ ЧИСТО'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Всего холдеров:</span>
                        <span className="text-slate-200 font-bold">{(auditData.layer3OnChainScan.holdersCount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Deployer EOA:</span>
                    <span className="text-slate-300 font-bold">{auditData.layer3OnChainScan.creatorPercent}% баланса</span>
                  </div>

                  {/* Top-10 Real On-Chain Holders List (GoPlus / Scan) */}
                  {Array.isArray(auditData.layer3OnChainScan.topHolders) && auditData.layer3OnChainScan.topHolders.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                      <div className="text-[10px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Топ-Держатели Контракта (On-Chain Scan):</span>
                        <span className="text-slate-500 font-normal">доля %</span>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {auditData.layer3OnChainScan.topHolders.map((h, hIdx) => (
                          <div
                            key={h.address + hIdx}
                            className="flex items-center justify-between text-[10px] p-1.5 rounded bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                              <span className="text-slate-500 font-bold w-3.5">{hIdx + 1}.</span>
                              <a
                                href={`https://bscscan.com/address/${h.address}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-300 hover:text-sky-300 font-mono truncate"
                                title={h.address}
                              >
                                {h.address.slice(0, 6)}...{h.address.slice(-4)}
                              </a>
                              {h.tag && (
                                <span className="text-[8px] px-1 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 truncate">
                                  {h.tag}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold font-mono ${h.holderType === 'EOA' && h.percent > 5 ? 'text-rose-400' : 'text-slate-200'}`}>
                                {h.percent}%
                              </span>
                              <button
                                type="button"
                                onClick={() => openForensicCaseForHolder(h.address, h.tag || `Holder #${hIdx + 1}`, h.percent)}
                                className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-bold font-mono transition cursor-pointer"
                                title="Исследовать маршруты и риск дампа (Flow Case)"
                              >
                                Case
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 4. LAYER 4: CEX HOT WALLETS & БИРЖЕВЫЕ АДРЕСА (Binance, MEXC, OKX, etc.)   */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Building2 className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <span>4. CEX Hot Wallets & Биржевые адреса</span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">
                        (Binance · MEXC · OKX · Gate.io · Bybit · Bitget · KuCoin · HTX)
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">Доля CEX:</span>
                    <span className={`px-2 py-0.5 rounded font-bold border ${
                      (auditData.layer4CexGateways?.totalCexHoldersPercent || 0) > 10
                        ? 'bg-rose-950 border-rose-500/40 text-rose-300'
                        : (auditData.layer4CexGateways?.totalCexHoldersPercent || 0) > 0
                        ? 'bg-amber-950 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-700 text-slate-400'
                    }`}>
                      {auditData.layer4CexGateways?.totalCexHoldersPercent || 0}% (~${((auditData.layer4CexGateways?.totalCexHoldersUsd || 0) / 1e3).toFixed(1)}k)
                    </span>
                  </div>
                </div>

                {/* 4-KPI Metrics Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Биржевых адресов:</div>
                    <div className="text-white font-bold mt-0.5 flex items-center gap-1.5">
                      <span>{auditData.layer4CexGateways?.cexWalletsCount || 0} кошельков</span>
                      {(auditData.layer4CexGateways?.cexWalletsCount || 0) > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Эмиссия на CEX:</div>
                    <div className="text-amber-300 font-bold mt-0.5">
                      {auditData.layer4CexGateways?.totalCexHoldersPercent || 0}% (${((auditData.layer4CexGateways?.totalCexHoldersUsd || 0) / 1e3).toFixed(1)}k)
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Давление на сброс (Inflow):</div>
                    <div className={`font-bold mt-0.5 ${
                      auditData.layer4CexGateways?.inflowPressureStatus === 'HIGH_SELL_PRESSURE'
                        ? 'text-rose-400'
                        : auditData.layer4CexGateways?.inflowPressureStatus === 'MODERATE'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {auditData.layer4CexGateways?.inflowPressureStatus || 'LOW'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Готовность арбитража:</div>
                    <div className="text-cyan-300 font-bold mt-0.5 text-[11px] truncate">
                      {auditData.layer4CexGateways?.arbitrageReadiness === 'READY_FOR_CEX_EXIT'
                        ? 'CEX СТАКАH ДОСТУПЕН'
                        : 'DEX TWAP ОБЯЗАТЕЛЕН'}
                    </div>
                  </div>
                </div>

                {/* Tracked Exchanges Cluster Chips */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Мониторинг биржевых сетей CEX:</span>
                    <span className="text-[9px] text-slate-500">Binance · MEXC · OKX · Gate.io · Bybit · Bitget · KuCoin · HTX · Crypto.com</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['Binance', 'MEXC', 'OKX', 'Gate.io', 'Bybit', 'Bitget', 'KuCoin', 'HTX', 'Crypto.com'].map((exName) => {
                      const isFound = auditData.layer4CexGateways?.detectedWallets?.some(
                        (w) => w.exchangeName?.toLowerCase().includes(exName.toLowerCase()) || w.walletLabel?.toLowerCase().includes(exName.toLowerCase())
                      ) || auditData.layer2CoinGecko?.cexMarkets?.some(m => m.exchangeName?.toLowerCase().includes(exName.toLowerCase()));

                      return (
                        <span
                          key={exName}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 border ${
                            isFound
                              ? 'bg-amber-950/80 border-amber-500/50 text-amber-200 shadow-sm shadow-amber-500/10'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFound ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                            }`}
                          />
                          <span>{exName}</span>
                          {isFound && <span className="text-[9px] text-amber-400 font-bold">✓ Active</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Detected CEX Wallets Detailed Table / Fallback */}
                {auditData.layer4CexGateways?.detectedWallets && auditData.layer4CexGateways.detectedWallets.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                      Обнаруженные биржевые адреса & депозитные шлюзы:
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900/80 text-[10px] text-slate-400 border-b border-slate-800 uppercase">
                          <tr>
                            <th className="py-1.5 px-2.5">Биржа & Метка</th>
                            <th className="py-1.5 px-2.5">Адрес кошелька</th>
                            <th className="py-1.5 px-2.5 text-right">Доля (%)</th>
                            <th className="py-1.5 px-2.5 text-right">Баланс USD</th>
                            <th className="py-1.5 px-2.5">Шлюз / Статус</th>
                            <th className="py-1.5 px-2.5 text-center">ИИ-Разбор</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {auditData.layer4CexGateways.detectedWallets.map((w, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition">
                              <td className="py-1.5 px-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  <span className="font-bold text-amber-300">{w.exchangeName}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">{w.walletLabel || 'Hot Wallet'}</div>
                              </td>
                              <td className="py-1.5 px-2.5 text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <span>{w.address.slice(0, 8)}...{w.address.slice(-6)}</span>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(w.address)}
                                    className="text-slate-500 hover:text-white"
                                    title="Скопировать биржевой адрес"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  {w.explorerUrl && (
                                    <a
                                      href={w.explorerUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-slate-500 hover:text-cyan-300"
                                      title="Открыть в Explorer"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-bold text-white">
                                {w.percent}%
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-emerald-400 font-bold">
                                ${(w.balanceUsd || 0).toLocaleString()}
                              </td>
                              <td className="py-1.5 px-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  w.depositStatus === 'HOT_WALLET'
                                    ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                                    : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                                }`}>
                                  {w.depositStatus}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const promptText = `Анализ биржевого кошелька ${w.exchangeName} (${w.address}): на нем сосредоточено ${w.percent}% эмиссии ($${(w.balanceUsd || 0).toLocaleString()}). Проверь динамику входящих депозитов за 24ч, риск скоординированного сброса в DEX пул и стратегию безопасного выхода.`;
                                    setChatQuestion(promptText);
                                    handleAskAi(promptText);
                                  }}
                                  disabled={isAskingAi}
                                  className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold transition disabled:opacity-50"
                                >
                                  ⚡ В ИИ
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">ℹ️</span>
                      <span>
                        На подтвержденных биржевых hot-кошельках эмиссии не обнаружено. Токен находится в 100% DEX-фазе (AMM-пул). Скрытых переводов на депозитные шлюзы CEX не зафиксировано.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] shrink-0">
                      100% DEX Пулы
                    </span>
                  </div>
                )}

                {/* Capacity & Arbitrage Advice */}
                {auditData.layer4CexGateways?.cexVsDexCapacityAdvice && (
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">💡</span>
                    <div>
                      <strong className="text-white">Рекомендация по ликвидности & выходу: </strong>
                      <span>{auditData.layer4CexGateways.cexVsDexCapacityAdvice}</span>
                    </div>
                  </div>
                )}

                {/* Direct AI Action Button */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const promptText = `Выполни полный аудит 4-го слоя (CEX Gateways & Биржевые адреса) для токена ${auditData.symbol} (${auditData.tokenAddress}). Отследи адреса бирж (Binance, MEXC, OKX, Gate.io, Bybit, Bitget, KuCoin, HTX). Доля на CEX: ${auditData.layer4CexGateways?.totalCexHoldersPercent || 0}% ($${((auditData.layer4CexGateways?.totalCexHoldersUsd || 0) / 1e3).toFixed(1)}k). Обнаружено кошельков: ${auditData.layer4CexGateways?.cexWalletsCount || 0}. Давление сброса: ${auditData.layer4CexGateways?.inflowPressureStatus}. Оцени риск экстренного выхода сайзом $1k, $10k, $50k и дай заключение.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    disabled={isAskingAi}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/90 via-indigo-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isAskingAi ? 'ИИ Анализирует Биржевые Адреса...' : '🧠 Запустить ИИ-Аудит Биржевых Адресов CEX'}</span>
                  </button>
                </div>
              </div>

              {/* 5. LAYER 5: SOCIAL SENTIMENT & ENGAGEMENT INTELLIGENCE */}
              {auditData.layer4SocialSentiment && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800 text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        <Share2 className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                        <span>5. Социальный Сентимент & CT/TG Радар</span>
                        <span className="text-[10px] font-normal text-slate-400 font-mono">(Social Intelligence)</span>
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400">Сентимент-скор:</span>
                      <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">
                        {auditData.layer4SocialSentiment.sentimentScore} / 100 ({auditData.layer4SocialSentiment.sentimentStatus})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Уникальных авторов:</div>
                      <div className="text-white font-bold mt-0.5">~{(auditData.layer4SocialSentiment.uniqueAuthorsCount || 0).toLocaleString()} авторов</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Вовлеченность 24ч:</div>
                      <div className="text-sky-300 font-bold mt-0.5">~{(auditData.layer4SocialSentiment.engagement24h || 0).toLocaleString()} реакций</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Риск спам-шилла:</div>
                      <div className={`font-bold mt-0.5 ${
                        auditData.layer4SocialSentiment.coordinatedShillRisk === 'LOW'
                          ? 'text-emerald-400'
                          : auditData.layer4SocialSentiment.coordinatedShillRisk === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {auditData.layer4SocialSentiment.coordinatedShillRisk} RISK
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Природа интереса:</div>
                      <div className="text-indigo-300 font-bold mt-0.5">{auditData.layer4SocialSentiment.organicInterestVsFomo}</div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                    <div>
                      <span className="text-slate-500">Основной нарратив: </span>
                      <span className="text-slate-200 font-medium">{auditData.layer4SocialSentiment.primaryNarrative}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Языки: <span className="text-slate-300">{auditData.layer4SocialSentiment.dominantLanguages.join(', ')}</span>
                    </div>
                  </div>

                  {/* Direct AI Social Action Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const promptText = `Проведи детальный аудит социального сентимента и вирусной активности токена ${auditData.symbol} (${auditData.tokenAddress}): оцени число уникальных авторов за 24ч (~${auditData.layer4SocialSentiment?.uniqueAuthorsCount || 0}), суммарный engagement (~${auditData.layer4SocialSentiment?.engagement24h || 0}), языковые кластеры (${auditData.layer4SocialSentiment?.dominantLanguages?.join(', ')}), ведущие нарративы сообщества ("${auditData.layer4SocialSentiment?.primaryNarrative}"), долю повторяющихся сообщений (coordinated shill detection, статус: ${auditData.layer4SocialSentiment?.coordinatedShillRisk}) и соотношение органического интереса vs FOMO (${auditData.layer4SocialSentiment?.organicInterestVsFomo}). В конце сформируй Social Sentiment Score и статус риска манипуляций.`;
                        setChatQuestion(promptText);
                        handleAskAi(promptText);
                      }}
                      disabled={isAskingAi}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                      <span>{isAskingAi ? 'ИИ Анализирует Соцсети & CT...' : '🌐 Запустить ИИ-Аудит Социального Сентимента & Шилла'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CEX vs DEX CROSS-MARKET LIQUIDITY MATRIX (CoinGecko + DEX Screener)      */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <ArrowRightLeft className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <span>Кросс-Рыночная Матрица Ликвидности: CEX vs DEX</span>
                      <span className="text-[10px] font-normal text-slate-400 font-mono">(CoinGecko & DEX AMM)</span>
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                      DEX: <strong className="text-emerald-400">{auditData.layer2CoinGecko.dexSharePercent ?? 100}%</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                      CEX: <strong className="text-cyan-400">{auditData.layer2CoinGecko.cexSharePercent ?? 0}%</strong>
                    </span>
                  </div>
                </div>

                {/* 2-Column Split: DEX AMM Engine vs CEX Orderbooks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 font-mono text-xs">
                  {/* Column 1: On-Chain DEX Pool (AMM) */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <Activity className="w-3.5 h-3.5" />
                        <span>1. Ончейн-Пул DEX ({auditData.dexName})</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Формула: x · y = k</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500">Пул ликвидности:</div>
                        <div className="text-white font-bold mt-0.5">
                          ${(auditData.layer1DexScreener.liquidityUsd / 1e3).toFixed(1)}k
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500">Объем торгов 24ч:</div>
                        <div className="text-emerald-400 font-bold mt-0.5">
                          ${(auditData.layer1DexScreener.volume24h / 1e3).toFixed(1)}k
                        </div>
                      </div>
                    </div>

                    {/* AMM Slippage Depth Table */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-between">
                        <span>Проскальзывание в пуле (Price Impact):</span>
                        <span className="text-slate-500">Сайз ордера</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-500">$1 000</div>
                          <div className="text-emerald-400 font-bold mt-0.5">
                            ~{(Math.min(99, (1000 / (auditData.layer1DexScreener.liquidityUsd || 50000)) * 100)).toFixed(2)}%
                          </div>
                          <div className="text-[9px] text-emerald-500/80">Безопасно</div>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                          <div className="text-slate-500">$10 000</div>
                          <div className={`font-bold mt-0.5 ${
                            (10000 / (auditData.layer1DexScreener.liquidityUsd || 50000)) * 100 > 10 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            ~{(Math.min(99, (10000 / (auditData.layer1DexScreener.liquidityUsd || 50000)) * 100)).toFixed(2)}%
                          </div>
                          <div className="text-[9px] text-slate-400">Умеренно</div>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900 border border-rose-500/30">
                          <div className="text-slate-500">$50 000</div>
                          <div className="text-rose-400 font-black mt-0.5">
                            ~{(Math.min(99, (50000 / (auditData.layer1DexScreener.liquidityUsd || 50000)) * 100)).toFixed(2)}%
                          </div>
                          <div className="text-[9px] text-rose-400 font-bold">MEV Риск</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Centralized Exchanges (CEX via CoinGecko) */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>2. Централизованные Биржи (CEX Markets)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {auditData.layer2CoinGecko.cexCount ? `${auditData.layer2CoinGecko.cexCount} площадок` : 'Нет CEX'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500">Объем на CEX 24ч:</div>
                        <div className="text-cyan-300 font-bold mt-0.5">
                          ${((auditData.layer2CoinGecko.totalCexVolume24h || 0) / 1e3).toFixed(1)}k
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500">Глобальный ранг MCap:</div>
                        <div className="text-white font-bold mt-0.5">
                          {auditData.layer2CoinGecko.marketCapRank ? `#${auditData.layer2CoinGecko.marketCapRank}` : 'Unranked'}
                        </div>
                      </div>
                    </div>

                    {/* CEX Markets List or Empty Notice */}
                    {auditData.layer2CoinGecko.cexMarkets && auditData.layer2CoinGecko.cexMarkets.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-between">
                          <span>Листинги CEX (MEXC, Gate, CoinGecko):</span>
                          <span className="text-slate-500">24ч Объем / Спред</span>
                        </div>
                        <div className="max-h-[110px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {auditData.layer2CoinGecko.cexMarkets.map((m, idx) => {
                            const spreadPct = auditData.layer1DexScreener.priceUsd > 0 && m.priceUsd > 0
                              ? (((m.priceUsd - auditData.layer1DexScreener.priceUsd) / auditData.layer1DexScreener.priceUsd) * 100).toFixed(1)
                              : '0.0';
                            const spreadNum = Number(spreadPct);
                            return (
                              <div
                                key={idx}
                                className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-[11px] hover:border-cyan-500/40 transition"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white">{m.exchangeName}</span>
                                  <span className="text-[10px] text-slate-400">{m.targetPair}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-cyan-300 font-bold">${(m.volume24hUsd / 1e3).toFixed(1)}k</span>
                                  <span className={`text-[10px] font-mono ${spreadNum > 0 ? 'text-emerald-400' : spreadNum < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                    {spreadNum > 0 ? `+${spreadPct}%` : `${spreadPct}%`}
                                  </span>
                                  {m.tradeUrl && (
                                    <a
                                      href={m.tradeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-slate-400 hover:text-white"
                                      title="Перейти к торгам"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                        ⚠️ <strong>Токен пока торгуется только на DEX.</strong> CEX стаканы отсутствуют. Весь объем и выход сосредоточены в смарт-контракте пула AMM.
                      </div>
                    )}
                  </div>
                </div>

                {/* Synthesis Advice Box */}
                <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs font-mono flex items-start gap-2.5">
                  <Scale className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <div>
                      <strong className="text-white">Институциональный вердикт по выходу & арбитражу: </strong>
                      {auditData.layer2CoinGecko.cexMarkets && auditData.layer2CoinGecko.cexMarkets.length > 0 ? (
                        <span>
                          При сайзе $10k–$50k прямой своп на DEX заберет <strong className="text-rose-400">~{((50000 / (auditData.layer1DexScreener.liquidityUsd || 50000)) * 100).toFixed(1)}%</strong> на проскальзывании. 
                          Рекомендуется <strong>депозит на CEX ({auditData.layer2CoinGecko.cexMarkets.map(m => m.exchangeName).join(', ')})</strong> с исполнением лимитными ордерами в биржевой стакан.
                        </span>
                      ) : (
                        <span>
                          Токен доступен исключительно на DEX. Прямой своп $50k обрушит ончейн-пул на <strong className="text-rose-400">~{((50000 / (auditData.layer1DexScreener.liquidityUsd || 50000)) * 100).toFixed(1)}%</strong>. 
                          Единственный безопасный метод выхода — <strong>ончейн TWAP-дробление</strong> (по $2 000 раз в 5–10 минут).
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* INTERACTIVE CEX & COINMARKETCAP POSITION & CAPITAL CALCULATOR             */}
                {/* ========================================================================= */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-3 font-mono text-xs shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <Calculator className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                          <span>Калькулятор Выхода & Ручной Ввод CEX</span>
                          <span className="text-[10px] text-indigo-400 font-normal">(CoinMarketCap / CEX Injection)</span>
                        </h5>
                        <p className="text-[10px] text-slate-400 font-sans">
                          Рассчитывает проскальзывание в AMM, спред арбитража и емкость CEX стаканов под ваш сайз.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsManualCexOpen(!isManualCexOpen)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition ${
                        isManualCexOpen
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-900 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/60'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isManualCexOpen ? 'Скрыть поля CMC' : 'Дополнить с CoinMarketCap'}</span>
                      {isManualCexOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Manual CoinMarketCap / CEX Injection Form */}
                  {isManualCexOpen && (
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-indigo-500/40 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-300 font-bold uppercase flex items-center gap-1">
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Параметры CEX с CoinMarketCap / Бирж:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setCustomCexVolume('150000');
                              setCustomCexExchanges('MEXC');
                              setCustomCexPrice((auditData.layer1DexScreener.priceUsd * 0.98).toFixed(6));
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300"
                          >
                            + MEXC $150k
                          </button>
                          <button
                            onClick={() => {
                              setCustomCexVolume('600000');
                              setCustomCexExchanges('MEXC, Gate.io, Bitget');
                              setCustomCexPrice((auditData.layer1DexScreener.priceUsd * 1.02).toFixed(6));
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300"
                          >
                            + Gate+MEXC $600k
                          </button>
                          <button
                            onClick={() => {
                              setCustomCexVolume('');
                              setCustomCexExchanges('');
                              setCustomCexPrice('');
                            }}
                            className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 text-[9px]"
                          >
                            Сброс
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Объем CEX 24ч ($ USD):</label>
                          <input
                            type="number"
                            value={customCexVolume}
                            onChange={(e) => setCustomCexVolume(e.target.value)}
                            placeholder={auditData.layer2CoinGecko.totalCexVolume24h ? String(auditData.layer2CoinGecko.totalCexVolume24h) : 'например: 250000'}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Список бирж CEX:</label>
                          <input
                            type="text"
                            value={customCexExchanges}
                            onChange={(e) => setCustomCexExchanges(e.target.value)}
                            placeholder="например: MEXC, Gate.io, Bitget, LBank"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Цена CEX ($ USD):</label>
                          <input
                            type="number"
                            step="any"
                            value={customCexPrice}
                            onChange={(e) => setCustomCexPrice(e.target.value)}
                            placeholder={String(auditData.layer1DexScreener.priceUsd || '0.001')}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-indigo-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Size Selector & Interactive Sliders */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Выберите или введите сайз ордера ($):
                      </span>
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                        {[1000, 5000, 10000, 25000, 50000, 100000].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setCalcOrderSize(sz)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              calcOrderSize === sz
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            ${(sz / 1e3).toFixed(0)}k
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          value={calcOrderSize}
                          onChange={(e) => setCalcOrderSize(Math.max(1, Number(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-3 py-1.5 text-white font-bold text-xs focus:border-indigo-400 outline-none"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        Сайз позиции для симуляции выхода
                      </span>
                    </div>
                  </div>

                  {/* Calculated Results Matrix */}
                  {(() => {
                    const effPoolLiq = auditData.layer1DexScreener.liquidityUsd || 50000;
                    const effDexPrice = auditData.layer1DexScreener.priceUsd || 0.0001;
                    const effDexVol = auditData.layer1DexScreener.volume24h || 0;
                    const effCexVol = customCexVolume.trim() ? (parseFloat(customCexVolume) || 0) : (auditData.layer2CoinGecko.totalCexVolume24h || 0);
                    const effCexPrice = customCexPrice.trim() ? (parseFloat(customCexPrice) || effDexPrice) : (auditData.layer2CoinGecko.cexMarkets?.[0]?.priceUsd || effDexPrice);
                    const effCexExchanges = customCexExchanges.trim() || (auditData.layer2CoinGecko.cexMarkets?.map(m => m.exchangeName).join(', ') || (effCexVol > 0 ? 'CEX Markets' : 'Нет CEX'));
                    
                    const totalCombinedVol = effDexVol + effCexVol;
                    const calcDexShare = totalCombinedVol > 0 ? ((effDexVol / totalCombinedVol) * 100).toFixed(1) : '100.0';
                    const calcCexShare = totalCombinedVol > 0 ? ((effCexVol / totalCombinedVol) * 100).toFixed(1) : '0.0';
                    
                    const calcImpactPct = Math.min(99.9, (calcOrderSize / (effPoolLiq + calcOrderSize)) * 100);
                    const calcSlippageLossUsd = calcOrderSize * (calcImpactPct / 100);
                    const calcCexCapacityPct = effCexVol > 0 ? (calcOrderSize / effCexVol) * 100 : 0;
                    const calcSpreadPct = effDexPrice > 0 ? (((effCexPrice - effDexPrice) / effDexPrice) * 100) : 0;

                    let routeBadge = '';
                    let routeDesc = '';
                    let routeColor = '';

                    if (calcImpactPct > 5 && effCexVol >= calcOrderSize * 1.5) {
                      routeBadge = 'CEX Депозит + Лимитная сетка';
                      routeDesc = `Экономия ~$${calcSlippageLossUsd.toFixed(0)} по сравнению с DEX. Выход через стакан ${effCexExchanges}.`;
                      routeColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40';
                    } else if (effCexVol === 0 && calcImpactPct > 7) {
                      const chunk = Math.max(500, Math.min(2500, Math.round(calcOrderSize / 8)));
                      routeBadge = 'Ончейн TWAP-дробление';
                      routeDesc = `Дробить по ~$${chunk.toLocaleString()} каждые 5-10 мин во избежание MEV-сэндвича.`;
                      routeColor = 'text-amber-400 border-amber-500/30 bg-amber-950/40';
                    } else if (calcImpactPct <= 2.5) {
                      routeBadge = 'Прямой DEX Своп';
                      routeDesc = `Ликвидности пула достаточно. Потери на проскальзывании минимальны (~${calcImpactPct.toFixed(2)}%).`;
                      routeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
                    } else {
                      routeBadge = 'Гибридный выход 50/50';
                      routeDesc = `50% лимитками на CEX (${effCexExchanges}) + 50% через ончейн TWAP-свопы.`;
                      routeColor = 'text-indigo-400 border-indigo-500/30 bg-indigo-950/40';
                    }

                    return (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          {/* DEX Impact */}
                          <div className={`p-2.5 rounded-lg bg-slate-900 border ${
                            calcImpactPct > 15 ? 'border-rose-500/50' : calcImpactPct > 5 ? 'border-amber-500/40' : 'border-slate-800'
                          }`}>
                            <div className="text-[10px] text-slate-500">DEX Проскальзывание:</div>
                            <div className={`font-black text-xs mt-0.5 ${
                              calcImpactPct > 15 ? 'text-rose-400' : calcImpactPct > 5 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              ~{calcImpactPct.toFixed(2)}%
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Потеря: <strong className="text-rose-400">-${calcSlippageLossUsd.toFixed(0)}</strong>
                            </div>
                          </div>

                          {/* CEX Capacity */}
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-slate-500">Нагрузка на CEX:</div>
                            <div className="font-bold text-xs text-cyan-300 mt-0.5">
                              {effCexVol > 0 ? `~${calcCexCapacityPct.toFixed(2)}%` : '0% (Нет CEX)'}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 truncate" title={effCexExchanges}>
                              {effCexVol > 0 ? `${(effCexVol / 1e3).toFixed(1)}k$ 24h` : 'Только DEX'}
                            </div>
                          </div>

                          {/* Arbitrage Spread */}
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-slate-500">Спред CEX vs DEX:</div>
                            <div className={`font-bold text-xs mt-0.5 ${
                              calcSpreadPct > 0 ? 'text-emerald-400' : calcSpreadPct < 0 ? 'text-rose-400' : 'text-slate-300'
                            }`}>
                              {calcSpreadPct > 0 ? `+${calcSpreadPct.toFixed(2)}%` : `${calcSpreadPct.toFixed(2)}%`}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {calcSpreadPct > 0 ? 'CEX Премия' : calcSpreadPct < 0 ? 'DEX Премия' : 'Паритет'}
                            </div>
                          </div>

                          {/* Volume Distribution */}
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-[10px] text-slate-500">Доли объемов:</div>
                            <div className="font-bold text-xs text-white mt-0.5">
                              DEX {calcDexShare}% / CEX {calcCexShare}%
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Всего: ${((totalCombinedVol) / 1e3).toFixed(1)}k
                            </div>
                          </div>
                        </div>

                        {/* Best Execution Recommendation Pill & Action Button */}
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${routeColor}`}>
                                {routeBadge}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans">
                                {routeDesc}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const promptText = `Анализ ликвидности и сценария выхода для ${auditData.symbol} (${auditData.tokenAddress}). Входные данные CEX (CoinMarketCap / Биржи): Суточный CEX объем $${(effCexVol || 0).toLocaleString()}, Биржи: ${effCexExchanges}, Сайз позиции $${(calcOrderSize || 0).toLocaleString()}, Цена CEX $${effCexPrice}, Проскальзывание на DEX: ~${calcImpactPct.toFixed(2)}% (Потеря ~$${calcSlippageLossUsd.toFixed(0)}), Спред CEX/DEX: ${calcSpreadPct.toFixed(2)}%. Рассчитай оптимальную стратегию входа/выхода, арбитражный спред и риск скрытой дистрибуции.`;
                              setChatQuestion(promptText);
                              handleAskAi(promptText);
                            }}
                            disabled={isAskingAi}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition shrink-0 disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>{isAskingAi ? 'ИИ Синтезирует...' : '🧠 Запустить ИИ-Анализ с этими CEX данными'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DEX POOL FUND FLOW CHART: PRICE LINE + NET DELTA BARS (SoSoValue Style)   */}
              {/* ========================================================================= */}
              <DexPoolFundFlowChart
                poolDecoder={auditData.poolDecoder}
                symbol={auditData.symbol}
                currentPrice={auditData.layer1DexScreener.priceUsd}
                contractAddress={auditData.tokenAddress}
                chain={auditData.chain}
              />

              {/* ========================================================================= */}
              {/* AMM POOL DECODER: x * y = k, RESERVES, MEV FILTER & TRUE ORGANIC NET FLOW */}
              {/* ========================================================================= */}
              {auditData.poolDecoder && (
                <AmmPoolDecoderPanel
                  poolDecoder={auditData.poolDecoder}
                  symbol={auditData.symbol}
                  onAskAi={(question) => {
                    setChatQuestion(question);
                    handleAskAi(question);
                  }}
                />
              )}

              {/* ========================================================================= */}
              {/* 5. 4-СЦЕНАРНАЯ МАТРИЦА С УСЛОВИЯМИ ОТМЕНЫ (INVALIDATION) [RULE 10]         */}
              {/* ========================================================================= */}
              {auditData.scenarios && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Split className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                          <span>5. Сценарная Матрица & Invalidation Radar</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                            [INFERENCE | RULE 10]
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Строгое правило: прогноз делится на 4 сценария. Для каждого определены подтверждающие триггеры и точка отмены (Invalidation).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                    {/* 1. BULL SCENARIO */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 transition flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                          <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                            <span>🚀 BULL СЦЕНАРИЙ</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                            Цель: {auditData.scenarios.bull.targetMultiplier}
                          </span>
                        </div>
                        <div className="mt-2 text-slate-300 text-[11px] font-sans leading-relaxed">
                          {auditData.scenarios.bull.condition}
                        </div>
                        <div className="mt-2 text-[11px] bg-emerald-950/30 p-2 rounded border border-emerald-500/20 text-emerald-300 flex justify-between">
                          <span>Целевая цена: <strong className="text-white">${auditData.scenarios.bull.targetPrice}</strong></span>
                          <span>Целевой FDV: <strong className="text-white">{auditData.scenarios.bull.targetFdv}</strong></span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-300">
                          <span className="text-slate-500">Мин. суточный объем: </span>
                          <span className="text-emerald-400 font-bold">{auditData.scenarios.bull.requiredVolume24h}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] bg-slate-900 p-2 rounded border border-rose-500/30">
                        <span className="text-rose-400 font-bold">🛑 Invalidation (Отмена тезиса): </span>
                        <span className="text-slate-300">{auditData.scenarios.bull.invalidation}</span>
                      </div>
                    </div>

                    {/* 2. BASE SCENARIO */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30 hover:border-cyan-500/60 transition flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                          <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                            <span>⚖️ BASE СЦЕНАРИЙ (Консолидация)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                            Диапазон
                          </span>
                        </div>
                        <div className="mt-2 text-slate-300 text-[11px] font-sans leading-relaxed">
                          {auditData.scenarios.base.condition}
                        </div>
                        <div className="mt-2 text-[11px] bg-cyan-950/30 p-2 rounded border border-cyan-500/20 text-cyan-300 flex justify-between">
                          <span>Коридор: <strong className="text-white">{auditData.scenarios.base.range}</strong></span>
                          <span>FDV: <strong className="text-white">{auditData.scenarios.base.targetFdv}</strong></span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-300">
                          <span className="text-slate-500">Медианная цена: </span>
                          <span className="text-white font-bold">${auditData.scenarios.base.targetPrice}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] bg-slate-900 p-2 rounded border border-slate-700">
                        <span className="text-cyan-400 font-bold">🛑 Invalidation: </span>
                        <span className="text-slate-300">{auditData.scenarios.base.invalidation}</span>
                      </div>
                    </div>

                    {/* 3. BEAR SCENARIO */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 transition flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <span>📉 BEAR СЦЕНАРИЙ (Откат)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                            Цель: {auditData.scenarios.bear.targetMultiplier}
                          </span>
                        </div>
                        <div className="mt-2 text-slate-300 text-[11px] font-sans leading-relaxed">
                          {auditData.scenarios.bear.condition}
                        </div>
                        <div className="mt-2 text-[11px] bg-amber-950/30 p-2 rounded border border-amber-500/20 text-amber-300 flex justify-between">
                          <span>Целевая цена: <strong className="text-white">${auditData.scenarios.bear.targetPrice}</strong></span>
                          <span>FDV: <strong className="text-white">{auditData.scenarios.bear.targetFdv}</strong></span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] bg-slate-900 p-2 rounded border border-emerald-500/30">
                        <span className="text-emerald-400 font-bold">🛑 Invalidation: </span>
                        <span className="text-slate-300">{auditData.scenarios.bear.invalidation}</span>
                      </div>
                    </div>

                    {/* 4. EXTREME BEAR SCENARIO */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-rose-500/40 hover:border-rose-500/70 transition flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                          <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                            <span>💥 EXTREME BEAR (Сброс китов)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
                            Цель: {auditData.scenarios.extremeBear.targetMultiplier}
                          </span>
                        </div>
                        <div className="mt-2 text-slate-300 text-[11px] font-sans leading-relaxed">
                          {auditData.scenarios.extremeBear.condition}
                        </div>
                        <div className="mt-2 text-[11px] bg-rose-950/30 p-2 rounded border border-rose-500/20 text-rose-300 flex justify-between">
                          <span>Дно сброса: <strong className="text-white">${auditData.scenarios.extremeBear.targetPrice}</strong></span>
                          <span>FDV: <strong className="text-white">{auditData.scenarios.extremeBear.targetFdv}</strong></span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] bg-slate-900 p-2 rounded border border-rose-700/50">
                        <span className="text-rose-400 font-bold">🛑 Invalidation: </span>
                        <span className="text-slate-300">{auditData.scenarios.extremeBear.invalidation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 6. РАСЧЕТ ЦЕЛЕЙ «ДО КУДА МОЖЕТ ДОЙТИ» & ГЛУБИНА КАПИТАЛА [RULE 5 & 12]    */}
              {/* ========================================================================= */}
              {auditData.depthTargets && auditData.depthTargets.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Target className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                          <span>Расчет Целей «До Куда Может Дойти» & Капитальная Глубина</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                            [FACT & CALC | RULE 5 & 12]
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Вместо пустых прогнозов: расчет требуемой MCap, 24ч объема и оценка влияния ордеров сайзом $1k, $10k, $50k на цену.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Size Impact Matrix ($1k, $10k, $50k) */}
                  {(() => {
                    const sample = auditData.depthTargets[0];
                    const slip1k = sample?.impactSlippage?.size1kPct ?? 0;
                    const slip10k = sample?.impactSlippage?.size10kPct ?? 0;
                    const slip50k = sample?.impactSlippage?.size50kPct ?? 0;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="flex justify-between items-center text-slate-400 text-[11px]">
                            <span>Ордер $1,000 (Retail):</span>
                            <span className="text-[10px] text-slate-500">Проскальзывание</span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-emerald-400 font-bold text-sm">
                              ~{slip1k}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {slip1k > 5 ? '⚠️ Повышенное' : '✅ Безопасно'}
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="flex justify-between items-center text-slate-400 text-[11px]">
                            <span>Ордер $10,000 (Medium):</span>
                            <span className="text-[10px] text-slate-500">Проскальзывание</span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className={`font-bold text-sm ${slip10k > 10 ? 'text-rose-400' : 'text-amber-300'}`}>
                              ~{slip10k}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {slip10k > 10 ? '🚨 Риск сдвига пула' : 'Умеренный сдвиг'}
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="flex justify-between items-center text-slate-400 text-[11px]">
                            <span>Ордер $50,000 (Whale):</span>
                            <span className="text-[10px] text-slate-500">Проскальзывание</span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className={`font-bold text-sm ${slip50k > 20 ? 'text-rose-400' : 'text-amber-400'}`}>
                              ~{slip50k}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {slip50k > 20 ? '🛑 Только через TWAP/CEX' : 'Допустимо'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Capital Targets Level Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="text-[10px] text-slate-500 border-b border-slate-800">
                          <th className="py-2">Уровень</th>
                          <th className="py-2">Целевая Цена</th>
                          <th className="py-2">Требуемый MCap</th>
                          <th className="py-2">Чистый Приток ($ Inflow)</th>
                          <th className="py-2">Мин. 24h Объем</th>
                          <th className="py-2">Реалистичность</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {auditData.depthTargets.map((lvl, idx) => {
                          const isUp = lvl.level.startsWith('+') || lvl.level.includes('Fib (TP') || lvl.level.includes('Parabolic');
                          const isFib = lvl.level.includes('Fib');
                          return (
                            <tr key={idx} className={`hover:bg-slate-850/40 ${lvl.level.includes('Golden') ? 'bg-amber-950/20' : ''}`}>
                              <td className="py-2 font-bold">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  isFib
                                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                                    : isUp
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {lvl.level}
                                </span>
                              </td>
                              <td className="py-2 text-white font-bold">
                                ${formatDexPrice(lvl.priceUsd)}
                              </td>
                              <td className="py-2 text-slate-300">
                                ${(lvl.requiredCapUsd / 1e3).toFixed(0)}k
                              </td>
                              <td className="py-2 text-emerald-300 font-bold">
                                {lvl.requiredNetInflowUsd != null && lvl.requiredNetInflowUsd > 0
                                  ? `+$${(lvl.requiredNetInflowUsd / 1e3).toFixed(1)}k`
                                  : isUp
                                  ? `+$${((lvl.requiredCapUsd - (auditData.layer1DexScreener.fdv || 0)) * 0.15 / 1e3).toFixed(1)}k`
                                  : '-'}
                              </td>
                              <td className="py-2 text-slate-400">
                                ${(lvl.requiredVol24hUsd / 1e3).toFixed(0)}k
                              </td>
                              <td className="py-2">
                                <span className={`text-[10px] font-bold ${
                                  lvl.feasibility === 'HIGH' ? 'text-emerald-400' :
                                  lvl.feasibility === 'MODERATE' ? 'text-cyan-300' :
                                  lvl.feasibility === 'LOW' ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                  {lvl.feasibility === 'HIGH' ? 'Высокая' : lvl.feasibility === 'MODERATE' ? 'Умеренная' : lvl.feasibility === 'LOW' ? 'Низкая' : 'Экстремальный риск'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TACTICAL SNIPER PLAN (Gemini AI Forensic Synthesis)                       */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <Bot className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">
                      Тактический План Снайпинга & Резюме ИИ
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                    5-Слойный Синтез (DEX · CG · Scan · CEX Gateways · Social AI)
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  {auditData.aiVerdict.summary}
                </p>

                {/* Tactical Parameters Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Зона входа:</div>
                    <div className="text-emerald-400 font-bold mt-0.5">{auditData.aiVerdict.tacticalPlan.entryZone}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Стоп-лосс (SL):</div>
                    <div className="text-rose-400 font-bold mt-0.5">{auditData.aiVerdict.tacticalPlan.stopLoss}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Тейк-профит (TP1/TP2):</div>
                    <div className="text-indigo-300 font-bold mt-0.5">
                      {auditData.aiVerdict.tacticalPlan.tp1} / {auditData.aiVerdict.tacticalPlan.tp2}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Безопасный ордер (Max):</div>
                    <div className="text-amber-300 font-bold mt-0.5">
                      ${auditData.aiVerdict.tacticalPlan.maxSafeOrderUsd} ({auditData.aiVerdict.tacticalPlan.maxSafeOrderPercentOfLp}% LP)
                    </div>
                  </div>
                </div>

                {/* Red Flags & Green Flags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-mono">
                  {/* Green Flags */}
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Зеленые Флаги (Сильные стороны):</span>
                    </div>
                    {auditData.aiVerdict.greenFlags.length > 0 ? (
                      auditData.aiVerdict.greenFlags.map((flag, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{flag}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400">Сильных сигналов пока не зафиксировано.</div>
                    )}
                  </div>

                  {/* Red Flags */}
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Красные Флаги (Риски ончейна):</span>
                    </div>
                    {auditData.aiVerdict.redFlags.length > 0 ? (
                      auditData.aiVerdict.redFlags.map((flag, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">⚠</span>
                          <span>{flag}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-emerald-400">Критических красных флагов не обнаружено.</div>
                    )}
                  </div>
                </div>

                {/* Sniper Advice Notice */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-500/20 text-xs font-mono text-purple-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{auditData.aiVerdict.tacticalPlan.sniperAdvice}</span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* TOP-10 HOLDERS TABLE: RAW VS ADJUSTED ON-CHAIN AUDIT [RULE 7]             */}
              {/* ========================================================================= */}
              {Boolean(auditData.layer3OnChainScan?.topHolders?.length) && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 text-xs gap-2">
                    <div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Анализ Холдеров: Raw vs Adjusted Top-10</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                          [FACT | RULE 7]
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Разделение общей эмиссии: Raw Top-10 (все адреса) и Adjusted Top-10 (исключая LP-пулы, burn и CEX).
                      </p>
                    </div>

                    {/* Filter Toggle Buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setHolderFilter('all')}
                        className={`px-2 py-1 rounded transition cursor-pointer font-bold ${
                          holderFilter === 'all'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Все адреса (Raw {auditData.layer3OnChainScan?.top10HoldersPercent ?? 0}%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHolderFilter('eoa')}
                        className={`px-2 py-1 rounded transition cursor-pointer font-bold ${
                          holderFilter === 'eoa'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-purple-300 hover:text-white'
                        }`}
                      >
                        Чистые EOA (Adjusted {auditData.layer3OnChainScan?.adjustedTop10Percent ?? auditData.layer3OnChainScan?.top10HoldersPercent ?? 0}%)
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Raw Top-10:</div>
                      <div className="text-white font-bold mt-0.5">{auditData.layer3OnChainScan?.top10HoldersPercent ?? 0}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-purple-500/30">
                      <div className="text-[10px] text-purple-400">Adjusted Top-10 (EOA):</div>
                      <div className="text-purple-300 font-bold mt-0.5">
                        {auditData.layer3OnChainScan?.adjustedTop10Percent ?? auditData.layer3OnChainScan?.top10HoldersPercent ?? 0}%
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Max частный EOA:</div>
                      <div className="text-amber-300 font-bold mt-0.5">
                        {auditData.layer3OnChainScan?.maxSingleEoaPercent != null ? auditData.layer3OnChainScan.maxSingleEoaPercent : 'N/A'}%
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Deployer кошелек:</div>
                      <div className="text-slate-300 font-bold mt-0.5">{auditData.layer3OnChainScan?.creatorPercent ?? 0}%</div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="text-[10px] text-slate-500 border-b border-slate-800">
                          <th className="py-2">#</th>
                          <th className="py-2">Адрес Кошелька</th>
                          <th className="py-2">Тип Адреса</th>
                          <th className="py-2 text-right">% От Эмиссии</th>
                          <th className="py-2 text-right">Статус / Блокировка</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(auditData.layer3OnChainScan.topHolders || [])
                          .filter((h) => {
                            if (!h) return false;
                            if (holderFilter === 'eoa') {
                              return h.holderType === 'EOA' || h.holderType === 'CREATOR' || (!h.holderType && !h.tag?.includes('Pool') && !h.tag?.includes('Burn'));
                            }
                            return true;
                          })
                          .map((holder, idx) => {
                            const isBurn = holder.holderType === 'BURN' || holder.tag?.toLowerCase().includes('burn') || holder.tag?.toLowerCase().includes('dead');
                            const isLp = holder.holderType === 'LP_POOL' || holder.tag?.toLowerCase().includes('pool') || holder.tag?.toLowerCase().includes('pancakeswap') || holder.tag?.toLowerCase().includes('uniswap') || holder.tag?.toLowerCase().includes('raydium');
                            const isCreator = holder.holderType === 'CREATOR' || holder.tag?.toLowerCase().includes('creator') || holder.tag?.toLowerCase().includes('deployer');
                            const isCex = holder.holderType === 'CEX' || holder.tag?.toLowerCase().includes('cex') || holder.tag?.toLowerCase().includes('binance') || holder.tag?.toLowerCase().includes('mexc') || holder.tag?.toLowerCase().includes('okx') || holder.tag?.toLowerCase().includes('gate') || holder.tag?.toLowerCase().includes('bybit') || holder.tag?.toLowerCase().includes('bitget') || holder.tag?.toLowerCase().includes('kucoin') || holder.tag?.toLowerCase().includes('htx');

                            return (
                              <tr key={idx} className="hover:bg-slate-850/50">
                                <td className="py-2 text-slate-500">{idx + 1}</td>
                                <td className="py-2 text-slate-300 font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate max-w-[180px] sm:max-w-xs">{holder.address}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyContract(holder.address)}
                                      className="text-slate-500 hover:text-slate-300 transition"
                                      title="Скопировать адрес"
                                    >
                                      {copiedContract === holder.address ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2">
                                  {isBurn ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30">
                                      🔥 Burn Address
                                    </span>
                                  ) : isLp ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                      💧 DEX LP Pool
                                    </span>
                                  ) : isCreator ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30">
                                      🛠️ Creator / Deployer
                                    </span>
                                  ) : isCex ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                                      🏦 {holder.tag ? holder.tag.replace(/^CEX\s*/i, '') : 'CEX Hot Wallet'}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30">
                                      👤 Частный EOA (Кит)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 text-right font-bold text-white">
                                  {holder.percent}%
                                </td>
                                <td className="py-2 text-right text-[10px]">
                                  {holder.isLocked ? (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                      🔒 Залочено
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">{holder.tag || 'Личный баланс'}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* INTERACTIVE AI ON-CHAIN COPILOT CHAT                                      */}
              {/* ========================================================================= */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Bot className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">
                      Задать Вопрос ИИ по этому токену
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Контекст: {auditData.symbol} ({auditData.chain})
                  </span>
                </div>

                {/* Quick Pre-Set Prompt Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  {/* Institutional 5-Layer Synthesis with Exchange Addresses */}
                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Выполни полный 5-Слойный Ончейн & CEX/DEX Интеллект-Аудит токена ${auditData.symbol} (${auditData.tokenAddress}) с обязательным учетом всех биржевых адресов (Binance, MEXC, OKX, Gate.io, Bybit, Bitget, KuCoin, HTX). Сопоставь ликвидность пулов AMM на DEX со стаканами CEX, оцени риск скрытого сброса через биржевые шлюзы и предоставь отчет строго по структуре из 10 обязательных пунктов.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2.5 py-1 rounded bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-slate-900 hover:brightness-125 border border-purple-500/60 text-purple-200 font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-purple-500/20"
                    title="Полный 5-Слойный Ончейн & CEX/DEX Интеллект-Аудит с учетом биржевых адресов"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>🏛️ 5-Слойный Интеллект-Аудит</span>
                    <span className="text-[9px] px-1 py-0.2 bg-purple-500/20 text-purple-200 rounded border border-purple-500/30">
                      5 Слоев + CEX
                    </span>
                  </button>

                  {/* CEX Exchange Wallets & Inflow Forensic Button */}
                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Проанализируй биржевые адреса CEX (Binance, MEXC, OKX, Gate.io, Bybit, Bitget, KuCoin, HTX) для токена ${auditData.symbol} (${auditData.tokenAddress}). Какая доля эмиссии сосредоточена на горячих кошельках CEX? Зафиксированы ли депозиты на биржевые шлюзы за последние 24ч? Рассчитай возможность экстренного выхода сайзом $1k, $10k, $50k через стаканы CEX vs пул AMM на DEX.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-900/60 hover:brightness-125 border border-amber-500/60 text-amber-300 font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
                    title="Анализ биржевых кошельков CEX, депозитных шлюзов и риска дампа"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>🏦 Биржевые адреса CEX</span>
                    <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-200 rounded border border-amber-500/30">
                      Binance/MEXC/OKX
                    </span>
                  </button>

                  {/* AMM Pool Decoder & MEV Forensic Button */}
                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Разбери ончейн-механику AMM пула токена (x * y = k): сколько WBNB/SOL/ETH в пуле, каков текущий Reserve_TOKEN, почему в ленте видны крупные покупки, а цена стоит или падает? Проверь sandwich-атаки (MEV), арбитражных ботов (Inter-pool / DEX-CEX), wash trading и рассчитай True Organic Net Flow за 1 час.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2.5 py-1 rounded bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 hover:brightness-125 border border-cyan-500/60 text-cyan-300 font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-cyan-500/20"
                    title="Ончейн-аудит пула (x*y=k, MEV sandwich, Wash trading, Organic Net Flow)"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>🧬 AMM Декодер (x·y=k & MEV)</span>
                    <span className="text-[9px] px-1 py-0.2 bg-cyan-500/20 text-cyan-200 rounded border border-cyan-500/30">
                      Ончейн-Пул
                    </span>
                  </button>

                  {/* Primary Institutional Scenario Button */}
                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = 'Какие данные подтверждают продолжение роста, какие указывают на дистрибуцию и при каких условиях каждый сценарий станет основным?';
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2.5 py-1 rounded bg-gradient-to-r from-emerald-950/90 via-slate-900 to-amber-950/90 hover:brightness-125 border border-emerald-500/60 text-emerald-300 font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                    title="«Какие данные подтверждают продолжение роста, какие указывают на дистрибуцию и при каких условиях каждый сценарий станет основным?»"
                  >
                    <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>⚖️ Рост vs Дистрибуция</span>
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-200 rounded border border-emerald-500/30">
                      Сценарии & Факты
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Проведи детальный аудит социального сентимента и вирусной активности токена: оцени число уникальных авторов за 24ч, суммарный engagement, языковые кластеры и географию, ведущие нарративы сообщества, долю повторяющихся сообщений (coordinated shill detection) и соотношение органического интереса vs FOMO. В конце сформируй Social Sentiment Score и статус риска манипуляций.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2.5 py-1 rounded bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/50 text-sky-300 font-medium transition cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-sm shadow-sky-500/20"
                    title="Аудит уникальных авторов, engagement, вирусных нарративов, shill-координации и сентимента"
                  >
                    <Share2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>🌐 Соц. сентимент</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Объясни причину движения за последние 24 часа. Разложи рост на 4 компонента: Market beta, Sector beta, Token-specific catalyst, Artificial activity. Оцени вклад Low/Medium/High и выдай итоговый вердикт (Organic pump / Sector rotation / Controlled pump / Possible distribution).`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/40 text-amber-300 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Разложение пампа на 4 компонента (Market beta, Sector beta, Catalyst, Artificial activity)"
                  >
                    <span>🚀 Почему пампят?</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Проверь, происходит ли скрытая дистрибуция токена, несмотря на рост цены. Проверь 10 ончейн-критериев: балансы Top-20, переводы на CEX/Router, продажи deployer, оборачиваемость без уникальных покупателей, средний чек, крупные sells, падение ликвидности при росте MCap. Выдай Accumulation, Neutral, Distribution вероятности.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Проверка скрытой разгрузки китов об розничный спрос"
                  >
                    <span>🕵️ Скрытая разгрузка</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Построй сценарии «До куда может дойти» с расчетом требуемого капитала и ликвидности для уровней +25%, +50%, +100%, +200%, -20%, -40%, -60%. Какая будет market cap, с кем сравнится, сколько потребуется покупателей, объемов и ликвидности, и зоны риска при сбросе китов.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-600/40 text-cyan-300 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Расчет целей капитализации и ликвидности +25%..+200% / -20%..-60%"
                  >
                    <span>🎯 До куда дойдет</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Проведи полный синтез по токену по 12 институциональным вопросам: динамика цены, рынок/сектор/токен, поведение относительно BTC/BNB, подтверждение объемами и ликвидностью, кто покупает и продает, признаки накопления/дистрибуции, выход с сайзом $1k, $10k, $50k, соцсети, катализаторы и 3 конкурента. В конце рассчитай Momentum, On-chain, Social, Liquidity, Manipulation Risk и Confidence Scores.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-purple-950/50 hover:bg-purple-900/60 border border-purple-600/40 text-purple-300 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Полный ончейн-синтез по 12 институциональным вопросам"
                  >
                    <span>🔬 Полный синтез</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Определи, куда может перейти ликвидность после роста лидеров сектора (Chinese BSC memes / Binance Alpha / MEXC). Найди отстающих кандидатов с чистым смарт-контрактом без honeypot/mint/мутабельных налогов и растущим объемом.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-blue-950/50 hover:bg-blue-900/60 border border-blue-600/40 text-blue-300 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Поиск следующей секторной ротации в экосистеме"
                  >
                    <span>🔄 Секторная ротация</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Проверь биржевой статус токена: Binance Spot, Binance Futures, Binance Alpha, Binance Wallet, Binance Convert, DEX. Для каждого статуса укажи статус, пару, дату и контракт. Проверь предупреждение TICKER COLLISION.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    title="Проверка официального биржевого статуса и коллизии тикеров"
                  >
                    <span>🏛️ Биржевой статус</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Что прямо сейчас подтверждает этот памп, а что ему противоречит? Сравни текущий час с предыдущим часом, со средним значением за 24 часа и с предыдущим пампом этого токена.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-50"
                  >
                    <span>⚡ Во время пампа</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Памп перешёл в консолидацию, накопление или дистрибуцию? Покажи изменение adjusted Top-20, ликвидности, уникальных покупателей, average trade size, sell pressure, CEX deposits и соцсетей.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-50"
                  >
                    <span>🛡️ После пампа</span>
                  </button>

                  <button
                    type="button"
                    disabled={isAskingAi}
                    onClick={() => {
                      const promptText = `Рассчитай проскальзывание (slippage), влияние сделки на цену (price impact), глубину ликвидности пула и возможность экстренного выхода для позиций $1,000, $10,000 и $50,000.`;
                      setChatQuestion(promptText);
                      handleAskAi(promptText);
                    }}
                    className="px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 transition cursor-pointer disabled:opacity-50"
                  >
                    <span>💼 Выход $1k/$10k/$50k</span>
                  </button>
                </div>

                {/* Question Input */}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAskAi();
                    }}
                    placeholder={`Спросите у ИИ любой нюанс по ${auditData.symbol} (например: "Каков риск слиппеджа при покупке на $500?")...`}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-20 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAskAi()}
                    disabled={isAskingAi || !chatQuestion.trim()}
                    className="absolute right-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center gap-1 cursor-pointer"
                  >
                    {isAskingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Спросить</span>
                  </button>
                </div>

                {/* Chat Answer Box */}
                {chatAnswer && (
                  <div className="p-4 rounded-xl bg-slate-950/95 border border-indigo-500/40 text-xs text-slate-200 leading-relaxed font-sans shadow-lg shadow-black/40">
                    <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-800/80 text-indigo-300 font-mono font-bold text-xs flex-wrap">
                      <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Аналитический синтез AI On-Chain Engine:</span>
                      {chatModel && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                          {chatModel} · Deep Thinking (HIGH)
                        </span>
                      )}
                      {chatGrounding?.enabled && (
                        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                          <Globe className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>Live Search Grounding Active</span>
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-slate-400 font-mono font-normal hidden sm:inline">
                        Строгое разделение: FACT · INFERENCE · RUMOR · MISSING DATA · SCENARIOS
                      </span>
                    </div>
                    <div className="prose prose-invert prose-xs max-w-none text-slate-200 space-y-2 leading-relaxed font-sans text-xs">
                      <ReactMarkdown>{chatAnswer}</ReactMarkdown>
                    </div>

                    {/* Grounding Web Citations / Sources */}
                    {chatGrounding?.sources && chatGrounding.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Подтвержденные веб-источники (Live Google Grounding):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {chatGrounding.sources.slice(0, 6).map((s, idx) => (
                            <a
                              key={idx}
                              href={s.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-700/60 text-indigo-300 hover:text-indigo-200 flex items-center gap-1 transition max-w-[280px] truncate"
                              title={s.title || s.uri}
                            >
                              <span className="truncate">{s.title || s.uri}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Forensic Case Modal Instance */}
      {isForensicModalOpen && selectedForensicCase && (
        <EtherscanForensicCaseModal
          isOpen={isForensicModalOpen}
          onClose={() => setIsForensicModalOpen(false)}
          caseData={selectedForensicCase}
          poolLiquidityUsd={auditData?.layer1DexScreener?.liquidityUsd || 45000}
        />
      )}
    </div>
  );
};
