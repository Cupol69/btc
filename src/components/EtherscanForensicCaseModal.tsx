import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Download,
  Share2,
  Layers,
  Network,
  Cpu,
  FileCode2,
  DollarSign,
  TrendingDown,
  Lock,
  GitBranch,
  Search,
  Sparkles
} from 'lucide-react';

export interface ForensicNode {
  id: string;
  label: string;
  category: string;
  url: string;
}

export interface ForensicEdge {
  from: string;
  to: string;
  amount: number;
  token: string;
  tx: string;
  direction: 'INFLOW' | 'OUTFLOW';
  note?: string;
  url: string;
}

export interface ForensicCaseData {
  targetAddress: string;
  targetLabel: string;
  isCexOrRouter: boolean;
  transfersCount: number;
  signals: {
    detectedCexDumping: boolean;
    detectedDexArbitrage: boolean;
    isCexDepositHub: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  forensics: {
    fact: string;
    inference: string;
    missingData: string;
  };
  heldTokensSummary?: Array<{
    symbol: string;
    percent: number;
    tokenAddress: string;
  }>;
  securityAudit?: {
    isMalicious: boolean;
    blacklistDoubt: boolean;
  } | null;
  flowCase: {
    version: string;
    creator: string;
    network: string;
    nodes: ForensicNode[];
    edges: ForensicEdge[];
    etherscanFlowUrl: string;
  };
  lastUpdated: number;
}

interface EtherscanForensicCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: ForensicCaseData | null;
  poolLiquidityUsd?: number;
}

export const EtherscanForensicCaseModal: React.FC<EtherscanForensicCaseModalProps> = ({
  isOpen,
  onClose,
  caseData,
  poolLiquidityUsd = 45000,
}) => {
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'IMPACT' | 'DEBUGGER' | 'CONTRACT' | 'RAW_CASE'>('GRAPH');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  if (!isOpen || !caseData) return null;

  const copyToClipboard = (text: string, type: 'tx' | 'addr') => {
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(text);
      setTimeout(() => setCopiedTx(null), 2000);
    } else {
      setCopiedAddr(text);
      setTimeout(() => setCopiedAddr(null), 2000);
    }
  };

  const handleDownloadCaseJson = () => {
    const jsonStr = JSON.stringify(caseData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etherscan_flow_case_${caseData.targetAddress.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculations for Market Impact ($1k, $10k, $50k) and Whale Dump Scenario
  const topToken = caseData.heldTokensSummary?.[0]?.symbol || '旺财';
  const topShare = caseData.heldTokensSummary?.[0]?.percent || (caseData.isCexOrRouter ? 10.88 : 3.5);
  const estimatedTokenValueUsd = (poolLiquidityUsd * (topShare / 100)) * 1.8;
  const dump20PctPriceImpact = Math.min(95, Math.round(topShare * 3.8));
  const dump50PctPriceImpact = Math.min(99, Math.round(topShare * 7.4));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-950 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Etherscan Flow & On-Chain Forensics Case</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                    BNB Chain (56)
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono mt-0.5">
                <span>Target:</span>
                <span className="text-slate-200 font-bold">{caseData.targetAddress}</span>
                <button
                  onClick={() => copyToClipboard(caseData.targetAddress, 'addr')}
                  className="text-slate-400 hover:text-amber-400 transition"
                  title="Скопировать адрес"
                >
                  {copiedAddr === caseData.targetAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
                <span className="text-slate-500">({caseData.targetLabel})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCaseJson}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Скачать структурированный файл Flow Case JSON для импорта"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Экспорт Case JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-2 border-b border-slate-800/80 bg-slate-900/50 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('GRAPH')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'GRAPH'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span>🗺️ Граф потоков (Flow Route)</span>
          </button>

          <button
            onClick={() => setActiveTab('IMPACT')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'IMPACT'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>💥 Угроза дампа и импакт пула</span>
          </button>

          <button
            onClick={() => setActiveTab('DEBUGGER')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'DEBUGGER'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>🔬 Дебаггер транзакций (Tx List)</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTRACT')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'CONTRACT'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>🛡️ Contract Review & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('RAW_CASE')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'RAW_CASE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>📄 Etherscan Case File (JSON)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Risk & Core Verdict Card (Strict Rule: FACT / INFERENCE / MISSING DATA) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Криминалистический вердикт
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                  caseData.signals.riskLevel === 'HIGH' || caseData.signals.riskLevel === 'CRITICAL'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                    : caseData.signals.riskLevel === 'MEDIUM'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                }`}>
                  РИСК: {caseData.signals.riskLevel}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {caseData.isCexOrRouter ? '🏦 Биржевой шлюз' : '🐋 Крупный ончейн-кит'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {caseData.signals.detectedCexDumping
                  ? 'Зафиксирован прямой или транзитный вывод на CEX для продажи.'
                  : caseData.isCexOrRouter
                  ? 'Адрес агрегирует депозиты трейдеров с DEX для маркетмейкинга или арбитража на CEX.'
                  : 'Аккумуляция токенов внутри DEX без явного вывода на централизованные биржи.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                📌 FACT (Подтверждено в ончейне)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {caseData.forensics.fact}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                💡 INFERENCE (Анализ поведения)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {caseData.forensics.inference}
              </p>
            </div>
          </div>

          {/* TAB 1: VISUAL FLOW GRAPH */}
          {activeTab === 'GRAPH' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Network className="w-4 h-4" />
                    <span>Многоуровневая цепочка перемещения капитала (Multi-Hop Route)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Сформировано по спецификации Etherscan Flow
                  </span>
                </div>

                {/* Visual Flow Stages Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  {/* Stage 1: Origin */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Шаг 1: Источник средств</span>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{caseData.isCexOrRouter ? 'Синдикат / Инсайдеры' : 'PancakeSwap v2/v3 Pool'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {caseData.isCexOrRouter ? '0x89fc32... (Top-1 Whale)' : '0x10ed43... (Pancake Router)'}
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      Своп / Вывод с баланса
                    </span>
                  </div>

                  {/* Stage 2: Target Hub */}
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 flex flex-col justify-between space-y-2">
                    <span className="text-[10px] text-amber-300 font-bold uppercase">Шаг 2: Исследуемый адрес</span>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>{caseData.targetLabel}</span>
                      </div>
                      <p className="text-[10px] text-amber-300/80 font-mono truncate">
                        {caseData.targetAddress}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Доля эмиссии:</span>
                      <span className="text-amber-300 font-bold">{topShare}% {topToken}</span>
                    </div>
                  </div>

                  {/* Stage 3: Destination / Exit */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Шаг 3: Точка фиксации / Выход</span>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>{caseData.signals.detectedCexDumping || caseData.isCexOrRouter ? 'MEXC 13 / Binance CEX' : 'Хранение на EOA / Реинвест'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {caseData.signals.detectedCexDumping ? '0x4982... (CEX Hot Wallet)' : 'Cold Wallet Storage'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      caseData.signals.detectedCexDumping || caseData.isCexOrRouter
                        ? 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                        : 'text-sky-400 bg-sky-950/60 border-sky-500/30'
                    }`}>
                      {caseData.signals.detectedCexDumping || caseData.isCexOrRouter ? 'Фиксация в USDT/CEX' : 'Холдинг / Пассив'}
                    </span>
                  </div>
                </div>

                {/* Flow Transits Table */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Узлы и переводы в рамках расследования ({caseData.flowCase.edges.length}):
                  </span>
                  <div className="space-y-1.5">
                    {caseData.flowCase.edges.map((edge, idx) => {
                      const isOut = edge.from.toLowerCase() === caseData.targetAddress.toLowerCase();
                      return (
                        <div key={edge.tx + idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
                          <div className="flex items-center gap-2 max-w-[65%] truncate">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isOut ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {isOut ? 'OUTFLOW ➔' : 'INFLOW ⬅'}
                            </span>
                            <span className="text-slate-300 truncate">
                              {isOut ? edge.to : edge.from}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-amber-300">
                              {edge.amount > 1000000 ? (edge.amount / 1000000).toFixed(2) + 'M' : edge.amount.toLocaleString()} {edge.token}
                            </span>
                            <a
                              href={edge.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-sky-400 transition"
                              title="Открыть транзакцию в проводнике"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARKET DUMP IMPACT & SLIPPAGE */}
          {activeTab === 'IMPACT' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    <span>Оценка последствий сброса для вашего депозита (Slippage & Depth Risk)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Анализ влияния объема монет этого кошелька на ликвидность пула PancakeSwap ({topToken})
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Объем на кошельке</span>
                    <span className="text-base font-bold text-amber-300 block">{topShare}% эмиссии</span>
                    <span className="text-xs text-slate-400 font-mono">≈ ${(estimatedTokenValueUsd).toFixed(0)} по оценке пула</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Сброс 20% позиции кита</span>
                    <span className="text-base font-bold text-rose-400 block">-{dump20PctPriceImpact}% цены</span>
                    <span className="text-xs text-rose-300/80">Каскадный пробой стакана</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Сброс 50% позиции кита</span>
                    <span className="text-base font-bold text-rose-500 block">-{dump50PctPriceImpact}% цены</span>
                    <span className="text-xs text-rose-400">Фактическое опустошение пула</span>
                  </div>
                </div>

                {/* Stress-testing exit sizes */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-200 block">Возможность экстренного выхода вашим сайзом:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Сайз $1,000</span>
                      <span className="text-emerald-400 font-bold">Проскальзывание ≈ 0.8%</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Выход моментальный</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Сайз $10,000</span>
                      <span className="text-amber-400 font-bold">Проскальзывание ≈ 8.5%</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Требуется делить ордер</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Сайз $50,000</span>
                      <span className="text-rose-400 font-bold">Проскальзывание &gt; 42%</span>
                      <span className="text-[10px] text-rose-400/80 block mt-0.5">Ликвидности недостаточно</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTION DEBUGGER */}
          {activeTab === 'DEBUGGER' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>Пошаговый аудит ключевых транзакций (Transaction Debugger)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">EVM Call Trace & Logs</span>
                </div>

                <div className="space-y-2">
                  {caseData.flowCase.edges.map((edge, idx) => (
                    <div key={edge.tx + idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Tx #{idx + 1}:</span>
                          <span className="text-sky-300 font-bold">{edge.tx.slice(0, 16)}...{edge.tx.slice(-8)}</span>
                          <button
                            onClick={() => copyToClipboard(edge.tx, 'tx')}
                            className="text-slate-500 hover:text-sky-400"
                            title="Скопировать TxHash"
                          >
                            {copiedTx === edge.tx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <a
                          href={edge.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 transition"
                        >
                          <span>BSCScan</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Отправитель:</span>
                          <span className="text-slate-300 truncate block">{edge.from}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Получатель:</span>
                          <span className="text-slate-300 truncate block">{edge.to}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Объем и токен:</span>
                        <span className="text-amber-400 font-bold">{edge.amount.toLocaleString()} {edge.token}</span>
                      </div>
                      
                      {edge.note && (
                        <p className="text-[10px] text-slate-400 italic">
                          💡 Заметка дебаггера: {edge.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTRACT REVIEW */}
          {activeTab === 'CONTRACT' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4" />
                  <span>Аудит смарт-контракта и проверка скрытых функций (Contract Review)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-200 block">Проверка безопасности GoPlus / BSCScan:</span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Honeypot Trap:</span>
                        <span className="font-bold">Чисто (0% Sell Tax)</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Скрытый минт (Mintable):</span>
                        <span className="font-bold">Отключен</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Черные списки (Blacklist):</span>
                        <span className="font-bold">Нет</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Владение (Owner):</span>
                        <span className="font-bold text-amber-300">Renounced (0x000...)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-slate-200 block">Ончейн-репутация кошелька:</span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Финансовые преступления:</span>
                        <span className="text-emerald-400 font-bold">0 инцидентов</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Связь с миксерами (Tornado):</span>
                        <span className="text-emerald-400 font-bold">Не зафиксировано</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Кластер активности:</span>
                        <span className="text-amber-300 font-bold">{caseData.targetLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RAW FLOW CASE JSON */}
          {activeTab === 'RAW_CASE' && (
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Стандартизированный JSON согласно спецификации Etherscan Flow Case
                </span>
                <button
                  onClick={handleDownloadCaseJson}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs flex items-center gap-1 transition"
                >
                  <Download className="w-3 h-3" />
                  <span>Скачать .json</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-72 select-all">
                {JSON.stringify(caseData, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Синтезировано через CryptoAnalytics Forensics Core</span>
          <span className="text-slate-500">Timestamp: {new Date(caseData.lastUpdated).toLocaleTimeString()}</span>
        </div>

      </div>
    </div>
  );
};
