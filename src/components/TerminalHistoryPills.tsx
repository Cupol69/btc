import React, { useState, useEffect, useRef } from 'react';
import { Clock, Trash2, X, ChevronDown, ChevronUp, History, Sparkles, Layers } from 'lucide-react';
import {
  TerminalHistoryItem,
  getTerminalHistory,
  removeTerminalHistoryItem,
  clearTerminalHistory,
} from '../services/terminalHistoryService';

interface TerminalHistoryPillsProps {
  activeContractOrSymbol?: string;
  onSelectToken: (item: { symbol: string; contract?: string; chain?: string }) => void;
  className?: string;
  compact?: boolean;
}

function formatShortPrice(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val) || val === 0) return '';
  if (val >= 1000) return `$${val.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;
  if (val >= 1) return `$${val.toFixed(3)}`;
  if (val >= 0.01) return `$${val.toFixed(4)}`;
  if (val >= 0.0001) return `$${val.toFixed(6)}`;
  return `$${val.toFixed(8)}`;
}

export const TerminalHistoryPills: React.FC<TerminalHistoryPillsProps> = ({
  activeContractOrSymbol,
  onSelectToken,
  className = '',
  compact = false,
}) => {
  const [history, setHistory] = useState<TerminalHistoryItem[]>(() => getTerminalHistory());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<TerminalHistoryItem[]>;
      if (customEvent.detail) {
        setHistory(customEvent.detail);
      } else {
        setHistory(getTerminalHistory());
      }
    };

    window.addEventListener('terminal_history_updated', handleUpdate);
    return () => {
      window.removeEventListener('terminal_history_updated', handleUpdate);
    };
  }, []);

  if (history.length === 0) {
    return null;
  }

  const activeNormalized = activeContractOrSymbol?.toLowerCase().trim() || '';

  // Show first 6 items in single line mode, or all when expanded
  const visibleItems = isExpanded ? history : history.slice(0, 7);
  const hiddenCount = Math.max(0, history.length - visibleItems.length);

  return (
    <div
      ref={containerRef}
      className={`w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 text-xs font-mono select-none transition ${className}`}
    >
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-900">
        <div className="flex items-center gap-1.5 text-slate-300 font-sans font-semibold text-[11px]">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="uppercase tracking-wider">История просмотров</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-400 font-mono text-[10px]">
            {history.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 7 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <span>{isExpanded ? 'Свернуть' : `Показать все (${history.length})`}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => clearTerminalHistory()}
            className="text-[10px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
            title="Очистить историю всех открытых токенов"
          >
            <Trash2 className="w-3 h-3" />
            <span>Очистить</span>
          </button>
        </div>
      </div>

      {/* Grid of recent tokens (Wraps cleanly, no cut-offs) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 max-h-56 overflow-y-auto pr-1">
        {visibleItems.map((item) => {
          const isSelected =
            activeNormalized &&
            (activeNormalized === item.symbol.toLowerCase() ||
              (item.contract && activeNormalized === item.contract.toLowerCase()) ||
              activeNormalized === item.id.toLowerCase());

          const shortAddr = item.contract
            ? `${item.contract.slice(0, 4)}...${item.contract.slice(-4)}`
            : '';

          return (
            <div
              key={item.id || item.symbol}
              className={`group relative flex items-center rounded-lg transition border text-xs whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold shadow-sm ring-1 ring-amber-400/30'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectToken({ symbol: item.symbol, contract: item.contract, chain: item.chain })}
                className="flex items-center gap-1.5 px-2.5 py-1"
                title={`${item.name || item.symbol}\n${item.contract || ''}\nНажмите для анализа`}
              >
                <span className="text-white font-bold">{item.symbol}</span>
                {item.priceUsd && item.priceUsd > 0 && (
                  <span className="text-[11px] text-amber-400/90 font-mono">
                    {formatShortPrice(item.priceUsd)}
                  </span>
                )}
                {item.chain && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {item.chain}
                  </span>
                )}
                {shortAddr && !compact && (
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    {shortAddr}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTerminalHistoryItem(item.id);
                }}
                className="opacity-60 group-hover:opacity-100 hover:text-rose-400 text-slate-500 px-1 py-1 transition pr-1.5 cursor-pointer"
                title="Удалить из истории"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {!isExpanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-2 py-1 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/50 text-[11px] transition flex items-center gap-1 bg-slate-900/50 cursor-pointer"
          >
            <span>+{hiddenCount} ещё</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
