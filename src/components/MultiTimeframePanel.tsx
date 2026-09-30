import React from 'react';
import { TimeframeTrend } from '../types';
import { Network, TrendingUp, TrendingDown, Minus, ShieldCheck, AlertCircle } from 'lucide-react';

interface MultiTimeframePanelProps {
  trends: Record<string, TimeframeTrend>;
  onSelectTimeframe: (tf: string) => void;
  activeTimeframe: string;
}

export const MultiTimeframePanel: React.FC<MultiTimeframePanelProps> = ({
  trends,
  onSelectTimeframe,
  activeTimeframe,
}) => {
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  const trendList = Object.values(trends) as TimeframeTrend[];
  const bullishCount = trendList.filter((t) => t.trend === 'BULLISH').length;
  const bearishCount = trendList.filter((t) => t.trend === 'BEARISH').length;

  let overallAlignment = 'Смешанный тренд (Флэт / Консолидация)';
  let alignmentColor = 'text-amber-400';

  if (bullishCount >= 4) {
    overallAlignment = 'Сильный бычий консенсус (Multi-TF Bullish)';
    alignmentColor = 'text-emerald-400';
  } else if (bearishCount >= 4) {
    overallAlignment = 'Сильный медвежий консенсус (Multi-TF Bearish)';
    alignmentColor = 'text-rose-400';
  }

  return (
    <div id="multitimeframe-panel" className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Multi-Timeframe Analysis (Раздел 5.5)
          </h3>
        </div>
        <div className="text-[11px] font-mono">
          Консенсус: <span className={`font-semibold ${alignmentColor}`}>{overallAlignment}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {timeframes.map((tf) => {
          const item = trends[tf] || {
            timeframe: tf,
            trend: 'NEUTRAL',
            changePercent: 0,
            volumeStrength: 'NORMAL',
            rsiApprox: 50,
          };

          const isBullish = item.trend === 'BULLISH';
          const isBearish = item.trend === 'BEARISH';
          const isSelected = activeTimeframe === tf;

          return (
            <button
              key={tf}
              id={`mtf-card-${tf}`}
              onClick={() => onSelectTimeframe(tf)}
              className={`p-2.5 rounded-lg border text-left transition ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20'
                  : 'bg-slate-800/60 border-slate-750 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono text-slate-200 uppercase">{tf}</span>
                <span
                  className={`inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isBullish
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isBearish
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isBullish ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : isBearish ? <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> : <Minus className="w-2.5 h-2.5 mr-0.5" />}
                  {item.trend}
                </span>
              </div>

              <div className="text-xs font-mono font-semibold text-white">
                <span className={item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-750/60">
                <span>RSI: <span className="text-slate-200 font-semibold">{item.rsiApprox}</span></span>
                <span>Vol: <span className={item.volumeStrength === 'HIGH' ? 'text-amber-400 font-semibold' : 'text-slate-300'}>{item.volumeStrength}</span></span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
