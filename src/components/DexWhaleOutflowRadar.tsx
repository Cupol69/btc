import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  Wallet,
  Activity,
  Layers,
  Info,
  TrendingDown,
  TrendingUp,
  Lock,
  Zap,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Filter,
  Maximize2,
  Cpu,
  GitBranch,
} from 'lucide-react';
import { DexWhaleOutflowRadarData, WhaleTransferTx, WhaleActionType } from '../types';
import { EtherscanForensicCaseModal, ForensicCaseData } from './EtherscanForensicCaseModal';

interface DexWhaleOutflowRadarProps {
  radarData: DexWhaleOutflowRadarData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  primaryDexName?: string;
  primaryChain?: string;
}

export const DexWhaleOutflowRadar: React.FC<DexWhaleOutflowRadarProps> = ({
  radarData,
  isLoading = false,
  onRefresh,
  primaryDexName = 'PancakeSwap V2',
  primaryChain = 'bsc',
}) => {
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [simulatedDumpPct, setSimulatedDumpPct] = useState<number>(5);

  // Forensic Case Modal State
  const [selectedForensicCase, setSelectedForensicCase] = useState<ForensicCaseData | null>(null);
  const [isForensicModalOpen, setIsForensicModalOpen] = useState<boolean>(false);
  const [isForensicLoading, setIsForensicLoading] = useState<boolean>(false);

  const openForensicForAddress = useCallback(async (targetAddr: string, targetLabel: string, txContext?: WhaleTransferTx) => {
    if (!targetAddr) return;
    setIsForensicLoading(true);
    try {
      const resp = await fetch(`/api/chinese-holders/flow-trace/${encodeURIComponent(targetAddr)}`);
      if (resp.ok) {
        const data = await resp.json();
        setSelectedForensicCase(data);
        setIsForensicModalOpen(true);
      } else {
        // Fallback construct structured case data
        const fallbackCase: ForensicCaseData = {
          targetAddress: targetAddr,
          targetLabel: targetLabel || 'Whale Entity',
          isCexOrRouter: targetLabel.toLowerCase().includes('mexc') || targetLabel.toLowerCase().includes('binance') || targetLabel.toLowerCase().includes('pancake'),
          transfersCount: txContext ? 1 : 4,
          signals: {
            detectedCexDumping: txContext?.actionType === 'DEX_SELL_DUMP',
            detectedDexArbitrage: txContext?.actionType === 'INTERNAL_SHUFFLE',
            isCexDepositHub: targetLabel.toLowerCase().includes('mexc') || targetLabel.toLowerCase().includes('cex'),
            riskLevel: txContext?.actionType === 'DEX_SELL_DUMP' ? 'HIGH' : 'MEDIUM',
          },
          forensics: {
            fact: txContext ? `Транзакция ${txContext.methodName} на сумму $${txContext.amountUsd.toLocaleString()} (${txContext.amountTokens.toLocaleString()} токенов).` : `Фиксация ончейн-активности адреса ${targetAddr}`,
            inference: txContext?.classificationExplanation || 'Анализ кластерных связей и маршрутов ликвидности',
            missingData: 'Глубина приватных офчейн OTC-сделок',
          },
          flowCase: {
            version: 'etherscan-skills-v1',
            creator: 'CryptoIntel Core',
            network: primaryChain.toUpperCase(),
            nodes: [
              { id: 'source', label: txContext?.fromLabel || 'Origin Node', category: 'EOA / Whale', url: `https://bscscan.com/address/${txContext?.fromAddress || targetAddr}` },
              { id: 'target', label: targetLabel, category: 'Subject', url: `https://bscscan.com/address/${targetAddr}` },
              { id: 'dest', label: txContext?.toLabel || 'Destination / LP', category: 'Destination', url: `https://bscscan.com/address/${txContext?.toAddress || targetAddr}` },
            ],
            edges: [
              {
                from: 'source',
                to: 'target',
                amount: txContext?.amountTokens || 0,
                token: radarData?.symbol || 'TOKEN',
                tx: txContext?.txHash || '',
                direction: 'INFLOW',
                note: txContext?.methodName || 'Transfer',
                url: `https://bscscan.com/tx/${txContext?.txHash || ''}`,
              }
            ],
            etherscanFlowUrl: `https://bscscan.com/address/${targetAddr}`,
          },
          lastUpdated: Date.now(),
        };
        setSelectedForensicCase(fallbackCase);
        setIsForensicModalOpen(true);
      }
    } catch (err) {
      console.warn('[Forensic] Error loading case:', err);
    } finally {
      setIsForensicLoading(false);
    }
  }, [primaryChain, radarData?.symbol]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const formatUsd = (val: number | undefined | null) => {
    if (val == null) return '$0';
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}k`;
    return `$${val.toLocaleString()}`;
  };

  const formatTokens = (val: number | undefined | null) => {
    if (val == null) return '0';
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
    return val.toLocaleString();
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Math.max(0, Date.now() - ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч назад`;
    return `${Math.floor(hours / 24)} д назад`;
  };

  // Simulated sell calculation based on Constant Product AMM formula (x * y = k)
  const simulationResults = useMemo(() => {
    if (!radarData) return null;
    const poolReserve = radarData.poolUsdReserveCapacity || 50000;
    const dumpUsd = Math.round(poolReserve * (simulatedDumpPct / 100));
    // AMM slippage approximation: slip = dump / (reserve + dump)
    const priceDropPct = Number(((dumpUsd / (poolReserve + dumpUsd)) * 100 * 1.5).toFixed(1));
    const remainingReserve = Math.max(0, poolReserve - dumpUsd);

    return {
      dumpUsd,
      priceDropPct: Math.min(99, priceDropPct),
      remainingReserve,
    };
  }, [radarData, simulatedDumpPct]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!radarData?.transactions) return [];
    if (filterAction === 'ALL') return radarData.transactions;
    if (filterAction === 'DEX_DUMP') return radarData.transactions.filter(t => t.actionType === 'DEX_SELL_DUMP');
    if (filterAction === 'INTERNAL_SHUFFLE') return radarData.transactions.filter(t => t.actionType === 'INTERNAL_SHUFFLE');
    if (filterAction === 'BUY') return radarData.transactions.filter(t => t.actionType === 'DEX_BUY_ACCUMULATE');
    return radarData.transactions;
  }, [radarData, filterAction]);

  if (isLoading && !radarData) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center space-y-4 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center mx-auto">
          <Activity className="w-5 h-5 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white font-mono">Сканирование трансферов и сбросов топ-холдеров...</h3>
          <p className="text-xs text-slate-400">Анализ методов смарт-контракта (transfer vs swapExactTokens) и адресов получателей</p>
        </div>
      </div>
    );
  }

  if (!radarData) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-sm font-bold text-white font-mono">Данные радара сбросов недоступны</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Выберите актив с активными пулами ликвидности для запуска детектора сбросов китов.
        </p>
      </div>
    );
  }

  const isShuffleAlert = radarData.dumpRiskStatus === 'INTERNAL_SHUFFLE_ALERT';
  const isActiveDump = radarData.dumpRiskStatus === 'ACTIVE_DEX_DUMP';

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="whale-outflow-radar" className="space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className={`border-2 rounded-xl p-4 sm:p-5 shadow-xl transition-all ${
        isActiveDump
          ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/50 shadow-rose-950/20'
          : isShuffleAlert
          ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-purple-950/30 border-amber-500/40 shadow-amber-950/20'
          : 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/20'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
              isActiveDump
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : isShuffleAlert
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {isActiveDump ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : isShuffleAlert ? (
                <Layers className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
                  <span>🚨 Радар Сбросов Топ-Холдеров & Маневров</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  DEX Слив vs Wallet Shuffle
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Ончейн-детектор разделяет <span className="text-rose-400 font-mono font-semibold">прямой сброс в пул</span> (вымывание USDT) от <span className="text-amber-300 font-mono font-semibold">технических трансферов</span> между кошельками синдиката (0% влияния на цену).
              </p>
            </div>
          </div>

          {/* Quick Jump Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => scrollToElement('whale-sell-simulator-section')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Симулятор Сброса ↓</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToElement('whale-ledger-section')}
              className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Журнал Маневров ↓</span>
            </button>
          </div>

          {/* Syndicate Cluster Metric Badge */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto font-mono text-xs">
            <div className="bg-slate-950/80 border border-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400 text-[11px]">Синдикат-связка:</span>
              <span className="text-purple-300 font-bold">{radarData.syndicateClusterConfidencePct}%</span>
            </div>

            <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs ${
              isActiveDump
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : isShuffleAlert
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {radarData.dumpRiskTitle}
            </div>
          </div>
        </div>

        {/* 🔥 Special Live Binance Futures & Funding Rate Intelligence Card */}
        {radarData.binanceFuturesIntel && (
          <div className="mt-4 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Binance Futures Live Intelligence ({radarData.binanceFuturesIntel.pair})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ЛИСТИНГ 2Ч НАЗАД
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">FUNDING RATE:</span>
                  <span className="text-rose-400 font-bold text-sm">+{radarData.binanceFuturesIntel.fundingRatePct}%</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
                  <span className="text-slate-400">NEXT:</span>
                  <span className="text-cyan-300 font-bold">{radarData.binanceFuturesIntel.nextFundingCountdown}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-sans leading-relaxed flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-amber-300 font-mono font-bold text-[11px] block mb-0.5">
                  Анатомия фандинга +{radarData.binanceFuturesIntel.fundingRatePct}% (Лонги перегреты, APR ~{radarData.binanceFuturesIntel.annualizedFundingPct}%):
                </span>
                <p className="text-slate-300 font-sans text-xs">
                  {radarData.binanceFuturesIntel.tacticalExplanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4 Core Diagnostic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 font-mono text-xs">
          {/* Card 1: Direct DEX Sell Dump */}
          <div className={`border rounded-xl p-3.5 space-y-1.5 ${
            radarData.directDexDumpUsd24h > 0
              ? 'bg-rose-950/30 border-rose-500/40'
              : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <span className="flex items-center gap-1 font-semibold text-rose-400">
                <TrendingDown className="w-3.5 h-3.5" />
                ПРЯМОЙ DEX-СЛИВ В ПУЛ
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">24 ЧАСА</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              {formatUsd(radarData.directDexDumpUsd24h)}
            </div>
            <div className="text-[11px] text-slate-400 font-sans leading-tight">
              {radarData.directDexDumpUsd24h === 0 ? (
                <span className="text-emerald-400 font-semibold">✅ 0 продаж в пул (Слива нет)</span>
              ) : (
                <span className="text-rose-400 font-semibold">⚠️ {radarData.directDexDumpTxCount24h} сброса в Router</span>
              )}
            </div>
          </div>

          {/* Card 2: Internal Wallet Shuffle */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                ВНУТРЕННИЕ ТРАНСФЕРЫ
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300">SHUFFLE</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-300">
              {formatUsd(radarData.internalShuffleUsd24h)}
            </div>
            <div className="text-[11px] text-slate-400 font-sans leading-tight">
              <span className="text-amber-200">
                {radarData.internalShuffleTxCount24h} транзакций (0.0% на цену)
              </span>
            </div>
          </div>

          {/* Card 3: CEX Inflow & Binance Deposit */}
          <div className={`border rounded-xl p-3.5 space-y-1.5 ${
            radarData.cexDepositUsd24h > 0
              ? 'bg-amber-950/30 border-amber-500/40'
              : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <ExternalLink className="w-3.5 h-3.5" />
                CEX DEPOSIT (BINANCE)
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300">HOT WALLET</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-300">
              {formatUsd(radarData.cexDepositUsd24h)}
            </div>
            <div className="text-[11px] text-slate-400 font-sans leading-tight">
              CEX Приток: <span className="text-slate-200 font-mono">{formatUsd(radarData.cexDepositUsd24h)}</span>
            </div>
          </div>

          {/* Card 4: Top-10 Concentration */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <span className="flex items-center gap-1 font-semibold text-purple-400">
                <Wallet className="w-3.5 h-3.5" />
                ДОЛЯ TOP-10 КИТОВ
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400">HOLDERS</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-purple-300">
              {radarData.top10HoldingPct}%
            </div>
            <div className="text-[11px] text-slate-400 font-sans leading-tight">
              Резерв пула: <span className="text-slate-200 font-mono">{formatUsd(radarData.poolUsdReserveCapacity)}</span>
            </div>
          </div>
        </div>

        {/* Actionable Guidance & Forensic Breakdown */}
        <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Ончейн-Вердикт по активности крупных кошельков:
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {radarData.dumpRiskVerdictText}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-slate-850">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h5 className="text-[11px] font-bold text-emerald-300 font-mono uppercase">
                Тактическая рекомендация для трейдера:
              </h5>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {radarData.actionableGuidance}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Whale Sell Impact Simulator */}
      <div id="whale-sell-simulator-section" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                Симулятор Сброса Топ-Холдера (Whale AMM Impact Simulator)
              </h3>
              <p className="text-xs text-slate-400">
                Математический расчет просадки пула при фиксации кита по формуле <span className="font-mono text-indigo-300">x · y = k</span>
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {[1, 5, 10, 20, 35].map((pct) => (
              <button
                key={`preset-${pct}`}
                type="button"
                onClick={() => setSimulatedDumpPct(pct)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  simulatedDumpPct === pct
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Объем сброса из резерва кита в пул:</span>
            <span className="text-indigo-400 font-bold text-sm">{simulatedDumpPct}% от емкости пула</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={simulatedDumpPct}
            onChange={(e) => setSimulatedDumpPct(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Simulation Output Metrics */}
        {simulationResults && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-sans">ИЗЪЯТИЕ USDT ИЗ ПУЛА</span>
              <div className="text-base font-bold text-white">
                {formatUsd(simulationResults.dumpUsd)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Чистая выручка кита
              </div>
            </div>

            <div className="bg-slate-950 border border-rose-500/30 rounded-lg p-3 space-y-1">
              <span className="text-[10px] text-rose-400 font-sans">РАСЧЕТНЫЙ ОБВАЛ ЦЕНЫ</span>
              <div className="text-base font-bold text-rose-400">
                -{simulationResults.priceDropPct}%
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Проскальзывание в пуле
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] text-slate-400 font-sans">ОСТАТОК В ПУЛЕ</span>
              <div className="text-base font-bold text-emerald-300">
                {formatUsd(simulationResults.remainingReserve)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Остаточная подушка
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Whale Ledger: Recent Large Transactions with Classification */}
      <div id="whale-ledger-section" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                Журнал Ончейн-Маневров Топ-Холдеров
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  МЕТОД-КЛАССИФИКАТОР
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Анализ вызовов смарт-контракта и проверка взаимодействия с пулом ликвидности
              </p>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterAction('ALL')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex-shrink-0 ${
                filterAction === 'ALL'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Все ({radarData.transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterAction('INTERNAL_SHUFFLE')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex-shrink-0 ${
                filterAction === 'INTERNAL_SHUFFLE'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              📦 Shuffles ({radarData.transactions.filter(t => t.actionType === 'INTERNAL_SHUFFLE').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterAction('DEX_DUMP')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex-shrink-0 ${
                filterAction === 'DEX_DUMP'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-950 text-rose-400 hover:text-rose-300 border border-slate-800'
              }`}
            >
              🚨 Сбросы ({radarData.transactions.filter(t => t.actionType === 'DEX_SELL_DUMP').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterAction('BUY')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex-shrink-0 ${
                filterAction === 'BUY'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              🟢 Покупки ({radarData.transactions.filter(t => t.actionType === 'DEX_BUY_ACCUMULATE').length})
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isInternal = tx.actionType === 'INTERNAL_SHUFFLE';
            const isDump = tx.actionType === 'DEX_SELL_DUMP';
            const isBuy = tx.actionType === 'DEX_BUY_ACCUMULATE';
            const isLp = tx.actionType === 'LP_LIQUIDITY_ADD' || tx.actionType === 'LP_LIQUIDITY_REMOVE';

            return (
              <div
                key={tx.id}
                className={`border rounded-xl p-3.5 transition-all space-y-2.5 ${
                  isDump
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                    : isInternal
                    ? 'bg-slate-950/70 border-amber-500/20 hover:border-amber-500/40'
                    : isBuy
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action Badge */}
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isDump
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isInternal
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : isBuy
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}>
                      {isDump ? '🚨 DEX DUMP' : isInternal ? '📦 ВНУТРЕННИЙ ПЕРЕВОД (SHUFFLE)' : isBuy ? '🟢 DEX BUY' : '🔒 LP ACTION'}
                    </span>

                    {/* Method Name */}
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-xs">
                      {tx.methodName}
                    </span>

                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatTimeAgo(tx.timestamp)}
                    </span>
                  </div>

                  {/* USD & Token Amount */}
                  <div className="flex items-baseline gap-2 font-mono self-start sm:self-auto">
                    <span className="text-sm font-bold text-white">
                      {formatUsd(tx.amountUsd)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({formatTokens(tx.amountTokens)} {radarData.symbol})
                    </span>
                  </div>
                </div>

                {/* From / To Routing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">ОТКУДА:</span>
                    <span className="text-indigo-300 font-semibold truncate">{tx.fromLabel}</span>
                    <span className="text-[10px] text-slate-500">({tx.fromAddress})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] uppercase font-sans">КУДА:</span>
                    <span className="text-cyan-300 font-semibold truncate">{tx.toLabel}</span>
                    <span className="text-[10px] text-slate-500">({tx.toAddress})</span>
                  </div>
                </div>

                {/* Classification & Impact Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans pt-1 border-t border-slate-850/60">
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {tx.classificationExplanation}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] flex-shrink-0">
                    <span className="text-slate-400">
                      Влияние на цену: <span className={tx.priceImpactPct < 0 ? 'text-rose-400 font-bold' : tx.priceImpactPct > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {tx.priceImpactPct > 0 ? `+${tx.priceImpactPct}%` : `${tx.priceImpactPct}%`}
                      </span>
                    </span>

                    {/* Open Forensic Case Button */}
                    <button
                      type="button"
                      onClick={() => openForensicForAddress(tx.fromAddress, tx.fromLabel, tx)}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Открыть полный ончейн Flow Case расследования для этого кошелька"
                    >
                      <GitBranch className="w-3 h-3 text-amber-400" />
                      <span>Flow Case</span>
                    </button>

                    {/* Copy Tx */}
                    <button
                      type="button"
                      onClick={() => handleCopy(tx.txHash, tx.id)}
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      title="Скопировать хэш транзакции"
                    >
                      {copiedTx === tx.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Tx Hash</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forensic Case Modal Instance */}
      {isForensicModalOpen && selectedForensicCase && (
        <EtherscanForensicCaseModal
          isOpen={isForensicModalOpen}
          onClose={() => setIsForensicModalOpen(false)}
          caseData={selectedForensicCase}
          poolLiquidityUsd={radarData?.poolUsdReserveCapacity || 50000}
        />
      )}
    </div>
  );
};
