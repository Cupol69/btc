import { EtfDailyRecord } from '../types';

export const INITIAL_ETF_DAILY_HISTORY: EtfDailyRecord[] = [
  {
    date: '2026-09-21',
    dayOfWeek: 'Пн',
    totalNetFlowUsdM: 998.96,
    ibit: 381.37,
    fbtc: 238.84,
    gbtc: 3.34,
    miniBtc: 3.06,
    arkb: 289.12,
    bitb: 21.56,
    others: 61.67,
    btcPriceAtClose: 63850,
    status: 'CONFIRMED',
    notes: 'Рекордный институциональный приток: +$999.0M (Farside/DTCC). Лидеры: IBIT +$381.4M, ARKB +$289.1M, FBTC +$238.8M.'
  },
  {
    date: '2026-09-18',
    dayOfWeek: 'Пт',
    totalNetFlowUsdM: 324.6,
    ibit: 0.0,
    fbtc: 310.7,
    gbtc: 0.0,
    miniBtc: 0.0,
    arkb: 1.9,
    bitb: 9.7,
    others: 2.3,
    btcPriceAtClose: 62900,
    status: 'CONFIRMED',
    notes: 'Пятничный приток +$324.6M (основной объем: Fidelity FBTC +$310.7M).'
  },
  {
    date: '2026-09-17',
    dayOfWeek: 'Чт',
    totalNetFlowUsdM: 159.5,
    ibit: 183.7,
    fbtc: -14.2,
    gbtc: -8.5,
    miniBtc: 0.0,
    arkb: 2.1,
    bitb: 1.4,
    others: -5.0,
    btcPriceAtClose: 62100,
    status: 'CONFIRMED',
    notes: 'Разворот в приток (+159.5M) за счет BlackRock IBIT (+183.7M).'
  },
  {
    date: '2026-09-16',
    dayOfWeek: 'Ср',
    totalNetFlowUsdM: -295.9,
    ibit: -95.0,
    fbtc: -112.5,
    gbtc: -48.2,
    miniBtc: 0.0,
    arkb: -21.4,
    bitb: -15.8,
    others: -3.0,
    btcPriceAtClose: 60400,
    status: 'CONFIRMED',
    notes: 'Массивный отток институционалов (-$295.9M) перед решением ФРС.'
  },
  {
    date: '2026-09-15',
    dayOfWeek: 'Вт',
    totalNetFlowUsdM: -450.4,
    ibit: -161.7,
    fbtc: -214.8,
    gbtc: -44.1,
    miniBtc: 0.0,
    arkb: -17.4,
    bitb: -12.4,
    others: 0.0,
    btcPriceAtClose: 59100,
    status: 'CONFIRMED',
    notes: 'Критический институциональный дамп (-$450.4M): Fidelity -$214.8M, BlackRock -$161.7M.'
  },
  {
    date: '2026-09-14',
    dayOfWeek: 'Пн',
    totalNetFlowUsdM: 159.9,
    ibit: 89.5,
    fbtc: 56.2,
    gbtc: -12.0,
    miniBtc: 4.2,
    arkb: 15.0,
    bitb: 7.0,
    others: 0.0,
    btcPriceAtClose: 58800,
    status: 'CONFIRMED',
    notes: 'Локальный отскок понедельника (+159.9M).'
  }
];

export interface EtfComputedMetrics {
  latestRecord: EtfDailyRecord;
  flow1dUsdM: number;
  flow5dWeeklyUsdM: number; // Last 5 trading days
  flow7dRollingUsdM: number;
  flow14dRollingUsdM: number;
  flow30dUsdM: number;
  streakDays: number;
  streakType: 'INFLOW_STREAK' | 'OUTFLOW_STREAK' | 'NEUTRAL';
  institutionalRegime: 'CRITICAL_DUMP' | 'DISTRIBUTION' | 'NEUTRAL' | 'ACCUMULATION' | 'AGGRESSIVE_BUYING';
  dateRangeLabel: string;
  officialReportDate: string;
  topFunds: {
    ibit: number;
    fbtc: number;
    gbtc: number;
    miniBtc: number;
    arkb: number;
    bitb: number;
    others: number;
  };
  totalBtcEquivalent: number;
  summaryText: string;
}

export function computeEtfMetrics(history: EtfDailyRecord[] = INITIAL_ETF_DAILY_HISTORY): EtfComputedMetrics {
  const records = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = records[0] || INITIAL_ETF_DAILY_HISTORY[0];

  const flow1d = latest.totalNetFlowUsdM;

  // 5 trading days (Standard Trading Week)
  const last5Records = records.slice(0, 5);
  const flow5d = Number(last5Records.reduce((acc, r) => acc + r.totalNetFlowUsdM, 0).toFixed(1));

  // 7 trading days
  const last7Records = records.slice(0, 7);
  const flow7d = Number(last7Records.reduce((acc, r) => acc + r.totalNetFlowUsdM, 0).toFixed(1));

  // 14 trading days
  const last14Records = records.slice(0, 14);
  const flow14d = Number(last14Records.reduce((acc, r) => acc + r.totalNetFlowUsdM, 0).toFixed(1));

  // 30 days estimate
  const flow30d = Number(records.reduce((acc, r) => acc + r.totalNetFlowUsdM, 0).toFixed(1));

  // Streak calculation
  let streakCount = 0;
  const isPositive = latest.totalNetFlowUsdM > 0;
  for (const r of records) {
    if (isPositive && r.totalNetFlowUsdM > 0) {
      streakCount++;
    } else if (!isPositive && r.totalNetFlowUsdM < 0) {
      streakCount++;
    } else {
      break;
    }
  }

  const streakDays = isPositive ? streakCount : -streakCount;
  const streakType = isPositive ? 'INFLOW_STREAK' : (streakDays < 0 ? 'OUTFLOW_STREAK' : 'NEUTRAL');

  let institutionalRegime: 'CRITICAL_DUMP' | 'DISTRIBUTION' | 'NEUTRAL' | 'ACCUMULATION' | 'AGGRESSIVE_BUYING';
  if (flow1d > 500 || flow5d > 800) {
    institutionalRegime = 'AGGRESSIVE_BUYING';
  } else if (flow5d > 100 || flow1d > 50) {
    institutionalRegime = 'ACCUMULATION';
  } else if (flow5d < -400 || flow1d < -200) {
    institutionalRegime = 'CRITICAL_DUMP';
  } else if (flow5d < 0) {
    institutionalRegime = 'DISTRIBUTION';
  } else {
    institutionalRegime = 'NEUTRAL';
  }

  // Funds sum over last 5 trading days
  const topFunds = {
    ibit: Number(last5Records.reduce((acc, r) => acc + r.ibit, 0).toFixed(1)),
    fbtc: Number(last5Records.reduce((acc, r) => acc + r.fbtc, 0).toFixed(1)),
    gbtc: Number(last5Records.reduce((acc, r) => acc + r.gbtc, 0).toFixed(1)),
    miniBtc: Number(last5Records.reduce((acc, r) => acc + (r.miniBtc || 0), 0).toFixed(1)),
    arkb: Number(last5Records.reduce((acc, r) => acc + r.arkb, 0).toFixed(1)),
    bitb: Number(last5Records.reduce((acc, r) => acc + r.bitb, 0).toFixed(1)),
    others: Number(last5Records.reduce((acc, r) => acc + r.others, 0).toFixed(1)),
  };

  const avgPrice = latest.btcPriceAtClose || 63500;
  const totalBtcEquivalent = Math.round((Math.abs(flow1d) * 1e6) / avgPrice);

  const startDate = last5Records[last5Records.length - 1]?.date.split('-').slice(1).reverse().join('.') || '15.09';
  const endDate = latest.date.split('-').slice(1).reverse().join('.');
  const dateRangeLabel = `${startDate}–${endDate} (${last5Records.length} сессий)`;

  const latestDayFormatted = `${latest.date.split('-')[2]} Сен (${latest.dayOfWeek})`;
  const officialReportDate = `${latestDayFormatted} • Финал DTCC / SEC`;

  let summaryText = '';
  if (institutionalRegime === 'AGGRESSIVE_BUYING') {
    summaryText = `🟢 Агрессивный институциональный приток: Фонды США выкупили ~$${flow1d.toFixed(1)}M (~${totalBtcEquivalent.toLocaleString()} BTC) за последнюю сессию (${latestDayFormatted}). Доминирование BlackRock (IBIT). Режим Risk-On.`;
  } else if (institutionalRegime === 'ACCUMULATION') {
    summaryText = `🟢 Умеренное накопление: Чистый приток за 5 сессий составил +$${flow5d.toFixed(1)}M. Поддержка со стороны Fidelity и BlackRock.`;
  } else if (institutionalRegime === 'CRITICAL_DUMP') {
    summaryText = `🔴 Институциональный дамп: Чистый отток из спотовых ETF США за сессию -$${Math.abs(flow1d).toFixed(1)}M. Режим Risk-Off.`;
  } else {
    summaryText = `🟡 Нейтральный баланс институциональных потоков: спред покупок и продаж фондов в равновесии.`;
  }

  return {
    latestRecord: latest,
    flow1dUsdM: flow1d,
    flow5dWeeklyUsdM: flow5d,
    flow7dRollingUsdM: flow7d,
    flow14dRollingUsdM: flow14d,
    flow30dUsdM: flow30d,
    streakDays,
    streakType,
    institutionalRegime,
    dateRangeLabel,
    officialReportDate,
    topFunds,
    totalBtcEquivalent,
    summaryText,
  };
}
