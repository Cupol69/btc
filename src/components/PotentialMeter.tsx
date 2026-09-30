import React, { useState, useMemo } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  DollarSign,
  PieChart,
  HelpCircle,
  Flame,
  AlertTriangle,
  Compass,
} from 'lucide-react';

function formatDexPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price) || price === 0) return '0.00';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.1) return price.toFixed(4);
  if (price >= 0.001) return price.toFixed(5);
  if (price >= 0.00001) return price.toFixed(7);
  if (price >= 0.000001) return price.toFixed(8);
  return price.toFixed(10).replace(/(\.\d*?[1-9])0+$/, '$1');
}

export interface PotentialMeterProps {
  currentPrice: number;
  fdv: number;
  liquidityUsd: number;
  volume24h: number;
  volume1h?: number;
  buyPressure1h?: number;
  symbol: string;
  tokenAddress?: string;
  chain?: string;
  depthTargets?: Array<{
    level: string;
    priceUsd: number;
    fdvUsd: number;
    requiredCapUsd: number;
    requiredVol24hUsd: number;
    impactSlippage: {
      size1kPct: number;
      size10kPct: number;
      size50kPct: number;
    };
    feasibility: 'HIGH' | 'MODERATE' | 'LOW' | 'EXTREME_RISK';
  }>;
  onAskAi: (question: string) => void;
}

export const PotentialMeter: React.FC<PotentialMeterProps> = ({
  currentPrice,
  fdv,
  liquidityUsd,
  volume24h,
  volume1h = 0,
  buyPressure1h = 50,
  symbol,
  tokenAddress = '',
  chain = 'BSC',
  depthTargets,
  onAskAi,
}) => {
  const [activeTab, setActiveTab] = useState<'fibonacci' | 'capital_targets' | 'whale_dump'>('fibonacci');
  const [customHighPrice, setCustomHighPrice] = useState<string>('');
  const [customLowPrice, setCustomLowPrice] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Default Swing Low & Swing High estimation based on standard on-chain ranges (or user custom)
  const swingHigh = useMemo(() => {
    const parsed = parseFloat(customHighPrice);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    // Approximation: ATH usually ~2.2x - 3.5x current if surging, or current price if at ATH
    return currentPrice * 2.5;
  }, [customHighPrice, currentPrice]);

  const swingLow = useMemo(() => {
    const parsed = parseFloat(customLowPrice);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    // Approximation: base consolidation low ~0.35x current price
    return currentPrice * 0.35;
  }, [customLowPrice, currentPrice]);

  // Fibonacci Retracement & Extension Calculations
  const fibCalculations = useMemo(() => {
    const diff = swingHigh - swingLow;
    
    // Retracements (from High down to Low)
    const retracements = [
      {
        ratio: 0.236,
        label: '0.236 Fib (Мелкий откат)',
        price: swingHigh - diff * 0.236,
        type: 'retrace' as const,
        description: 'Быстрый откат сильного тренда',
        safety: 'Агрессивный вход',
        color: 'text-amber-400',
        bgColor: 'bg-amber-950/40 border-amber-500/30',
      },
      {
        ratio: 0.382,
        label: '0.382 Fib (Первичная поддержка)',
        price: swingHigh - diff * 0.382,
        type: 'retrace' as const,
        description: 'Классическая первая волна коррекции',
        safety: 'Умеренный риск',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-950/40 border-cyan-500/30',
      },
      {
        ratio: 0.500,
        label: '0.500 Fib (Эквилибриум / 50%)',
        price: swingHigh - diff * 0.500,
        type: 'retrace' as const,
        description: 'Баланс покупателей и продавцов',
        safety: 'Оптимальная зона',
        color: 'text-blue-400',
        bgColor: 'bg-blue-950/40 border-blue-500/30',
      },
      {
        ratio: 0.618,
        label: '0.618 Fib (Золотой карман / Golden Pocket)',
        price: swingHigh - diff * 0.618,
        type: 'retrace' as const,
        description: 'Главная институциональная зона разворота',
        safety: 'Лучшая точка входа (Golden Zone)',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-950/50 border-emerald-500/40',
      },
      {
        ratio: 0.786,
        label: '0.786 Fib (Глубокий откат)',
        price: swingHigh - diff * 0.786,
        type: 'retrace' as const,
        description: 'Глубокая защита перед сломом структуры',
        safety: 'Повышенный риск (Stop-Hunt)',
        color: 'text-purple-400',
        bgColor: 'bg-purple-950/40 border-purple-500/30',
      },
    ];

    // Extensions (from High upwards)
    const extensions = [
      {
        ratio: 1.0,
        label: '1.000 Fib (Тестирование ATH / Локального хая)',
        price: swingHigh,
        type: 'extension' as const,
        description: 'Сопротивление вершины импульса',
        multiplier: `${((swingHigh / currentPrice - 1) * 100).toFixed(0)}%`,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-950/40 border-indigo-500/30',
      },
      {
        ratio: 1.272,
        label: '1.272 Fib (TP-1 Расширение)',
        price: swingLow + diff * 1.272,
        type: 'extension' as const,
        description: 'Первичный импульс пробоя максимума',
        multiplier: `${(((swingLow + diff * 1.272) / currentPrice - 1) * 100).toFixed(0)}%`,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-950/40 border-emerald-500/30',
      },
      {
        ratio: 1.618,
        label: '1.618 Fib (Golden Extension / Основной Тейк)',
        price: swingLow + diff * 1.618,
        type: 'extension' as const,
        description: 'Математическая цель волны 3/5 импульса',
        multiplier: `${(((swingLow + diff * 1.618) / currentPrice - 1) * 100).toFixed(0)}%`,
        color: 'text-amber-300 font-bold',
        bgColor: 'bg-amber-950/50 border-amber-500/50',
      },
      {
        ratio: 2.618,
        label: '2.618 Fib (Hyper-Cycle Парабола)',
        price: swingLow + diff * 2.618,
        type: 'extension' as const,
        description: 'Параболический памп при Tier-1 листингах',
        multiplier: `${(((swingLow + diff * 2.618) / currentPrice - 1) * 100).toFixed(0)}%`,
        color: 'text-fuchsia-400 font-black',
        bgColor: 'bg-fuchsia-950/40 border-fuchsia-500/40',
      },
    ];

    // Net Dollar Inflow Required to push price up to each Fib Extension in constant product AMM
    // In x * y = k, to increase price P by multiplier M, required Net Inflow in quote asset (USDT/BNB) is:
    // Delta_y = y_0 * (sqrt(M) - 1) where y_0 ≈ Liquidity / 2
    const baseQuoteReserve = Math.max(10000, liquidityUsd / 2);

    const calculatedExtensions = extensions.map(ext => {
      const mult = ext.price / currentPrice;
      const targetMcap = fdv * mult;
      let netInflowRequiredUsd = 0;
      if (mult > 1) {
        netInflowRequiredUsd = baseQuoteReserve * (Math.sqrt(mult) - 1);
      }
      return {
        ...ext,
        targetMcap,
        netInflowRequiredUsd,
      };
    });

    const calculatedRetracements = retracements.map(ret => {
      const mult = ret.price / currentPrice;
      const targetMcap = fdv * mult;
      // Inflow/Outflow to hit this level
      let netOutflowUsd = 0;
      if (mult < 1) {
        netOutflowUsd = baseQuoteReserve * (1 - Math.sqrt(mult));
      }
      return {
        ...ret,
        targetMcap,
        netOutflowUsd,
      };
    });

    return {
      retracements: calculatedRetracements,
      extensions: calculatedExtensions,
      goldenPocketPrice: swingHigh - diff * 0.618,
      goldenExtensionPrice: swingLow + diff * 1.618,
    };
  }, [currentPrice, fdv, liquidityUsd, swingHigh, swingLow]);

  // Potential Summary & Key Metrics
  const summaryScore = useMemo(() => {
    // Score out of 100 based on Volume, Liquidity depth, Buy pressure and FDV headroom
    let score = 50;
    if (buyPressure1h > 55) score += 15;
    else if (buyPressure1h < 45) score -= 15;

    const volToLiq = liquidityUsd > 0 ? volume24h / liquidityUsd : 0;
    if (volToLiq > 1.0 && volToLiq < 6.0) score += 15;
    else if (volToLiq >= 6.0) score += 5; // overheating risk

    if (liquidityUsd >= 200000) score += 10;
    else if (liquidityUsd < 30000) score -= 15;

    return Math.min(95, Math.max(15, score));
  }, [buyPressure1h, liquidityUsd, volume24h]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3.5">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Compass className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
              <span>Измеритель Потенциала: Фибоначчи, Капитал и Тейк-Профиты</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold">
                [AMM FIB & CAPITAL ENGINE]
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Математический расчет уровней отката (Golden Pocket), целей импульса (Fib Extension) и чистого долларового притока ($ Net Inflow), необходимого для сдвига цены.
            </p>
          </div>
        </div>

        {/* Global Potential Index Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <div className="p-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400 text-[10px]">Индекс Потенциала:</span>
            <span className={`font-black ${
              summaryScore >= 70 ? 'text-emerald-400' : summaryScore >= 45 ? 'text-amber-300' : 'text-rose-400'
            }`}>
              {summaryScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* 2. Mode Tabs: Fib Levels vs Capital Targets vs Whale Impact */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('fibonacci')}
            className={`px-3 py-1 rounded transition cursor-pointer font-bold flex items-center gap-1.5 ${
              activeTab === 'fibonacci'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Сетка Фибоначчи (Golden Pocket)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capital_targets')}
            className={`px-3 py-1 rounded transition cursor-pointer font-bold flex items-center gap-1.5 ${
              activeTab === 'capital_targets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Капитал & Необходимый Net Inflow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whale_dump')}
            className={`px-3 py-1 rounded transition cursor-pointer font-bold flex items-center gap-1.5 ${
              activeTab === 'whale_dump'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Зоны Сброса Китов & Слиппедж</span>
          </button>
        </div>

        {/* Toggle Custom High/Low swing anchor prices */}
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="text-[11px] text-slate-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
        >
          <span>Настроить экстремумы (ATH / Low)</span>
          {showAdvancedSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Advanced Swing Customizer */}
      {showAdvancedSettings && (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">
              Swing High / Локальный максимум ($):
            </label>
            <input
              type="number"
              step="any"
              value={customHighPrice}
              onChange={(e) => setCustomHighPrice(e.target.value)}
              placeholder={`По умолчанию: $${formatDexPrice(currentPrice * 2.5)}`}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">
              Swing Low / Дно накопления ($):
            </label>
            <input
              type="number"
              step="any"
              value={customLowPrice}
              onChange={(e) => setCustomLowPrice(e.target.value)}
              placeholder={`По умолчанию: $${formatDexPrice(currentPrice * 0.35)}`}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FIBONACCI EXTENSION & RETRACEMENT LADDER                           */}
      {/* ========================================================================= */}
      {activeTab === 'fibonacci' && (
        <div className="space-y-3 font-mono">
          {/* Key Golden Zones Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Golden Extension (1.618 Fib TP)</span>
                </span>
                <span className="text-white text-sm font-black">
                  ${formatDexPrice(fibCalculations.goldenExtensionPrice)}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Главная расчетная цель импульса. При текущем MCap ${(fdv / 1e3).toFixed(0)}k составит ${((fdv * (fibCalculations.goldenExtensionPrice / currentPrice)) / 1e3).toFixed(0)}k.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Golden Pocket (0.618 Fib Re-entry)</span>
                </span>
                <span className="text-white text-sm font-black">
                  ${formatDexPrice(fibCalculations.goldenPocketPrice)}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Институциональный карман набора позиции при откате. Снижение от текущей цены на ~{Math.abs(Math.round((1 - fibCalculations.goldenPocketPrice / currentPrice) * 100))}% .
              </p>
            </div>
          </div>

          {/* Detailed Fibonacci Levels Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-800 bg-slate-950">
                  <th className="py-2.5 px-3">Уровень Фибоначчи</th>
                  <th className="py-2.5 px-2">Цена ($ USD)</th>
                  <th className="py-2.5 px-2">Относительно текущей</th>
                  <th className="py-2.5 px-2">Расчетный MCap</th>
                  <th className="py-2.5 px-3">Требуемый Net Inflow ($)</th>
                  <th className="py-2.5 px-3">Характеристика</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {/* Extensions (UP) */}
                {fibCalculations.extensions.map((lvl, idx) => {
                  const isCurrentAbove = currentPrice >= lvl.price;
                  return (
                    <tr key={`ext-${idx}`} className={`hover:bg-slate-850/50 ${lvl.ratio === 1.618 ? 'bg-amber-950/20' : ''}`}>
                      <td className="py-2.5 px-3 font-bold flex items-center gap-1.5">
                        <span className="text-emerald-400">📈</span>
                        <span className={lvl.color}>{lvl.label}</span>
                      </td>
                      <td className="py-2.5 px-2 text-white font-black">
                        ${formatDexPrice(lvl.price)}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          +{lvl.multiplier}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-300">
                        ${(lvl.targetMcap / 1e3).toFixed(0)}k
                      </td>
                      <td className="py-2.5 px-3 text-emerald-300 font-bold">
                        +${(lvl.netInflowRequiredUsd / 1e3).toFixed(1)}k
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans text-[10px]">
                        {lvl.description}
                      </td>
                    </tr>
                  );
                })}

                {/* CURRENT PRICE ROW SEPARATOR */}
                <tr className="bg-indigo-950/50 border-y-2 border-indigo-500 font-bold">
                  <td className="py-2 px-3 text-indigo-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span>ТЕКУЩАЯ ЦЕНА ТОКЕНА</span>
                  </td>
                  <td className="py-2 px-2 text-white text-sm font-black">
                    ${formatDexPrice(currentPrice)}
                  </td>
                  <td className="py-2 px-2 text-indigo-300 text-[10px]">
                    Точка отсчета (0.0%)
                  </td>
                  <td className="py-2 px-2 text-white">
                    ${(fdv / 1e3).toFixed(0)}k
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    База (TVL: ${(liquidityUsd / 1e3).toFixed(1)}k)
                  </td>
                  <td className="py-2 px-3 text-indigo-200 font-sans text-[10px]">
                    1h Buy Pressure: {buyPressure1h}%
                  </td>
                </tr>

                {/* Retracements (DOWN) */}
                {fibCalculations.retracements.map((lvl, idx) => {
                  const percentDown = ((1 - lvl.price / currentPrice) * 100).toFixed(1);
                  return (
                    <tr key={`ret-${idx}`} className={`hover:bg-slate-850/50 ${lvl.ratio === 0.618 ? 'bg-emerald-950/20' : ''}`}>
                      <td className="py-2.5 px-3 font-bold flex items-center gap-1.5">
                        <span className="text-amber-400">📉</span>
                        <span className={lvl.color}>{lvl.label}</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-200 font-bold">
                        ${formatDexPrice(lvl.price)}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          -{percentDown}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-400">
                        ${(lvl.targetMcap / 1e3).toFixed(0)}k
                      </td>
                      <td className="py-2.5 px-3 text-rose-300">
                        -${(lvl.netOutflowUsd / 1e3).toFixed(1)}k
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans text-[10px]">
                        {lvl.safety}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CAPITAL TARGETS & REQUIRED NET INFLOW (RULE 5)                     */}
      {/* ========================================================================= */}
      {activeTab === 'capital_targets' && (
        <div className="space-y-3 font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Target className="w-4 h-4" />
                <span>Физический Расчет Капитала для Достижения Уровней (Rule 5)</span>
              </span>
              <span className="text-[10px] text-slate-500">Формула пула AMM x·y=k</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Вместо абстрактных прогнозов аналитический движок оценивает, сколько реальных долларов (Net Inflow) должно зайти в пул ликвидности PancakeSwap/Uniswap, чтобы цена закрепилась на каждом уровне с учетом текущего TVL (${(liquidityUsd / 1e3).toFixed(1)}k).
            </p>
          </div>

          {/* Upside Level Cards Grid */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Цели Роста & Требуемый Капитал (Upside Capital Targets):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              {[
                { level: '+25%', mult: 1.25, feas: 'ВЫСОКАЯ', color: 'emerald' },
                { level: '+50%', mult: 1.50, feas: 'УМЕРЕННАЯ', color: 'cyan' },
                { level: '+100% (2x)', mult: 2.00, feas: 'ТРЕБУЕТ CEX', color: 'indigo' },
                { level: '+200% (3x)', mult: 3.00, feas: 'СПЕКУЛЯТИВНАЯ', color: 'purple' },
              ].map((tgt, i) => {
                const targetPrice = currentPrice * tgt.mult;
                const targetMcap = fdv * tgt.mult;
                const reqInflow = Math.max(5000, (liquidityUsd / 2) * (Math.sqrt(tgt.mult) - 1));
                const reqVol = volume24h * (tgt.mult * 1.15);

                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <span className="font-black text-emerald-400 text-sm">{tgt.level}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {tgt.feas}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Целевая цена:</span>
                          <span className="text-white font-bold">${formatDexPrice(targetPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target MCap:</span>
                          <span className="text-slate-200 font-bold">${(targetMcap / 1e3).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Мин. 24h объем:</span>
                          <span className="text-slate-300">${(reqVol / 1e3).toFixed(0)}k</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 bg-slate-900/80 p-2 rounded text-[10px]">
                      <div className="flex justify-between text-emerald-300 font-bold">
                        <span>Чистый приток (Net Inflow):</span>
                        <span>+${(reqInflow / 1e3).toFixed(1)}k</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Downside Level Cards Grid */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Цели Коррекции & Стресс-Тест Дампа (Downside Capital Outflow):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { level: '-20%', mult: 0.80, label: 'Локальный откат', trigger: 'Фиксация спекулянтов', color: 'amber' },
                { level: '-40%', mult: 0.60, label: 'Пробой структуры', trigger: 'Срабатывание стопов', color: 'rose' },
                { level: '-60%', mult: 0.40, label: 'Каскадный сброс китов', trigger: 'Выход ранних холдеров', color: 'red' },
              ].map((tgt, i) => {
                const targetPrice = currentPrice * tgt.mult;
                const targetMcap = fdv * tgt.mult;
                const netOutflow = Math.max(3000, (liquidityUsd / 2) * (1 - Math.sqrt(tgt.mult)));

                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <span className="font-black text-rose-400 text-sm">{tgt.level}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 text-rose-300">
                          {tgt.label}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Уровень цены:</span>
                          <span className="text-slate-200 font-bold">${formatDexPrice(targetPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target MCap:</span>
                          <span className="text-slate-300 font-bold">${(targetMcap / 1e3).toFixed(0)}k</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Триггер:</span>
                          <span className="text-slate-400 text-[10px]">{tgt.trigger}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 bg-slate-900/80 p-2 rounded text-[10px]">
                      <div className="flex justify-between text-rose-300 font-bold">
                        <span>Дамп для пробоя (Net Outflow):</span>
                        <span>-${(netOutflow / 1e3).toFixed(1)}k</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHALE DUMP ZONES & SLIPPAGE IMPACT (RULE 12)                       */}
      {/* ========================================================================= */}
      {activeTab === 'whale_dump' && (
        <div className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Ордер $1,000 (Retail):</span>
                <span className="text-emerald-400 font-bold">Слиппедж</span>
              </div>
              <div className="text-base font-black text-emerald-400">
                ~{((1000 / (liquidityUsd + 1000)) * 100).toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Вход/выход без существенного сдвига пула.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Ордер $10,000 (Medium):</span>
                <span className="text-amber-400 font-bold">Слиппедж</span>
              </div>
              <div className={`text-base font-black ${
                (10000 / (liquidityUsd + 10000)) * 100 > 10 ? 'text-rose-400' : 'text-amber-300'
              }`}>
                ~{((10000 / (liquidityUsd + 10000)) * 100).toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                {(10000 / (liquidityUsd + 10000)) * 100 > 10 ? 'Требуется дробление на части.' : 'Допустимый импакт.'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/40 space-y-1">
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Ордер $50,000 (Whale Dump):</span>
                <span className="text-rose-400 font-bold">Слиппедж</span>
              </div>
              <div className="text-base font-black text-rose-400">
                ~{((50000 / (liquidityUsd + 50000)) * 100).toFixed(2)}%
              </div>
              <div className="text-[10px] text-rose-300 font-sans">
                Критический сдвиг. Сброс китом обрушит стакан.
              </div>
            </div>
          </div>

          {/* Downside Support Lines */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Нижние Уровни Поддержки & Риск Ликвидации Пула:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">-20% (Зона проторговки):</div>
                <div className="text-white font-bold mt-0.5">${formatDexPrice(currentPrice * 0.80)}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Локальная поддержка</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">-40% (Пробой структуры):</div>
                <div className="text-amber-300 font-bold mt-0.5">${formatDexPrice(currentPrice * 0.60)}</div>
                <div className="text-[10px] text-amber-400 mt-0.5">Срабатывание стопов</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-rose-900/30">
                <div className="text-slate-400 text-[10px]">-60% (Сброс китов):</div>
                <div className="text-rose-400 font-bold mt-0.5">${formatDexPrice(currentPrice * 0.40)}</div>
                <div className="text-[10px] text-rose-400 mt-0.5">Экстремальный стресс-тест</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Fast Action Button: Send Detailed Analysis to Gemini AI Engine */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="text-slate-400 text-[11px] font-sans flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Синтез потенциала через Фибоначчи и капитал пулов в соответствии с правилами Rule 5, 10, 12.</span>
        </div>

        <button
          type="button"
          onClick={() => {
            const prompt = `Проведи детальный расчет потенциала токена ${symbol} (${tokenAddress}): 
1. Рассчитай сетку Фибоначчи: Golden Pocket (0.618 Fib = $${formatDexPrice(fibCalculations.goldenPocketPrice)}) и цели Golden Extension (1.618 Fib = $${formatDexPrice(fibCalculations.goldenExtensionPrice)} и 2.618 Fib).
2. Сколько чистого долларового притока ($ Net Inflow) нужно влить в пул ликвидности для достижения +25%, +50%, +100% и +200% с учетом текущего TVL $${(liquidityUsd / 1e3).toFixed(1)}k.
3. Оцени зоны риска сброса китами (-20%, -40%, -60%) и слиппедж на сайзы $1k, $10k, $50k.
4. Выдай 4 сценария (Bull, Base, Bear, Extreme Bear) со строгими условиями Invalidation.`;
            onAskAi(prompt);
          }}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>🧠 Запросить Полный Анализ Потенциала у ИИ</span>
        </button>
      </div>
    </div>
  );
};
