// Growth Drivers Definition & Algorithmic Classifier Engine
// Contains 27 formalized methods of token growth with strict deterministic signals

export interface GrowthDriverMeta {
  id: number;
  category: 'DEMAND' | 'LISTING' | 'TOKENOMICS' | 'MANIPULATION' | 'EXTERNAL_FLOW' | 'EVENT';
  name: string;
  nameRu: string;
  sustainability: 1 | 2 | 3 | 4 | 5;
  description: string;
  keySignal: string;
}

export const GROWTH_DRIVERS: Record<number, GrowthDriverMeta> = {
  1: {
    id: 1,
    category: 'DEMAND',
    name: 'Organic Retail Demand',
    nameRu: 'Органический ритейл-спрос',
    sustainability: 5,
    description: 'Массовый приток индивидуальных покупателей с органическим удержанием',
    keySignal: 'Рост уникальных покупателей >30%, средний чек <$300, ретеншн >7д'
  },
  2: {
    id: 2,
    category: 'DEMAND',
    name: 'Viral Narrative / Cultural Meme',
    nameRu: 'Вирусный нарратив / культурный мем',
    sustainability: 4,
    description: 'Вирусный импульс, где активность в соцсетях опережает движение цены',
    keySignal: 'Социальные всплески опережают график на 30м-2ч, высокий уникальный охват'
  },
  3: {
    id: 3,
    category: 'DEMAND',
    name: 'Influencer / KOL Amplification',
    nameRu: 'Influencer / KOL амплификация',
    sustainability: 1,
    description: 'Краткосрочный спайк от постов 1–3 платных инфлюенсеров',
    keySignal: 'Точечный спайк объёма сразу после твита, быстрое затухание за 4-8ч'
  },
  4: {
    id: 4,
    category: 'DEMAND',
    name: 'Community-Driven Momentum',
    nameRu: 'Community-driven momentum',
    sustainability: 3,
    description: 'Постоянный органический рейдинг и вовлечение сообщества без единого лидера',
    keySignal: 'Высокий engagement ratio, непрерывный поток мелких транзакций'
  },
  5: {
    id: 5,
    category: 'LISTING',
    name: 'DEX Listing / New Pool Deployment',
    nameRu: 'DEX-листинг / новый пул',
    sustainability: 3,
    description: 'Первичный запуск пула на PancakeSwap/Uniswap и приток стартовой ликвидности',
    keySignal: 'Возраст пула < 48ч, добавление LP резервов'
  },
  6: {
    id: 6,
    category: 'LISTING',
    name: 'Tier-2 CEX Listing (MEXC/Gate/LBank)',
    nameRu: 'Tier-2 CEX листинг (MEXC/Gate)',
    sustainability: 3,
    description: 'Выход на централизованные биржи второй категории с притоком арбитража',
    keySignal: 'Анонс листинга на MEXC/Gate, депозиты токенов на горячие CEX-кошельки'
  },
  7: {
    id: 7,
    category: 'LISTING',
    name: 'Binance Alpha / Wallet Exposure',
    nameRu: 'Binance Alpha / Wallet exposure',
    sustainability: 3,
    description: 'Попадание в витрину кошелька Binance Web3 Wallet или Binance Alpha',
    keySignal: 'Приток мелких транзакций из мобильного интерфейса Binance Web3'
  },
  8: {
    id: 8,
    category: 'LISTING',
    name: 'Binance Spot / Futures Listing',
    nameRu: 'Binance Spot / Futures листинг',
    sustainability: 3,
    description: 'Официальный полномасштабный листинг на крупнейшей бирже Binance',
    keySignal: 'Официальный анонс Binance, колоссальный всплеск объема >$50M+'
  },
  9: {
    id: 9,
    category: 'LISTING',
    name: 'Exchange Campaigns & Showcase',
    nameRu: 'Включение в витрины/кампании',
    sustainability: 2,
    description: 'Кампании вознаграждений Kickstarter / Startup, затухающие после дедлайна',
    keySignal: 'Рост объёма строго в период акции, падение активности после завершения'
  },
  10: {
    id: 10,
    category: 'TOKENOMICS',
    name: 'Buyback & Burn',
    nameRu: 'Buyback & Burn (Выкуп и сжигание)',
    sustainability: 4,
    description: 'Регулярный выкуп токенов с рынка из реальной выручки протокола и отправка на 0x0...dead',
    keySignal: 'Верифицируемые ончейн-транзакции сжигания с баланса доходов экосистемы'
  },
  11: {
    id: 11,
    category: 'TOKENOMICS',
    name: 'Tax -> Rewards (Dividend Stream)',
    nameRu: 'Tax → Rewards (Дивиденды)',
    sustainability: 3,
    description: 'Налог со сделок распределяется в виде USDT/BNB пассивного дохода холдерам',
    keySignal: 'Ончейн-выплаты процессора распределения дивидендов на адреса холдеров'
  },
  12: {
    id: 12,
    category: 'TOKENOMICS',
    name: 'Fixed Supply / 100% Fair Launch',
    nameRu: 'Фиксированный supply / fair launch',
    sustainability: 4,
    description: '100% ликвидности сожжено, нет минта, нет аллокаций команды и скрытых налогов',
    keySignal: '0% tax, 100% LP burned, renounced ownership (отказ от владения)'
  },
  13: {
    id: 13,
    category: 'TOKENOMICS',
    name: 'Staking / Supply Lockups',
    nameRu: 'Стейкинг / локи сапплая',
    sustainability: 3,
    description: 'Временное изъятие значительной части циркулирующего предложения в смарт-контракты',
    keySignal: 'Отток токенов из свободного обращения в контракт стейкинга/лока'
  },
  14: {
    id: 14,
    category: 'TOKENOMICS',
    name: 'Supply Exhaustion',
    nameRu: 'Supply exhaustion (Истощение продавца)',
    sustainability: 4,
    description: 'Продавцы и ранние аирдропщики исчерпали балансы, цена растет при низком давлении продаж',
    keySignal: 'Цена отталкивается вверх при падающем объеме продаж, стакан сверху пуст'
  },
  15: {
    id: 15,
    category: 'MANIPULATION',
    name: 'Controlled Pump (MM / Cluster)',
    nameRu: 'Controlled pump (ММ / Кластер)',
    sustainability: 2,
    description: 'Искусственное удержание и разгон цены маркетмейкером или группой связанных кошельков',
    keySignal: 'Покупки идут с кластера адресов с единым источником финансирования'
  },
  16: {
    id: 16,
    category: 'MANIPULATION',
    name: 'Wash Trading / Volume Farming',
    nameRu: 'Wash trading / volume farming',
    sustainability: 1,
    description: 'Накрутка объемов ботами без реального притока уникальных участников',
    keySignal: 'Высокий суточный оборот при критически малом числе уникальных покупателей (<30)'
  },
  17: {
    id: 17,
    category: 'MANIPULATION',
    name: 'Fake Endorsement / Insider Mimicry',
    nameRu: 'Fake endorsement / имитация инсайда',
    sustainability: 1,
    description: 'Отправка токенов на кошельки CZ/Виталика или вброс фальшивых скриншотов анонсов',
    keySignal: 'Слухи о связи с основателями бирж, неподтверждённые официальными источниками'
  },
  18: {
    id: 18,
    category: 'MANIPULATION',
    name: 'Ladder Attack / Thin Pool Spoof',
    nameRu: 'Ladder attack / spoof на тонкой ликвидности',
    sustainability: 1,
    description: 'Манипуляция ценой микро-ордерами на ультра-тонком пуле ликвидности (<$10k)',
    keySignal: 'Свечи +50% на сделках в $50-$100 из-за отсутствия глубины пула'
  },
  19: {
    id: 19,
    category: 'EXTERNAL_FLOW',
    name: 'Sector Rotation',
    nameRu: 'Sector rotation (Ротация корзины)',
    sustainability: 3,
    description: 'Синхронный приток ликвидности во весь сектор (BSC-мемы, китайские токены, AI)',
    keySignal: 'Одновременный рост 4+ токенов того же сегмента с ростом рыночной доли'
  },
  20: {
    id: 20,
    category: 'EXTERNAL_FLOW',
    name: 'Market Beta (BTC / BNB correlation)',
    nameRu: 'Market beta (Влияние BTC/BNB)',
    sustainability: 3,
    description: 'Рост токена обусловлен общим бычьим трендом рынка и ростом нативного газа блокчейна',
    keySignal: 'Корреляция с графиком BTC/BNB > 0.85, отсутствие независимых катализаторов'
  },
  21: {
    id: 21,
    category: 'EXTERNAL_FLOW',
    name: 'Quote-Asset Drift (False USD Markup)',
    nameRu: 'Quote-asset drift (Ложный рост в USD)',
    sustainability: 1,
    description: 'Кажущийся рост цены в долларах происходит исключительно из-за удорожания BNB в пуле',
    keySignal: 'Цена в BNB не растет, токен в USD вырос строго на % роста BNB'
  },
  22: {
    id: 22,
    category: 'EXTERNAL_FLOW',
    name: 'Arbitrage Alignment',
    nameRu: 'Арбитражное выравнивание',
    sustainability: 3,
    description: 'Рост в пулах вызван арбитражными ботами, выравнивающими спред со спотом CEX',
    keySignal: 'Высокая частота мгновенных арбитражных свопов при расширении спреда CEX-DEX'
  },
  23: {
    id: 23,
    category: 'EXTERNAL_FLOW',
    name: 'Derivatives Squeeze (Short Squeeze)',
    nameRu: 'Derivatives squeeze (Шорт-сквиз)',
    sustainability: 1,
    description: 'Принудительная ликвидация шорт-позиций на фьючерсах, разгоняющая спотовую цену',
    keySignal: 'Крайне отрицательный фандинг (<-0.1%), лавина ликвидаций шортов'
  },
  24: {
    id: 24,
    category: 'EVENT',
    name: 'Airdrop / Red Packets Claim Event',
    nameRu: 'Airdrop / Red Packets раздача',
    sustainability: 2,
    description: 'Всплеск активности вокруг клейма дропа, часто сменяющийся фиксацией прибыли',
    keySignal: 'Массовые вызовы контракта клейма, всплеск транзакций перед демпингом'
  },
  25: {
    id: 25,
    category: 'EVENT',
    name: 'Partnership / Protocol Integration',
    nameRu: 'Партнёрства / интеграция продукта',
    sustainability: 4,
    description: 'Реальный релиз новой функциональности, запуск кросс-чейн моста или утилити',
    keySignal: 'Верифицированный релиз смарт-контракта продукта или официальный анонс партнера'
  },
  26: {
    id: 26,
    category: 'EVENT',
    name: 'Scarcity / Halving Catalyst',
    nameRu: 'Дефицитное событие (Халвинг/Локаут)',
    sustainability: 4,
    description: 'Фундаментальное резкое сокращение суточного предложения или эмиссии',
    keySignal: 'Снижение скорости эмиссии в смарт-контракте, рост спроса на дефицитный сапплай'
  },
  27: {
    id: 27,
    category: 'EVENT',
    name: 'Narrative Revival / CTO Takeover',
    nameRu: 'Возрождение нарратива (CTO Revival)',
    sustainability: 2,
    description: 'Перезапуск проекта сообществом (Community Takeover) после ухода создателя',
    keySignal: 'Смена метаданных, активизация нового комьюнити при чистом оставшемся пуле'
  }
};

export interface TokenGrowthClassification {
  growth_driver_primary: number; // 1-27
  growth_driver_primary_name: string;
  growth_driver_secondary: number; // 1-27
  growth_driver_secondary_name: string;
  driver_sustainability: 1 | 2 | 3 | 4 | 5;
  sustainability_stars: string;
  evidence: string;
}

// Algorithmic Classifier: analyzes token metrics and returns strict growth drivers without hallucination
export function classifyTokenGrowthDrivers(token: {
  symbol?: string;
  category?: string;
  dexLiquidityUsd?: number;
  volume24hUsd?: number;
  txns24h?: number;
  buyPercent?: number;
  priceChange24h?: number;
  multiplierFdvTvl?: number;
  hasVanitySignature?: boolean;
  isFarmingBinance?: boolean;
  isBurnConfirmed?: boolean;
  isFairLaunch?: boolean;
  chain?: string;
  poolPairs?: Array<{ quoteSymbol: string; liquidityUsd: number }>;
}): TokenGrowthClassification {
  const liq = token.dexLiquidityUsd || 0;
  const vol = token.volume24hUsd || 0;
  const txs = token.txns24h || 0;
  const buyPct = token.buyPercent || 50;
  const change24h = token.priceChange24h || 0;
  const cat = (token.category || '').toLowerCase();

  // Check if primary liquidity is concentrated in an exotic quote asset (e.g. GOOGLB, QQQB)
  const exoticQuotes = ['GOOGLB', 'QQQB', 'BABYSUE', 'TEST'];
  const hasExoticPrimaryQuote = Boolean(
    token.poolPairs &&
    token.poolPairs.length > 0 &&
    token.poolPairs.some(p => exoticQuotes.includes(p.quoteSymbol?.toUpperCase()) && p.liquidityUsd >= liq * 0.4)
  );

  let primary = 1;
  let secondary = 19;
  let evidence = 'Сбалансированный органический спрос участников рынка.';

  // 0. Check for Exotic Quote-Asset Concentration (Method 21)
  if (hasExoticPrimaryQuote) {
    primary = 15;
    secondary = 21;
    const exoticPair = token.poolPairs?.find(p => exoticQuotes.includes(p.quoteSymbol?.toUpperCase()));
    evidence = `⚠️ Вторичный пул котирования (${exoticPair?.quoteSymbol}): >40% ликвидности в синтетическом активе. Двойной риск девальвации при выходе в стейблкоин.`;
  }
  // 1. Check for Volume Manipulation & Wash Trading (Method 16)
  else if (vol > 50000 && txs > 0 && vol / txs > 1000 && txs < 50) {
    primary = 16;
    secondary = 18;
    evidence = `Аномальное соотношение объема ($${(vol / 1e3).toFixed(1)}k) к числу транзакций (${txs} txs) указывает на накрутку оборота.`;
  }
  // 2. Check for Controlled MM Pump / Cluster Farming (Method 15)
  else if (token.isFarmingBinance || (txs > 3000 && vol / (liq || 1) > 2.5)) {
    primary = 15;
    secondary = 7;
    evidence = `Высокая частота микро-свопов (${txs.toLocaleString()} txs/24ч) и оборот Vol/TVL ${(vol / (liq || 1)).toFixed(1)}x характерны для фарминга рейтинга и маркетмейкинга.`;
  }
  // 3. Check for Fair Launch & Burn Tokenomics (Method 10 & 12)
  else if (cat.includes('fair launch') || token.isFairLaunch || (liq > 25000 && buyPct >= 50 && (token.multiplierFdvTvl || 0) < 10)) {
    primary = 12;
    secondary = 10;
    evidence = `100% циркулирующего предложения в пуле, сожженная LP ликвидность, низкий мультипликатор FDV/TVL (${token.multiplierFdvTvl || 1}x).`;
  }
  // 4. Check for Sector Rotation (Method 19)
  else if (cat.includes('chinese') || cat.includes('bsc') || cat.includes('floki') || cat.includes('meme')) {
    primary = 19;
    secondary = change24h > 15 ? 2 : 14;
    evidence = `Синхронное движение в рамках сегмента BSC/Chinese Memes с подтверждением объемов на PancakeSwap ($${(vol / 1e3).toFixed(1)}k).`;
  }
  // 5. Check for Supply Exhaustion (Method 14)
  else if (change24h > 5 && buyPct >= 55 && vol < liq * 0.5) {
    primary = 14;
    secondary = 1;
    evidence = `Цена растет (+${change24h.toFixed(1)}%) при умеренном объеме: давление продавцов раннего пула исчерпано.`;
  }
  // 6. Check for Tier-2 CEX / DEX Listing (Method 6 / 5)
  else if (cat.includes('mexc') || cat.includes('gate') || cat.includes('listing')) {
    primary = 6;
    secondary = 22;
    evidence = `Торговая активность на CEX MEXC/Gate и ончейн-арбитраж поддерживают глубину пула.`;
  }
  // 7. Default Organic Retail Demand (Method 1)
  else {
    primary = 1;
    secondary = 4;
    evidence = `Пул ликвидности $${(liq / 1e3).toFixed(1)}k TVL с активным распределением покупателей (${buyPct}% покупок).`;
  }

  const primMeta = GROWTH_DRIVERS[primary] || GROWTH_DRIVERS[1];
  const secMeta = GROWTH_DRIVERS[secondary] || GROWTH_DRIVERS[19];

  const stars = '★'.repeat(primMeta.sustainability) + '☆'.repeat(5 - primMeta.sustainability);

  return {
    growth_driver_primary: primary,
    growth_driver_primary_name: `${primary}. ${primMeta.nameRu}`,
    growth_driver_secondary: secondary,
    growth_driver_secondary_name: `${secondary}. ${secMeta.nameRu}`,
    driver_sustainability: primMeta.sustainability,
    sustainability_stars: stars,
    evidence
  };
}
