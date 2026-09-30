import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  X,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Table as TableIcon
} from 'lucide-react';
import { CrossMarketData, EtfDailyRecord } from '../types';
import { INITIAL_ETF_DAILY_HISTORY, computeEtfMetrics } from '../data/etfFlowData';

interface SpotEtfFlowsHeaderPillProps {
  currentSymbol?: string;
}

export const SpotEtfFlowsHeaderPill: React.FC<SpotEtfFlowsHeaderPillProps> = ({ currentSymbol = 'BTCUSDT' }) => {
  const [data, setData] = useState<CrossMarketData | null>(null);
  const [history, setHistory] = useState<EtfDailyRecord[]>(INITIAL_ETF_DAILY_HISTORY);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'entry'>('overview');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New record form state
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newDayOfWeek, setNewDayOfWeek] = useState<string>('Вт');
  const [newTotal, setNewTotal] = useState<string>('');
  const [newIbit, setNewIbit] = useState<string>('');
  const [newFbtc, setNewFbtc] = useState<string>('');
  const [newGbtc, setNewGbtc] = useState<string>('');
  const [newBitb, setNewBitb] = useState<string>('');
  const [newArkb, setNewArkb] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const fetchEtfData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cross-market/BTCUSDT');
      if (res.ok) {
        const json: CrossMarketData = await res.json();
        setData(json);
        if (json.etfDailyHistory && Array.isArray(json.etfDailyHistory) && json.etfDailyHistory.length > 0) {
          setHistory(json.etfDailyHistory);
        }
      }
    } catch {
      // Fallback to initial history seamlessly
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEtfData();
    const interval = setInterval(fetchEtfData, 45000);
    return () => clearInterval(interval);
  }, [currentSymbol]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute metrics dynamically from actual history
  const metrics = useMemo(() => {
    return computeEtfMetrics(history);
  }, [history]);

  const flow1d = data?.etfMultiPeriod?.flow1dUsdM ?? metrics.flow1dUsdM;
  const flow5d = data?.etfMultiPeriod?.flow4dUsdM ?? metrics.flow5dWeeklyUsdM;
  const flow7d = data?.etfMultiPeriod?.flow7dUsdM ?? metrics.flow7dRollingUsdM;
  const flow14d = data?.etfMultiPeriod?.flow14dUsdM ?? metrics.flow14dRollingUsdM;
  const streakDays = data?.etfMultiPeriod?.streakDays ?? metrics.streakDays;
  const streakType = data?.etfMultiPeriod?.streakType ?? metrics.streakType;
  const regime = data?.etfMultiPeriod?.institutionalRegime ?? metrics.institutionalRegime;
  const officialReportDate = data?.etfMultiPeriod?.officialReportDate ?? metrics.officialReportDate;
  const dateRangeLabel = data?.etfMultiPeriod?.dateRangeLabel ?? metrics.dateRangeLabel;
  const warningAlert = data?.etfMultiPeriod?.impactAnalysis?.warningAlert ?? metrics.summaryText;

  const topFunds = data?.etfMultiPeriod?.topFundsBreakdown
    ? {
        ibit: data.etfMultiPeriod.topFundsBreakdown.ibitBlackrockUsdM,
        fbtc: data.etfMultiPeriod.topFundsBreakdown.fbtcFidelityUsdM,
        gbtc: data.etfMultiPeriod.topFundsBreakdown.gbtcGrayscaleUsdM,
        bitb: data.etfMultiPeriod.topFundsBreakdown.bitbBitwiseUsdM,
        others: data.etfMultiPeriod.topFundsBreakdown.othersUsdM,
      }
    : {
        ibit: metrics.latestRecord.ibit,
        fbtc: metrics.latestRecord.fbtc,
        gbtc: metrics.latestRecord.gbtc,
        bitb: metrics.latestRecord.bitb,
        others: Number((metrics.latestRecord.others + (metrics.latestRecord.miniBtc || 0) + metrics.latestRecord.arkb).toFixed(1)),
      };

  const isAggressiveBuying = regime === 'AGGRESSIVE_BUYING';
  const isAccumulation = regime === 'ACCUMULATION';
  const isSevereDump = regime === 'CRITICAL_DUMP';
  const isOutflow = regime === 'DISTRIBUTION';

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalNum = parseFloat(newTotal);
    if (isNaN(totalNum)) return;

    const record: EtfDailyRecord = {
      date: newDate,
      dayOfWeek: newDayOfWeek,
      totalNetFlowUsdM: totalNum,
      ibit: parseFloat(newIbit) || 0,
      fbtc: parseFloat(newFbtc) || 0,
      gbtc: parseFloat(newGbtc) || 0,
      bitb: parseFloat(newBitb) || 0,
      arkb: parseFloat(newArkb) || 0,
      others: 0,
      status: 'CONFIRMED',
      notes: newNotes || 'Введено вручную пользователем',
    };

    const updated = [record, ...history.filter(h => h.date !== record.date)].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setHistory(updated);

    try {
      await fetch('/api/etf/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record }),
      });
      setSaveSuccessMsg(`Данные за ${newDate} успешно сохранены! Метрики пересчитаны.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      setActiveTab('history');
    } catch {
      setSaveSuccessMsg(`Сохранено локально!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Top Header Interactive Badge */}
      <button
        id="btn-spot-etf-header-pill"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition shadow-sm cursor-pointer ${
          isAggressiveBuying
            ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300 hover:bg-emerald-900/70 ring-1 ring-emerald-500/40 shadow-emerald-950/50'
            : isAccumulation
            ? 'bg-emerald-950/50 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/50'
            : isSevereDump
            ? 'bg-rose-950/70 border-rose-600/70 text-rose-300 hover:bg-rose-900/60 ring-1 ring-rose-500/30'
            : isOutflow
            ? 'bg-amber-950/50 border-amber-600/50 text-amber-300 hover:bg-amber-900/50'
            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
        }`}
        title="Институциональные потоки Spot ETF США (BlackRock, Fidelity, Grayscale). Клик для детальной истории и аналитики"
      >
        <Building
          className={`w-3.5 h-3.5 shrink-0 ${
            isAggressiveBuying || isAccumulation
              ? 'text-emerald-400'
              : isSevereDump
              ? 'text-rose-400 animate-pulse'
              : isOutflow
              ? 'text-amber-400'
              : 'text-slate-400'
          }`}
        />

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-200 hidden md:inline">Spot ETF:</span>

          {/* 1. Latest Session Sensor */}
          <span className="text-[10px] text-slate-400">24ч:</span>
          <span className={`font-black ${flow1d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {flow1d >= 0 ? '+' : ''}${flow1d.toFixed(1)}M
          </span>

          <span className="text-slate-600">|</span>

          {/* 2. Cumulative Weekly Flow */}
          <span className="text-[10px] text-slate-400">Неделя:</span>
          <span className={`font-black ${flow5d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {flow5d >= 0 ? '+' : ''}${flow5d.toFixed(1)}M
          </span>
        </div>

        {/* Dynamic Status Pill */}
        {isAggressiveBuying && (
          <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
            <ArrowUpRight className="w-2.5 h-2.5" />
            <span>RISK-ON</span>
          </span>
        )}

        {isAccumulation && !isAggressiveBuying && (
          <span className="px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
            ACCUM
          </span>
        )}

        {isSevereDump && (
          <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[9px] font-bold">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>RISK-OFF</span>
          </span>
        )}

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Comprehensive Dropdown / Modal Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[370px] sm:w-[500px] md:w-[560px] bg-slate-900/98 backdrop-blur-2xl border border-slate-750 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[88vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${
                isAggressiveBuying || isAccumulation
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}>
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Институциональные Потоки Spot Bitcoin ETF</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    Farside • DTCC • SEC
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{officialReportDate}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-indigo-400 font-mono">{dateRangeLabel}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchEtfData}
                disabled={isLoading}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Обновить с сервера"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Сводка & Фонды</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>История по дням ({history.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('entry')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'entry'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Внести данные</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & TOP ISSUERS */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Dynamic Institutional Alert Banner */}
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed shadow-sm flex items-start gap-2.5 ${
                  isAggressiveBuying || isAccumulation
                    ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-100'
                    : isSevereDump
                    ? 'bg-rose-950/80 border-rose-600/60 text-rose-100'
                    : 'bg-amber-950/70 border-amber-600/50 text-amber-100'
                }`}
              >
                {isAggressiveBuying || isAccumulation ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold">
                    {isAggressiveBuying
                      ? 'Институциональный Buy-Side Бум: '
                      : isAccumulation
                      ? 'Чистый институциональный приток: '
                      : isSevereDump
                      ? 'Внимание институциональный дамп: '
                      : 'Нейтральная динамика: '}
                  </span>
                  <span>{warningAlert}</span>
                </div>
              </div>

              {/* 4 Rolling Timeframe Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {/* 1. Latest 24h Session */}
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">⚡ Сессия 24ч</span>
                  <div className={`text-base font-black my-1 font-mono ${flow1d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {flow1d >= 0 ? '+' : ''}${flow1d.toFixed(1)}M
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{metrics.latestRecord.date.split('-').slice(1).reverse().join('.')}</span>
                </div>

                {/* 2. 5-Day Weekly Total */}
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase">📊 5 Сессий (Неделя)</span>
                  <div className={`text-base font-black my-1 font-mono ${flow5d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {flow5d >= 0 ? '+' : ''}${flow5d.toFixed(1)}M
                  </div>
                  <span className="text-[9px] text-indigo-300/80 font-mono">Официальный факт</span>
                </div>

                {/* 3. 7-Day Total */}
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">📅 За 7 Дней</span>
                  <div className={`text-base font-black my-1 font-mono ${flow7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {flow7d >= 0 ? '+' : ''}${flow7d.toFixed(1)}M
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">7D Rolling</span>
                </div>

                {/* 4. 14-Day Total */}
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">📈 За 14 Дней</span>
                  <div className={`text-base font-black my-1 font-mono ${flow14d >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {flow14d >= 0 ? '+' : ''}${flow14d.toFixed(1)}M
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">14D Total</span>
                </div>
              </div>

              {/* Fund Breakdown & Streak */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Разбивка за последнюю сессию ({metrics.latestRecord.date}):</span>
                  <span className={`text-[10px] font-mono font-bold ${
                    streakType === 'INFLOW_STREAK' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {streakType === 'INFLOW_STREAK'
                      ? `🟢 ${streakDays} дня подряд притока`
                      : `🔴 ${Math.abs(streakDays)} дня оттока`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {/* BlackRock IBIT */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-300 font-medium">BlackRock (IBIT):</span>
                    <span className={`font-mono font-bold ${topFunds.ibit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {topFunds.ibit >= 0 ? '+' : ''}${topFunds.ibit.toFixed(1)}M
                    </span>
                  </div>

                  {/* Fidelity FBTC */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-300 font-medium">Fidelity (FBTC):</span>
                    <span className={`font-mono font-bold ${topFunds.fbtc >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {topFunds.fbtc >= 0 ? '+' : ''}${topFunds.fbtc.toFixed(1)}M
                    </span>
                  </div>

                  {/* Bitwise BITB */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-300 font-medium">Bitwise (BITB):</span>
                    <span className={`font-mono font-bold ${topFunds.bitb >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {topFunds.bitb >= 0 ? '+' : ''}${topFunds.bitb.toFixed(1)}M
                    </span>
                  </div>

                  {/* Grayscale GBTC */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-300 font-medium">Grayscale (GBTC):</span>
                    <span className={`font-mono font-bold ${topFunds.gbtc >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {topFunds.gbtc >= 0 ? '+' : ''}${topFunds.gbtc.toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory Footer */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-1">
                <div className="text-white font-bold flex items-center gap-1.5 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Институциональный механизм клиринга (T+1):</span>
                </div>
                <p>
                  Потоки спотовых ETF публикуются эмитентами (BlackRock, Fidelity, Bitwise) после закрытия торговой сессии в Нью-Йорке (с 00:00 до 04:00 UTC). Чистый приток <strong className="text-emerald-300">+${flow1d.toFixed(1)}M</strong> означает физический выкуп маркет-мейкерами около <strong className="text-white">~{Math.round(flow1d * 1e6 / (metrics.latestRecord.btcPriceAtClose || 63800)).toLocaleString()} BTC</strong> на кастодиальных счетах Coinbase Prime.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY HISTORY TABLE */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Хронология последних {history.length} торговых сессий:</span>
                <span className="text-slate-500 font-mono">Все суммы в $M USD</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px]">
                      <th className="py-2 px-2.5">Дата (День)</th>
                      <th className="py-2 px-2.5 text-right">Итого (Net)</th>
                      <th className="py-2 px-2 text-right text-emerald-400">IBIT</th>
                      <th className="py-2 px-2 text-right text-sky-400">FBTC</th>
                      <th className="py-2 px-2 text-right text-rose-400">GBTC</th>
                      <th className="py-2 px-2 text-right text-amber-400">BITB</th>
                      <th className="py-2 px-2.5 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {history.map((row, idx) => {
                      const isRowPositive = row.totalNetFlowUsdM >= 0;
                      return (
                        <tr
                          key={row.date}
                          className={`hover:bg-slate-850/60 transition ${
                            idx === 0 ? 'bg-indigo-950/20 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2 px-2.5 text-slate-300 font-sans">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs">{row.date.split('-').slice(1).reverse().join('.')}</span>
                              <span className="text-[10px] text-slate-500">({row.dayOfWeek})</span>
                              {idx === 0 && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-sans">
                                  Свежий
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`py-2 px-2.5 text-right font-black ${
                            isRowPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isRowPositive ? '+' : ''}${row.totalNetFlowUsdM.toFixed(1)}M
                          </td>
                          <td className="py-2 px-2 text-right text-slate-200">
                            {row.ibit >= 0 ? `+${row.ibit.toFixed(1)}` : row.ibit.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-200">
                            {row.fbtc >= 0 ? `+${row.fbtc.toFixed(1)}` : row.fbtc.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-200">
                            {row.gbtc >= 0 ? `+${row.gbtc.toFixed(1)}` : row.gbtc.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-200">
                            {row.bitb >= 0 ? `+${row.bitb.toFixed(1)}` : row.bitb.toFixed(1)}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              DTCC
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL QUICK-ENTRY / FARSIDE SYNC */}
          {activeTab === 'entry' && (
            <form onSubmit={handleAddRecord} className="space-y-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                <span>Внести данные торговой сессии (Farside / TreeNews):</span>
                <span className="text-[10px] text-slate-500">Автопересчет 1D, 5D, 7D, 14D</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Дата (ГГГГ-ММ-ДД)</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">День недели</label>
                  <select
                    value={newDayOfWeek}
                    onChange={(e) => setNewDayOfWeek(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Пн">Понедельник (Пн)</option>
                    <option value="Вт">Вторник (Вт)</option>
                    <option value="Ср">Среда (Ср)</option>
                    <option value="Чт">Четверг (Чт)</option>
                    <option value="Пт">Пятница (Пт)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Итого Net ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Например: 942.8"
                    value={newTotal}
                    onChange={(e) => setNewTotal(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">IBIT BlackRock ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="648.5"
                    value={newIbit}
                    onChange={(e) => setNewIbit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">FBTC Fidelity ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="184.2"
                    value={newFbtc}
                    onChange={(e) => setNewFbtc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">GBTC Grayscale ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="-18.2"
                    value={newGbtc}
                    onChange={(e) => setNewGbtc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">BITB Bitwise ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="52.1"
                    value={newBitb}
                    onChange={(e) => setNewBitb(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">ARKB Ark Invest ($M)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="45.3"
                    value={newArkb}
                    onChange={(e) => setNewArkb(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Комментарий / Новость</label>
                  <input
                    type="text"
                    placeholder="Источник (Farside / SEC)"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Сохранить в терминал</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
