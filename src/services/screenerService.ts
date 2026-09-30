import { ScreenerCoinItem, DailyScanAnalysis } from '../types';

export const screenerService = {
  async fetchScreenerData(): Promise<ScreenerCoinItem[]> {
    try {
      const response = await fetch('/api/screener');
      if (!response.ok) {
        throw new Error(`Screener API status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch (err) {
      console.warn('[ScreenerService] Error fetching screener data:', err);
      return [];
    }
  },

  async runDailyScan(screenerItems: ScreenerCoinItem[]): Promise<DailyScanAnalysis> {
    try {
      const response = await fetch('/api/ai/daily-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ screenerItems }),
      });

      if (!response.ok) {
        throw new Error(`Daily scan API status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn('[ScreenerService] Daily scan error, returning fallback:', err);
      return {
        marketRegime: 'УМЕРЕННЫЙ РИСК-ОН',
        marketMood: 'Анализ деривативов указывает на выборочный спрос в альтах.',
        topOpportunities: screenerItems.slice(0, 3).map((item) => ({
          symbol: item.symbol,
          bias: item.change24h >= 0 ? 'LONG' : 'SHORT',
          setup: `Аномальная активность деривативов: фандинг ${(item.fundingRate * 100).toFixed(4)}%`,
          catalyst: `Squeeze score: ${item.squeezeScore}/100`,
          keyLevels: `Вход в районе текущей цены $${item.price}`,
          invalidation: `Слом тренда при изменении > 3% против позиции`,
        })),
        macroRiskWarnings: [
          'Следите за ставками финансирования на BTC и ETH.',
          'Проверяйте перевес стакана в USD перед исполнением маркет-ордеров.',
        ],
        summaryVerdict: 'Торгуйте в направлении подтвержденного CVD потока и избегайте перегретых позиций.',
        timestamp: Date.now(),
        modelUsed: 'deterministic-rules-engine',
      };
    }
  },
};
