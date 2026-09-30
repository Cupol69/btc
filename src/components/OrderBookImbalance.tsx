import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OrderBook, OrderBookImbalance as IOrderBookImbalance } from '../types';
import {
  Scale,
  ArrowDown,
  ArrowUp,
  Sliders,
  ShieldCheck,
  Clock,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Zap,
  TrendingUp,
  TrendingDown,
  Maximize2,
} from 'lucide-react';

interface OrderBookProps {
  orderBook: OrderBook | null;
  imbalance: IOrderBookImbalance;
  currentPrice: number;
  onDepthChange?: (depth: number) => void;
  selectedDepth?: number;
}

export const OrderBookImbalance: React.FC<OrderBookProps> = ({
  orderBook,
  imbalance: initialImbalance,
  currentPrice,
  onDepthChange,
  selectedDepth: propDepth = 20,
}) => {
  const [depthLevels, setDepthLevels] = useState<number>(propDepth);
  const [throttledBook, setThrottledBook] = useState<OrderBook | null>(orderBook);
  const [smoothMode, setSmoothMode] = useState<boolean>(true); // EMA smoothed vs instant raw
  const [showMiniLadder, setShowMiniLadder] = useState<boolean>(false);
  const [imbalanceHistory, setImbalanceHistory] = useState<number[]>([]);
  const [emaImbalance, setEmaImbalance] = useState<number>(0);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const lastUpdateRef = useRef<number>(Date.now());
  const pendingBookRef = useRef<OrderBook | null>(orderBook);
  const emaRef = useRef<number>(0);

  // Sync propDepth
  useEffect(() => {
    if (propDepth && propDepth !== depthLevels) {
      setDepthLevels(propDepth);
    }
  }, [propDepth]);

  // Keep track of incoming raw orderbook
  useEffect(() => {
    pendingBookRef.current = orderBook;
  }, [orderBook]);

  // Throttled update cycle (every 2.5s) to prevent jitter and calculate stable EMA
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingBookRef.current) {
        setThrottledBook(pendingBookRef.current);
        lastUpdateRef.current = Date.now();
        setSecondsAgo(0);

        // Calculate instant imbalance on current selected depth
        const bids = pendingBookRef.current.bids.slice(0, depthLevels);
        const asks = pendingBookRef.current.asks.slice(0, depthLevels);
        const sumBids = bids.reduce((acc, b) => acc + b.price * b.qty, 0);
        const sumAsks = asks.reduce((acc, a) => acc + a.price * a.qty, 0);
        const total = sumBids + sumAsks;
        const rawImb = total > 0 ? ((sumBids - sumAsks) / total) * 100 : 0;

        // Exponential smoothing: EMA_t = alpha * raw + (1 - alpha) * EMA_{t-1}
        const alpha = 0.35; // Responsive yet smooth
        const newEma = emaRef.current === 0 ? rawImb : alpha * rawImb + (1 - alpha) * emaRef.current;
        emaRef.current = newEma;
        setEmaImbalance(newEma);

        setImbalanceHistory((prev) => {
          const next = [...prev, smoothMode ? newEma : rawImb];
          return next.slice(-14); // Keep last 14 data points
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [depthLevels, smoothMode]);

  // Seconds ago ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - lastUpdateRef.current) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUsd = (val: number): string => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  // Detailed multi-horizon analytics
  const analytics = useMemo(() => {
    const rawBids = throttledBook?.bids || [];
    const rawAsks = throttledBook?.asks || [];

    // Helper for any depth
    const calcForDepth = (d: number) => {
      const bSlice = rawBids.slice(0, d);
      const aSlice = rawAsks.slice(0, d);
      const bUsd = bSlice.reduce((acc, b) => acc + b.price * b.qty, 0);
      const aUsd = aSlice.reduce((acc, a) => acc + a.price * a.qty, 0);
      const tot = bUsd + aUsd;
      const pct = tot > 0 ? ((bUsd - aUsd) / tot) * 100 : 0;
      return { bUsd, aUsd, tot, pct };
    };

    const micro = calcForDepth(5); // Top 5 (Spread momentum)
    const mid = calcForDepth(20); // Top 20 (Session depth)
    const deep = calcForDepth(50); // Top 50 (Institutional base)
    const active = calcForDepth(depthLevels); // User selected depth

    // Spread calculation
    const bestBid = rawBids[0]?.price || currentPrice;
    const bestAsk = rawAsks[0]?.price || currentPrice;
    const spreadUsd = Math.max(0, bestAsk - bestBid);
    const spreadBps = bestBid > 0 ? (spreadUsd / bestBid) * 10000 : 0; // Basis points (0.01% = 1 bps)

    // Locate Major Walls (Largest single limit orders in top 50)
    let maxBidWall = { price: 0, qtyUsd: 0, distPct: 0 };
    let maxAskWall = { price: 0, qtyUsd: 0, distPct: 0 };

    rawBids.slice(0, 50).forEach((b) => {
      const notional = b.price * b.qty;
      if (notional > maxBidWall.qtyUsd) {
        maxBidWall = {
          price: b.price,
          qtyUsd: notional,
          distPct: currentPrice > 0 ? ((b.price - currentPrice) / currentPrice) * 100 : 0,
        };
      }
    });

    rawAsks.slice(0, 50).forEach((a) => {
      const notional = a.price * a.qty;
      if (notional > maxAskWall.qtyUsd) {
        maxAskWall = {
          price: a.price,
          qtyUsd: notional,
          distPct: currentPrice > 0 ? ((a.price - currentPrice) / currentPrice) * 100 : 0,
        };
      }
    });

    // Ratio Bids / Asks
    const ratioMultiplier = active.aUsd > 0 ? active.bUsd / active.aUsd : 1;

    return {
      micro,
      mid,
      deep,
      active,
      bestBid,
      bestAsk,
      spreadUsd,
      spreadBps,
      maxBidWall,
      maxAskWall,
      ratioMultiplier,
      rawBids: rawBids.slice(0, 5),
      rawAsks: rawAsks.slice(0, 5),
    };
  }, [throttledBook, depthLevels, currentPrice]);

  const handleDepthChange = (newDepth: number) => {
    setDepthLevels(newDepth);
    if (onDepthChange) onDepthChange(newDepth);
  };

  // Active displayed imbalance: smoothed EMA or raw
  const displayedImbalance = smoothMode ? (emaImbalance !== 0 ? emaImbalance : analytics.active.pct) : analytics.active.pct;
  const isBuyerDominant = displayedImbalance > 10;
  const isSellerDominant = displayedImbalance < -10;

  // Gauge pointer angle calculation: -100% -> -82 deg (left), 0% -> 0 deg (center), +100% -> +82 deg (right)
  const clampedImbalance = Math.max(-100, Math.min(100, displayedImbalance));
  const gaugeAngle = (clampedImbalance / 100) * 82;

  // Imbalance Trend calculation (last vs previous)
  const trendStatus = useMemo(() => {
    if (imbalanceHistory.length < 3) return 'STABLE';
    const recent = imbalanceHistory.slice(-4);
    const delta = recent[recent.length - 1] - recent[0];
    if (delta > 4) return 'EXPANDING_BUY';
    if (delta < -4) return 'EXPANDING_SELL';
    return 'STABLE';
  }, [imbalanceHistory]);

  return (
    <div id="orderbook-imbalance-panel" className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 flex flex-col space-y-3 shadow-sm">
      {/* 1. Header with Title, Mode Switcher & Live Throttle Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Order Book Imbalance (USD)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Плотность и давление книги заявок в $ Notional
            </span>
          </div>
        </div>

        {/* Controls: Smoothing Toggle & Timer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSmoothMode(!smoothMode)}
            className={`text-[10px] font-mono px-2 py-1 rounded-md border transition cursor-pointer flex items-center gap-1.5 ${
              smoothMode
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={smoothMode ? 'Сглаживание EMA включено (без шума)' : 'Мгновенный режим (Raw)'}
          >
            <Activity className="w-3 h-3" />
            <span>{smoothMode ? 'EMA Сглажен' : 'Raw Моментальный'}</span>
          </button>

          <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400">
            <Clock className="w-3 h-3 text-amber-400/80" />
            <span>{secondsAgo}с</span>
          </div>
        </div>
      </div>

      {/* 2. Main Analytics Card: Gauge + Imbalance % + Ratio + Spread */}
      <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-750 flex flex-col items-center relative overflow-hidden">
        {/* Top Info Bar inside Gauge: Spread & Ratio */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-750/70 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Спред:</span>
            <span className="text-slate-200 font-semibold">
              ${analytics.spreadUsd >= 1 ? analytics.spreadUsd.toFixed(2) : analytics.spreadUsd.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-500">({analytics.spreadBps.toFixed(1)} bps)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Соотношение B/A:</span>
            <span
              className={`font-bold ${
                analytics.ratioMultiplier >= 1.2
                  ? 'text-emerald-400'
                  : analytics.ratioMultiplier <= 0.8
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {analytics.ratioMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Semi-Circle Gauge Visual with High-Precision Arc */}
        <div className="relative w-52 h-26 flex items-end justify-center overflow-hidden my-1">
          <svg className="w-52 h-26" viewBox="0 0 200 100">
            <defs>
              <linearGradient id="orderbookGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="35%" stopColor="#fb7185" />
                <stop offset="48%" stopColor="#64748b" />
                <stop offset="52%" stopColor="#64748b" />
                <stop offset="65%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Background Arc */}
            <path
              d="M 20 95 A 80 80 0 0 1 180 95"
              fill="none"
              stroke="#1e293b"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Color Arc */}
            <path
              d="M 20 95 A 80 80 0 0 1 180 95"
              fill="none"
              stroke="url(#orderbookGaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Reference Center Tick */}
            <line x1="100" y1="12" x2="100" y2="26" stroke="#f8fafc" strokeWidth="2.5" strokeDasharray="2,2" />
            <line x1="45" y1="45" x2="55" y2="52" stroke="#f43f5e" strokeWidth="1.5" />
            <line x1="155" y1="45" x2="145" y2="52" stroke="#10b981" strokeWidth="1.5" />
          </svg>

          {/* Smooth Inertial Needle Pointer */}
          <div
            className="absolute bottom-0 left-1/2 w-1.5 h-22 bg-gradient-to-t from-white to-amber-300 origin-bottom rounded-t-full shadow-2xl transition-transform duration-1000 ease-out z-10 pointer-events-none"
            style={{
              transform: `translateX(-50%) rotate(${gaugeAngle}deg)`,
            }}
          >
            <div className="w-3.5 h-3.5 bg-amber-400 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2 shadow-md border border-slate-900" />
          </div>

          {/* Needle Hub */}
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-7 h-7 bg-slate-950 border-2 border-slate-400 rounded-full z-20 shadow-inner flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* Imbalance Metric Display & Interpretation */}
        <div className="text-center mt-2 w-full">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                isBuyerDominant
                  ? 'text-emerald-400'
                  : isSellerDominant
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {displayedImbalance >= 0 ? `+${displayedImbalance.toFixed(1)}%` : `${displayedImbalance.toFixed(1)}%`}
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Топ-{depthLevels}
            </span>
          </div>

          {/* Trend & Verbal Assessment */}
          <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
            <span
              className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                isBuyerDominant
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : isSellerDominant
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {isBuyerDominant ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Преобладание Bids (Покупатели защищают)</span>
                </>
              ) : isSellerDominant ? (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Преобладание Asks (Продавцы давят)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Равновесный стакан ликвидности</span>
                </>
              )}
            </span>

            {/* Sparkline Trend Tag */}
            {trendStatus !== 'STABLE' && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  trendStatus === 'EXPANDING_BUY'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {trendStatus === 'EXPANDING_BUY' ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    <span>Нарастание покупок</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    <span>Нарастание продаж</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Mini Imbalance Trend History Sparkline */}
        {imbalanceHistory.length > 3 && (
          <div className="w-full mt-2.5 pt-2 border-t border-slate-750/70 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500">Динамика дисбаланса:</span>
            <div className="flex items-center gap-1">
              {imbalanceHistory.map((val, idx) => {
                const heightPct = Math.min(100, Math.max(15, Math.abs(val)));
                const isPos = val >= 0;
                return (
                  <div
                    key={`hist-${idx}`}
                    className="w-1.5 rounded-t transition-all"
                    style={{
                      height: `${Math.round(heightPct * 0.18) + 4}px`,
                      backgroundColor: isPos ? '#10b981' : '#f43f5e',
                      opacity: 0.4 + (idx / imbalanceHistory.length) * 0.6,
                    }}
                    title={`${val.toFixed(1)}%`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Bids vs Asks Progress Bar in USD */}
        <div className="w-full mt-2.5">
          <div className="flex justify-between text-[11px] font-mono mb-1">
            <span className="text-emerald-400 font-bold">
              Bids: {formatUsd(analytics.active.bUsd)} (
              {analytics.active.tot > 0 ? ((analytics.active.bUsd / analytics.active.tot) * 100).toFixed(0) : 50}%)
            </span>
            <span className="text-rose-400 font-bold">
              Asks: {formatUsd(analytics.active.aUsd)} (
              {analytics.active.tot > 0 ? ((analytics.active.aUsd / analytics.active.tot) * 100).toFixed(0) : 50}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-700 ease-out"
              style={{
                width: `${analytics.active.tot > 0 ? (analytics.active.bUsd / analytics.active.tot) * 100 : 50}%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-700 ease-out"
              style={{
                width: `${analytics.active.tot > 0 ? (analytics.active.aUsd / analytics.active.tot) * 100 : 50}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Multi-Depth Horizon Matrix: Top-5 vs Top-20 vs Top-50 */}
      <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Срез глубины (Спред vs Институты):</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          {/* Micro Depth (Top 5) */}
          <button
            type="button"
            onClick={() => handleDepthChange(5)}
            className={`p-2 rounded-lg border transition cursor-pointer text-left ${
              depthLevels === 5
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-750 text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Спред (Топ-5)</span>
              <span className="font-bold">{formatUsd(analytics.micro.tot)}</span>
            </div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                analytics.micro.pct >= 8
                  ? 'text-emerald-400'
                  : analytics.micro.pct <= -8
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {analytics.micro.pct >= 0 ? `+${analytics.micro.pct.toFixed(1)}%` : `${analytics.micro.pct.toFixed(1)}%`}
            </div>
          </button>

          {/* Mid Depth (Top 20) */}
          <button
            type="button"
            onClick={() => handleDepthChange(20)}
            className={`p-2 rounded-lg border transition cursor-pointer text-left ${
              depthLevels === 20
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-750 text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Сессия (Топ-20)</span>
              <span className="font-bold">{formatUsd(analytics.mid.tot)}</span>
            </div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                analytics.mid.pct >= 8
                  ? 'text-emerald-400'
                  : analytics.mid.pct <= -8
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {analytics.mid.pct >= 0 ? `+${analytics.mid.pct.toFixed(1)}%` : `${analytics.mid.pct.toFixed(1)}%`}
            </div>
          </button>

          {/* Deep Depth (Top 50) */}
          <button
            type="button"
            onClick={() => handleDepthChange(50)}
            className={`p-2 rounded-lg border transition cursor-pointer text-left ${
              depthLevels === 50
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-750 text-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>База (Топ-50)</span>
              <span className="font-bold">{formatUsd(analytics.deep.tot)}</span>
            </div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                analytics.deep.pct >= 8
                  ? 'text-emerald-400'
                  : analytics.deep.pct <= -8
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {analytics.deep.pct >= 0 ? `+${analytics.deep.pct.toFixed(1)}%` : `${analytics.deep.pct.toFixed(1)}%`}
            </div>
          </button>
        </div>
      </div>

      {/* 4. Major Wall Radar: Largest Support and Resistance Blocks */}
      <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-750 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Ключевые стены ликвидности (Major Walls):</span>
          </div>
          <span className="text-[10px] text-slate-400">в радиусе 50 уровней</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {/* Bid Wall */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-400/80 uppercase font-semibold block">
                Стена Bids (Поддержка)
              </span>
              <div className="text-sm font-bold text-white mt-0.5">
                ${analytics.maxBidWall.price >= 1 ? analytics.maxBidWall.price.toLocaleString() : analytics.maxBidWall.price.toFixed(4)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400">
                {formatUsd(analytics.maxBidWall.qtyUsd)}
              </span>
              <div className="text-[10px] text-slate-400">
                {analytics.maxBidWall.distPct.toFixed(2)}% от цены
              </div>
            </div>
          </div>

          {/* Ask Wall */}
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-rose-400/80 uppercase font-semibold block">
                Стена Asks (Сопротивление)
              </span>
              <div className="text-sm font-bold text-white mt-0.5">
                ${analytics.maxAskWall.price >= 1 ? analytics.maxAskWall.price.toLocaleString() : analytics.maxAskWall.price.toFixed(4)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-rose-400">
                {formatUsd(analytics.maxAskWall.qtyUsd)}
              </span>
              <div className="text-[10px] text-slate-400">
                +{analytics.maxAskWall.distPct.toFixed(2)}% от цены
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Collapsible Mini Depth Ladder (Top 5 Bids vs Top 5 Asks) */}
      <div className="border border-slate-750 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMiniLadder(!showMiniLadder)}
          className="w-full bg-slate-800/70 hover:bg-slate-800 p-2 flex items-center justify-between text-xs font-mono text-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Микро-стакан у спреда (Топ-5 заявок)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>{showMiniLadder ? 'Скрыть' : 'Показать'}</span>
            {showMiniLadder ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showMiniLadder && (
          <div className="p-2.5 bg-slate-900/95 space-y-2 text-xs font-mono animate-fadeIn">
            <div className="grid grid-cols-2 gap-3">
              {/* Asks (Sell orders - red) */}
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">
                  Asks (Продажа)
                </span>
                <div className="space-y-1">
                  {analytics.rawAsks.map((a, i) => (
                    <div key={`ask-row-${i}`} className="flex justify-between items-center bg-rose-500/5 px-2 py-0.5 rounded text-[11px]">
                      <span className="text-rose-400 font-semibold">${a.price}</span>
                      <span className="text-slate-300">{formatUsd(a.price * a.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bids (Buy orders - green) */}
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                  Bids (Покупка)
                </span>
                <div className="space-y-1">
                  {analytics.rawBids.map((b, i) => (
                    <div key={`bid-row-${i}`} className="flex justify-between items-center bg-emerald-500/5 px-2 py-0.5 rounded text-[11px]">
                      <span className="text-emerald-400 font-semibold">${b.price}</span>
                      <span className="text-slate-300">{formatUsd(b.price * b.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
