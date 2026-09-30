import React, { useState, useEffect, useRef } from 'react';
import { DumpRiskAssessment } from '../types';
import {
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Info,
  Activity,
  Zap,
} from 'lucide-react';

interface DumpRadarBulbProps {
  dumpRisk: DumpRiskAssessment;
  symbol: string;
}

export const DumpRadarBulb: React.FC<DumpRadarBulbProps> = ({ dumpRisk, symbol }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const lastAlertTimeRef = useRef<number>(0);

  // Sound alert trigger when risk becomes CRITICAL
  useEffect(() => {
    if (soundEnabled && dumpRisk.level === 'CRITICAL') {
      const now = Date.now();
      // Throttle beep to once every 20 seconds
      if (now - lastAlertTimeRef.current > 20000) {
        lastAlertTimeRef.current = now;
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.35);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch {
          // AudioContext not allowed or disabled
        }
      }
    }
  }, [dumpRisk.level, soundEnabled]);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const { score, level, triggers, description, advice, metrics } = dumpRisk;

  // Visual styling based on danger level
  let bulbColor = 'bg-emerald-500 shadow-emerald-500/50';
  let badgeBg = 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';
  let levelText = 'LOW';
  let pulseRing = false;

  if (level === 'CRITICAL') {
    bulbColor = 'bg-rose-500 shadow-rose-500/80 animate-ping';
    badgeBg = 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.35)]';
    levelText = 'CRITICAL DUMP';
    pulseRing = true;
  } else if (level === 'HIGH') {
    bulbColor = 'bg-orange-500 shadow-orange-500/70';
    badgeBg = 'bg-orange-950/60 text-orange-300 border-orange-500/50';
    levelText = 'HIGH RISK';
    pulseRing = true;
  } else if (level === 'ELEVATED') {
    bulbColor = 'bg-amber-400 shadow-amber-400/50';
    badgeBg = 'bg-amber-950/50 text-amber-300 border-amber-500/40';
    levelText = 'ELEVATED';
  } else if (level === 'GUARDED') {
    bulbColor = 'bg-sky-400 shadow-sky-400/40';
    badgeBg = 'bg-sky-950/40 text-sky-300 border-sky-500/30';
    levelText = 'GUARDED';
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Interactive Bulb Trigger Button */}
      <button
        type="button"
        id="dump-radar-bulb-button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all duration-200 select-none ${badgeBg} hover:opacity-90 active:scale-95`}
        title="Радар риска пролива (Dump / Liquidity Flush Radar). Нажмите для детального разбора"
      >
        {/* The Indicator Bulb */}
        <div className="relative flex items-center justify-center w-3 h-3">
          {pulseRing && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
              level === 'CRITICAL' ? 'bg-rose-400' : 'bg-orange-400'
            }`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 shadow-sm transition-colors duration-300 ${
            level === 'CRITICAL'
              ? 'bg-rose-500'
              : level === 'HIGH'
              ? 'bg-orange-500'
              : level === 'ELEVATED'
              ? 'bg-amber-400'
              : level === 'GUARDED'
              ? 'bg-sky-400'
              : 'bg-emerald-400'
          }`} />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">DUMP RADAR:</span>
          <span className="text-[11px] font-bold">
            {levelText} ({score}%)
          </span>
        </div>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 p-3.5 bg-slate-900/98 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl z-50 text-xs font-sans space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${
                level === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : level === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {level === 'CRITICAL' || level === 'HIGH' ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  Радар риска пролива <span className="font-mono text-amber-400 text-[11px]">({symbol})</span>
                </h4>
                <p className="text-[10px] text-slate-400">Мониторинг исчерпания бидов и маркет-селлов</p>
              </div>
            </div>

            {/* Sound Mute/Unmute Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-md border text-[10px] flex items-center gap-1 transition-colors ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'Звуковой сигнал включен' : 'Включить звуковой сигнал при тревоге'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Звук ВКЛ' : 'Звук'}</span>
            </button>
          </div>

          {/* Risk Level Meter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Индекс угрозы пролива:</span>
              <span className={`font-bold ${
                score >= 80 ? 'text-rose-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {score} / 100 [{level}]
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  score >= 80
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                    : score >= 60
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : score >= 40
                    ? 'bg-gradient-to-r from-sky-500 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                }`}
                style={{ width: `${Math.max(5, score)}%` }}
              />
            </div>
          </div>

          {/* Live Micro-factors Grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Стакан ($ USD):</span>
              <span className={`font-bold ${metrics.imbalancePct < -15 ? 'text-rose-400' : metrics.imbalancePct > 15 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {metrics.imbalancePct > 0 ? '+' : ''}{metrics.imbalancePct.toFixed(1)}% {metrics.imbalancePct < 0 ? '(Аски > Бидов)' : '(Биды > Асков)'}
              </span>
            </div>

            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Taker CVD поток:</span>
              <span className={`font-bold ${metrics.takerDeltaUsd < -5000 ? 'text-rose-400' : metrics.takerDeltaUsd > 5000 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {metrics.takerDeltaUsd >= 0 ? '+' : ''}${(metrics.takerDeltaUsd / 1000).toFixed(1)}k
              </span>
            </div>

            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Ликвидации лонгов (15м):</span>
              <span className={`font-bold ${metrics.longLiquidationUsd > 50000 ? 'text-rose-400' : 'text-slate-200'}`}>
                ${(metrics.longLiquidationUsd / 1000).toFixed(0)}k
              </span>
            </div>

            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block mb-0.5">Фандинг ставка:</span>
              <span className={`font-bold ${metrics.fundingRatePct > 0.02 ? 'text-orange-400' : 'text-slate-200'}`}>
                {metrics.fundingRatePct.toFixed(4)}% {metrics.fundingRatePct > 0.02 ? '(Перегрев)' : ''}
              </span>
            </div>
          </div>

          {/* Trigger list if any */}
          {triggers.length > 0 ? (
            <div className="space-y-1 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Сработавшие триггеры риска:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {triggers.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-400 text-xs">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[11px] text-emerald-300/90 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Все метрики в норме, дисбаланс продавцов и каскады маркет-селлов отсутствуют.</span>
            </div>
          )}

          {/* Advice & Protection */}
          <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1 text-[10px] uppercase">
              <Info className="w-3 h-3 text-amber-400" /> Рекомендация по защите:
            </div>
            <p className="text-slate-300 leading-relaxed">{advice}</p>
          </div>
        </div>
      )}
    </div>
  );
};
