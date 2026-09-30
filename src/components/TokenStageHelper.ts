import { TokenStageLevel, STAGE_DEFINITIONS } from './TokenStageDifferenceCard';
import { MemeTokenCandidate, StageHealth } from '../data/memePipelineTokens';

export interface StageFactsCalculation {
  tokenStage: TokenStageLevel;
  stageHealth: StageHealth;
  daysInStage: number;
  stageReason: string;
  healthReason: string;
  contextualSignal: string;
  invalidationCriteria: string;
  suggestedAction: string;
}

/**
 * Hard ontological facts determine the Stage (0..6).
 * Fast market signals determine the Health (HEATING | STABLE | COOLING).
 */
export function calculateTokenStageFacts(token: MemeTokenCandidate): StageFactsCalculation {
  // If explicitly preset in candidate, use it, otherwise derive from deterministic facts
  let stage: TokenStageLevel = 1;
  let days = token.daysInStage ?? 3;
  let stageReason = '';

  const liq = token.dexLiquidityUsd || 0;
  const vol = token.volume24hUsd || 0;
  const buyPct = token.buyPercent || 50;
  const priceChange = token.priceChange24h || 0;
  const priceChange1h = token.priceChange1h || 0;
  const isZeroLiq = !token.dexPoolFound || liq < 1000;

  // 1. Slow Ontological Anchor (Stage 0..6)
  if (token.tokenStage !== undefined) {
    stage = token.tokenStage;
    stageReason = token.stageReason || STAGE_DEFINITIONS[stage].nameRu;
  } else if (isZeroLiq) {
    stage = 0;
    days = 1;
    stageReason = 'Нет подтверждённого пула или нулевая ликвидность на PancakeSwap';
  } else if (
    token.symbol.toUpperCase() === '4' ||
    token.symbol.toUpperCase() === 'CAT' ||
    token.symbol.toUpperCase() === 'BNBCAT' ||
    token.category.toLowerCase().includes('binance') ||
    token.category.toLowerCase().includes('floki')
  ) {
    if (token.symbol.toUpperCase() === 'CAT' || token.symbol.toUpperCase() === 'FORM') {
      stage = 5; // Binance Spot / Futures listed ecosystem
      days = 18;
      stageReason = 'Активный листинг CEX Tier-1 (Binance Spot & Futures)';
    } else {
      stage = 4; // Binance Alpha / Web3 Wallet
      days = 7;
      stageReason = 'Инкубация в Binance Alpha / Web3 Wallet, подготовка к споту';
    }
  } else if (token.category.toLowerCase().includes('mexc') || token.passHighlight?.toLowerCase().includes('mexc')) {
    stage = 3;
    days = 4;
    stageReason = 'Подтверждённый листинг Tier-2 CEX (MEXC / Gate)';
  } else if (liq >= 150000 && vol >= 100000) {
    // Mature DEX with deep pool
    if (priceChange < -25 && vol < 30000 && buyPct < 35) {
      stage = 6;
      days = 21;
      stageReason = 'Поздняя дистрибуция / Истощение ликвидности (Exhaustion)';
    } else {
      stage = 2;
      days = 9;
      stageReason = 'Зрелый DEX: глубокий пул ($150k+), подготовка к выходу на CEX';
    }
  } else if (liq >= 10000) {
    stage = 1;
    days = 5;
    stageReason = 'Ранний импульс DEX: проверка органики против накрутки ботов';
  } else {
    stage = 0;
    days = 2;
    stageReason = 'Свежий пул DEX (< $10k TVL): высокий риск эксплойта';
  }

  // Override days if specified in candidate
  if (token.daysInStage !== undefined) {
    days = token.daysInStage;
  }

  // 2. Fast Health Metric (HEATING | STABLE | COOLING)
  // Reflects intraday volatility without altering the slow stage
  let stageHealth: StageHealth = 'STABLE';
  let healthReason = 'Нейтральный баланс спроса и предложения';

  if (priceChange1h > 3 || (priceChange > 8 && buyPct >= 52) || (vol > liq * 1.5 && buyPct > 55)) {
    stageHealth = 'HEATING';
    healthReason = `Активный разгон: 1h +${priceChange1h.toFixed(1)}%, 24h +${priceChange.toFixed(1)}%, покупатели ${buyPct.toFixed(1)}%`;
  } else if (priceChange1h < -2 || priceChange < -5 || buyPct < 45) {
    stageHealth = 'COOLING';
    healthReason = `Остывание/Откат: 1h ${priceChange1h.toFixed(1)}%, 24h ${priceChange.toFixed(1)}%, покупатели ${buyPct.toFixed(1)}%`;
  } else {
    stageHealth = 'STABLE';
    healthReason = `Консолидация внутри диапазона: баланс покупателей (${buyPct.toFixed(1)}%) и стабильный пул`;
  }

  if (token.stageHealth) {
    stageHealth = token.stageHealth;
  }

  // 3. Stage-Dependent Interpretation of Fast Signals
  let contextualSignal = '';
  let invalidationCriteria = '';
  let suggestedAction = '';

  switch (stage) {
    case 0:
      contextualSignal = 'Внимание: тонкий стакан. Любые колебания вызваны микро-ордерами.';
      invalidationCriteria = 'Удаление пула создателем (Rugpull) или honeypot 100% tax.';
      suggestedAction = 'Вход на $11 строго запрещён до фиксации ликвидности > $15k TVL.';
      break;

    case 1:
      if (stageHealth === 'HEATING') {
        contextualSignal = 'Органический запуск: приток свежих уникальных кошельков подтверждает интерес.';
      } else if (stageHealth === 'COOLING') {
        contextualSignal = 'Здоровый технический откат ранней DEX-стадии. Паники нет: стадия 1 не нарушена.';
      } else {
        contextualSignal = 'Накопление в боковике перед попыткой импульса к отметке $50k TVL.';
      }
      invalidationCriteria = 'Слив пула создателем, отток холдеров > 10% за 24h, или падение TVL ниже $10k.';
      suggestedAction = 'Тестовый ордер $11 допустим при импакте < 0.15%.';
      break;

    case 2:
      if (stageHealth === 'HEATING') {
        contextualSignal = 'Пробой диапазона: всплеск объёма тестирует готовность к листингу на CEX.';
      } else if (stageHealth === 'COOLING') {
        contextualSignal = 'Остывание после теста локального хая. Пул $150k+ поглощает продажи без паники.';
      } else {
        contextualSignal = 'Баланс объёма и ликвидности: органический торговый оборот DEX.';
      }
      invalidationCriteria = 'Продажи Top-10 EOA без встречного спроса, падение TVL ниже $80k.';
      suggestedAction = 'Оптимальная точка подбора на $11 с минимальным импактом (< 0.02%).';
      break;

    case 3:
      if (stageHealth === 'HEATING') {
        contextualSignal = 'Приток биржевого капитала с MEXC/Gate. Повышенный арбитраж между DEX и биржей.';
      } else if (stageHealth === 'COOLING') {
        contextualSignal = 'Пост-листинговая фиксация прибыли ранними инсайдерами. Стадия листинга стабильна.';
      } else {
        contextualSignal = 'Сбалансированный арбитражный коридор между PancakeSwap и стаканом CEX.';
      }
      invalidationCriteria = 'Прекращение депозитов на биржу, делистинг пары или спред DEX/CEX > 15%.';
      suggestedAction = 'Арбитражный мониторинг. Вход на $11 безопасен с точки зрения слиппеджа.';
      break;

    case 4:
      if (stageHealth === 'HEATING') {
        contextualSignal = 'Ажиотаж вокруг Binance Alpha: спекулятивный разгон под слухи спота.';
      } else if (stageHealth === 'COOLING') {
        contextualSignal = 'Сброс FOMO-ритейла. Крупные держатели продолжают удерживать позиции.';
      } else {
        contextualSignal = 'Удержание базы холдеров в Web3 Wallet перед финальным аудитом Binance.';
      }
      invalidationCriteria = 'Исключение из Binance Alpha / Web3 Trending, массовый отток с кошельков инкубатора.';
      suggestedAction = 'Позиционный трейдинг. Импакт на $11 нулевой (< 0.005%).';
      break;

    case 5:
      if (stageHealth === 'HEATING') {
        contextualSignal = 'Осторожно: разгон стакана под выход крупного институционального кита.';
      } else if (stageHealth === 'COOLING') {
        contextualSignal = 'Давление шортов на деривативах Binance Futures при стабильном спотовом спросе.';
      } else {
        contextualSignal = 'Институциональный спотовый ордерфлоу с маркетмейкингом мирового уровня.';
      }
      invalidationCriteria = 'Синхронный сброс крупнейших CEX-кошельков, закрытие фьючерсных позиций.';
      suggestedAction = 'Максимальная ликвидность, нулевой риск манипуляции объемом для ордера $11.';
      break;

    case 6:
      contextualSignal = 'ОПАСНОСТЬ: поздняя дистрибуция. Любой отскок — ловушка для ликвидности.';
      invalidationCriteria = 'Разворот тренда возможен только при вливании свежих $500k+ TVL новым фондом.';
      suggestedAction = 'Воздержаться от покупок. Высокий риск застревания в неликвиде.';
      break;
  }

  return {
    tokenStage: stage,
    stageHealth,
    daysInStage: days,
    stageReason,
    healthReason,
    contextualSignal,
    invalidationCriteria,
    suggestedAction,
  };
}
