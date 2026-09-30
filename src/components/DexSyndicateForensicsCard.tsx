import React, { useState } from 'react';
import { DexSyndicateForensics, DexPoolItem } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Droplets,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  TrendingUp,
} from 'lucide-react';

interface DexSyndicateForensicsCardProps {
  forensics: DexSyndicateForensics | null | undefined;
  symbol: string;
  contractAddress?: string;
  primaryChain?: string;
  pools?: DexPoolItem[];
  onTriggerAiInvestigation?: (question: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const DexSyndicateForensicsCard: React.FC<DexSyndicateForensicsCardProps> = ({
  forensics,
  symbol,
  contractAddress,
  primaryChain = 'bsc',
  pools = [],
  onTriggerAiInvestigation,
  onRefresh,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeInsightIndex, setActiveInsightIndex] = useState<number | null>(null);

  if (!forensics) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <Cpu className="w-8 h-8 text-purple-400 mx-auto opacity-70 animate-pulse" />
        <h3 className="text-sm font-bold text-white">Ончейн-Расследование & Анализ Синдиката</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Запустите сканирование для анализа скрытых мультипулов, выявления vanity-сигнатур (...7777), родственных токенов и фарминга листинга на Binance.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold font-mono transition inline-flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Запустить расследование {symbol}</span>
          </button>
        )}
      </div>
    );
  }

  const {
    hasVanitySignature,
    vanityPattern,
    isMultiPoolHiddenLiquidity,
    emptyStandardPoolWarning,
    realLiquidityQuoteTokens,
    totalVolumeToLiquidityRatio,
    farmingBinanceListingStatus,
    relatedTokensOrBridges,
    insights,
    summaryConclusion,
  } = forensics;

  const handleCopyReport = () => {
    const reportText = `[DEX ON-CHAIN FORENSIC DOSSIER: ${symbol}]
Контракт: ${contractAddress || 'N/A'} (Сеть: ${primaryChain.toUpperCase()})
Сигнатура Синдиката: ${hasVanitySignature ? `Да (${vanityPattern})` : 'Обычный адрес'}
Структура ликвидности: ${isMultiPoolHiddenLiquidity ? 'Скрытые мультипулы (USDT/SPCXB)' : 'Стандартная'}
Статус фарминга Binance: ${farmingBinanceListingStatus}
Отношение Vol/TVL: ${totalVolumeToLiquidityRatio}x
Родственные мосты/токены: ${relatedTokensOrBridges.join(', ') || 'Нет'}
Заключение: ${summaryConclusion}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/95 border border-purple-500/30 rounded-xl p-5 shadow-xl shadow-purple-950/20 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                  <span>🕵️ Ончейн-Расследование & Анатомия Синдиката</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    FORENSIC AI
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Детектор теневых пулов, vanity-генераторов (...7777), кросс-мостов и накрутки объемов
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyReport}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            title="Скопировать ончейн-досье"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано' : 'Досье'}</span>
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer border border-slate-700"
              title="Обновить ончейн-анализ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Key Diagnostic Badges Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Badge 1: Vanity Signature */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          hasVanitySignature
            ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>СИГНАТУРА АДРЕСА</span>
            {hasVanitySignature ? <Sparkles className="w-3.5 h-3.5 text-purple-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />}
          </div>
          <div className="mt-1">
            <div className="text-xs font-bold text-white">
              {hasVanitySignature ? vanityPattern : 'Стандартный'}
            </div>
            <div className="text-[10px] text-slate-400">
              {hasVanitySignature ? 'Генератор синдиката' : 'Рандомный деплой'}
            </div>
          </div>
        </div>

        {/* Badge 2: Multi-Pool Liquidity */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isMultiPoolHiddenLiquidity
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>СТРУКТУРА ПУЛОВ</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-xs font-bold text-white">
              {isMultiPoolHiddenLiquidity ? 'Скрытый Мультипул' : 'Стандартная'}
            </div>
            <div className="text-[10px] text-amber-400">
              {isMultiPoolHiddenLiquidity ? 'В обход ловушки WBNB' : 'Обычные пары'}
            </div>
          </div>
        </div>

        {/* Badge 3: Binance Farming Status */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          farmingBinanceListingStatus === 'ACTIVE_FARMING'
            ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>БОРЬБА ЗА BINANCE</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-1">
            <div className="text-xs font-bold text-white">
              {farmingBinanceListingStatus === 'ACTIVE_FARMING' ? 'ФАРМИНГ МЕТРИК' : 'ОРГАНИКА'}
            </div>
            <div className="text-[10px] text-indigo-300">
              Vol/TVL: {totalVolumeToLiquidityRatio}x
            </div>
          </div>
        </div>

        {/* Badge 4: Related Bridges */}
        <div className="p-3 rounded-lg border bg-slate-950/60 border-slate-800 text-slate-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>РОДНЯ & МОСТЫ</span>
            <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <div className="text-xs font-bold text-emerald-300 truncate">
              {relatedTokensOrBridges.length > 0 ? relatedTokensOrBridges.slice(0, 2).join(', ') : 'Автономный'}
            </div>
            <div className="text-[10px] text-slate-400">
              {relatedTokensOrBridges.length > 0 ? `${relatedTokensOrBridges.length} токена в сети` : 'Нет связок'}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Box on WBNB/Empty Pool Trap if applicable */}
      {emptyStandardPoolWarning && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-3.5 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <span>⚠️ Почему стандартные боты и ИИ говорят, что «пул мёртвый»?</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
              {emptyStandardPoolWarning}
            </p>
          </div>
        </div>
      )}

      {/* Comprehensive Forensic Insights Accordion / Cards */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-300 font-mono flex items-center justify-between">
          <span>Ключевые пункты ончейн-досье:</span>
          <span className="text-[10px] text-slate-500">{insights.length} раздела</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {insights.map((insight, idx) => {
            const isSelected = activeInsightIndex === idx;
            const isAlert = insight.severity === 'WARNING' || insight.severity === 'ALERT';
            const isPos = insight.severity === 'POSITIVE';

            return (
              <div
                key={idx}
                onClick={() => setActiveInsightIndex(isSelected ? null : idx)}
                className={`p-3.5 rounded-lg border transition cursor-pointer space-y-2 ${
                  isAlert
                    ? 'bg-purple-950/30 border-purple-500/40 hover:border-purple-500/70'
                    : isPos
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    {isAlert ? '⚡' : isPos ? '✅' : '🔍'} {insight.title}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    isAlert
                      ? 'bg-purple-500/20 text-purple-300'
                      : isPos
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {insight.verdict}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {insight.details}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Multi-Pool Breakdown Table */}
      {pools.length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Карта всех пулов токена (Реальные объемы vs Ловушки):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{pools.length} пулов найдено</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] text-slate-400">
                  <th className="pb-1.5">DEX / Пара</th>
                  <th className="pb-1.5">Цена в пуле</th>
                  <th className="pb-1.5">Ликвидность (TVL)</th>
                  <th className="pb-1.5">Объем (24ч)</th>
                  <th className="pb-1.5">Свопов (24ч)</th>
                  <th className="pb-1.5 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {pools.map((p, i) => {
                  const pairName = `${p.baseToken?.symbol || symbol} / ${p.quoteToken?.symbol || '?'}`;
                  const isMainPool = p.liquidityUsd > 100000;
                  const isDust = p.liquidityUsd < 500;
                  const txCount = (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0);

                  return (
                    <tr key={i} className={`hover:bg-slate-900/60 transition ${isMainPool ? 'bg-indigo-950/20' : ''}`}>
                      <td className="py-2">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{p.dexId}</span>
                          <span className="text-indigo-300 font-normal">{pairName}</span>
                        </div>
                      </td>
                      <td className="py-2 text-slate-300">
                        ${p.priceUsd != null ? (p.priceUsd >= 1 ? p.priceUsd.toFixed(3) : p.priceUsd.toFixed(6)) : '—'}
                      </td>
                      <td className="py-2">
                        <span className={`font-bold ${isMainPool ? 'text-emerald-400' : isDust ? 'text-rose-400' : 'text-slate-200'}`}>
                          ${p.liquidityUsd ? p.liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                        </span>
                      </td>
                      <td className="py-2 text-slate-300">
                        ${p.volume?.h24 ? p.volume.h24.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
                      </td>
                      <td className="py-2 text-slate-300">
                        {txCount.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        {isMainPool ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            ОСНОВНОЙ ПУЛ
                          </span>
                        ) : isDust ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                            ПУСТЫШКА / ДУСТ
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            КРОСС-МОСТ
                          </span>
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

      {/* Summary Conclusion Box & Interactive AI Prompts */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/40 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-white font-mono">ИТОГОВЫЙ ОНЧЕЙН-ВЕРДИКТ СИНДИКАТА:</span>
            <p className="text-xs text-slate-200 leading-relaxed font-mono">
              {summaryConclusion}
            </p>
          </div>
        </div>

        {/* 1-Click AI Forensic Prompts */}
        {onTriggerAiInvestigation && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">Быстрый вопрос ИИ:</span>
            <button
              type="button"
              onClick={() => onTriggerAiInvestigation(`Расскажи подробно про связь токена ${symbol} с китайским синдикатом 牛来 и адресами 7777, и почему боты путают пулы`)}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 transition cursor-pointer flex items-center gap-1"
            >
              <span>Связь с 牛来 и адресами 7777</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => onTriggerAiInvestigation(`Каковы реальные шансы у ${symbol} на листинг на Binance судя по ончейн-метрикам и накрутке транзакций?`)}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition cursor-pointer flex items-center gap-1"
            >
              <span>Шансы на листинг Binance</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => onTriggerAiInvestigation(`Как безопасно выйти из ${symbol} в стейблкоины USDT через PancakeSwap без высокого проскальзывания?`)}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1"
            >
              <span>Безопасный маршрут вывода</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
