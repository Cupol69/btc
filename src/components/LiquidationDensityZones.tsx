import React, { useState, useEffect } from 'react';
import { LiquidationDensityMap, LiquidationCluster } from '../types';
import { binanceRest } from '../services/binanceRest';
import { Magnet, AlertTriangle, ShieldAlert, Zap, RefreshCw, Layers } from 'lucide-react';

interface LiquidationDensityZonesProps {
  symbol: string;
  currentPrice: number;
}

export const LiquidationDensityZones: React.FC<LiquidationDensityZonesProps> = ({
  symbol,
  currentPrice,
}) => {
  const [densityMap, setDensityMap] = useState<LiquidationDensityMap | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTierFilter, setActiveTierFilter] = useState<string>('ALL');

  const fetchDensity = async () => {
    setLoading(true);
    try {
      const data = await binanceRest.getLiquidationClusters(symbol);
      if (data) {
        setDensityMap(data);
      }
    } catch (err) {
      console.warn('[LiquidationDensityZones] Error loading clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDensity();
    const timer = setInterval(fetchDensity, 15000);
    return () => clearInterval(timer);
  }, [symbol]);

  if (!densityMap) {
    return (
      <div id="liquidation-density-skeleton" className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 animate-pulse space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="h-20 bg-slate-800/50 rounded"></div>
      </div>
    );
  }

  const markPrice = densityMap.markPrice || currentPrice || 1;
  const filteredClusters = densityMap.clusters.filter((c) =>
    activeTierFilter === 'ALL' ? true : c.leverageTier === activeTierFilter
  );

  const shortLiqClusters = filteredClusters.filter((c) => c.side === 'SHORT_LIQ').reverse();
  const longLiqClusters = filteredClusters.filter((c) => c.side === 'LONG_LIQ').reverse();

  const maxVol = Math.max(
    ...densityMap.clusters.map((c) => c.estimatedVolUsd),
    100000
  );

  const getRiskColor = (risk: LiquidationDensityMap['cascadeRisk']) => {
    switch (risk) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
      case 'HIGH':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
      case 'MEDIUM':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      default:
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
    }
  };

  const formatUsd = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${Math.round(num)}`;
  };

  const formatPrice = (p: number) => {
    if (p >= 100) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  return (
    <div id="liquidation-density-zones" className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Magnet className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
              Liquidation Density Clusters (10x-100x)
            </h3>
            <span className="text-[10px] text-slate-400">
              Binance Agent OS • High-leverage Cascade Magnet Levels
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${getRiskColor(densityMap.cascadeRisk)}`}>
            CASCADE RISK: {densityMap.cascadeRisk}
          </span>
          <button
            id="btn-refresh-liq-density"
            onClick={fetchDensity}
            disabled={loading}
            className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 transition-colors"
            title="Обновить карту ликвидаций"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Magnet Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        {/* Short Liquidation Magnet (Above Mark) */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Short Squeeze Magnet
            </span>
            <span className="text-[9px] text-slate-400">
              +{(((densityMap.primaryShortMagnet - markPrice) / markPrice) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-white font-mono">
              ${formatPrice(densityMap.primaryShortMagnet)}
            </span>
            <span className="text-[10px] text-slate-400">
              Trigger: ${formatPrice(densityMap.shortSqueezePrice)}
            </span>
          </div>
          <p className="text-[9px] text-slate-400">
            Пул принудительных покупок шортистов (магнитный уровень для маркет-мейкера).
          </p>
        </div>

        {/* Long Liquidation Magnet (Below Mark) */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-rose-500/30 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Long Cascade Magnet
            </span>
            <span className="text-[9px] text-slate-400">
              {(((densityMap.primaryLongMagnet - markPrice) / markPrice) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-white font-mono">
              ${formatPrice(densityMap.primaryLongMagnet)}
            </span>
            <span className="text-[10px] text-slate-400">
              Trigger: ${formatPrice(densityMap.longCascadePrice)}
            </span>
          </div>
          <p className="text-[9px] text-slate-400">
            Пул принудительных продаж лонгистов при падении котировок.
          </p>
        </div>
      </div>

      {/* Leverage Filter Pills */}
      <div className="flex items-center justify-between pt-1 text-[10px] font-mono border-t border-slate-800">
        <span className="text-slate-400 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-500" /> Leverage Tiers:
        </span>
        <div className="flex items-center gap-1">
          {['ALL', '100x', '50x', '25x', '10x'].map((tier) => (
            <button
              key={tier}
              id={`filter-tier-${tier}`}
              onClick={() => setActiveTierFilter(tier)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                activeTierFilter === tier
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Cluster Density Bars */}
      <div className="space-y-1.5 font-mono text-[11px]">
        {/* Short Liquidation Pools (Above Current Price) */}
        <div className="space-y-1">
          <span className="text-[9px] text-emerald-400/80 uppercase tracking-wider font-semibold block">
            ▲ Short Liquidation Heatmap (Выше текущей цены)
          </span>
          {shortLiqClusters.map((cluster, i) => {
            const widthPct = Math.min(100, Math.max(8, (cluster.estimatedVolUsd / maxVol) * 100));
            return (
              <div
                key={`short-${i}`}
                className="group relative bg-slate-950/60 rounded p-1.5 border border-slate-800/80 hover:border-emerald-500/40 transition-colors"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 rounded transition-all"
                  style={{ width: `${widthPct}%` }}
                />
                <div className="relative flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {cluster.leverageTier}
                    </span>
                    <span className="font-bold text-slate-200">${formatPrice(cluster.priceLevel)}</span>
                    <span className="text-[9px] text-emerald-400">+{cluster.distancePct.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cluster.isMagnetZone && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                        <Magnet className="w-2 h-2" /> MAGNET
                      </span>
                    )}
                    <span className="text-slate-300 font-semibold">{formatUsd(cluster.estimatedVolUsd)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Mark Price Center Divider */}
        <div className="py-1.5 px-2.5 rounded bg-slate-850 border border-amber-500/40 flex items-center justify-between text-xs font-bold text-amber-300 my-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>MARK PRICE (INDEX REFERENCE)</span>
          </div>
          <span className="font-mono text-sm text-white">${formatPrice(markPrice)}</span>
        </div>

        {/* Long Liquidation Pools (Below Current Price) */}
        <div className="space-y-1">
          <span className="text-[9px] text-rose-400/80 uppercase tracking-wider font-semibold block">
            ▼ Long Liquidation Heatmap (Ниже текущей цены)
          </span>
          {longLiqClusters.map((cluster, i) => {
            const widthPct = Math.min(100, Math.max(8, (cluster.estimatedVolUsd / maxVol) * 100));
            return (
              <div
                key={`long-${i}`}
                className="group relative bg-slate-950/60 rounded p-1.5 border border-slate-800/80 hover:border-rose-500/40 transition-colors"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-rose-500/10 rounded transition-all"
                  style={{ width: `${widthPct}%` }}
                />
                <div className="relative flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {cluster.leverageTier}
                    </span>
                    <span className="font-bold text-slate-200">${formatPrice(cluster.priceLevel)}</span>
                    <span className="text-[9px] text-rose-400">{cluster.distancePct.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cluster.isMagnetZone && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 flex items-center gap-0.5">
                        <Magnet className="w-2 h-2" /> MAGNET
                      </span>
                    )}
                    <span className="text-slate-300 font-semibold">{formatUsd(cluster.estimatedVolUsd)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
