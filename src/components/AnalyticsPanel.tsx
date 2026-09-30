import React from 'react';
import {
  SpotFuturesBasis,
  OpenInterest,
  OpenInterestHist,
  TakerLongShortRatio,
  LiquidationOrder,
  CVDData,
} from '../types';
import { CVDIndicator } from './CVDIndicator';
import { OpenInterestPanel } from './OpenInterestPanel';
import { Percent, Skull, Info } from 'lucide-react';

interface AnalyticsPanelProps {
  basis: SpotFuturesBasis;
  openInterest: OpenInterest | null;
  oiHistory: OpenInterestHist[];
  takerRatio: TakerLongShortRatio | null;
  liquidations: LiquidationOrder[];
  cvdData: CVDData;
  timeframe: string;
  symbol: string;
  hasFutures?: boolean;
  priceChange24h?: number;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  basis,
  openInterest,
  oiHistory,
  takerRatio,
  liquidations,
  cvdData,
  timeframe,
  symbol,
  hasFutures = true,
  priceChange24h = 0,
}) => {
  if (!hasFutures) {
    return (
      <div id="analytics-panel" className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 space-y-3.5">
        {/* For Spot pairs, we still show the CVD flow indicator which works 100% on spot market taker volumes */}
        <CVDIndicator cvdData={cvdData} timeframe={timeframe} />

        <div className="bg-slate-800/40 rounded-lg border border-slate-750 p-4 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-xs font-bold text-slate-200 font-mono">
              Фьючерсы недоступны для {symbol}
            </h3>
            <p className="text-[11px] text-slate-400">
              Метрики Open Interest, Funding Rate и Ликвидации рассчитываются для контрактов USDT-M. Спотовый анализ CVD и книги заявок активен.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isContango = basis.structure === 'CONTANGO';
  const isBackwardation = basis.structure === 'BACKWARDATION';

  // Compute liquidation aggregates (USD)
  const totalLongLiqUsd = liquidations
    .filter((l) => l.side === 'SELL')
    .reduce((sum, l) => sum + parseFloat(l.executedQty || l.origQty) * parseFloat(l.price), 0);

  const totalShortLiqUsd = liquidations
    .filter((l) => l.side === 'BUY')
    .reduce((sum, l) => sum + parseFloat(l.executedQty || l.origQty) * parseFloat(l.price), 0);

  return (
    <div id="analytics-panel" className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 space-y-3.5 shadow-sm font-sans">
      {/* 1. Cumulative Volume Delta (CVD) Micro-Indicator */}
      <CVDIndicator cvdData={cvdData} timeframe={timeframe} />

      {/* 2. Enhanced Open Interest (OI) & Capital Matrix Panel */}
      <OpenInterestPanel
        openInterest={openInterest}
        initialOiHistory={oiHistory}
        symbol={symbol}
        futuresPrice={basis.futuresPrice || basis.spotPrice}
        priceChange24h={priceChange24h}
      />

      {/* 3. Spot-Futures Basis Metric */}
      <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-750 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            <span>Spot-Futures Basis & CEX Spread</span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              isContango
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isBackwardation
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {basis.structure} ({basis.basis >= 0 ? '+' : ''}{basis.basis.toFixed(4)}%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Basis / Spread</span>
            <span className={`font-bold text-sm ${basis.basis >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {basis.basis >= 0 ? '+' : ''}{basis.basis.toFixed(4)}%
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Годовой APR</span>
            <span className="font-semibold text-sm text-slate-200">{basis.annualizedAPR.toFixed(2)}%</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Mark Price</span>
            <span className="text-sm text-amber-300 font-bold">
              ${basis.futuresPrice >= 1 ? basis.futuresPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : basis.futuresPrice.toFixed(6)}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400">
          {isContango
            ? '⚡ Контанго: Премия фьючерса к споту. Трейдеры настроены оптимистично.'
            : isBackwardation
            ? '⚠️ Бэквордация: Дисконт фьючерса к споту. Преобладают продажи/хеджирование.'
            : '⚖️ Баланс: Спред между спотом и деривативами минимален.'}
        </p>
      </div>

      {/* 4. Live Liquidation Stream (Быстрый и легкий поток реальных ликвидаций) */}
      <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-750 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span>Live Liquidation Stream</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-rose-400">Longs: ${(totalLongLiqUsd / 1000).toFixed(0)}k</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Shorts: ${(totalShortLiqUsd / 1000).toFixed(0)}k</span>
          </div>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto pr-1 text-[11px] font-mono scrollbar-thin">
          {liquidations.length === 0 ? (
            <div className="text-slate-500 text-center py-3 text-[11px]">
              Ожидание потока ликвидаций в реальном времени...
            </div>
          ) : (
            liquidations.slice(0, 6).map((liq, idx) => {
              const isLongLiq = liq.side === 'SELL';
              const amountUsd = parseFloat(liq.executedQty || liq.origQty) * parseFloat(liq.price);
              return (
                <div
                  key={`${liq.time}-${idx}`}
                  className="flex items-center justify-between py-1 px-1.5 rounded bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                        isLongLiq
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isLongLiq ? 'LONG' : 'SHORT'}
                    </span>
                    <span className="text-slate-300 font-semibold">{liq.symbol}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      ${!isNaN(parseFloat(liq.price)) ? (parseFloat(liq.price) >= 1 ? parseFloat(liq.price).toLocaleString() : parseFloat(liq.price).toFixed(5)) : '—'}
                    </span>
                    <span className="text-white font-bold">${amountUsd && !isNaN(amountUsd) ? Math.round(amountUsd).toLocaleString() : '—'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
