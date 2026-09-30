import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  GitMerge,
  Copy,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Search,
  Check,
  Zap,
  Network,
  Workflow,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Maximize2,
  TrendingDown,
  Cpu,
} from 'lucide-react';
import { EtherscanForensicCaseModal, ForensicCaseData } from './EtherscanForensicCaseModal';

export interface OverlappingWallet {
  address: string;
  clusterType: 'INSIDER_SYNDICATE' | 'MARKET_MAKER_HUB' | 'EARLY_SNIPER_CLUSTER' | 'CEX_HOT_WALLET';
  clusterLabel: string;
  description: string;
  tokens: {
    symbol: string;
    address: string;
    percent: number;
    previousPercent?: number;
    percentDelta?: number;
    changeStatus?: 'ACCUMULATING' | 'DUMPING' | 'UNCHANGED' | 'NEW_POSITION';
    isLocked: boolean;
    tag?: string;
  }[];
  totalShareAcrossAll: number;
  netDeltaAcrossAll?: number;
}

export interface ChineseHoldersOverlapResponse {
  timestamp: number;
  totalTokensScanned: number;
  tokens: {
    symbol: string;
    address: string;
    quote: string;
    holderCount: number;
    topHoldersCount: number;
  }[];
  overlappingCount: number;
  overlappingWallets: OverlappingWallet[];
}

interface Chinese7HoldersClusterMatrixProps {
  onOpenAuditForToken?: (contractAddress: string) => void;
  onSelectSymbol?: (symbol: string, contractAddress?: string) => void;
}

export const Chinese7HoldersClusterMatrix: React.FC<Chinese7HoldersClusterMatrixProps> = ({
  onOpenAuditForToken,
  onSelectSymbol,
}) => {
  const [data, setData] = useState<ChineseHoldersOverlapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [selectedWalletAddr, setSelectedWalletAddr] = useState<string | null>(null);
  const [flowTrace, setFlowTrace] = useState<any | null>(null);
  const [isFlowLoading, setIsFlowLoading] = useState<boolean>(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchFlowTrace = useCallback(async (addr: string, openModal = false) => {
    if (!addr) return;
    setIsFlowLoading(true);
    setFlowError(null);
    try {
      const resp = await fetch(`/api/forensics/flow-tracer?address=${addr}&chainId=56`);
      if (!resp.ok) throw new Error('Не удалось проследить маршрут транзакций');
      const json = await resp.json();
      setFlowTrace(json);
      if (openModal) {
        setIsModalOpen(true);
      }
    } catch (err: any) {
      console.warn('[FlowTracer] error:', err);
      setFlowError(err.message || 'Ошибка построения графа');
    } finally {
      setIsFlowLoading(false);
    }
  }, []);

  const fetchOverlap = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/dex/chinese-holders-overlap?force=${force}`);
      if (!resp.ok) {
        throw new Error(`Ошибка ончейн-сканирования (${resp.status})`);
      }
      const json: ChineseHoldersOverlapResponse = await resp.json();
      setData(json);
      if (json.overlappingWallets.length > 0 && !selectedWalletAddr) {
        setSelectedWalletAddr(json.overlappingWallets[0].address);
      }
    } catch (err: any) {
      console.error('[Chinese7HoldersClusterMatrix] fetch error:', err);
      setError(err.message || 'Не удалось получить данные держателей');
    } finally {
      setIsLoading(false);
    }
  }, [selectedWalletAddr]);

  useEffect(() => {
    fetchOverlap(false);
  }, [fetchOverlap]);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 1800);
  };

  const activeWallet = data?.overlappingWallets.find(w => w.address === selectedWalletAddr) || data?.overlappingWallets[0] || null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4 font-mono">
      {/* 1. Top Header with 100% On-Chain Fact Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 rounded-lg text-amber-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                Ончейн-Связки Китов: 7 Китайских Токенов
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                100% REAL ON-CHAIN FACT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Прямое вычисление пересечений холдеров в блокчейне BNB Chain без эмуляций и прогнозов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Address Flow Tracer Button */}
          <button
            type="button"
            onClick={() => {
              if (activeWallet) {
                fetchFlowTrace(activeWallet.address);
              }
            }}
            disabled={isFlowLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            title="Запустить криминалистическую ончейн-трассировку (Etherscan Flow Tracer Skill)"
          >
            <Workflow className={`w-4 h-4 ${isFlowLoading ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            <span>{isFlowLoading ? 'Трассировка...' : '⚡ Flow Tracer (Skill)'}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchOverlap(true)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Сканирование BNB Chain...' : 'Обновить ончейн-слепок'}</span>
          </button>
        </div>
      </div>

      {/* 2. Critical Insight Callout (Computed purely from live on-chain overlap data) */}
      {data && data.overlappingWallets.length > 0 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Ключевые обнаруженные факты в блокчейне (Найдено связок: {data.overlappingCount}):</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Обновлено: {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
            {data.overlappingWallets.slice(0, 2).map((w, idx) => (
              <div
                key={w.address}
                onClick={() => setSelectedWalletAddr(w.address)}
                className="p-2 rounded bg-slate-950/70 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-amber-200 truncate">{w.clusterLabel}</strong>
                  <span className="text-[9px] text-amber-400 font-mono font-bold">
                    {w.tokens.length} токена
                  </span>
                </div>
                <div className="text-slate-300 text-[10px]">
                  Адрес: <code className="text-amber-300">{w.address.slice(0, 8)}...{w.address.slice(-6)}</code>
                  <div className="mt-0.5 text-slate-400">
                    Держит: {w.tokens.map(t => `${t.symbol} (${t.percent}%)`).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Main Grid: Left Overlapping Wallets / Right Detailed Cross-Holdings Matrix */}
      {isLoading && !data ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <div className="text-xs">Считывание балансов Top-Holders из GoPlus / BSCScan...</div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchOverlap(true)}
            className="px-2.5 py-1 bg-rose-900/60 rounded text-[11px] hover:bg-rose-900"
          >
            Повторить
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Overlapping Wallets List */}
          <div className="lg:col-span-5 space-y-2 max-h-[460px] overflow-y-auto pr-1">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between px-1">
              <span>Связанные Кошельки-Киты ({data?.overlappingCount || 0}):</span>
              <span className="text-[10px] text-slate-500">минимум 2 токена</span>
            </div>

            {data?.overlappingWallets.map((wallet, wIdx) => {
              const isSelected = selectedWalletAddr === wallet.address;
              const isCex = wallet.clusterType === 'CEX_HOT_WALLET';
              const isSyndicate = wallet.clusterType === 'INSIDER_SYNDICATE';
              const isMM = wallet.clusterType === 'MARKET_MAKER_HUB';

              return (
                <div
                  key={wallet.address}
                  onClick={() => setSelectedWalletAddr(wallet.address)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30'
                      : isCex
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-emerald-900/30'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate max-w-[210px]">
                        {wallet.clusterLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        isCex
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : isMM
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : isSyndicate
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isCex ? `🏦 ${wallet.clusterLabel.split('(')[0]}` : `${wallet.tokens.length} токена`}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mb-2 line-clamp-1">
                    {wallet.description}
                  </p>

                  {/* Token Share Badges and Card Quick Actions */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/60">
                    <div className="flex items-center gap-1 flex-wrap">
                      {wallet.tokens.map((t) => {
                        const isAcc = t.changeStatus === 'ACCUMULATING';
                        const isDump = t.changeStatus === 'DUMPING';
                        const isHighConcentration = t.percent >= 10;
                        const isMedConcentration = t.percent >= 3;

                        return (
                          <span
                            key={t.symbol}
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-mono flex items-center gap-1 ${
                              isAcc
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold ring-1 ring-emerald-500/30'
                                : isDump
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold ring-1 ring-rose-500/30'
                                : isHighConcentration
                                ? 'bg-purple-950/80 text-purple-200 border-purple-500/50 font-bold'
                                : isMedConcentration
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                            title={`Токен: ${t.symbol} | Доля: ${t.percent}% ${
                              isDump
                                ? `| 🚨 Сброс: ${t.percentDelta}%`
                                : isAcc
                                ? `| 🟢 Докупка: +${t.percentDelta}%`
                                : isHighConcentration
                                ? `| 🐋 Крупный холдер (>10%)`
                                : ''
                            }`}
                          >
                            <span>{t.symbol}: <strong>{t.percent}%</strong></span>
                            {isAcc && <span className="text-[8px] text-emerald-300">▲</span>}
                            {isDump && <span className="text-[8px] text-rose-300">▼</span>}
                            {!isAcc && !isDump && isHighConcentration && (
                              <span className="text-[8px] text-purple-300">👑</span>
                            )}
                          </span>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWalletAddr(wallet.address);
                        fetchFlowTrace(wallet.address);
                      }}
                      className="px-2 py-1 rounded text-[9px] font-bold bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center gap-1 flex-shrink-0"
                      title="Проследить маршрут (Etherscan Flow)"
                    >
                      <Workflow className="w-2.5 h-2.5 text-amber-400" />
                      <span>Trace</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Wallet Cross-Holding Inspector */}
          {activeWallet && (
            <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
              {/* Wallet Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      {activeWallet.clusterLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-amber-400 font-mono">{activeWallet.address}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeWallet.address)}
                      className="text-slate-500 hover:text-amber-300 transition"
                      title="Скопировать адрес"
                    >
                      {copiedAddr === activeWallet.address ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`https://bscscan.com/address/${activeWallet.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-sky-300 transition flex items-center gap-0.5 text-[10px]"
                    >
                      <span>BSCScan</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Совокупный % эмиссий</span>
                    <span className="text-sm font-bold text-amber-400">
                      {activeWallet.totalShareAcrossAll.toFixed(1)}% суммарно
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchFlowTrace(activeWallet.address)}
                    disabled={isFlowLoading}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-2"
                    title="Запустить ончейн-трассировку перемещения средств (Etherscan Flow Tracer Skill)"
                  >
                    <Workflow className={`w-3.5 h-3.5 ${isFlowLoading ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
                    <span>{isFlowLoading ? 'Трассировка...' : 'Flow Tracer (Skill)'}</span>
                  </button>
                </div>
              </div>

              {/* Etherscan Flow Forensics Result Box (Inspired by github.com/etherscan/skills) */}
              {flowTrace && flowTrace.targetAddress === activeWallet.address.toLowerCase() && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5 text-xs font-mono shadow-inner animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Network className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 block text-xs">
                          Etherscan/BSCScan Flow Tracer Case
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Маршрут перемещения средств и выявление связок по стандарту Etherscan Skills
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        flowTrace.signals.riskLevel === 'HIGH'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          : flowTrace.signals.riskLevel === 'MEDIUM'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      }`}>
                        РИСК: {flowTrace.signals.riskLevel}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Открыть полный интерактивный отчет расследования (Etherscan Skills Case)"
                      >
                        <Maximize2 className="w-3 h-3 text-amber-400" />
                        <span>Полный Case</span>
                      </button>
                      <a
                        href={flowTrace.flowCase.etherscanFlowUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 transition"
                        title="Открыть в проводнике BSCScan"
                      >
                        <span>Проводник</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Fact & Inference breakdown (Rules 3, 4, 8) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
                      <span className="text-emerald-400 font-bold block mb-0.5">📌 FACT (Подтверждено в ончейне):</span>
                      <p className="text-slate-300 leading-relaxed text-[10px]">
                        {flowTrace.forensics.fact}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
                      <span className="text-sky-400 font-bold block mb-0.5">💡 INFERENCE (Аналитическая интерпретация):</span>
                      <p className="text-slate-300 leading-relaxed text-[10px]">
                        {flowTrace.forensics.inference}
                      </p>
                    </div>
                  </div>

                  {/* Flow Graph Edges Table */}
                  {flowTrace.flowCase.edges.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          Ончейн-маршруты и трансферы ({flowTrace.flowCase.edges.length}):
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Etherscan Flow Trace Core
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {flowTrace.flowCase.edges.map((edge: any, eIdx: number) => {
                          const isOut = edge.from.toLowerCase() === activeWallet.address.toLowerCase();
                          return (
                            <div key={edge.tx + eIdx} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[10px] space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                                  {isOut ? (
                                    <ArrowUpRight className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                  ) : (
                                    <ArrowDownLeft className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                  )}
                                  <span className={isOut ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                    {isOut ? 'OUTFLOW ->' : 'INFLOW <-'}
                                  </span>
                                  <span className="text-slate-300 font-mono text-[9px] truncate">
                                    {isOut ? edge.to.slice(0, 10) + '...' + edge.to.slice(-6) : edge.from.slice(0, 10) + '...' + edge.from.slice(-6)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="font-bold text-amber-300">
                                    {edge.amount > 1000000 ? (edge.amount / 1000000).toFixed(2) + 'M' : edge.amount > 1000 ? (edge.amount / 1000).toFixed(1) + 'k' : edge.amount.toFixed(2)} {edge.token}
                                  </span>
                                  <a
                                    href={edge.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-500 hover:text-sky-400 transition"
                                    title="Хэш транзакции в проводнике"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                              {edge.note && (
                                <div className="text-[9px] text-slate-400 pl-4 border-l border-slate-700/60 italic">
                                  {edge.note}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description & Forensic Conclusion */}
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1">
                <span className="text-slate-400 font-bold block text-[10px]">
                  🔍 Анализ ончейн-связи (Rule 7 & 8):
                </span>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {activeWallet.description}
                </p>
              </div>

              {/* Special CEX Actionable Strategy Box when CEX Hot Wallet is selected */}
              {activeWallet.clusterType === 'CEX_HOT_WALLET' && (
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Что мы извлекаем из трекинга {activeWallet.clusterLabel} (Торговые Сигналы):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/30">
                      <span className="text-emerald-400 font-bold block mb-0.5">1. Сигнал на Сброс (Sell Wall):</span>
                      <p className="text-slate-400 leading-tight">
                        Резкий скачок баланса токенов на адресе {activeWallet.clusterLabel.split('(')[0]} = киты завели токены для продажи на споте CEX без проскальзывания в DEX-пуле.
                      </p>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/30">
                      <span className="text-sky-400 font-bold block mb-0.5">2. CEX/DEX Арбитраж:</span>
                      <p className="text-slate-400 leading-tight">
                        Если на бирже цена выше, чем в пуле PancakeSwap, арбитражники скупают DEX и переводят на этот биржевой шлюз, разгоняя цену на ончейне.
                      </p>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/30">
                      <span className="text-amber-400 font-bold block mb-0.5">3. Очищенный расчет Top-10:</span>
                      <p className="text-slate-400 leading-tight">
                        Вычитаем {activeWallet.totalShareAcrossAll.toFixed(1)}% биржевого шлюза из доли китов — получаем реальное распределение между частными EOA без искажения.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Table of exact token shares held by this wallet */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Фактическое распределение по 7 токенам:</span>
                  <span className="text-[10px] text-slate-500">Доля от Total Supply</span>
                </span>

                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                      <tr>
                        <th className="py-2 px-3">Токен</th>
                        <th className="py-2 px-3 text-right">Текущая Доля (%)</th>
                        <th className="py-2 px-3 text-center">Динамика / Дельта</th>
                        <th className="py-2 px-3 text-right">Тип / Статус</th>
                        <th className="py-2 px-3 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950">
                      {activeWallet.tokens.map((t) => {
                        const hasDelta = t.percentDelta !== undefined && t.percentDelta !== 0;
                        const isAcc = t.changeStatus === 'ACCUMULATING';
                        const isDump = t.changeStatus === 'DUMPING';

                        return (
                          <tr key={t.symbol} className="hover:bg-slate-900/50 transition">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-100">{t.symbol}</span>
                                <a
                                  href={`https://bscscan.com/token/${t.address}?a=${activeWallet.address}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-500 hover:text-sky-400"
                                  title="Посмотреть баланс и транзакции в BSCScan"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded font-mono ${
                                  t.percent >= 10
                                    ? 'bg-purple-950/80 text-purple-200 border border-purple-500/40'
                                    : t.percent >= 3
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'text-slate-200'
                                }`}
                              >
                                {t.percent}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[10px]">
                              {isAcc ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold inline-flex items-center gap-1">
                                  <span>▲ +{t.percentDelta}%</span>
                                  <span className="text-[8px] uppercase tracking-tight">Накопление</span>
                                </span>
                              ) : isDump ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold inline-flex items-center gap-1">
                                  <span>▼ {t.percentDelta}%</span>
                                  <span className="text-[8px] uppercase tracking-tight">Сброс</span>
                                </span>
                              ) : (
                                <span className="text-slate-500">
                                  {t.previousPercent ? `Стабильно (${t.percent}%)` : 'Фиксация базы'}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-[10px] text-slate-400">
                                {activeWallet.clusterType === 'CEX_HOT_WALLET'
                                  ? '🏦 CEX Hot Wallet'
                                  : t.isLocked
                                  ? '🔒 Залочено'
                                  : '⚡ Private EOA'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onOpenAuditForToken && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAuditForToken(t.address)}
                                    className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Аудит
                                  </button>
                                )}
                                {onSelectSymbol && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectSymbol(t.symbol, t.address)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition cursor-pointer"
                                  >
                                    График
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trading Implication Footer */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1 text-amber-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Риск синхронного сброса: {activeWallet.totalShareAcrossAll > 25 ? 'КРИТИЧЕСКИЙ (Концентрация)' : 'УМЕРЕННЫЙ'}</span>
                </span>
                <span className="text-slate-500 text-[10px]">
                  Данные получены напрямую из блокчейна BNB Chain
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Screen Etherscan Forensic Case Modal */}
      {isModalOpen && flowTrace && (
        <EtherscanForensicCaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          caseData={flowTrace}
          poolLiquidityUsd={45000}
        />
      )}
    </div>
  );
};
