import React from 'react';
import { TacticalTradePlan } from '../types';
import { Target, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus, Crosshair, Scale } from 'lucide-react';

interface TacticalTradeMapProps {
  plan: TacticalTradePlan | null;
  currentPrice: number;
}

export const TacticalTradeMap: React.FC<TacticalTradeMapProps> = ({ plan, currentPrice }) => {
  if (!plan) return null;

  const entryPrice = Number(plan.entryPrice);
  const target1Price = Number(plan.target1Price);
  const target2Price = plan.target2Price ? Number(plan.target2Price) : null;
  const invalidationPrice = Number(plan.invalidationPrice);

  if (isNaN(entryPrice) || entryPrice <= 0) return null;

  const formatPrice = (p: number | null | undefined) => {
    if (p == null || isNaN(p) || p <= 0) return '—';
    if (p >= 1) {
      return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return p.toFixed(4);
  };

  const isLong = plan.bias === 'LONG';
  const isShort = plan.bias === 'SHORT';
  const isNeutral = plan.bias === 'NEUTRAL';

  // Calculate percentage distances from current price
  const calcDiff = (target: number | null | undefined) => {
    if (target == null || !currentPrice || currentPrice <= 0 || isNaN(target)) return '0.00%';
    const pct = ((target - currentPrice) / currentPrice) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  };

  const biasBadge = isLong ? (
    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
      <ArrowUpRight className="w-3 h-3" /> LONG BIAS
    </span>
  ) : isShort ? (
    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
      <ArrowDownRight className="w-3 h-3" /> SHORT BIAS
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold flex items-center gap-1">
      <Minus className="w-3 h-3" /> NEUTRAL
    </span>
  );

  return (
    <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-3 mb-3 text-xs space-y-2.5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crosshair className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              Тактическая AI-разметка в моменте
            </span>
            <span className="text-[10px] text-slate-400 font-mono ml-2">
              (R:R {plan.riskRewardRatio})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plan.confidenceScore && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
              Уверенность: {plan.confidenceScore}%
            </span>
          )}
          {biasBadge}
        </div>
      </div>

      {/* Interactive Level Badges / Roadmap */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono">
        {/* 1. Entry Level */}
        <div className="bg-slate-900/90 rounded-lg border border-sky-500/30 p-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-sky-400 font-bold mb-1">
            <span>ВХОД (ENTRY)</span>
            <span className="text-slate-400">{calcDiff(entryPrice)}</span>
          </div>
          <div className="text-sm font-bold text-sky-200">
            ${formatPrice(entryPrice)}
          </div>
        </div>

        {/* 2. Target 1 */}
        <div className="bg-slate-900/90 rounded-lg border border-emerald-500/30 p-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Target className="w-2.5 h-2.5" /> ЦЕЛЬ 1 (TP1)
            </span>
            <span className="text-emerald-400">{calcDiff(target1Price)}</span>
          </div>
          <div className="text-sm font-bold text-emerald-200">
            ${formatPrice(target1Price)}
          </div>
        </div>

        {/* 3. Target 2 */}
        {target2Price && target2Price > 0 ? (
          <div className="bg-slate-900/90 rounded-lg border border-emerald-500/20 p-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[10px] text-emerald-500 font-bold mb-1">
              <span className="flex items-center gap-1">
                <Target className="w-2.5 h-2.5" /> ЦЕЛЬ 2 (TP2)
              </span>
              <span className="text-emerald-400">{calcDiff(target2Price)}</span>
            </div>
            <div className="text-sm font-bold text-emerald-300">
              ${formatPrice(target2Price)}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 rounded-lg border border-slate-800 p-2 flex items-center justify-center text-slate-500 text-[10px]">
            Цель 2: Трейлинг-стоп
          </div>
        )}

        {/* 4. Invalidation / Stop */}
        <div className="bg-slate-900/90 rounded-lg border border-rose-500/40 p-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-rose-400 font-bold mb-1">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-2.5 h-2.5" /> ОТМЕНА (STOP)
            </span>
            <span className="text-rose-400">{calcDiff(invalidationPrice)}</span>
          </div>
          <div className="text-sm font-bold text-rose-200">
            ${formatPrice(invalidationPrice)}
          </div>
        </div>
      </div>

      {/* Rationale & Invalidation Reasons */}
      <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
        <p>
          <strong className="text-amber-400">Логика входа:</strong> {plan.rationale}
        </p>
        <p>
          <strong className="text-rose-400">Условие отмены:</strong> {plan.invalidationReason}
        </p>
      </div>
    </div>
  );
};
