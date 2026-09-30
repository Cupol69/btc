import React, { useState } from 'react';
import { MarketAnomaly } from '../types';
import { AlertTriangle, Zap, Skull, Flame, Layers, ChevronRight, X, ShieldCheck } from 'lucide-react';

interface MarketAnomalyBannerProps {
  anomalies: MarketAnomaly[];
  onDismiss?: (id: string) => void;
}

export const MarketAnomalyBanner: React.FC<MarketAnomalyBannerProps> = ({ anomalies, onDismiss }) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<MarketAnomaly | null>(null);

  if (!anomalies || anomalies.length === 0) {
    return (
      <div id="market-anomalies-strip" className="bg-slate-900/60 rounded-xl border border-slate-800/80 px-3.5 py-2 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">Anomaly Engine Active:</span>
          <span>Аномальных всплесков ликвидаций или критического перегрева фандинга не зафиксировано</span>
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline">Факторы: Funding, OI, Liqs, Book Wall</span>
      </div>
    );
  }

  const getIcon = (type: MarketAnomaly['type']) => {
    switch (type) {
      case 'LIQUIDATION_SPIKE':
        return <Skull className="w-3.5 h-3.5 text-rose-400" />;
      case 'EXTREME_FUNDING':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'OI_SURGE':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ORDERBOOK_WALL':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'BASIS_DIVERGENCE':
        return <AlertTriangle className="w-3.5 h-3.5 text-indigo-400" />;
      case 'FLASH_DUMP_RISK':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getBadgeStyle = (severity: MarketAnomaly['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750';
    }
  };

  return (
    <div id="market-anomalies-strip" className="space-y-2">
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Обнаружены аномалии рынка:
          </span>
        </div>

        {/* Anomaly Badges Strip */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-start sm:justify-end">
          {anomalies.map((anom) => (
            <button
              key={anom.id}
              onClick={() => setSelectedAnomaly(selectedAnomaly?.id === anom.id ? null : anom)}
              className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer shadow-sm ${getBadgeStyle(
                anom.severity
              )} ${selectedAnomaly?.id === anom.id ? 'ring-1 ring-white/40' : ''}`}
            >
              {getIcon(anom.type)}
              <span className="font-semibold">{anom.title}</span>
              <span className="font-bold bg-slate-900/60 px-1.5 py-0.2 rounded text-[10px] text-white">
                {anom.value}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Details Popup Card */}
      {selectedAnomaly && (
        <div className="bg-slate-850 border border-amber-500/40 rounded-xl p-3 text-xs font-mono text-slate-200 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getIcon(selectedAnomaly.type)}
              <span className="font-bold text-amber-300">{selectedAnomaly.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                Значение: {selectedAnomaly.value}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {selectedAnomaly.description}
            </p>
          </div>

          <button
            onClick={() => setSelectedAnomaly(null)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
