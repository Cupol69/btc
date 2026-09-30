import {
  SentimentAnalysis,
  OrderBookImbalance,
  SpotFuturesBasis,
  TimeframeTrend,
  OrderBook,
  Kline,
  LiquidationOrder,
  OpenInterestHist,
  CVDData,
  CVDPoint,
  MarketAnomaly,
  MarketRegime,
  DumpRiskAssessment,
  DumpRiskLevel,
  TacticalTradePlan,
  LongShortRatio,
  TopPositionRatio,
  SmartMoneyDivergence,
} from '../types';

export const analyticsEngine = {
  /**
   * 5.2 SENTIMENT ANALYSIS (Derivatives 4-Pillar Model)
   * Formula: sentiment = (funding_rate_norm * 0.3 + ls_ratio_dev * 0.3 + oi_change * 0.2 + taker_ratio * 0.2)
   */
  calculateSentiment(
    fundingRate: number, // e.g. 0.0001 = 0.01%
    longShortRatio: number, // e.g. 1.4
    oiChangePercent: number, // e.g. +5.2%
    takerBuySellRatio: number // e.g. 1.15
  ): SentimentAnalysis {
    // 1. Funding rate normalized:
    // Binance baseline equilibrium rate is exactly 0.0001 (0.01% per 8h).
    // Deviation from baseline: (fundingRate - 0.0001) / 0.0004 -> [-100, 100]
    // 0.01% (baseline) -> 0 (Neutral)
    // +0.03% -> +50 (Greed)
    // +0.05% -> +100 (Extreme Greed)
    // 0.00% -> -25 (Mild Bearish)
    // -0.03% -> -100 (Extreme Fear / heavy shorting)
    const fundingNormalized = Math.max(
      -100,
      Math.min(100, ((fundingRate - 0.0001) / 0.0004) * 100)
    );

    // 2. Long/Short ratio deviation:
    // Symmetrical ratio mapping:
    // When ratio >= 1.0 (longs dominant, e.g. 2.0 = 66.7% longs): (ratio - 1.0) * 100 -> [0, 100]
    // When ratio < 1.0 (shorts dominant, e.g. 0.5 = 66.7% shorts): (1 - 1 / ratio) * 100 -> [-100, 0]
    const validLsRatio = Math.max(0.01, longShortRatio);
    const lsDeviation = validLsRatio >= 1.0
      ? Math.min(100, (validLsRatio - 1.0) * 100)
      : Math.max(-100, (1 - 1.0 / validLsRatio) * 100);

    // 3. OI Change %: Range [-10%, +10%] -> [-100, 100]
    const oiNormalized = Math.max(-100, Math.min(100, oiChangePercent * 10));

    // 4. Taker Buy/Sell ratio:
    // Symmetrical buyer vs seller aggressiveness:
    // When ratio >= 1.0: (ratio - 1.0) * 200 -> [0, 100] (at 1.5 -> +100)
    // When ratio < 1.0: (1 - 1 / ratio) * 200 -> [-100, 0] (at 0.67 -> -100)
    const validTakerRatio = Math.max(0.01, takerBuySellRatio);
    const takerNormalized = validTakerRatio >= 1.0
      ? Math.min(100, (validTakerRatio - 1.0) * 200)
      : Math.max(-100, (1 - 1.0 / validTakerRatio) * 200);

    // Composite calculation with weights: 0.3, 0.3, 0.2, 0.2
    const compositeScore = Math.round(
      fundingNormalized * 0.3 + lsDeviation * 0.3 + oiNormalized * 0.2 + takerNormalized * 0.2
    );

    let classification: SentimentAnalysis['classification'] = 'NEUTRAL';
    let description = 'Нейтральный баланс сил на рынке';

    if (compositeScore >= 50) {
      classification = 'EXTREME_GREED';
      description = 'Экстремальная жадность (рынок перегрет, повышен риск лонг-сквиза)';
    } else if (compositeScore >= 15) {
      classification = 'GREED';
      description = 'Умеренный бычий сентимент и преобладание покупателей';
    } else if (compositeScore <= -50) {
      classification = 'EXTREME_FEAR';
      description = 'Экстремальный страх (давление шортов / риск шорт-сквиза)';
    } else if (compositeScore <= -15) {
      classification = 'FEAR';
      description = 'Медвежий сентимент и осторожность участников';
    }

    return {
      compositeScore,
      classification,
      fundingScore: Math.round(fundingNormalized),
      longShortScore: Math.round(lsDeviation),
      oiScore: Math.round(oiNormalized),
      takerScore: Math.round(takerNormalized),
      description,
      mode: 'FUTURES',
      rawOiChangePercent: oiChangePercent,
    };
  },

  /**
   * 5.2.1 SPOT SENTIMENT ANALYSIS (3-Pillar Spot Liquidity Model)
   * Designed for Spot-only tokens without USDT-M Futures.
   * Pillars:
   * 1. Order Book USD Imbalance (Weight 35%): Bid vs Ask notional depth
   * 2. Spot CVD Taker Buyer Dominance (Weight 35%): Aggressive market buys vs sells
   * 3. 24h Price & Volume Momentum (Weight 30%): Price change %
   */
  calculateSpotSentiment(
    orderBookImbalance: number, // -1 to +1
    buyerDominancePercent: number, // 0 to 100%
    priceChangePercent: number // e.g. +3.5%
  ): SentimentAnalysis {
    // 1. Order Book Imbalance score [-100, 100]
    const imbalanceScore = Math.max(-100, Math.min(100, Math.round(orderBookImbalance * 100)));

    // 2. CVD Buyer Dominance: 50% = 0 neutral, 100% = +100, 0% = -100
    const cvdScore = Math.max(-100, Math.min(100, Math.round((buyerDominancePercent - 50) * 2)));

    // 3. 24h Momentum: +10% -> +50, +20% -> +100
    const momentumScore = Math.max(-100, Math.min(100, Math.round(priceChangePercent * 5)));

    const compositeScore = Math.round(
      imbalanceScore * 0.35 + cvdScore * 0.35 + momentumScore * 0.30
    );

    let classification: SentimentAnalysis['classification'] = 'NEUTRAL';
    let description = 'Нейтральное соотношение спроса и предложения на споте';

    if (compositeScore >= 50) {
      classification = 'EXTREME_GREED';
      description = 'Высокая спотовая перекупленность и аномальный приток покупателей';
    } else if (compositeScore >= 15) {
      classification = 'GREED';
      description = 'Умеренное преобладание спотовых бидов и рыночных покупок';
    } else if (compositeScore <= -50) {
      classification = 'EXTREME_FEAR';
      description = 'Сильное давление спотовых продавцов и плотные лимитные аски';
    } else if (compositeScore <= -15) {
      classification = 'FEAR';
      description = 'Медвежий перевес в стакане и пассивный спрос';
    }

    return {
      compositeScore,
      classification,
      fundingScore: 0,
      longShortScore: imbalanceScore,
      oiScore: cvdScore,
      takerScore: momentumScore,
      description,
      mode: 'SPOT',
      spotMetrics: {
        imbalanceScore,
        cvdScore,
        momentumScore,
        rawImbalancePct: orderBookImbalance * 100,
        rawBuyerDominancePct: buyerDominancePercent,
        rawPriceChangePct: priceChangePercent,
      },
    };
  },

  /**
   * 5.4 ORDER BOOK IMBALANCE (Strictly USD / Notional Value ($))
   * Formula: imbalance = (bid_notional_usd - ask_notional_usd) / (bid_notional_usd + ask_notional_usd)
   */
  calculateOrderBookImbalance(orderBook: OrderBook, depthLevels: number = 20): OrderBookImbalance {
    if (!orderBook.bids.length && !orderBook.asks.length) {
      return {
        imbalance: 0,
        bidVolume: 0,
        askVolume: 0,
        totalBidNotionalUsd: 0,
        totalAskNotionalUsd: 0,
        dominantSide: 'BALANCED',
      };
    }

    const bids = orderBook.bids.slice(0, depthLevels);
    const asks = orderBook.asks.slice(0, depthLevels);

    // Quantity sums
    const totalBidVol = bids.reduce((sum, b) => sum + b.qty, 0);
    const totalAskVol = asks.reduce((sum, a) => sum + a.qty, 0);

    // Strict USD ($) Notional calculations: sum(Price * Qty)
    const totalBidNotionalUsd = bids.reduce((sum, b) => sum + b.price * b.qty, 0);
    const totalAskNotionalUsd = asks.reduce((sum, a) => sum + a.price * a.qty, 0);

    const totalNotionalUsd = totalBidNotionalUsd + totalAskNotionalUsd;
    // Imbalance in range [-1, +1]
    const imbalance = totalNotionalUsd > 0 ? (totalBidNotionalUsd - totalAskNotionalUsd) / totalNotionalUsd : 0;

    let dominantSide: OrderBookImbalance['dominantSide'] = 'BALANCED';
    if (imbalance > 0.08) {
      dominantSide = 'BUYERS';
    } else if (imbalance < -0.08) {
      dominantSide = 'SELLERS';
    }

    return {
      imbalance,
      bidVolume: totalBidVol,
      askVolume: totalAskVol,
      totalBidNotionalUsd,
      totalAskNotionalUsd,
      dominantSide,
    };
  },

  /**
   * CUMULATIVE VOLUME DELTA (CVD)
   * Tracks aggressive market buyers vs aggressive market sellers over time
   */
  calculateCVD(klines: Kline[]): CVDData {
    if (!klines || klines.length === 0) {
      return {
        points: [],
        netDeltaUsd: 0,
        buyerDominancePercent: 50,
        trend: 'NEUTRAL',
      };
    }

    let runningCvd = 0;
    let totalTakerBuy = 0;
    let totalTakerSell = 0;

    const points: CVDPoint[] = klines.map((k) => {
      const quoteVol = k.quoteVolume > 0 ? k.quoteVolume : k.volume * k.close;
      const takerBuy = k.takerBuyQuoteVolume > 0 ? k.takerBuyQuoteVolume : k.takerBuyBaseVolume * k.close;
      const takerSell = Math.max(0, quoteVol - takerBuy);
      const deltaUsd = takerBuy - takerSell;

      runningCvd += deltaUsd;
      totalTakerBuy += takerBuy;
      totalTakerSell += takerSell;

      return {
        time: k.time,
        price: k.close,
        takerBuyUsd: takerBuy,
        takerSellUsd: takerSell,
        deltaUsd,
        cvdUsd: runningCvd,
      };
    });

    const netDeltaUsd = runningCvd;
    const totalVolume = totalTakerBuy + totalTakerSell;
    const buyerDominancePercent = totalVolume > 0 ? (totalTakerBuy / totalVolume) * 100 : 50;

    // Detect CVD Trend vs Price Trend (Absorption / Divergence)
    let trend: CVDData['trend'] = 'NEUTRAL';
    const recent = points.slice(-10);
    if (recent.length >= 5) {
      const firstCvd = recent[0].cvdUsd;
      const lastCvd = recent[recent.length - 1].cvdUsd;
      const cvdDeltaRecent = lastCvd - firstCvd;

      const firstPrice = recent[0].price;
      const lastPrice = recent[recent.length - 1].price;
      const priceDeltaRecent = (lastPrice - firstPrice) / firstPrice;

      if (cvdDeltaRecent > 0 && priceDeltaRecent >= 0) {
        trend = 'BULLISH_FLOW';
      } else if (cvdDeltaRecent < 0 && priceDeltaRecent <= 0) {
        trend = 'BEARISH_FLOW';
      } else if (cvdDeltaRecent > 0 && priceDeltaRecent < 0) {
        trend = 'ABSORPTION'; // aggressive buyers absorbed by passive limit sellers
      } else if (cvdDeltaRecent < 0 && priceDeltaRecent > 0) {
        trend = 'ABSORPTION'; // aggressive sellers absorbed by passive limit buyers
      }
    }

    return {
      points,
      netDeltaUsd,
      buyerDominancePercent,
      trend,
    };
  },

  /**
   * 5.6 SPOT-FUTURES BASIS
   * Formula: basis = (futures_price - spot_price) / spot_price * 100
   */
  calculateBasis(spotPrice: number, futuresPrice: number, indexPrice: number, fundingRate: number): SpotFuturesBasis {
    if (spotPrice <= 0) {
      return {
        spotPrice,
        futuresPrice,
        indexPrice,
        basis: 0,
        annualizedAPR: 0,
        structure: 'NEUTRAL',
      };
    }

    const basis = ((futuresPrice - spotPrice) / spotPrice) * 100;
    // Annualized funding rate APR (8h rate * 3 * 365)
    const annualizedAPR = fundingRate * 3 * 365 * 100;

    let structure: SpotFuturesBasis['structure'] = 'NEUTRAL';
    if (basis > 0.02) {
      structure = 'CONTANGO';
    } else if (basis < -0.02) {
      structure = 'BACKWARDATION';
    }

    return {
      spotPrice,
      futuresPrice,
      indexPrice,
      basis,
      annualizedAPR,
      structure,
    };
  },

  /**
   * AUTOMATED MARKET ANOMALY DETECTION ENGINE
   */
  detectAnomalies(
    symbol: string,
    fundingRate: number,
    basis: SpotFuturesBasis,
    imbalance: OrderBookImbalance,
    liquidations: LiquidationOrder[],
    oiHistory: OpenInterestHist[],
    takerRatio: number,
    currentPrice: number
  ): MarketAnomaly[] {
    const anomalies: MarketAnomaly[] = [];
    const now = Date.now();

    // 1. Check Extreme Funding Squeeze Risk
    if (fundingRate >= 0.00025) {
      anomalies.push({
        id: `funding-high-${now}`,
        type: 'EXTREME_FUNDING',
        severity: 'CRITICAL',
        title: '🔥 Перегретый лонг-фандинг (Squeeze Risk)',
        description: `Ставка финансирования ${(fundingRate * 100).toFixed(4)}% (>+27% APR). Лонги переплачивают шортам — повышен риск лонг-сквиза.`,
        value: `${(fundingRate * 100).toFixed(3)}%`,
        timestamp: now,
      });
    } else if (fundingRate <= -0.0002) {
      anomalies.push({
        id: `funding-low-${now}`,
        type: 'EXTREME_FUNDING',
        severity: 'CRITICAL',
        title: '⚡ Отрицательный фандинг (Short Squeeze Watch)',
        description: `Ставка ${(fundingRate * 100).toFixed(4)}%. Шорты переплачивают лонгам — возможность импульсного шорт-сквиза вверх.`,
        value: `${(fundingRate * 100).toFixed(3)}%`,
        timestamp: now,
      });
    }

    // 2. Check Liquidation Spikes
    if (liquidations && liquidations.length > 0) {
      const recent15m = liquidations.filter((l) => now - l.time < 15 * 60 * 1000);
      const longLiqs = recent15m.filter((l) => l.side === 'SELL');
      const shortLiqs = recent15m.filter((l) => l.side === 'BUY');

      const longLiqUsd = longLiqs.reduce((acc, l) => acc + parseFloat(l.price) * parseFloat(l.executedQty || l.origQty), 0);
      const shortLiqUsd = shortLiqs.reduce((acc, l) => acc + parseFloat(l.price) * parseFloat(l.executedQty || l.origQty), 0);

      if (longLiqUsd > 100_000) {
        anomalies.push({
          id: `liq-long-${now}`,
          type: 'LIQUIDATION_SPIKE',
          severity: longLiqUsd > 500_000 ? 'CRITICAL' : 'WARNING',
          title: '🚨 Всплеск ликвидаций Лонгов',
          description: `Зафиксирован сброс лонгов на $${(longLiqUsd / 1000).toFixed(0)}k. Возможно истощение продавцов (Divergence / Local Bottom).`,
          value: `$${(longLiqUsd / 1000).toFixed(0)}k`,
          timestamp: now,
        });
      } else if (shortLiqUsd > 100_000) {
        anomalies.push({
          id: `liq-short-${now}`,
          type: 'LIQUIDATION_SPIKE',
          severity: shortLiqUsd > 500_000 ? 'CRITICAL' : 'WARNING',
          title: '🚨 Всплеск ликвидаций Шортов',
          description: `Каскад ликвидаций шортов на $${(shortLiqUsd / 1000).toFixed(0)}k. Топливо для импульсного движения вверх.`,
          value: `$${(shortLiqUsd / 1000).toFixed(0)}k`,
          timestamp: now,
        });
      }
    }

    // 3. Check Open Interest Surges
    if (oiHistory && oiHistory.length >= 4) {
      const recentOi = parseFloat(oiHistory[oiHistory.length - 1].sumOpenInterestValue);
      const pastOi = parseFloat(oiHistory[0].sumOpenInterestValue);
      const oiChange = pastOi > 0 ? ((recentOi - pastOi) / pastOi) * 100 : 0;

      if (Math.abs(oiChange) >= 6) {
        anomalies.push({
          id: `oi-surge-${now}`,
          type: 'OI_SURGE',
          severity: 'WARNING',
          title: oiChange > 0 ? '⚡ Резкий приток Open Interest' : '📉 Резкий отток Open Interest',
          description: `Открытый интерес изменился на ${oiChange > 0 ? '+' : ''}${oiChange.toFixed(1)}% за 24ч ($${((recentOi - pastOi) / 1_000_000).toFixed(1)}M). Приток нового кредитного плеча.`,
          value: `${oiChange > 0 ? '+' : ''}${oiChange.toFixed(1)}%`,
          timestamp: now,
        });
      }
    }

    // 4. Check Order Book Liquidity Wall ($ USD based)
    if (Math.abs(imbalance.imbalance) >= 0.35) {
      const isBidWall = imbalance.imbalance > 0;
      anomalies.push({
        id: `ob-wall-${now}`,
        type: 'ORDERBOOK_WALL',
        severity: 'INFO',
        title: isBidWall ? '🐋 Плотная стенка покупателей' : '🧱 Плотная стенка продавцов',
        description: `Дисбаланс стакана ${(Math.abs(imbalance.imbalance) * 100).toFixed(0)}% в пользу ${isBidWall ? 'покупок' : 'продаж'} (Биды: $${(imbalance.totalBidNotionalUsd / 1000).toFixed(0)}k vs Аски: $${(imbalance.totalAskNotionalUsd / 1000).toFixed(0)}k).`,
        value: `${(imbalance.imbalance * 100).toFixed(0)}%`,
        timestamp: now,
      });
    }

    // 5. Check Spot-Futures Basis Spread Dislocation
    if (Math.abs(basis.basis) >= 0.12) {
      anomalies.push({
        id: `basis-disc-${now}`,
        type: 'BASIS_DIVERGENCE',
        severity: 'INFO',
        title: basis.basis > 0 ? '📈 Высокая премия фьючерса' : '📉 Глубокий дисконт фьючерса',
        description: `Спред спот-фьючерс составляет ${basis.basis.toFixed(3)}% (${basis.structure}). Возможность базисного арбитража.`,
        value: `${basis.basis > 0 ? '+' : ''}${basis.basis.toFixed(2)}%`,
        timestamp: now,
      });
    }

    // 6. Check Flash Dump Risk Alarm
    if (imbalance.imbalance <= -0.30 && takerRatio < 0.85) {
      anomalies.push({
        id: `dump-risk-${now}`,
        type: 'FLASH_DUMP_RISK',
        severity: 'CRITICAL',
        title: '⚠️ Высокая угроза пролива (Dump / Sell-Off Alert)',
        description: `Откачка бидов (аски преобладают на ${(Math.abs(imbalance.imbalance) * 100).toFixed(0)}%) в сочетании с агрессивным давлением продавцов (Taker Buy/Sell: ${takerRatio.toFixed(2)}).`,
        value: `Риск: ВЫСОКИЙ`,
        timestamp: now,
      });
    }

    return anomalies;
  },

  /**
   * REAL-TIME DUMP / FLASH CRASH RISK RADAR ENGINE
   * Multivariable evaluation of order book depth, taker flow, liquidation clusters, funding rate, and timeframe momentum.
   */
  calculateDumpRisk(
    imbalance: OrderBookImbalance,
    cvdData: CVDData,
    liquidations: LiquidationOrder[],
    fundingRate: number,
    topTraderRatio: number,
    trends: Record<string, TimeframeTrend>,
    klines: Kline[]
  ): DumpRiskAssessment {
    let score = 0;
    const triggers: string[] = [];

    const now = Date.now();
    const recent15m = (liquidations || []).filter((l) => now - l.time < 15 * 60 * 1000);
    const longLiqs = recent15m.filter((l) => l.side === 'SELL');
    const longLiqUsd = longLiqs.reduce(
      (acc, l) => acc + parseFloat(l.price) * parseFloat(l.executedQty || l.origQty),
      0
    );

    const imbalancePct = (imbalance.imbalance || 0) * 100;
    const takerDeltaUsd = cvdData.liveTickDeltaUsd ?? cvdData.netDeltaUsd;
    const fundingRatePct = fundingRate * 100;

    // 1. Order Book Liquidity Vacuum / Asks Dominance (up to +35 pts)
    if (imbalance.imbalance <= -0.40) {
      score += 35;
      triggers.push(`Критический дефицит бидов: аски превышают биды на ${Math.abs(imbalancePct).toFixed(0)}% (глубокий дисбаланс)`);
    } else if (imbalance.imbalance <= -0.25) {
      score += 25;
      triggers.push(`Тонкий бид-стакан: перевес продавцов на ${Math.abs(imbalancePct).toFixed(0)}%`);
    } else if (imbalance.imbalance <= -0.12) {
      score += 12;
      triggers.push(`Локальное преобладание асков (-${Math.abs(imbalancePct).toFixed(0)}%)`);
    }

    // 2. Aggressive Taker Market Sell CVD Flow (up to +30 pts)
    if (cvdData.trend === 'BEARISH_FLOW') {
      score += 15;
    }
    if (takerDeltaUsd < -100_000) {
      score += 20;
      triggers.push(`Массивный сброс по рынку: Taker Delta -$${Math.abs(takerDeltaUsd / 1000).toFixed(0)}k`);
    } else if (takerDeltaUsd < -25_000) {
      score += 12;
      triggers.push(`Устойчивый поток маркет-селлов: Taker Delta -$${Math.abs(takerDeltaUsd / 1000).toFixed(0)}k`);
    } else if (takerDeltaUsd < -5_000) {
      score += 5;
    }

    // 3. Cascading Long Liquidations (up to +20 pts)
    if (longLiqUsd >= 500_000) {
      score += 20;
      triggers.push(`Каскад ликвидаций лонгов: $${(longLiqUsd / 1000).toFixed(0)}k за 15м`);
    } else if (longLiqUsd >= 100_000) {
      score += 14;
      triggers.push(`Всплеск ликвидаций лонгов: $${(longLiqUsd / 1000).toFixed(0)}k за 15м`);
    } else if (longLiqUsd >= 30_000) {
      score += 8;
      triggers.push(`Локальные принудительные закрытия лонгов: $${(longLiqUsd / 1000).toFixed(0)}k`);
    }

    // 4. Overheated Long Funding (Squeeze Vulnerability) (up to +15 pts)
    if (fundingRate >= 0.0003) {
      score += 15;
      triggers.push(`Экстремально перегретый фандинг (${fundingRatePct.toFixed(4)}%): высокий риск лонг-сквиза`);
    } else if (fundingRate >= 0.00018) {
      score += 10;
      triggers.push(`Повышенная ставка фандинга (${fundingRatePct.toFixed(4)}%)`);
    }

    // 5. Smart Money / Top Traders Positioning (up to +12 pts)
    const isTopTradersBearish = topTraderRatio > 0 && topTraderRatio < 0.90;
    if (isTopTradersBearish) {
      score += 12;
      triggers.push(`Топ-трейдеры (киты) в шортах: соотношение L/S ${topTraderRatio.toFixed(2)}`);
    }

    // 6. Micro-Timeframe Breakdown (1m, 5m, 15m) (up to +15 pts)
    const tf1m = trends['1m'];
    const tf5m = trends['5m'];
    const tf15m = trends['15m'];
    const microBearishCount = [tf1m, tf5m, tf15m].filter((t) => t && t.trend === 'BEARISH').length;
    const isMultiTfBearish = microBearishCount >= 2;

    if (microBearishCount === 3) {
      score += 15;
      triggers.push(`Синхронный медвежий слом на 1m, 5m, 15m`);
    } else if (microBearishCount === 2) {
      score += 8;
      triggers.push(`Медвежий импульс на микро-таймфреймах`);
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, Math.round(score)));

    // Categorize level
    let level: DumpRiskLevel = 'LOW';
    let description = 'Рыночная структура стабильна. Признаков агрессивного сброса или ликвидационного каскада не зафиксировано.';
    let advice = 'Штатный торговый режим. Ликвидность в стакане сбалансирована.';

    if (score >= 80) {
      level = 'CRITICAL';
      description = '🚨 КРИТИЧЕСКАЯ УГРОЗА ПРОЛИВА: Активный каскад маркет-селлов при исчерпании лимитных бидов в стакане.';
      advice = 'НЕ ловить падающие ножи лимитками! Подтянуть стоп-лоссы лонгов или зафиксировать прибыль. Дождаться истощения CVD дельты.';
    } else if (score >= 60) {
      level = 'HIGH';
      description = '⚠️ ВЫСОКИЙ РИСК СБРОСА: Существенный перекос в сторону продаж, откачка бидов и повышенная уязвимость структуры.';
      advice = 'Соблюдать повышенную осторожность. Лонг-сетапы требуют строгого подтверждения по поглощению дельты.';
    } else if (score >= 40) {
      level = 'ELEVATED';
      description = '⚡ ПОВЫШЕННЫЙ РИСК: Умеренное давление продавцов, локальное истощение покупателей.';
      advice = 'Контролировать уровень инвалидации. Избегать набора лонгов с высоким кредитным плечом.';
    } else if (score >= 20) {
      level = 'GUARDED';
      description = 'Внимание: небольшое локальное давление на бид-стакан, но критических каскадов нет.';
      advice = 'Стандартное управление рисками.';
    }

    return {
      score,
      level,
      triggers,
      description,
      advice,
      metrics: {
        imbalancePct,
        takerDeltaUsd,
        longLiquidationUsd: longLiqUsd,
        fundingRatePct,
        isTopTradersBearish,
        isMultiTfBearish,
      },
    };
  },

  /**
   * DETECT HIGH-LEVEL MARKET REGIME
   */
  detectMarketRegime(
    fundingRate: number,
    longShortRatio: number,
    basis: SpotFuturesBasis,
    cvdTrend: CVDData['trend'],
    sentimentScore: number
  ): { regime: MarketRegime; title: string; badgeColor: string; description: string } {
    if (fundingRate < 0 && cvdTrend === 'BULLISH_FLOW') {
      return {
        regime: 'ACCUMULATION_DIP_BUYING',
        title: 'Accumulation / Dip Buying',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        description: 'Отрицательный/нейтральный фандинг при агрессивных спот-покупках — институциональный набор позиций.',
      };
    }

    if (fundingRate > 0.00025 && longShortRatio > 1.4) {
      return {
        regime: 'OVERHEATED_LONG_SQUEEZE',
        title: 'Overheated Longs / Squeeze Risk',
        badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        description: 'Перегруженность розничных лонгов с высокой комиссией финансирования. Высокая вероятность сброса.',
      };
    }

    if (fundingRate < -0.00015 && longShortRatio < 0.85) {
      return {
        regime: 'SHORT_SQUEEZE_SETUP',
        title: 'Short Squeeze Setup',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        description: 'Плотное скопление шорт-позиций при отрицательном фандинге — условия для резкого импульса вверх.',
      };
    }

    if (cvdTrend === 'ABSORPTION') {
      return {
        regime: 'DISTRIBUTION_SELLING',
        title: 'Absorption / Divergence',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        description: 'Маркет-ордера поглощаются лимитными заявками. Возможен разворот локального диапазона.',
      };
    }

    if (Math.abs(sentimentScore) >= 40) {
      return {
        regime: 'VOLATILITY_EXPANSION',
        title: 'Volatility Expansion',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        description: 'Односторонний импульс с высоким сентиментом и расширением диапазона.',
      };
    }

    return {
      regime: 'RANGE_CHOP_EQUILIBRIUM',
      title: 'Range / Equilibrium',
      badgeColor: 'bg-slate-750 text-slate-300 border-slate-700',
      description: 'Сбалансированный рынок без явного перекоса покупателей и продавцов.',
    };
  },

  /**
   * 5.5 MULTI-TIMEFRAME ANALYSIS
   */
  analyzeKlines(klines: Kline[], timeframe: string): TimeframeTrend {
    if (klines.length < 5) {
      return {
        timeframe,
        trend: 'NEUTRAL',
        changePercent: 0,
        volumeStrength: 'NORMAL',
        rsiApprox: 50,
      };
    }

    const current = klines[klines.length - 1];
    const first = klines[0];
    const changePercent = ((current.close - first.open) / first.open) * 100;

    // Moving average SMA 20
    const slice20 = klines.slice(-20);
    const sma20 = slice20.reduce((acc, k) => acc + k.close, 0) / slice20.length;

    // Volume comparison
    const avgVol = slice20.reduce((acc, k) => acc + k.quoteVolume, 0) / slice20.length;
    const currentVol = current.quoteVolume;
    let volumeStrength: TimeframeTrend['volumeStrength'] = 'NORMAL';
    if (currentVol > avgVol * 1.5) {
      volumeStrength = 'HIGH';
    } else if (currentVol < avgVol * 0.6) {
      volumeStrength = 'LOW';
    }

    // Fast RSI approximation (14-period)
    let gains = 0;
    let losses = 0;
    const period = Math.min(14, klines.length - 1);
    for (let i = klines.length - period; i < klines.length; i++) {
      const diff = klines[i].close - klines[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = losses === 0 ? 100 : gains / losses;
    const rsiApprox = Math.round(100 - 100 / (1 + rs));

    let trend: TimeframeTrend['trend'] = 'NEUTRAL';
    if (current.close > sma20 && rsiApprox > 52) {
      trend = 'BULLISH';
    } else if (current.close < sma20 && rsiApprox < 48) {
      trend = 'BEARISH';
    }

    return {
      timeframe,
      trend,
      changePercent,
      volumeStrength,
      rsiApprox,
    };
  },

  /**
   * Resilient client-side commentary fallback
   */
  generateClientFallbackCommentary(payload: any): string {
    const symbol = payload.symbol || 'BTCUSDT';
    const mode = payload.horizonMode || 'SCALP';
    const price = payload.spotPrice != null && !isNaN(Number(payload.spotPrice)) ? `$${Number(payload.spotPrice).toLocaleString()}` : 'N/A';
    const change = (payload.priceChange24h || 0) >= 0 ? `+${(payload.priceChange24h || 0).toFixed(2)}%` : `${(payload.priceChange24h || 0).toFixed(2)}%`;
    const sentimentScore = payload.sentimentScore !== undefined ? payload.sentimentScore : 50;
    const sentimentClass = payload.sentimentClass || 'NEUTRAL';
    const cvdDelta = payload.liveTickDeltaUsd !== undefined ? `$${Math.round(payload.liveTickDeltaUsd || 0).toLocaleString()}` : `$${Math.round(payload.cvdNetDeltaUsd || 0).toLocaleString()}`;
    const basis = payload.basis !== undefined ? `${payload.basis > 0 ? '+' : ''}${payload.basis.toFixed(3)}%` : '0.00%';
    const basisType = (payload.basis || 0) > 0.03 ? 'Контанго (Contango)' : (payload.basis || 0) < -0.03 ? 'Бэквордация (Backwardation)' : 'Нейтральный (Equilibrium)';
    const funding = payload.fundingRate !== undefined ? `${(payload.fundingRate * 100).toFixed(4)}%` : '0.0100%';
    const topTrader = payload.topTraderRatio ? `${parseFloat(payload.topTraderRatio).toFixed(2)}` : '1.00';
    const globalLs = payload.longShortRatio ? `${parseFloat(payload.longShortRatio).toFixed(2)}` : '1.00';
    const takerRatio = payload.takerBuySellRatio ? `${parseFloat(payload.takerBuySellRatio).toFixed(2)}` : '1.00';
    const imbalancePct = payload.orderBookImbalance !== undefined ? `${(payload.orderBookImbalance * 100).toFixed(1)}` : '0.0';

    if (mode === 'FLASH_SUMMARY') {
      const isCvdPositive = parseFloat(cvdDelta.replace(/[^0-9.-]/g, '')) >= 0;
      const bias = sentimentScore > 55 ? '🟢 БЫЧИЙ (LONG)' : sentimentScore < 45 ? '🔴 МЕДВЕЖИЙ (SHORT)' : '⚖️ НЕЙТРАЛЬНЫЙ (FLAT)';
      const dumpRisk = payload.dumpRiskScore !== undefined ? payload.dumpRiskScore : 25;

      return `### ⚡ МГНОВЕННЫЙ FLASH AI-СИНТЕЗ (1 СЕКУНДА) — ${symbol}
- **Рыночный вердикт:** **${bias}** (Сентимент: **${sentimentScore}/100** \`${sentimentClass}\`)
- **Taker CVD Дельта (Live):** **${cvdDelta}** (${isCvdPositive ? '🟢 Приток покупок' : '🔴 Давление продаж'})
- **Стакан ($ Notional):** Дисбаланс **${imbalancePct}%** | **Фандинг (8ч):** **${funding}** | **Базис:** **${basis}**
- **Dump Radar (Риск пролива):** **${dumpRisk}/100** (\`${dumpRisk > 60 ? 'ВЫСОКИЙ РИСК' : dumpRisk > 40 ? 'УМЕРЕННЫЙ' : 'НИЗКИЙ'}\`)

---

#### 🧠 Экспресс-диагностика ситуации:
1. **Ключевой фактор микроструктуры:** ${
        isCvdPositive
          ? 'Преобладают активные маркет-покупки, выкупающие ближайшие аск-уровни. Покупатели удерживают локальный моментум.'
          : 'Маркет-продавцы агрессивно бьют по лимитным заявкам покупателей, формируя нисходящее давление на стакан.'
      }
2. **Ловушки & Ликвидность:** ${
        Math.abs(parseFloat(imbalancePct)) > 10
          ? `В стакане заметен выраженный перекос ${parseFloat(imbalancePct) > 0 ? 'бид-поддержки (стенки снизу)' : 'аск-сопротивления (плотность сверху)'}.`
          : 'Книга заявок сбалансирована, цена чувствительна к крупным рыночным маркет-ордерам.'
      }
3. **🎯 Действие (Actionable Trigger):** ${
        sentimentScore > 50 && isCvdPositive
          ? 'Искать точки входа в лонг на микро-откатах к локальным бид-плотностям с коротким стопом.'
          : 'Приоритет работы от продаж при тесте локальных сопротивлений, пока CVD дельта остается отрицательной.'
      }`;
    }

    if (mode === 'SCALP') {
      const isCvdPositive = parseFloat(cvdDelta.replace(/[^0-9.-]/g, '')) >= 0;
      const isBidsDominant = parseFloat(imbalancePct) > 5;
      const isAsksDominant = parseFloat(imbalancePct) < -5;

      return `### ⚡ HFT & SCALP АНАЛИЗ (5–30 МИНУТ) — ${symbol}
- **Текущая котировка:** ${price} (${change} 24h) | **Сентимент:** **${sentimentScore}/100** (\`${sentimentClass}\`)
- **Taker CVD Дельта:** **${cvdDelta}** (${isCvdPositive ? 'Преобладание маркет-покупок' : 'Преобладание маркет-продаж'})
- **Стакан в USD:** Дисбаланс **${imbalancePct}%** (${isBidsDominant ? 'Преобладание лимитных бидов' : isAsksDominant ? 'Преобладание лимитных асков' : 'Сбалансированная книга заявок'})

---

#### ⚡ 1. Поток ордеров & Taker CVD Дельта
${isCvdPositive
  ? `В тиковом потоке фиксируется преобладание покупателей: маркет-ордера на покупку агрессивно поднимают цену. Локальный моментум направлен вверх, однако требуется отслеживать лимитное сопротивление сверху.`
  : `В тиковом потоке наблюдается доминирование маркет-продавцов: продажи бьют по бидам. Давление направлено вниз, покупатели пока не оказывают агрессивного сопротивления.`}

---

#### ⚖️ 2. Анализ стакана ликвидности ($ Notional)
${isBidsDominant
  ? `В стакане заявок наблюдается перевес лимитных бидов (+${imbalancePct}%). Крупные долларовые стенки расположены под текущей ценой, выступая подушкой безопасности и сдерживая глубокий пролив.`
  : isAsksDominant
  ? `В стакане преобладают лимитные аски (${imbalancePct}%). Долларовые стенки над текущей ценой формируют плотное сопротивление и могут гасить восходящие импульсы.`
  : `Книга заявок сбалансирована: объем на покупку и продажу распределен равномерно. Движение цены будет полностью определяться направлением рыночных Taker-ордеров.`}

---

#### 🎯 3. Тактический скальп-сетап & План действий
1. **Направление (Bias):** ${sentimentScore >= 50 && isCvdPositive ? '🟢 Лонг-импульс на откатах' : '🔴 Шорт-приоритет на тестах сопротивления'}
2. **Точка подтверждения:** Вход на продолжение импульса только при сохранении темпа притока CVD (объем не менее $50k+).
3. **Целевой диапазон:** Ближайшие пулы ликвидности и границы текущей консолидации (+0.4%–1.2%).
4. **🛑 Инвалидация (Invalidation):** Резкий разворот тикового CVD против позиции на объеме со сломом локального экстремума 5-минутной свечи.`;
    }

    if (mode === 'INTRADAY') {
      const isHighFunding = (payload.fundingRate || 0) > 0.02;
      const isNegativeFunding = (payload.fundingRate || 0) < -0.015;
      const topTraderNum = parseFloat(topTrader);

      return `### 🎯 СЕССИОННЫЙ ИНТРАДЕЙ-ПЛАН (1–8 ЧАСОВ) — ${symbol}
- **Текущая цена:** ${price} (${change} 24h) | **Сентимент:** **${sentimentScore}/100** (\`${sentimentClass}\`)
- **Funding Rate (8h):** **${funding}** | **Базис:** **${basis}** (\`${basisType}\`)
- **Позиционирование участников:** Top Traders L/S: **${topTrader}** | Global: **${globalLs}**

---

#### 🎯 1. Сессионный контекст & Структура
Текущее внутридневное движение формируется под влиянием сентимента **${sentimentScore}/100**. ${
  sentimentScore > 60
    ? 'Рынок находится в фазе бычьей экспансии: покупатели удерживают контроль над внутридневными поддержками.'
    : sentimentScore < 40
    ? 'Рынок испытывает локальное давление продаж: доминирует осторожность участников.'
    : 'Рынок находится в фазе сжатия волатильности и накопления объема в пределах дневного диапазона.'
}

---

#### 📊 2. Деривативный срез, Фандинг & Сквиз-риски
- **Ставка финансирования:** **${funding}**. ${
  isHighFunding
    ? 'Лонг-позиции перегреты: высокая плата за удержание лонгов создает предпосылки для лонг-сквиза при пробое поддержек.'
    : isNegativeFunding
    ? 'Шорты платят лонгам: перекос в шорт открывает потенциал для резкого шорт-сквиза вверх при наплыве спотовых покупок.'
    : 'Фандинг находится в нейтральном диапазоне (0.01%), риск внезапного сквиза минимален.'
}
- **Spot-Futures Basis:** **${basis}** (\`${basisType}\`). ${
  (payload.basis || 0) > 0.03
    ? 'Контанго: фьючерсы торгуются с умеренной премией к споту, что отражает оптимизм рынка.'
    : (payload.basis || 0) < -0.03
    ? 'Бэквордация: фьючерсы со скидкой к споту, свидетельство хеджирования рисков.'
    : 'Спред стабилен, аномального давления не зафиксировано.'
}

---

#### 🐋 3. Позиционирование участников (Киты vs Ритейл)
- **Top Traders L/S:** **${topTrader}** vs **Global L/S:** **${globalLs}**.
${
  topTraderNum >= 1.2
    ? `Крупные институциональные игроки (Top Traders) сместили позиционирование в пользу лонгов, в то время как ритейл более осторожен. Это дает позитивный фон для среднесрочного удержания.`
    : topTraderNum <= 0.85
    ? `Крупные игроки сокращают экспозицию или наращивают короткие позиции, что требует повышенного внимания к защитным стоп-лоссам.`
    : `Баланс сил среди крупных участников нейтрален, явного доминирования китов в одну сторону не зафиксировано.`
}

---

#### 📍 4. Торговый план на текущую сессию
1. 🟢 **Бычий триггер (Лонг):** Закрепление выше локального сессионного уровня с подтверждением притока Taker-покупок (+$50k+) и поддержкой лимитных бидов.
2. 🔴 **Медвежий триггер (Шорт):** Потеря уровня поддержки на всплеске объема продаж и истощение покупательского CVD.
3. 🛑 **Инвалидация:** Пробой противоположной границы сессионного диапазона с изменением знака кумулятивной дельты.`;
    }

    if (mode === 'SWING') {
      return `### 📈 СВИНГ-АНАЛИЗ & МАКРО-КАРТИНА (1–3 ДНЯ) — ${symbol}
- **Текущая цена:** ${price} (${change} 24h) | **Сентимент:** **${sentimentScore}/100** (\`${sentimentClass}\`)
- **Spot-Futures Basis:** **${basis}** (\`${basisType}\`) | **Funding (8h):** **${funding}**
- **Рыночный режим:** **${payload.marketRegime || 'EQUILIBRIUM'}**

---

#### 📈 1. Макро-структура & Фаза рынка
На старших таймфреймах (4H/1D) актив торгуется в режиме **${sentimentScore > 50 ? 'восходящего тренда / аккумуляции' : 'консолидации / распределения'}**. Индекс рыночного сентимента **${sentimentScore}/100** указывает на ${
  sentimentScore > 60
    ? 'уверенный бычий контроль со стороны среднесрочных инвесторов.'
    : sentimentScore < 40
    ? 'давление продавцов и необходимость подтверждения дна перед набором позиций.'
    : 'нейтральное равновесие и набор ликвидности перед следующим импульсом.'
}

---

#### 🏛️ 2. Spot-Futures Basis & Деривативная премия
- Базис составляет **${basis}** (\`${basisType}\`).
${
  (payload.basis || 0) > 0.03
    ? 'Положительный базис свидетельствует о готовности участников удерживать среднесрочные лонги с премией к спотовой цене.'
    : 'Базис находится в околонулевой зоне, свидетельствуя об отсутствии спекулятивного перегрева деривативов.'
}

---

#### 🔥 3. Карта ликвидаций & Пулы ликвидности
${
  payload.recentLiquidationsCount > 0
    ? `Зафиксированы недавние ликвидации: ${payload.recentLiquidationsCount} шт на общую сумму $${Math.round((payload.recentLiquidationsLongUsd || 0) + (payload.recentLiquidationsShortUsd || 0)).toLocaleString()}. Рынок сбросил избыточное кредитное плечо перед формированием нового движения.`
    : 'Критических каскадных ликвидаций не зафиксировано, кредитное плечо в системе распределено стабильно.'
}

---

#### 🗺️ 4. Среднесрочный стратегический план (1–3 дня)
1. **Зона набора позиций:** Работа от ключевых уровней поддержки старшего таймфрейма с обязательным подтверждением лимитной плотности.
2. **Среднесрочные цели:** Верхние границы диапазона и неснятые пулы ликвидности.
3. **🛑 Уровень отмены (Invalidation):** Закрытие 4-часовой свечи ниже критической зоны поддержки со сломом структуры тренда.`;
    }

    let crossMktSnippet = '';
    if (payload.crossMarket) {
      const cm = payload.crossMarket;
      if (cm.isMajor) {
        crossMktSnippet = `
---

### 🏛️ 6. TradFi & Cross-Exchange Matrix (США & Институционалы)
- **Спот Coinbase:** $${cm.coinbasePrice} (Премия: **${cm.coinbasePremiumPercent >= 0 ? '+' : ''}${cm.coinbasePremiumPercent}%** / \`${cm.coinbasePremiumStatus}\`)
- **Оценка притока Spot ETF:** **${cm.etfNetFlowEstimateUsdM >= 0 ? '+' : ''}$${cm.etfNetFlowEstimateUsdM}M** (\`${cm.etfSentiment}\`)
- **CME Фьючерсы:** $${cm.cmeFuturesPrice || '—'} (Базис: +${cm.cmeBasisPercent || 0.45}%)
- **Совокупный OI всех бирж:** ~$${((cm.globalAggregateOiUsd || 20000000000) / 1e9).toFixed(1)}B (Binance ~${cm.binanceOiSharePercent || 42}%)
- **Аппетит к риску:** \`${cm.tradFiRiskAppetite}\` — ${cm.macroSummary}`;
      } else {
        crossMktSnippet = `
---

### 🌐 6. Кросс-рыночная матрица & Связь с Bitcoin
- **Сектор актива:** \`${cm.altcoinSector || 'ECOSYSTEM'}\` | **Бета к BTC (β):** **${cm.altcoinBetaToBtc || 1.4}x**
- **Доминация BTC (BTC.D):** **${cm.btcDominancePercent || 58.4}%** (\`${cm.btcDominanceTrend || 'STABLE'}\`)
- **Режим монеты к BTC:** \`${cm.altcoinRegime}\`
- **Спред фандинга Bybit vs Binance:** **${cm.crossExchangeFundingDiff >= 0 ? '+' : ''}${cm.crossExchangeFundingDiff}%**
- **Вывод:** ${cm.macroSummary}`;
      }
    }

    return `### 🎯 Резюме и институциональный сентимент рынка (${symbol})
- **Текущая котировка:** ${price} (${change} за 24ч)
- **Индекс сентимента:** **${sentimentScore}/100** — \`${sentimentClass}\`
- **Taker CVD Поток:** **${cvdDelta}** (${parseFloat(cvdDelta.replace(/[^0-9.-]/g, '')) >= 0 ? 'Преобладание маркет-покупок' : 'Преобладание маркет-продаж'})
- **Order Book Imbalance (USD):** **${imbalancePct}%** (${parseFloat(imbalancePct) > 0 ? 'Преобладание лимитных бидов' : 'Преобладание лимитных асков'})
- **Spot-Futures Basis:** **${basis}** (\`${basisType}\`)
- **Ставка финансирования (8ч):** **${funding}** (${(payload.fundingRate || 0) > 0.02 ? 'Лонг-сквиз риск' : (payload.fundingRate || 0) < -0.015 ? 'Шорт-сквиз потенциал' : 'Сбалансировано'})
- **Top Traders L/S (Киты):** **${topTrader}** | **Global L/S:** **${globalLs}** | **Taker Aggression:** **${takerRatio}**

---

### ⚡ 1. Order Flow & Taker CVD Дельта
${
  parseFloat(cvdDelta.replace(/[^0-9.-]/g, '')) >= 0
    ? `Кумулятивная дельта объемов демонстрирует чистый приток маркет-покупок (**${cvdDelta}**). Агрессивные покупатели поднимают котировку, однако для устойчивого ралли требуется преодоление ближайших лимитных стенок.`
    : `Кумулятивная дельта объемов указывает на перевес маркет-продавцов (**${cvdDelta}**). Продавцы давят на бид-уровни, создавая риск коррекционного движения при слабой поддержке лимитов.`
}

---

### ⚖️ 2. Стакан ликвидности в USD ($ Notional) & Дисбаланс
- **Дисбаланс книги заявок:** **${imbalancePct}%**.
${
  parseFloat(imbalancePct) > 10
    ? 'В книге заявок зафиксирован выраженный перевес лимитных бидов. Крупные долларовые ордера под текущей ценой создают барьер против импульсных проливов.'
    : parseFloat(imbalancePct) < -10
    ? 'В стакане заявок преобладают лимитные аски. Сверху сформирована плотная стена лимитных продаж, сдерживающая восходящий импульс.'
    : 'Ликвидность в книге заявок распределена равномерно, критических перекосов объема не обнаружено.'
}

---

### 📊 3. Деривативы, Фандинг & Позиционирование китов
1. **Funding Rate & Сквиз-потенциал:** Ставка за 8ч составляет **${funding}**. ${(payload.fundingRate || 0) > 0.02 ? 'Высокая ставка финансирования указывает на перегрев лонгов и риск каскадной разгрузки.' : 'Ставка сбалансирована, угрозы внезапного сквиза нет.'}
2. **Top Traders vs Global:** Киты держат соотношение **${topTrader}** против **${globalLs}** у всех аккаунтов. ${parseFloat(topTrader) >= 1.2 ? 'Крупные институционалы сохраняют уверенный перевес в лонг.' : 'Позиционирование крупных участников нейтральное.'}

---

### ⚠️ 4. Ликвидационный фон & Риски
- **Ликвидации:** ${payload.recentLiquidationsCount > 0 ? `Зафиксировано ликвидаций: ${payload.recentLiquidationsCount} шт (Long: $${Math.round(payload.recentLiquidationsLongUsd || 0)}, Short: $${Math.round(payload.recentLiquidationsShortUsd || 0)}).` : 'Критических ликвидационных каскадов не зафиксировано, волатильность в пределах нормы.'}
${payload.dumpRiskScore !== undefined ? `- **Индекс риска пролива (Dump Radar):** ${payload.dumpRiskScore}/100 [${payload.dumpRiskLevel || 'NORMAL'}]${payload.dumpRiskTriggers && payload.dumpRiskTriggers.length > 0 ? ` — Триггеры: ${payload.dumpRiskTriggers.join(', ')}` : ''}` : ''}

---

### 🎯 5. Итоговый институциональный вердикт & Сценарии:
1. 🟢 **Бычий сценарий (Long Trigger):** Удержание текущих уровней поддержки с подтверждением притока покупателей в Taker CVD и поглощением лимитных асков. Цели: верхние границы диапазона.
2. 🔴 **Медвежий сценарий (Short Trigger):** Преобладание маркет-продаж и истощение бид-стакана.
3. 🛑 **Инвалидация:** Пробой противоположной границы диапазона на объеме со сломом микроструктуры.${crossMktSnippet}`;
  },

  /**
   * Resilient client-side tactical trade plan fallback
   */
  generateClientTacticalTradePlan(payload: any): TacticalTradePlan | null {
    const spotPrice = Number(payload.spotPrice) || 0;
    if (spotPrice <= 0) return null;

    const mode = payload.horizonMode || 'SCALP';
    const sentimentScore = payload.sentimentScore !== undefined ? payload.sentimentScore : 50;
    const imbalancePct = payload.orderBookImbalance !== undefined ? payload.orderBookImbalance * 100 : 0;
    const funding = payload.fundingRate !== undefined ? payload.fundingRate : 0.0001;
    const liveTickDelta = payload.liveTickDeltaUsd !== undefined ? payload.liveTickDeltaUsd : (payload.cvdNetDeltaUsd || 0);
    const topTrader = payload.topTraderRatio ? parseFloat(payload.topTraderRatio) : 1.0;

    let bias: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let bullishSignals = 0;
    let bearishSignals = 0;

    if (sentimentScore > 55) bullishSignals++;
    if (sentimentScore < 45) bearishSignals++;
    if (imbalancePct > 5) bullishSignals++;
    if (imbalancePct < -5) bearishSignals++;
    if (liveTickDelta > 10000) bullishSignals++;
    if (liveTickDelta < -10000) bearishSignals++;
    if (topTrader > 1.1) bullishSignals++;
    if (topTrader < 0.9) bearishSignals++;
    if (funding < -0.0001) bullishSignals++;
    if (funding > 0.00025) bearishSignals++;

    if (bullishSignals > bearishSignals) bias = 'LONG';
    else if (bearishSignals > bullishSignals) bias = 'SHORT';
    else bias = 'NEUTRAL';

    let entryOffsetPct = mode === 'SCALP' ? 0.0005 : mode === 'INTRADAY' ? 0.001 : 0.002;
    let tp1OffsetPct = mode === 'SCALP' ? 0.006 : mode === 'INTRADAY' ? 0.018 : 0.045;
    let tp2OffsetPct = mode === 'SCALP' ? 0.012 : mode === 'INTRADAY' ? 0.035 : 0.085;
    let slOffsetPct = mode === 'SCALP' ? 0.0035 : mode === 'INTRADAY' ? 0.0085 : 0.022;

    const roundP = (val: number) => {
      if (spotPrice > 1000) return Math.round(val * 10) / 10;
      if (spotPrice > 10) return Math.round(val * 100) / 100;
      return Math.round(val * 10000) / 10000;
    };

    let entry = spotPrice;
    let takeProfit1 = spotPrice;
    let takeProfit2 = spotPrice;
    let stopLoss = spotPrice;

    if (bias === 'LONG') {
      entry = roundP(spotPrice * (1 - entryOffsetPct));
      takeProfit1 = roundP(entry * (1 + tp1OffsetPct));
      takeProfit2 = roundP(entry * (1 + tp2OffsetPct));
      stopLoss = roundP(entry * (1 - slOffsetPct));
    } else if (bias === 'SHORT') {
      entry = roundP(spotPrice * (1 + entryOffsetPct));
      takeProfit1 = roundP(entry * (1 - tp1OffsetPct));
      takeProfit2 = roundP(entry * (1 - tp2OffsetPct));
      stopLoss = roundP(entry * (1 + slOffsetPct));
    } else {
      entry = roundP(spotPrice);
      takeProfit1 = roundP(entry * (1 + tp1OffsetPct));
      takeProfit2 = roundP(entry * (1 + tp2OffsetPct));
      stopLoss = roundP(entry * (1 - slOffsetPct));
    }

    const potentialGainPct = ((Math.abs(takeProfit1 - entry) / entry) * 100).toFixed(2);
    const potentialRiskPct = ((Math.abs(entry - stopLoss) / entry) * 100).toFixed(2);
    const riskRewardRatio = (parseFloat(potentialGainPct) / (parseFloat(potentialRiskPct) || 1)).toFixed(2);

    return {
      bias,
      entryPrice: entry,
      target1Price: takeProfit1,
      target2Price: takeProfit2,
      invalidationPrice: stopLoss,
      riskRewardRatio: `1:${riskRewardRatio}`,
      horizon: mode,
      rationale: `${bias === 'LONG' ? 'Бычий' : bias === 'SHORT' ? 'Медвежий' : 'Нейтральный'} сетап сформирован на базе анализа сентимента (${sentimentScore}/100), CVD потока (${liveTickDelta >= 0 ? '+' : ''}$${Math.round(liveTickDelta)}), дисбаланса стакана (${imbalancePct.toFixed(1)}%) и ставок финансирования.`,
      invalidationReason: `Пробой уровня $${stopLoss} с нарушением структуры риска и поглощением лимитных заявок.`,
      confidenceScore: Math.min(95, Math.max(50, Math.round(Math.abs(sentimentScore - 50) * 1.2 + 60))),
    };
  },

  /**
   * 5.7 SMART MONEY DIVERGENCE (Account Ratio vs Position Ratio)
   * Core Binance Agent OS analytical layer:
   * Compares Top Trader Accounts Long/Short Ratio vs Top Trader Positions Long/Short Ratio (USD volume).
   */
  calculateSmartMoneyDivergence(
    accountRatioData?: LongShortRatio[],
    positionRatioData?: TopPositionRatio[]
  ): SmartMoneyDivergence {
    const latestAcc = accountRatioData && accountRatioData.length > 0 ? accountRatioData[accountRatioData.length - 1] : null;
    const latestPos = positionRatioData && positionRatioData.length > 0 ? positionRatioData[positionRatioData.length - 1] : null;

    const accRatio = latestAcc ? parseFloat(latestAcc.longShortRatio) || 1.0 : 1.0;
    const posRatio = latestPos ? parseFloat(latestPos.longShortRatio) || 1.0 : 1.0;

    const accountLongPct = latestAcc?.longAccount ? parseFloat(latestAcc.longAccount) * 100 : (accRatio / (1 + accRatio)) * 100;
    const positionLongPct = latestPos?.longPosition ? parseFloat(latestPos.longPosition) * 100 : (posRatio / (1 + posRatio)) * 100;

    const spreadRatio = parseFloat((posRatio / (accRatio || 1)).toFixed(3));
    let divergenceType: SmartMoneyDivergence['divergenceType'] = 'NEUTRAL';
    let summary = '';
    let riskFlag: SmartMoneyDivergence['riskFlag'] = 'LOW';

    if (positionLongPct > 55 && accountLongPct < 48) {
      divergenceType = 'BULLISH_WHALE_ACCUMULATION';
      summary = 'Крупный капитал (Position Ratio) агрессивно аккумулирует лонги, пока большинство трейдеров шортят. Высокая вероятность выноса шортов вверх.';
      riskFlag = 'LOW';
    } else if (accountLongPct > 58 && positionLongPct < 46) {
      divergenceType = 'BEARISH_WHALE_HEDGING';
      summary = 'Толпа трейдеров (Account Ratio) перегружена в лонгах, но суммарный долларовый объем топ-позиций китов в шортах. Риск дистрибуции и сквиза вниз.';
      riskFlag = 'HIGH';
    } else if (accountLongPct > 55 && positionLongPct > 55) {
      divergenceType = 'ALIGNED_BULL';
      summary = 'Синхронный бычий консенсус: и количество аккаунтов, и объем позиций китов направлены в Long.';
      riskFlag = 'MEDIUM';
    } else if (accountLongPct < 45 && positionLongPct < 45) {
      divergenceType = 'ALIGNED_BEAR';
      summary = 'Синхронный медвежий консенсус: аккаунты и долларовый объем китов направлены в Short.';
      riskFlag = 'MEDIUM';
    } else {
      divergenceType = 'NEUTRAL';
      summary = 'Равновесное состояние: нет критического расхождения между числом счетов и объемом позиций.';
    }

    return {
      accountRatio: parseFloat(accRatio.toFixed(3)),
      positionRatio: parseFloat(posRatio.toFixed(3)),
      accountLongPct: parseFloat(accountLongPct.toFixed(1)),
      positionLongPct: parseFloat(positionLongPct.toFixed(1)),
      divergenceType,
      summary,
      riskFlag,
      spreadRatio,
    };
  },
};
