import React from 'react';
import { SmartMoneyDivergence } from '../types';
import { Users, DollarSign, Compass, AlertCircle, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

interface SmartMoneyDivergenceCardProps {
  divergence: SmartMoneyDivergence | null;
  symbol: string;
}

export const SmartMoneyDivergenceCard: React.FC<SmartMoneyDivergenceCardProps> = ({
  divergence,
  symbol,
}) => {
  if (!divergence) {
    return (
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 text-center text-xs text-slate-500 font-mono">
        Загрузка данных дивергенции смарт-мани...
      </div>
    );
  }

  const getTypeBadge = (type: SmartMoneyDivergence['divergenceType']) => {
    switch (type) {
      case 'BULLISH_WHALE_ACCUMULATION':
        return {
          label: 'BULLISH WHALE ACCUMULATION',
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'BEARISH_WHALE_HEDGING':
        return {
          label: 'BEARISH WHALE HEDGING (TRAP)',
          color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'ALIGNED_BULL':
        return {
          label: 'ALIGNED BULLISH CONSENSUS',
          color: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          icon: <TrendingUp className="w-3.5 h-3.5 text-teal-300" />,
        };
      case 'ALIGNED_BEAR':
        return {
          label: 'ALIGNED BEARISH CONSENSUS',
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          icon: <TrendingDown className="w-3.5 h-3.5 text-orange-400" />,
        };
      default:
        return {
          label: 'NEUTRAL EQUILIBRIUM',
          color: 'bg-slate-700/50 text-slate-300 border-slate-600',
          icon: <Compass className="w-3.5 h-3.5 text-slate-300" />,
        };
    }
  };

  const badge = getTypeBadge(divergence.divergenceType);

  return (
    <div id="smart-money-divergence-card" className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 font-mono">
              Top Trader Smart Money Divergence
            </h3>
            <span className="text-[10px] text-slate-400">
              Accounts Ratio vs Positions Volume Ratio (Binance Agent OS)
            </span>
          </div>
        </div>

        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${badge.color}`}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {/* Two Pillars Comparison */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Account Ratio (Number of Trader Accounts) */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-400" /> Account Ratio
            </span>
            <span className="text-[10px] text-slate-300">{divergence.accountRatio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold text-emerald-400">{divergence.accountLongPct.toFixed(1)}% L</span>
            <span className="text-sm font-bold text-rose-400">{(100 - divergence.accountLongPct).toFixed(1)}% S</span>
          </div>
          <div className="h-1.5 w-full bg-rose-500/30 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${divergence.accountLongPct}%` }} />
          </div>
          <span className="text-[9px] text-slate-500 block text-center">Число счетов топ-трейдеров</span>
        </div>

        {/* Position Ratio (Net USD Position Volume) */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-purple-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] flex items-center gap-1 text-purple-300">
              <DollarSign className="w-3 h-3 text-purple-400" /> Position Ratio
            </span>
            <span className="text-[10px] text-purple-300 font-bold">{divergence.positionRatio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold text-emerald-400">{divergence.positionLongPct.toFixed(1)}% L</span>
            <span className="text-sm font-bold text-rose-400">{(100 - divergence.positionLongPct).toFixed(1)}% S</span>
          </div>
          <div className="h-1.5 w-full bg-rose-500/30 rounded-full overflow-hidden flex">
            <div className="h-full bg-purple-400 transition-all" style={{ width: `${divergence.positionLongPct}%` }} />
          </div>
          <span className="text-[9px] text-purple-400/80 block text-center font-bold">Суммарный объем в USD ($)</span>
        </div>
      </div>

      {/* Divergence Analysis Summary */}
      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-400">
            Spread Ratio (Positions / Accounts):
          </span>
          <span className={`font-bold ${divergence.spreadRatio > 1.05 ? 'text-purple-400' : divergence.spreadRatio < 0.95 ? 'text-rose-400' : 'text-slate-300'}`}>
            {divergence.spreadRatio.toFixed(3)}x
          </span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {divergence.summary}
        </p>
      </div>
    </div>
  );
};
