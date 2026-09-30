/**
 * Binance WebSocket Client for Real-Time Streams (Section 3)
 * - Spot Stream: wss://stream.binance.com:9443/ws/
 * - Futures Stream: wss://fstream.binance.com/ws/
 * - Features: Auto-reconnect, proactive heartbeat, visibilitychange recovery, exponential backoff
 */

type MessageHandler = (data: any) => void;

const SPOT_WS_SERVERS = [
  'wss://stream.binance.com:9443/ws',
  'wss://data-stream.binance.vision/ws',
  'wss://stream.binance.com:443/ws',
];

const FUTURES_WS_SERVERS = [
  'wss://fstream.binance.com/ws',
  'wss://fstream-auth.binance.com/ws',
];

class BinanceWebSocketService {
  private spotWs: WebSocket | null = null;
  private futuresWs: WebSocket | null = null;

  private spotServerIndex = 0;
  private futuresServerIndex = 0;

  private spotHandlers: Map<string, Set<MessageHandler>> = new Map();
  private futuresHandlers: Map<string, Set<MessageHandler>> = new Map();

  private isSpotConnected = false;
  private isFuturesConnected = false;

  private spotReconnectTimer: any = null;
  private futuresReconnectTimer: any = null;
  private heartbeatTimer: any = null;

  private lastSpotMessageTime = 0;
  private lastFuturesMessageTime = 0;

  private activeSpotSymbol = 'btcusdt';
  private activeInterval = '15m';
  private activeFuturesSymbol = 'btcusdt';

  private connectionListeners: ((status: { spot: boolean; futures: boolean }) => void)[] = [];

  constructor() {
    this.connectSpot();
    this.connectFutures();
    this.startHeartbeat();
    this.setupBrowserLifecycleListeners();
  }

  private setupBrowserLifecycleListeners() {
    if (typeof window !== 'undefined') {
      // When tab becomes visible again, verify connection and immediately reconnect if stale
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const now = Date.now();
          const spotStale = !this.isSpotConnected || (now - this.lastSpotMessageTime > 25000);
          const futuresStale = !this.isFuturesConnected || (now - this.lastFuturesMessageTime > 25000);

          if (spotStale) {
            this.reconnectSpot();
          }
          if (futuresStale) {
            this.reconnectFutures();
          }
        }
      });

      // When browser regains network connectivity
      window.addEventListener('online', () => {
        this.reconnectAll();
      });

      window.addEventListener('focus', () => {
        const now = Date.now();
        if (!this.isSpotConnected || (now - this.lastSpotMessageTime > 30000)) {
          this.reconnectSpot();
        }
      });
    }
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      // If connected but no message received for > 30s, socket is likely dead/zombie -> reconnect
      if (this.isSpotConnected && this.lastSpotMessageTime > 0 && now - this.lastSpotMessageTime > 30000) {
        console.warn('[BinanceWS] Spot WS heartbeat timeout, refreshing connection...');
        this.reconnectSpot();
      }
      if (this.isFuturesConnected && this.lastFuturesMessageTime > 0 && now - this.lastFuturesMessageTime > 30000) {
        this.reconnectFutures();
      }
    }, 10000);
  }

  public setSymbol(symbol: string, interval: string = '15m') {
    const lower = symbol.toLowerCase();
    if (this.activeSpotSymbol !== lower || this.activeInterval !== interval) {
      this.activeSpotSymbol = lower;
      this.activeInterval = interval;
      this.activeFuturesSymbol = lower;
      this.reconnectAll();
    }
  }

  public setInterval(interval: string) {
    if (this.activeInterval !== interval) {
      this.activeInterval = interval;
      this.reconnectSpot();
    }
  }

  public reconnectNow() {
    this.reconnectAll();
  }

  public reconnectAll() {
    this.reconnectSpot();
    this.reconnectFutures();
  }

  private reconnectSpot() {
    if (this.spotWs) {
      try {
        this.spotWs.onclose = null;
        this.spotWs.onerror = null;
        this.spotWs.close();
      } catch {}
      this.spotWs = null;
    }
    clearTimeout(this.spotReconnectTimer);
    this.isSpotConnected = false;
    this.notifyStatus();
    this.connectSpot();
  }

  private reconnectFutures() {
    if (this.futuresWs) {
      try {
        this.futuresWs.onclose = null;
        this.futuresWs.onerror = null;
        this.futuresWs.close();
      } catch {}
      this.futuresWs = null;
    }
    clearTimeout(this.futuresReconnectTimer);
    this.isFuturesConnected = false;
    this.notifyStatus();
    this.connectFutures();
  }

  private connectSpot() {
    try {
      const streams = [
        `${this.activeSpotSymbol}@ticker`,
        `${this.activeSpotSymbol}@kline_${this.activeInterval}`,
        `${this.activeSpotSymbol}@depth20@100ms`,
        `${this.activeSpotSymbol}@aggTrade`,
      ].join('/');

      const baseServer = SPOT_WS_SERVERS[this.spotServerIndex % SPOT_WS_SERVERS.length];
      const url = `${baseServer}/${streams}`;
      this.spotWs = new WebSocket(url);

      this.spotWs.onopen = () => {
        this.isSpotConnected = true;
        this.lastSpotMessageTime = Date.now();
        this.notifyStatus();
      };

      this.spotWs.onmessage = (event) => {
        this.lastSpotMessageTime = Date.now();
        if (!this.isSpotConnected) {
          this.isSpotConnected = true;
          this.notifyStatus();
        }
        try {
          const data = JSON.parse(event.data);
          const eventType = data.e;

          if (eventType) {
            const handlers = this.spotHandlers.get(eventType);
            if (handlers) {
              handlers.forEach((h) => h(data));
            }
          }

          if (data.bids && data.asks) {
            const depthHandlers = this.spotHandlers.get('depth');
            if (depthHandlers) {
              depthHandlers.forEach((h) => h(data));
            }
          }
        } catch {}
      };

      this.spotWs.onclose = () => {
        this.isSpotConnected = false;
        this.notifyStatus();
        this.spotServerIndex++;
        clearTimeout(this.spotReconnectTimer);
        this.spotReconnectTimer = setTimeout(() => this.connectSpot(), 1500);
      };

      this.spotWs.onerror = () => {
        if (this.spotWs) {
          try {
            this.spotWs.close();
          } catch {}
        }
      };
    } catch {
      this.spotServerIndex++;
      clearTimeout(this.spotReconnectTimer);
      this.spotReconnectTimer = setTimeout(() => this.connectSpot(), 2000);
    }
  }

  private connectFutures() {
    try {
      const streams = [
        `${this.activeFuturesSymbol}@markPrice@1s`,
        `${this.activeFuturesSymbol}@forceOrder`,
        `!forceOrder@arr`,
      ].join('/');

      const baseServer = FUTURES_WS_SERVERS[this.futuresServerIndex % FUTURES_WS_SERVERS.length];
      const url = `${baseServer}/${streams}`;
      this.futuresWs = new WebSocket(url);

      this.futuresWs.onopen = () => {
        this.isFuturesConnected = true;
        this.lastFuturesMessageTime = Date.now();
        this.notifyStatus();
      };

      this.futuresWs.onmessage = (event) => {
        this.lastFuturesMessageTime = Date.now();
        if (!this.isFuturesConnected) {
          this.isFuturesConnected = true;
          this.notifyStatus();
        }
        try {
          const data = JSON.parse(event.data);
          const eventType = data.e;

          if (eventType) {
            const handlers = this.futuresHandlers.get(eventType);
            if (handlers) {
              handlers.forEach((h) => h(data));
            }
          }
        } catch {}
      };

      this.futuresWs.onclose = () => {
        this.isFuturesConnected = false;
        this.notifyStatus();
        this.futuresServerIndex++;
        clearTimeout(this.futuresReconnectTimer);
        this.futuresReconnectTimer = setTimeout(() => this.connectFutures(), 2000);
      };

      this.futuresWs.onerror = () => {
        if (this.futuresWs) {
          try {
            this.futuresWs.close();
          } catch {}
        }
      };
    } catch {
      this.futuresServerIndex++;
      clearTimeout(this.futuresReconnectTimer);
      this.futuresReconnectTimer = setTimeout(() => this.connectFutures(), 3000);
    }
  }

  public onSpotEvent(event: '24hrTicker' | 'kline' | 'depth' | 'aggTrade', handler: MessageHandler) {
    if (!this.spotHandlers.has(event)) {
      this.spotHandlers.set(event, new Set());
    }
    this.spotHandlers.get(event)!.add(handler);

    return () => {
      this.spotHandlers.get(event)?.delete(handler);
    };
  }

  public onFuturesEvent(event: 'markPriceUpdate' | 'forceOrder', handler: MessageHandler) {
    if (!this.futuresHandlers.has(event)) {
      this.futuresHandlers.set(event, new Set());
    }
    this.futuresHandlers.get(event)!.add(handler);

    return () => {
      this.futuresHandlers.get(event)?.delete(handler);
    };
  }

  public onConnectionChange(listener: (status: { spot: boolean; futures: boolean }) => void) {
    this.connectionListeners.push(listener);
    listener({ spot: this.isSpotConnected, futures: this.isFuturesConnected });
    return () => {
      this.connectionListeners = this.connectionListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus() {
    const status = { spot: this.isSpotConnected, futures: this.isFuturesConnected };
    this.connectionListeners.forEach((l) => l(status));
  }
}

export const binanceWs = new BinanceWebSocketService();
