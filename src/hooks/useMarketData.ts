import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Ticker24h,
  Kline,
  OrderBook,
  FundingRateInfo,
  PremiumIndex,
  OpenInterest,
  OpenInterestHist,
  LongShortRatio,
  TakerLongShortRatio,
  LiquidationOrder,
  CrossMarketData,
  CVDData,
  OrderBookImbalance,
  SpotFuturesBasis,
  SentimentAnalysis,
  TimeframeTrend,
  MarketAnomaly,
  DumpRiskAssessment,
  TacticalTradePlan,
  SmartMoneyDivergence,
  AICommentaryPayload,
  AnalysisHorizonMode,
  TopPositionRatio,
} from '../types';
import { binanceRest } from '../services/binanceRest';
import { binanceWs } from '../services/binanceWs';
import { analyticsEngine } from '../services/analyticsEngine';

const DEFAULT_IMBALANCE: OrderBookImbalance = {
  imbalance: 0,
  bidVolume: 0,
  askVolume: 0,
  totalBidNotionalUsd: 0,
  totalAskNotionalUsd: 0,
  dominantSide: 'BALANCED',
};

const DEFAULT_BASIS: SpotFuturesBasis = {
  spotPrice: 0,
  futuresPrice: 0,
  indexPrice: 0,
  basis: 0,
  annualizedAPR: 0,
  structure: 'NEUTRAL',
};

const DEFAULT_SENTIMENT: SentimentAnalysis = {
  compositeScore: 0,
  classification: 'NEUTRAL',
  fundingScore: 0,
  longShortScore: 0,
  oiScore: 0,
  takerScore: 0,
  description: 'Нейтральный сантимент',
};

const DEFAULT_CVD: CVDData = {
  points: [],
  netDeltaUsd: 0,
  buyerDominancePercent: 50,
  trend: 'NEUTRAL',
};

export function useMarketData(symbol: string, interval: string = '15m', depthLevels: number = 20) {
  const [ticker, setTicker] = useState<Ticker24h | null>(null);
  const [klines, setKlines] = useState<Kline[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [premiumIndex, setPremiumIndex] = useState<PremiumIndex | null>(null);
  const [fundingInfo, setFundingInfo] = useState<FundingRateInfo | null>(null);
  const [openInterest, setOpenInterest] = useState<OpenInterest | null>(null);
  const [oiHistory, setOiHistory] = useState<OpenInterestHist[]>([]);
  const [topTraderRatio, setTopTraderRatio] = useState<LongShortRatio | null>(null);
  const [globalRatio, setGlobalRatio] = useState<LongShortRatio | null>(null);
  const [takerRatio, setTakerRatio] = useState<TakerLongShortRatio | null>(null);
  const [liquidations, setLiquidations] = useState<LiquidationOrder[]>([]);
  const [allTickers, setAllTickers] = useState<Record<string, Ticker24h>>({});
  const [crossMarket, setCrossMarket] = useState<CrossMarketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasFutures, setHasFutures] = useState<boolean>(true);

  // Derived state
  const [imbalance, setImbalance] = useState<OrderBookImbalance>(DEFAULT_IMBALANCE);
  const [basis, setBasis] = useState<SpotFuturesBasis>(DEFAULT_BASIS);
  const [sentiment, setSentiment] = useState<SentimentAnalysis>(DEFAULT_SENTIMENT);
  const [cvdData, setCvdData] = useState<CVDData>(DEFAULT_CVD);
  const [trends, setTrends] = useState<Record<string, TimeframeTrend>>({});
  const [anomalies, setAnomalies] = useState<MarketAnomaly[]>([]);
  const [dumpRisk, setDumpRisk] = useState<DumpRiskAssessment | null>(null);
  const [tacticalPlan, setTacticalPlan] = useState<TacticalTradePlan | null>(null);
  const [smartMoneyDivergence, setSmartMoneyDivergence] = useState<SmartMoneyDivergence | null>(null);
  const [marketRegime, setMarketRegime] = useState<{ regime: string; title: string; badgeColor: string; description: string }>({
    regime: 'RANGE_CHOP_EQUILIBRIUM',
    title: 'Консолидация / Боковик',
    badgeColor: 'bg-slate-700 text-slate-200 border-slate-600',
    description: 'Рынок находится в состоянии относительного баланса сил.',
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update WS active symbol
  useEffect(() => {
    binanceWs.setSymbol(symbol, interval);
  }, [symbol, interval]);

  // Main Data Fetcher
  const refreshAll = useCallback(async () => {
    try {
      const [
        tickerRes,
        klinesRes,
        bookRes,
        premiumRes,
        fundingRes,
        oiRes,
        oiHistRes,
        topTraderRes,
        globalRatioRes,
        takerRatioRes,
        crossRes,
        allTickersRes,
      ] = await Promise.allSettled([
        binanceRest.get24hTicker(symbol),
        binanceRest.getKlines(symbol, interval, 100),
        binanceRest.getDepth(symbol, depthLevels),
        binanceRest.getPremiumIndex(symbol),
        binanceRest.getFundingRateHistory(symbol, 1),
        binanceRest.getOpenInterest(symbol),
        binanceRest.getOpenInterestHist(symbol, '15m', 30),
        binanceRest.getTopLongShortRatio(symbol, '15m', 1),
        binanceRest.getGlobalLongShortRatio(symbol, '15m', 1),
        binanceRest.getTakerLongShortRatio(symbol, '15m', 1),
        binanceRest.getCrossMarketData(symbol),
        binanceRest.get24hTicker(),
      ]);

      if (!isMountedRef.current) return;

      if (tickerRes.status === 'fulfilled' && tickerRes.value) {
        if (!Array.isArray(tickerRes.value)) {
          setTicker(tickerRes.value);
        }
      }
      if (klinesRes.status === 'fulfilled' && klinesRes.value) {
        setKlines(klinesRes.value);
      }
      if (bookRes.status === 'fulfilled' && bookRes.value) {
        setOrderBook(bookRes.value);
      }
      if (premiumRes.status === 'fulfilled' && premiumRes.value) {
        setPremiumIndex(premiumRes.value);
        setHasFutures(true);
      } else {
        setHasFutures(false);
      }
      if (fundingRes.status === 'fulfilled' && fundingRes.value && fundingRes.value.length > 0) {
        setFundingInfo(fundingRes.value[0]);
      }
      if (oiRes.status === 'fulfilled' && oiRes.value) {
        setOpenInterest(oiRes.value);
      }
      if (oiHistRes.status === 'fulfilled' && oiHistRes.value) {
        setOiHistory(oiHistRes.value);
      }
      if (topTraderRes.status === 'fulfilled' && topTraderRes.value && topTraderRes.value.length > 0) {
        setTopTraderRatio(topTraderRes.value[0]);
      }
      if (globalRatioRes.status === 'fulfilled' && globalRatioRes.value && globalRatioRes.value.length > 0) {
        setGlobalRatio(globalRatioRes.value[0]);
      }
      if (takerRatioRes.status === 'fulfilled' && takerRatioRes.value && takerRatioRes.value.length > 0) {
        setTakerRatio(takerRatioRes.value[0]);
      }
      if (crossRes.status === 'fulfilled' && crossRes.value) {
        setCrossMarket(crossRes.value);
      }
      if (allTickersRes.status === 'fulfilled' && allTickersRes.value && Array.isArray(allTickersRes.value)) {
        const map: Record<string, Ticker24h> = {};
        allTickersRes.value.forEach((t) => {
          if (t.symbol) map[t.symbol] = t;
        });
        setAllTickers(map);
      }
    } catch (err) {
      console.warn('[useMarketData] Fetch error:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [symbol, interval, depthLevels]);

  // Initial fetch and symbol change
  useEffect(() => {
    setIsLoading(true);
    refreshAll();

    const intervalId = setInterval(() => {
      refreshAll();
    }, 20000); // 20s poller

    return () => clearInterval(intervalId);
  }, [refreshAll]);

  // WebSocket listeners
  useEffect(() => {
    const unsubTicker = binanceWs.onSpotEvent('24hrTicker', (data) => {
      if (!data || !data.s || data.s.toUpperCase() !== symbol.toUpperCase()) return;
      setTicker((prev) => ({
        symbol: data.s,
        lastPrice: data.c,
        priceChange: data.p,
        priceChangePercent: data.P,
        openPrice: data.o,
        highPrice: data.h,
        lowPrice: data.l,
        volume: data.v,
        quoteVolume: data.q,
        bidPrice: prev?.bidPrice || data.c,
        askPrice: prev?.askPrice || data.c,
      }));
    });

    const unsubKline = binanceWs.onSpotEvent('kline', (data) => {
      if (!data || !data.s || data.s.toUpperCase() !== symbol.toUpperCase()) return;
      const k = data.k;
      if (!k) return;
      const newCandle: Kline = {
        time: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        quoteVolume: parseFloat(k.q),
        trades: k.n,
        takerBuyBaseVolume: parseFloat(k.V),
        takerBuyQuoteVolume: parseFloat(k.Q),
      };

      setKlines((prev) => {
        if (!prev || prev.length === 0) return [newCandle];
        const lastIdx = prev.length - 1;
        if (prev[lastIdx].time === newCandle.time) {
          const updated = [...prev];
          updated[lastIdx] = newCandle;
          return updated;
        } else if (newCandle.time > prev[lastIdx].time) {
          return [...prev.slice(1), newCandle];
        }
        return prev;
      });
    });

    const unsubLiq = binanceWs.onFuturesEvent('forceOrder', (data) => {
      if (!data || !data.o) return;
      const o = data.o;
      if (o.s && o.s.toUpperCase() === symbol.toUpperCase()) {
        const newLiq: LiquidationOrder = {
          symbol: o.s,
          price: o.p,
          origQty: o.q,
          executedQty: o.z,
          averagePrice: o.ap,
          status: o.X,
          timeInForce: o.f,
          type: o.o,
          side: o.S,
          time: data.E,
        };
        setLiquidations((prev) => [newLiq, ...prev.slice(0, 49)]);
      }
    });

    return () => {
      unsubTicker();
      unsubKline();
      unsubLiq();
    };
  }, [symbol]);

  // Run Analytics Calculations when raw market data changes
  useEffect(() => {
    const spotPrice = parseFloat(ticker?.lastPrice || '0');
    const futuresPrice = parseFloat(premiumIndex?.markPrice || ticker?.lastPrice || '0');
    const indexPrice = parseFloat(premiumIndex?.indexPrice || ticker?.lastPrice || '0');
    const fundingRate = parseFloat(fundingInfo?.fundingRate || premiumIndex?.lastFundingRate || '0.0001');

    // 1. Order Book Imbalance
    if (orderBook) {
      const imb = analyticsEngine.calculateOrderBookImbalance(orderBook, depthLevels);
      setImbalance(imb);
    }

    // 2. Spot-Futures Basis
    if (spotPrice > 0) {
      const b = analyticsEngine.calculateBasis(spotPrice, futuresPrice, indexPrice, fundingRate);
      setBasis(b);
    }

    // 3. CVD & Trends
    let currentCvd = cvdData;
    if (klines.length > 0) {
      currentCvd = analyticsEngine.calculateCVD(klines);
      setCvdData(currentCvd);

      const calculatedTrends: Record<string, TimeframeTrend> = {};
      ['1m', '5m', '15m', '1h', '4h', '1d'].forEach((tf) => {
        calculatedTrends[tf] = analyticsEngine.analyzeKlines(klines, tf);
      });
      setTrends(calculatedTrends);
    }

    // 4. Sentiment
    const lsRatio = parseFloat(globalRatio?.longShortRatio || '1.0');
    const oiChangePct = 0;
    const takerRatioVal = parseFloat(takerRatio?.buySellRatio || '1.0');
    const sent = analyticsEngine.calculateSentiment(fundingRate, lsRatio, oiChangePct, takerRatioVal);
    setSentiment(sent);

    // 5. Smart Money Divergence
    if (topTraderRatio && globalRatio) {
      const div = analyticsEngine.calculateSmartMoneyDivergence([globalRatio], [topTraderRatio as any]);
      setSmartMoneyDivergence(div);
    }

    // 6. Dump Risk
    if (imbalance && klines.length > 0) {
      const topTraderNum = topTraderRatio ? parseFloat(topTraderRatio.longShortRatio) : 1.0;
      const dr = analyticsEngine.calculateDumpRisk(
        imbalance,
        currentCvd,
        liquidations,
        fundingRate,
        topTraderNum,
        trends,
        klines
      );
      setDumpRisk(dr);
    }

    // 7. Tactical Plan
    if (klines.length > 0) {
      const planPayload = {
        spotPrice,
        klines,
        sentimentScore: sentiment.compositeScore,
        imbalance,
        cvdData: currentCvd,
        dumpRisk,
      };
      const plan = analyticsEngine.generateClientTacticalTradePlan(planPayload);
      setTacticalPlan(plan);
    }

    // 8. Anomalies
    const anoms = analyticsEngine.detectAnomalies(
      symbol,
      fundingRate,
      basis,
      imbalance,
      liquidations,
      oiHistory,
      takerRatioVal,
      spotPrice
    );
    setAnomalies(anoms);

    // 9. Market Regime
    const reg = analyticsEngine.detectMarketRegime(
      fundingRate,
      lsRatio,
      basis,
      currentCvd.trend,
      sentiment.compositeScore
    );
    if (reg) {
      setMarketRegime(reg);
    }
  }, [ticker, premiumIndex, fundingInfo, orderBook, klines, depthLevels, globalRatio, topTraderRatio, takerRatio, liquidations]);

  // AI Commentary Generator Call
  const generateAiCommentary = useCallback(
    async (userQuery?: string, horizonMode: AnalysisHorizonMode = 'FULL') => {
      const spotPrice = parseFloat(ticker?.lastPrice || '0');
      const payload: AICommentaryPayload = {
        symbol,
        spotPrice,
        priceChange24h: parseFloat(ticker?.priceChangePercent || '0'),
        volume24h: parseFloat(ticker?.quoteVolume || '0'),
        fundingRate: parseFloat(fundingInfo?.fundingRate || premiumIndex?.lastFundingRate || '0.0001'),
        nextFundingInMinutes: premiumIndex?.nextFundingTime ? Math.max(0, Math.round((premiumIndex.nextFundingTime - Date.now()) / 60000)) : 240,
        basis: basis.basis,
        sentimentScore: sentiment.compositeScore,
        sentimentClass: sentiment.classification,
        orderBookImbalance: imbalance.imbalance,
        longShortRatio: parseFloat(globalRatio?.longShortRatio || '1.0'),
        topTraderRatio: parseFloat(topTraderRatio?.longShortRatio || '1.0'),
        takerBuySellRatio: parseFloat(takerRatio?.buySellRatio || '1.0'),
        recentLiquidationsCount: liquidations.length,
        recentLiquidationsLongUsd: liquidations.filter((l) => l.side === 'SELL').reduce((s, l) => s + parseFloat(l.price) * parseFloat(l.executedQty), 0),
        recentLiquidationsShortUsd: liquidations.filter((l) => l.side === 'BUY').reduce((s, l) => s + parseFloat(l.price) * parseFloat(l.executedQty), 0),
        cvdNetDeltaUsd: cvdData.netDeltaUsd,
        anomalies: anomalies.map((a) => a.title),
        dumpRiskScore: dumpRisk?.score || 0,
        dumpRiskLevel: dumpRisk?.level || 'LOW',
        dumpRiskTriggers: dumpRisk?.triggers || [],
        trends: Object.fromEntries(Object.entries(trends).map(([k, v]) => [k, v.trend])),
        userQuery,
        horizonMode,
        crossMarket: crossMarket || undefined,
      };

      try {
        const res = await fetch('/api/ai/commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn('[useMarketData] AI commentary fetch error:', err);
      }
      return null;
    },
    [symbol, ticker, fundingInfo, premiumIndex, basis, sentiment, imbalance, globalRatio, topTraderRatio, takerRatio, liquidations, cvdData, anomalies, dumpRisk, trends, crossMarket]
  );

  const spotPrice = parseFloat(ticker?.lastPrice || '0');
  const commentaryPayload: AICommentaryPayload = {
    symbol,
    spotPrice,
    priceChange24h: parseFloat(ticker?.priceChangePercent || '0'),
    volume24h: parseFloat(ticker?.quoteVolume || '0'),
    fundingRate: parseFloat(fundingInfo?.fundingRate || premiumIndex?.lastFundingRate || '0.0001'),
    nextFundingInMinutes: premiumIndex?.nextFundingTime ? Math.max(0, Math.round((premiumIndex.nextFundingTime - Date.now()) / 60000)) : 240,
    basis: basis.basis,
    sentimentScore: sentiment.compositeScore,
    sentimentClass: sentiment.classification,
    orderBookImbalance: imbalance.imbalance,
    longShortRatio: parseFloat(globalRatio?.longShortRatio || '1.0'),
    topTraderRatio: parseFloat(topTraderRatio?.longShortRatio || '1.0'),
    takerBuySellRatio: parseFloat(takerRatio?.buySellRatio || '1.0'),
    recentLiquidationsCount: liquidations.length,
    recentLiquidationsLongUsd: liquidations.filter((l) => l.side === 'SELL').reduce((s, l) => s + parseFloat(l.price) * parseFloat(l.executedQty), 0),
    recentLiquidationsShortUsd: liquidations.filter((l) => l.side === 'BUY').reduce((s, l) => s + parseFloat(l.price) * parseFloat(l.executedQty), 0),
    cvdNetDeltaUsd: cvdData.netDeltaUsd,
    anomalies: anomalies.map((a) => a.title),
    dumpRiskScore: dumpRisk?.score || 0,
    dumpRiskLevel: dumpRisk?.level || 'LOW',
    dumpRiskTriggers: dumpRisk?.triggers || [],
    trends: Object.fromEntries(Object.entries(trends).map(([k, v]) => [k, v.trend])),
    crossMarket: crossMarket || undefined,
  };

  return {
    ticker,
    klines,
    orderBook,
    trades,
    premiumIndex,
    fundingInfo,
    openInterest,
    oiHistory,
    topTraderRatio,
    globalRatio,
    takerRatio,
    liquidations,
    allTickers,
    crossMarket,
    imbalance,
    basis,
    sentiment,
    cvdData,
    trends,
    anomalies,
    dumpRisk,
    tacticalPlan,
    smartMoneyDivergence,
    marketRegime,
    commentaryPayload,
    isLoading,
    refreshAll,
    hasFutures,
    generateAiCommentary,
  };
}
