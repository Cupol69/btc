/**
 * Binance REST API Client
 * Strictly uses endpoints from binance-analytics-docs.txt
 * Only PUBLIC Market Data - No trading, no API keys
 */

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
  TopPositionRatio,
  LiquidationDensityMap,
} from '../types';
import { rateLimiter } from './rateLimiter';

const DIRECT_SPOT_BASE = 'https://data-api.binance.vision';
const DIRECT_FUTURES_BASE = 'https://fapi.binance.com';
const PROXY_BASE = '/api/binance';

// In-memory cache for Exchange Info (Section 1.7)
let exchangeInfoCache: { timestamp: number; data: any } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function sanitizeSymbol(symbol?: string): string {
  if (!symbol) return '';
  return encodeURIComponent(symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));
}

async function fetchWithRetry<T>(
  url: string,
  proxyFallbackUrl: string,
  weight: number = 1,
  retries: number = 3
): Promise<T> {
  await rateLimiter.acquire(weight);

  let attempt = 0;
  let delay = 500; // 500ms initial delay

  // For futures endpoints, browser direct calls always face CORS/geo-restrictions, so use the proxy route directly
  const isFutures = url.includes('fapi.binance.com') || url.includes('/futures/');
  // Also for bulk/heavy endpoints like getting all tickers (/ticker/24hr with no symbol) or depth, prefer proxy directly to avoid browser CORS/timeout
  const isBulkOrUnfiltered = url.endsWith('/ticker/24hr') || url.includes('fapi') || isFutures;
  const targetUrl = (isFutures || isBulkOrUnfiltered) ? proxyFallbackUrl : url;

  while (attempt < retries) {
    try {
      let response: Response;
      let usedUrl = targetUrl;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        response = await fetch(targetUrl, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timer);

        // If direct spot API returned 400/403/404/451/5xx or HTML, try proxy fallback
        const contentType = response.headers.get('content-type') || '';
        if (
          (!response.ok || contentType.includes('text/html')) &&
          targetUrl !== proxyFallbackUrl
        ) {
          const fallbackCtrl = new AbortController();
          const fallbackTimer = setTimeout(() => fallbackCtrl.abort(), 8000);
          response = await fetch(proxyFallbackUrl, {
            headers: { 'Accept': 'application/json' },
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fallbackTimer);
          usedUrl = proxyFallbackUrl;
        }
      } catch (err) {
        if (targetUrl !== proxyFallbackUrl) {
          const fallbackCtrl = new AbortController();
          const fallbackTimer = setTimeout(() => fallbackCtrl.abort(), 8000);
          response = await fetch(proxyFallbackUrl, {
            headers: { 'Accept': 'application/json' },
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fallbackTimer);
          usedUrl = proxyFallbackUrl;
        } else {
          throw err;
        }
      }

      // Update rate limiter with server header if available
      const weightHeader = response.headers.get('x-mbx-used-weight-1m');
      rateLimiter.updateFromHeaders(weightHeader);

      if (response.status === 429 || response.status === 418) {
        rateLimiter.handleRateLimitError(response.status);
        throw new Error(`Rate limit hit: ${response.status}`);
      }

      // If client error 400/404/422 (e.g. invalid or unlisted symbol), do not retry in loop
      if (response.status === 400 || response.status === 404 || response.status === 422) {
        const text = await response.text().catch(() => '');
        throw new Error(`Symbol invalid or unlisted (${response.status}): ${text.slice(0, 100)}`);
      }

      const text = await response.text();
      const trimmed = text.trim();

      // Check if response is valid JSON (starts with { or [)
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        // If we got HTML from direct and haven't tried proxy, try proxy
        if (usedUrl !== proxyFallbackUrl) {
          const proxyRes = await fetch(proxyFallbackUrl, {
            headers: { 'Accept': 'application/json' },
          });
          const proxyText = await proxyRes.text();
          const proxyTrimmed = proxyText.trim();
          if (proxyTrimmed.startsWith('{') || proxyTrimmed.startsWith('[')) {
            return JSON.parse(proxyTrimmed);
          }
        }
        throw new Error(`Non-JSON response received from ${usedUrl}`);
      }

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${trimmed.slice(0, 100)}`);
      }

      const data = JSON.parse(trimmed);
      return data;
    } catch (error: any) {
      attempt++;
      // Fast-fail if invalid symbol error
      if (error?.message?.includes('invalid or unlisted') || error?.message?.includes('Non-JSON')) {
        throw error;
      }
      if (attempt >= retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error(`Failed to fetch ${url}`);
}

export const binanceRest = {
  // ==========================================
  // РАЗДЕЛ 1: SPOT MARKET DATA
  // ==========================================

  /**
   * 1.1 TICKER 24HR
   * Endpoint: GET /api/v3/ticker/24hr
   * Rate weight: 2 (single symbol) or 40 (all symbols)
   */
  async get24hTicker(symbol?: string): Promise<Ticker24h | Ticker24h[]> {
    if (symbol) {
      const clean = sanitizeSymbol(symbol);
      if (!clean) throw new Error('Invalid symbol');
      const direct = `${DIRECT_SPOT_BASE}/api/v3/ticker/24hr?symbol=${clean}`;
      const proxy = `${PROXY_BASE}/spot/ticker/24hr?symbol=${clean}`;
      return fetchWithRetry<Ticker24h>(direct, proxy, 2);
    } else {
      const direct = `${DIRECT_SPOT_BASE}/api/v3/ticker/24hr`;
      const proxy = `${PROXY_BASE}/spot/ticker/24hr`;
      return fetchWithRetry<Ticker24h[]>(direct, proxy, 40);
    }
  },

  /**
   * 1.2 KLINES / CANDLESTICKS
   * Endpoint: GET /api/v3/klines
   * Rate weight: 2
   */
  async getKlines(symbol: string, interval: string, limit = 100): Promise<Kline[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_SPOT_BASE}/api/v3/klines?symbol=${clean}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/spot/klines?symbol=${clean}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
    const rawData = await fetchWithRetry<any[][]>(direct, proxy, 2);

    if (!Array.isArray(rawData)) return [];

    return rawData.map((k) => ({
      time: Math.floor(k[0] / 1000), // convert to unix seconds for lightweight-charts
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      quoteVolume: parseFloat(k[7]),
      trades: k[8],
      takerBuyBaseVolume: parseFloat(k[9]),
      takerBuyQuoteVolume: parseFloat(k[10]),
    }));
  },

  /**
   * 1.3 ORDER BOOK DEPTH
   * Endpoint: GET /api/v3/depth
   * Rate weight: 5 (for limit <= 100)
   */
  async getDepth(symbol: string, limit = 50): Promise<OrderBook> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) throw new Error('Invalid symbol');
    const direct = `${DIRECT_SPOT_BASE}/api/v3/depth?symbol=${clean}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/spot/depth?symbol=${clean}&limit=${limit}`;
    const rawData = await fetchWithRetry<{ lastUpdateId: number; bids: string[][]; asks: string[][] }>(
      direct,
      proxy,
      5
    );

    let bidTotal = 0;
    const bids = (rawData?.bids || []).map(([price, qty]) => {
      const p = parseFloat(price);
      const q = parseFloat(qty);
      bidTotal += q;
      return { price: p, qty: q, total: bidTotal };
    });

    let askTotal = 0;
    const asks = (rawData?.asks || []).map(([price, qty]) => {
      const p = parseFloat(price);
      const q = parseFloat(qty);
      askTotal += q;
      return { price: p, qty: q, total: askTotal };
    });

    return {
      lastUpdateId: rawData?.lastUpdateId || 0,
      bids,
      asks,
    };
  },

  /**
   * 1.5 AGGREGATE TRADES
   * Endpoint: GET /api/v3/aggTrades
   * Rate weight: 2
   */
  async getAggTrades(symbol: string, limit = 100): Promise<any[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_SPOT_BASE}/api/v3/aggTrades?symbol=${clean}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/spot/aggTrades?symbol=${clean}&limit=${limit}`;
    return fetchWithRetry<any[]>(direct, proxy, 2);
  },

  /**
   * 1.6 AVERAGE PRICE
   * Endpoint: GET /api/v3/avgPrice
   * Rate weight: 2
   */
  async getAvgPrice(symbol: string): Promise<{ mins: number; price: string }> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) throw new Error('Invalid symbol');
    const direct = `${DIRECT_SPOT_BASE}/api/v3/avgPrice?symbol=${clean}`;
    const proxy = `${PROXY_BASE}/spot/avgPrice?symbol=${clean}`;
    return fetchWithRetry<{ mins: number; price: string }>(direct, proxy, 2);
  },

  /**
   * 1.7 EXCHANGE INFO (Cached)
   * Endpoint: GET /api/v3/exchangeInfo
   * Rate weight: 20
   */
  async getExchangeInfo(): Promise<any> {
    if (exchangeInfoCache && Date.now() - exchangeInfoCache.timestamp < CACHE_TTL_MS) {
      return exchangeInfoCache.data;
    }

    const direct = `${DIRECT_SPOT_BASE}/api/v3/exchangeInfo`;
    const proxy = `${PROXY_BASE}/spot/exchangeInfo`;
    const data = await fetchWithRetry<any>(direct, proxy, 20);
    exchangeInfoCache = { timestamp: Date.now(), data };
    return data;
  },

  // ==========================================
  // РАЗДЕЛ 2: FUTURES MARKET DATA
  // ==========================================

  /**
   * 2.1 FUNDING RATE
   * Endpoint: GET /fapi/v1/fundingRate
   * Rate weight: 1
   */
  async getFundingRateHistory(symbol: string, limit = 10): Promise<FundingRateInfo[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_FUTURES_BASE}/fapi/v1/fundingRate?symbol=${clean}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/futures/fundingRate?symbol=${clean}&limit=${limit}`;
    return fetchWithRetry<FundingRateInfo[]>(direct, proxy, 1);
  },

  /**
   * 2.2 MARK PRICE & PREMIUM INDEX
   * Endpoint: GET /fapi/v1/premiumIndex
   * Rate weight: 1
   */
  async getPremiumIndex(symbol: string): Promise<PremiumIndex> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) throw new Error('Invalid symbol');
    const direct = `${DIRECT_FUTURES_BASE}/fapi/v1/premiumIndex?symbol=${clean}`;
    const proxy = `${PROXY_BASE}/futures/premiumIndex?symbol=${clean}`;
    return fetchWithRetry<PremiumIndex>(direct, proxy, 1);
  },

  /**
   * 2.3 OPEN INTEREST
   * Endpoint: GET /fapi/v1/openInterest
   * Rate weight: 1
   */
  async getOpenInterest(symbol: string): Promise<OpenInterest> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) throw new Error('Invalid symbol');
    const direct = `${DIRECT_FUTURES_BASE}/fapi/v1/openInterest?symbol=${clean}`;
    const proxy = `${PROXY_BASE}/futures/openInterest?symbol=${clean}`;
    return fetchWithRetry<OpenInterest>(direct, proxy, 1);
  },

  /**
   * 2.4 OPEN INTEREST HISTORY
   * Endpoint: GET /futures/data/openInterestHist
   * Rate weight: 1
   */
  async getOpenInterestHist(symbol: string, period = '1h', limit = 30): Promise<OpenInterestHist[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_FUTURES_BASE}/futures/data/openInterestHist?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/futures-data/openInterestHist?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    return fetchWithRetry<OpenInterestHist[]>(direct, proxy, 1);
  },

  /**
   * 2.5 LONG/SHORT RATIO (Top Trader - Accounts Ratio)
   * Endpoint: GET /futures/data/topLongShortAccountRatio
   * Rate weight: 1
   */
  async getTopLongShortRatio(symbol: string, period = '1h', limit = 30): Promise<LongShortRatio[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_FUTURES_BASE}/futures/data/topLongShortAccountRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/futures-data/topLongShortAccountRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    return fetchWithRetry<LongShortRatio[]>(direct, proxy, 1);
  },

  /**
   * 2.5B TOP TRADER POSITION RATIO (Volume / USD Size Ratio)
   * Endpoint: GET /futures/data/topLongShortPositionRatio
   * Key for Smart Money Divergence (whales vs retail accounts)
   * Rate weight: 1
   */
  async getTopLongShortPositionRatio(symbol: string, period = '1h', limit = 30): Promise<TopPositionRatio[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_FUTURES_BASE}/futures/data/topLongShortPositionRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/futures-data/topLongShortPositionRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    return fetchWithRetry<TopPositionRatio[]>(direct, proxy, 1);
  },

  /**
   * 2.6 LONG/SHORT RATIO (All Accounts)

   * Endpoint: GET /futures/data/globalLongShortAccountRatio
   * Rate weight: 1
   */
  async getGlobalLongShortRatio(symbol: string, period = '1h', limit = 30): Promise<LongShortRatio[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_FUTURES_BASE}/futures/data/globalLongShortAccountRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/futures-data/globalLongShortAccountRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    return fetchWithRetry<LongShortRatio[]>(direct, proxy, 1);
  },

  /**
   * 2.7 TAKER BUY/SELL VOLUME RATIO
   * Endpoint: GET /futures/data/takerlongshortRatio
   * Rate weight: 1
   */
  async getTakerLongShortRatio(symbol: string, period = '1h', limit = 30): Promise<TakerLongShortRatio[]> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return [];
    const direct = `${DIRECT_FUTURES_BASE}/futures/data/takerlongshortRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    const proxy = `${PROXY_BASE}/futures-data/takerlongshortRatio?symbol=${clean}&period=${encodeURIComponent(period)}&limit=${limit}`;
    return fetchWithRetry<TakerLongShortRatio[]>(direct, proxy, 1);
  },

  /**
   * 2.8 LIQUIDATION ORDERS
   * Endpoint: GET /fapi/v1/allForceOrders
   * Rate weight: 20
   */
  async getLiquidationOrders(symbol?: string, limit = 30): Promise<LiquidationOrder[]> {
    const clean = sanitizeSymbol(symbol);
    const query = clean ? `symbol=${clean}&limit=${limit}` : `limit=${limit}`;
    const direct = `${DIRECT_FUTURES_BASE}/fapi/v1/allForceOrders?${query}`;
    const proxy = `${PROXY_BASE}/futures/allForceOrders?${query}`;
    return fetchWithRetry<LiquidationOrder[]>(direct, proxy, 20);
  },

  /**
   * Cross-Market & TradFi Intelligence
   * Fetches Coinbase spot premium, CME metrics, global CEX OI, and altcoin beta to BTC
   */
  async getCrossMarketData(symbol: string): Promise<import('../types').CrossMarketData | null> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return null;
    try {
      const res = await fetch(`/api/cross-market/${clean}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[BinanceRest] Failed to fetch cross-market data:', err);
    }
    return null;
  },

  /**
   * 2.9 LIQUIDATION DENSITY CLUSTERS & MAGNET ZONES
   * Computes high-resolution cascade price thresholds (10x-100x leverage)
   */
  async getLiquidationClusters(symbol: string): Promise<LiquidationDensityMap | null> {
    const clean = sanitizeSymbol(symbol);
    if (!clean) return null;
    try {
      const res = await fetch(`/api/binance/liquidation-clusters?symbol=${clean}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[BinanceRest] Failed to fetch liquidation clusters:', err);
    }
    return null;
  },

  /**
   * 3.0 BINANCE AGENT OS - MCP SERVER INTERACTION
   */
  async getMcpStatus(): Promise<any> {
    try {
      const res = await fetch('/api/mcp/status', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[BinanceRest] Failed to fetch MCP status:', err);
    }
    return null;
  },

  async callMcpTool(name: string, args: any = {}): Promise<any> {
    try {
      const res = await fetch('/api/mcp/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, args }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`[BinanceRest] Failed to call MCP tool ${name}:`, err);
    }
    return null;
  },
};
