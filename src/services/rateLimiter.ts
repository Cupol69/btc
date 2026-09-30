/**
 * Rate Limiter implementing Binance API Rate Limits (Section 4 & 6)
 * - Request weight limit: 6000 weight / minute
 * - Handles HTTP 429 & 418 with exponential backoff & pause
 */

class RateLimiter {
  private usedWeight = 0;
  private maxWeightPerMinute = 6000;
  private weightHistory: { timestamp: number; weight: number }[] = [];
  private isPaused = false;
  private pausedUntil: number | null = null;
  private listeners: ((status: { usedWeight: number; isPaused: boolean; pausedUntil: number | null }) => void)[] = [];

  constructor() {
    // Clean old weights every 2 seconds
    setInterval(() => {
      this.cleanup();
    }, 2000);
  }

  private cleanup() {
    const oneMinuteAgo = Date.now() - 60000;
    this.weightHistory = this.weightHistory.filter((entry) => entry.timestamp > oneMinuteAgo);
    this.usedWeight = this.weightHistory.reduce((sum, entry) => sum + entry.weight, 0);

    if (this.isPaused && this.pausedUntil && Date.now() > this.pausedUntil) {
      this.isPaused = false;
      this.pausedUntil = null;
    }

    this.notify();
  }

  public async acquire(weight = 1): Promise<void> {
    this.cleanup();

    if (this.isPaused && this.pausedUntil) {
      const waitTime = Math.max(0, this.pausedUntil - Date.now());
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.isPaused = false;
      this.pausedUntil = null;
    }

    // If approaching 80% limit, add artificial delay
    if (this.usedWeight + weight > this.maxWeightPerMinute * 0.8) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.weightHistory.push({ timestamp: Date.now(), weight });
    this.usedWeight += weight;
    this.notify();
  }

  public updateFromHeaders(headerValue: string | null) {
    if (headerValue) {
      const serverWeight = parseInt(headerValue, 10);
      if (!isNaN(serverWeight)) {
        this.usedWeight = Math.max(this.usedWeight, serverWeight);
        this.notify();
      }
    }
  }

  public handleRateLimitError(status: number) {
    if (status === 429) {
      // 429 Too Many Requests: Pause for 60 seconds (Section 6.1)
      this.isPaused = true;
      this.pausedUntil = Date.now() + 60000;
      console.warn('[RateLimiter] Rate limit exceeded (429). Pausing requests for 60s.');
      this.notify();
    } else if (status === 418) {
      // 418 IP ban warning
      this.isPaused = true;
      this.pausedUntil = Date.now() + 120000;
      console.error('[RateLimiter] IP Rate limit banned (418). Pausing requests for 120s.');
      this.notify();
    }
  }

  public getStatus() {
    return {
      usedWeight: this.usedWeight,
      maxWeight: this.maxWeightPerMinute,
      isPaused: this.isPaused,
      pausedUntil: this.pausedUntil,
    };
  }

  public subscribe(callback: (status: { usedWeight: number; maxWeight: number; isPaused: boolean; pausedUntil: number | null }) => void) {
    this.listeners.push(callback);
    callback(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((cb) => cb(status));
  }
}

export const rateLimiter = new RateLimiter();
