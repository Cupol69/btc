export interface Ticker24h {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  bidPrice: string;
  askPrice: string;
  weightedAvgPrice?: string;
  count?: number;
}

export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
}

export interface OrderBookEntry {
  price: number;
  qty: number;
  notionalUsd?: number;
  total?: number;
}

export interface OrderBook {
  lastUpdateId: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface FundingRateInfo {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  markPrice?: string;
}

export interface PremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  interestRate: string;
  nextFundingTime: number;
}

export interface OpenInterest {
  symbol: string;
  openInterest: string;
  time: number;
}

export interface OpenInterestHist {
  symbol: string;
  sumOpenInterest: string;
  sumOpenInterestValue: string;
  timestamp: string | number;
}

export interface LongShortRatio {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: string | number;
}

export interface TakerLongShortRatio {
  buySellRatio: string;
  buyVol: string;
  sellVol: string;
  timestamp: string | number;
}

export interface LiquidationOrder {
  symbol: string;
  price: string;
  origQty: string;
  executedQty: string;
  averagePrice: string;
  status: string;
  timeInForce: string;
  type: string;
  side: 'BUY' | 'SELL'; // BUY liquidation = Short liquidated, SELL liquidation = Long liquidated
  time: number;
}

export interface SentimentAnalysis {
  compositeScore: number; // -100 to +100
  classification: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED';
  fundingScore: number;
  longShortScore: number;
  oiScore: number;
  takerScore: number;
  description: string;
  mode?: 'FUTURES' | 'SPOT';
  rawOiChangePercent?: number;
  spotMetrics?: {
    imbalanceScore: number;
    cvdScore: number;
    momentumScore: number;
    rawImbalancePct: number;
    rawBuyerDominancePct: number;
    rawPriceChangePct: number;
  };
}

export interface OrderBookImbalance {
  imbalance: number; // -1 to +1
  bidVolume: number;
  askVolume: number;
  totalBidNotionalUsd: number; // Total USD $ bids
  totalAskNotionalUsd: number; // Total USD $ asks
  dominantSide: 'BUYERS' | 'SELLERS' | 'BALANCED';
}

export interface SpotFuturesBasis {
  spotPrice: number;
  futuresPrice: number;
  indexPrice: number;
  basis: number; // in %
  annualizedAPR: number; // in %
  structure: 'CONTANGO' | 'BACKWARDATION' | 'NEUTRAL';
}

export interface TimeframeTrend {
  timeframe: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  changePercent: number;
  volumeStrength: 'HIGH' | 'NORMAL' | 'LOW';
  rsiApprox: number;
}

export interface CVDPoint {
  time: number;
  price: number;
  takerBuyUsd: number;
  takerSellUsd: number;
  deltaUsd: number;
  cvdUsd: number;
}

export interface TickTrade {
  id: number;
  price: number;
  qty: number;
  quoteQty: number;
  time: number;
  isBuyerMaker: boolean; // true = Market Sell (taker sell), false = Market Buy (taker buy)
}

export interface TickCvdPoint {
  time: number;
  price: number;
  tradeDeltaUsd: number;
  cumulativeUsd: number;
  side: 'BUY' | 'SELL';
  sizeUsd: number;
}

export interface CVDData {
  points: CVDPoint[];
  netDeltaUsd: number;
  buyerDominancePercent: number;
  trend: 'BULLISH_FLOW' | 'BEARISH_FLOW' | 'ABSORPTION' | 'NEUTRAL';
  liveTickPoints?: TickCvdPoint[];
  liveTickDeltaUsd?: number;
  liveTradesCount?: number;
  liveBuyVolumeUsd?: number;
  liveSellVolumeUsd?: number;
}

export interface MarketAnomaly {
  id: string;
  type: 'LIQUIDATION_SPIKE' | 'OI_SURGE' | 'EXTREME_FUNDING' | 'ORDERBOOK_WALL' | 'BASIS_DIVERGENCE' | 'FLASH_DUMP_RISK';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  value: string;
  timestamp: number;
}

export type DumpRiskLevel = 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface DumpRiskAssessment {
  score: number; // 0 to 100
  level: DumpRiskLevel;
  triggers: string[];
  description: string;
  advice: string;
  metrics: {
    imbalancePct: number;
    takerDeltaUsd: number;
    longLiquidationUsd: number;
    fundingRatePct: number;
    isTopTradersBearish: boolean;
    isMultiTfBearish: boolean;
  };
}

export type MarketRegime =
  | 'ACCUMULATION_DIP_BUYING'
  | 'OVERHEATED_LONG_SQUEEZE'
  | 'SHORT_SQUEEZE_SETUP'
  | 'DISTRIBUTION_SELLING'
  | 'RANGE_CHOP_EQUILIBRIUM'
  | 'VOLATILITY_EXPANSION';

export type AnalysisHorizonMode = 'FLASH_SUMMARY' | 'SCALP' | 'INTRADAY' | 'SWING' | 'FULL';

export interface TacticalTradePlan {
  bias: 'LONG' | 'SHORT' | 'NEUTRAL';
  entryPrice: number;
  target1Price: number;
  target2Price?: number;
  invalidationPrice: number;
  riskRewardRatio: string;
  horizon: AnalysisHorizonMode;
  rationale: string;
  invalidationReason: string;
  confidenceScore?: number; // 0 - 100
}

export interface AICommentaryPayload {
  symbol: string;
  spotPrice: number;
  priceChange24h: number;
  volume24h: number;
  fundingRate: number;
  nextFundingInMinutes: number;
  basis: number;
  sentimentScore: number;
  sentimentClass: string;
  orderBookImbalance: number;
  longShortRatio: number;
  topTraderRatio: number;
  takerBuySellRatio: number;
  recentLiquidationsCount: number;
  recentLiquidationsLongUsd: number;
  recentLiquidationsShortUsd: number;
  cvdNetDeltaUsd?: number;
  liveTickDeltaUsd?: number;
  liveTradesCount?: number;
  liveBuyVolumeUsd?: number;
  liveSellVolumeUsd?: number;
  anomalies?: string[];
  marketRegime?: MarketRegime;
  dumpRiskScore?: number;
  dumpRiskLevel?: string;
  dumpRiskTriggers?: string[];
  trends: Record<string, string>;
  userQuery?: string;
  horizonMode?: AnalysisHorizonMode;
  crossMarket?: CrossMarketData;
  marketTimingContext?: {
    minutesToFunding: number;
    hoursToFridayDeribitExpiry: number;
    nyseSessionState: 'OPEN' | 'CLOSED' | 'PRE_MARKET';
    minutesToNyseEvent: number;
    minutesToDailyClose: number;
  };
}

export interface EtfDailyRecord {
  date: string; // e.g. "2026-09-21" or "21 Сен"
  dayOfWeek: string; // "Пн", "Вт", "Ср", "Чт", "Пт"
  totalNetFlowUsdM: number;
  ibit: number; // BlackRock
  fbtc: number; // Fidelity
  gbtc: number; // Grayscale GBTC
  miniBtc?: number; // Grayscale BTC Mini
  arkb: number; // Ark Invest / 21Shares
  bitb: number; // Bitwise
  others: number; // Invesco, VanEck, Valkyrie, etc.
  btcPriceAtClose?: number;
  status: 'CONFIRMED' | 'PARTIAL' | 'PENDING';
  notes?: string;
}

export interface CrossMarketData {
  symbol: string;
  isMajor: boolean; // true for BTC / ETH / SOL
  timestamp: number;
  
  // 1. Coinbase & US Institutional Spot
  coinbasePrice: number;
  binanceSpotPrice: number;
  coinbasePremiumUsd: number; // Difference in $
  coinbasePremiumPercent: number; // Difference in %
  coinbasePremiumStatus: 'STRONG_US_BUYING' | 'MILD_PREMIUM' | 'NEUTRAL' | 'US_DISCOUNT_SELLING';
  
  // 2. CME & TradFi Metrics
  cmeFuturesPrice?: number;
  cmeBasisPercent?: number;
  cmeWeekendGap?: {
    hasGap: boolean;
    gapPrice: number;
    gapDistancePct: number;
    gapType: 'UP_GAP' | 'DOWN_GAP' | 'NONE';
    fridayClosePrice?: number;
    currentSpotPrice?: number;
    cmeSessionSchedule?: string;
  };
  etfNetFlowEstimateUsdM: number; // e.g. -$462.7M estimated ETF flow
  etfSentiment: 'STRONG_INFLOW' | 'MODERATE_INFLOW' | 'NEUTRAL' | 'OUTFLOW' | 'CRITICAL_DUMP';
  
  // Institutional Multi-Period Spot ETF Analytics (Official Fact & Sensor)
  etfMultiPeriod?: {
    flow1dUsdM: number; // Single-day latest official report
    flow4dUsdM: number; // Cumulative current week total
    flow7dUsdM: number; // Cumulative 7-day rolling total
    flow14dUsdM?: number; // Cumulative 14-day rolling total
    flow30dUsdM: number; // Cumulative 30-day total
    streakDays: number; // e.g. -4 for 4 consecutive days of outflow or +2
    streakType: 'OUTFLOW_STREAK' | 'INFLOW_STREAK' | 'NEUTRAL';
    officialReportDate: string; // e.g. "21 Сентября (Пн)"
    dateRangeLabel?: string; // Dynamic rolling label e.g. "21–22 сент."
    institutionalRegime: 'CRITICAL_DUMP' | 'DISTRIBUTION' | 'NEUTRAL' | 'ACCUMULATION' | 'AGGRESSIVE_BUYING';
    topFundsBreakdown: {
      ibitBlackrockUsdM: number;
      fbtcFidelityUsdM: number;
      gbtcGrayscaleUsdM: number;
      bitbBitwiseUsdM: number;
      othersUsdM: number;
    };
    impactAnalysis: {
      estimatedBtcSoldTokens: number;
      marketPressureStatus: string;
      warningAlert?: string;
    };
  };
  etfDailyHistory?: EtfDailyRecord[];
  
  // 3. Multi-CEX & Derivatives Global Aggregation
  bybitFundingRate: number;
  bybitPrice: number;
  crossExchangeFundingDiff: number; // Binance vs Bybit funding rate diff
  globalAggregateOiUsd: number; // Total estimated OI across Binance + Bybit + OKX + Deribit
  binanceOiSharePercent: number; // e.g. ~42%
  
  // 4. Altcoin Specific Intelligence (when viewing Altcoins)
  altcoinBetaToBtc?: number; // e.g. 1.85
  altcoinSector?: string;
  btcDominancePercent: number; // e.g. 58.2%
  btcDominanceTrend: 'RISING' | 'FALLING' | 'STABLE';
  altcoinRegime: 'OUTPERFORMING_BTC' | 'UNDERPERFORMING_BTC' | 'CORRELATED' | 'ALT_SEASON_ROTATION';
  tradFiRiskAppetite: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';
  macroSummary: string;
}

export interface RateLimitStatus {
  usedWeight1m: number;
  maxWeight1m: number;
  requestCount5m: number;
  isPaused: boolean;
  pausedUntil: number | null;
}

export type ScreenerSignal =
  | 'LONG_SQUEEZE'
  | 'SHORT_SQUEEZE'
  | 'CVD_DIVERGENCE'
  | 'VOLATILITY_SURGE'
  | 'FUNDING_SPIKE'
  | 'ACCUMULATION'
  | 'ORDERBOOK_WALL';

export interface ScreenerCoinItem {
  symbol: string;
  baseAsset: string;
  price: number;
  change24h: number;
  volume24hUsd: number;
  fundingRate: number; // e.g. 0.0001
  basisPct: number; // e.g. +0.03%
  imbalancePct: number; // e.g. +14.2%
  cvdDeltaUsd: number; // e.g. +1250000
  signals: ScreenerSignal[];
  squeezeScore: number; // 0 to 100
  volatility24h: number; // High - Low / Low %
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  highlights: string;
}

export interface DailyScanAnalysis {
  marketRegime: string;
  marketMood: string;
  topOpportunities: {
    symbol: string;
    bias: 'LONG' | 'SHORT' | 'BREAKOUT';
    setup: string;
    catalyst: string;
    keyLevels: string;
    invalidation: string;
  }[];
  macroRiskWarnings: string[];
  summaryVerdict: string;
  timestamp: number;
  modelUsed?: string;
}

// DEX & Multi-Chain On-Chain Types
export interface DexPoolItem {
  chainId: string;
  dexId: string;
  pairAddress: string;
  url: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: number;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidityUsd: number;
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  pairSymbol?: string;
  volume24hUsd?: number;
  feeTierPercent?: number;
  explorerUrls: {
    tokenExplorer: string;
    pairExplorer: string;
    bubblemapsUrl: string;
    dexToolsUrl: string;
  };
}

export interface ChainSummary {
  chain: string;
  liquidityUsd: number;
  volume24h: number;
  poolCount: number;
  liquiditySharePercent: number;
}

export interface BinanceAlphaMetrics {
  high24h: number;
  low24h: number;
  volume24h: number;
  txns24h: number;
  mktCap: number;
  fdv: number;
  chainHolders: number;
  chainLq: number;
  tokenTags: string[];
  alphaDataSource: 'On-Chain + Limit' | 'Binance Web3 Hybrid' | 'DEX Native';
}

export interface DexOnChainData {
  symbol: string;
  name?: string;
  tokenName?: string;
  timestamp: number;
  binanceSpotPrice: number;
  primaryDexPrice: number;
  primaryDexName?: string;
  arbitrageSpreadUsd: number;
  arbitrageSpreadPercent: number;
  arbitrageStatus: 'DEX_PREMIUM' | 'DEX_DISCOUNT' | 'PARITY';
  totalDexLiquidityUsd: number;
  totalDexVolume24h: number;
  totalBuys24h: number;
  totalSells24h: number;
  buyPressurePercent24h: number;
  totalBuys1h: number;
  totalSells1h: number;
  buyPressurePercent1h: number;
  chainsSummary: ChainSummary[];
  topPools: DexPoolItem[];
  pools?: DexPoolItem[];
  primaryContractAddress: string;
  primaryChain: string;
  primaryPairAddress?: string;
  compositeScore?: number;
  compositeRating?: 'STRONG_ACCUMULATION' | 'HEALTHY_EXPANSION' | 'NEUTRAL_RANGING' | 'DISTRIBUTION_RISK' | 'HIGH_DANGER';
  compositePillars?: {
    liquidityDepth: number;
    volumeVelocity: number;
    netWhaleFlow: number;
    contractIntegrity: number;
  };
  binanceAlpha?: BinanceAlphaMetrics;
  mktCap?: number;
  marketCap?: number;
  fdv?: number;
  security?: DexSecurityAudit;
  cexDexSpreadPct?: number;
  netWhaleFlowUsd?: number;
  liquidityLevels?: DexLiquidityLevelsData;
  syndicateForensics?: DexSyndicateForensics;
  whaleOutflowRadar?: DexWhaleOutflowRadarData;
  recentWhaleSwaps?: DexWhaleSwap[];
}

export interface DexLiquidityLevel {
  id: string;
  label: string;
  type: 'RESISTANCE_EXTREME' | 'RESISTANCE_MAJOR' | 'RESISTANCE_LOCAL' | 'CURRENT_PRICE' | 'SUPPORT_LOCAL' | 'SUPPORT_MAJOR' | 'SUPPORT_FLOOR';
  price: number;
  distancePct: number;
  estSellPressureUsd?: number;
  estBuyVolumeNeededUsd?: number;
  description: string;
  whaleAction: 'TAKE_PROFIT_HEAVY' | 'TAKE_PROFIT_SCALE' | 'DEFENSE_ACCUMULATION' | 'PANIC_DUMP_CASCADE' | 'PIVOT_ZONE';
  riskRating: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NEUTRAL';
}

export interface DexAmmSpikeTarget {
  targetPrice: number;
  spikePotentialPct: number;
  requiredBuyFlowUsd: number;
  spikeCeilingPrice: number;
  recommendedLimitTakeProfit: number;
  estimatedDuration: string;
  probabilityRating: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  tacticalPlaybook: string;
  triggerCondition: string;
  fomoTrapWarning: string;
}

export interface DexLiquidityLevelsData {
  symbol: string;
  currentPrice: number;
  primaryDexName: string;
  primaryChain: string;
  poolLiquidityUsd: number;
  whaleCostBasisEst: number;
  syndicatePhase: 'ACCUMULATION' | 'MARKUP_PUMP' | 'DISTRIBUTION_PEAK' | 'COOLOFF_DUMP';
  slippage5PctSellUsd: number;
  slippage10PctSellUsd: number;
  slippage25PctSellUsd: number;
  levels: DexLiquidityLevel[];
  ammSpikeTarget?: DexAmmSpikeTarget;
  tacticalPlan: {
    recommendedTakeProfit1: number;
    recommendedTakeProfit2: number;
    recommendedTakeProfit3: number;
    recommendedStopLoss: number;
    riskRewardRatio: string;
    actionVerdict: string;
  };
}

export interface SyndicateForensicInsight {
  title: string;
  verdict: string;
  category: 'POOL_DISTRIBUTION' | 'VANITY_SYNDICATE' | 'BINANCE_FARMING' | 'WASH_FLOW' | 'SAFETY_INTEGRITY';
  severity: 'INFO' | 'WARNING' | 'ALERT' | 'POSITIVE';
  details: string;
}

export interface DexSyndicateForensics {
  hasVanitySignature: boolean;
  vanityPattern?: string;
  isMultiPoolHiddenLiquidity: boolean;
  emptyStandardPoolWarning?: string;
  realLiquidityQuoteTokens: string[];
  totalVolumeToLiquidityRatio: number;
  farmingBinanceListingStatus: 'ACTIVE_FARMING' | 'ORGANIC_TRADING' | 'DORMANT';
  relatedTokensOrBridges: string[];
  insights: SyndicateForensicInsight[];
  summaryConclusion: string;
}

export type WhaleActionType =
  | 'DEX_SELL_DUMP'
  | 'INTERNAL_SHUFFLE'
  | 'DEX_BUY_ACCUMULATE'
  | 'CEX_DEPOSIT'
  | 'LP_LIQUIDITY_ADD'
  | 'LP_LIQUIDITY_REMOVE';

export interface WhaleTransferTx {
  id: string;
  txHash: string;
  timestamp: number;
  fromAddress: string;
  fromLabel: string;
  toAddress: string;
  toLabel: string;
  actionType: WhaleActionType;
  amountUsd: number;
  amountTokens: number;
  priceImpactPct: number;
  poolReserveImpactPct: number;
  methodName: string;
  classificationExplanation: string;
  riskBadge: 'CRITICAL_DUMP' | 'INTERNAL_TRANSFER' | 'BULLISH_BUY' | 'CEX_PRESSURE' | 'LP_CHANGE';
}

export interface DexBinanceFuturesIntel {
  pair: string;
  isFuturesListed: boolean;
  fundingRatePct: number;
  fundingInterval: string;
  nextFundingCountdown: string;
  annualizedFundingPct: number;
  sentiment: 'EXTREME_LONG_HEAVY' | 'LONG_HEAVY' | 'NEUTRAL' | 'SHORT_HEAVY';
  tacticalExplanation: string;
}

export interface DexWhaleOutflowRadarData {
  symbol: string;
  timestamp: number;
  top10HoldingPct: number;
  directDexDumpUsd24h: number;
  directDexDumpTxCount24h: number;
  internalShuffleUsd24h: number;
  internalShuffleTxCount24h: number;
  cexDepositTxCount24h?: number;
  cexDepositUsd24h: number;
  lpWithdrawUsd24h: number;
  lpLockedPct: number;
  poolUsdReserveCapacity: number;
  maxPotentialDumpImpact10Pct: number;
  dumpRiskStatus: 'SAFE_HOLDING' | 'INTERNAL_SHUFFLE_ALERT' | 'ACTIVE_DEX_DUMP' | 'CEX_INFLOW_PRESSURE';
  dumpRiskTitle: string;
  dumpRiskVerdictText: string;
  syndicateClusterConfidencePct: number;
  actionableGuidance: string;
  binanceFuturesIntel?: DexBinanceFuturesIntel;
  transactions: WhaleTransferTx[];
}

export interface DexAiAnalysis {
  analysisText: string;
  healthScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  actionableVerdict: string;
  memeStage?: 'EARLY_ACCUMULATION' | 'VIRAL_EXPANSION' | 'OVERHEATED_FOMO' | 'DISTRIBUTION' | 'LIQUIDITY_TRAP';
  memeStageLabel?: string;
  volumeToMcapRatio?: number;
  liqToMcapRatio?: number;
  mcapFdvRatio?: number;
  slippageExitRisk?: 'MINIMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  keyFindings?: string[];
  tacticalPlan?: {
    action: string;
    entryZone: string;
    stopLoss: string;
    tp1: string;
    tp2: string;
    maxRecommendedSize: string;
  };
  liquidityLevelsPlan?: DexLiquidityLevelsData;
  syndicateForensics?: DexSyndicateForensics;
  whaleOutflowRadar?: DexWhaleOutflowRadarData;
}

export interface DexSecurityAudit {
  isContract: boolean;
  address: string;
  chain: string;
  tokenName?: string;
  tokenSymbol?: string;
  securityScore: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER';
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  isMintable: boolean;
  isBlacklisted: boolean;
  isOwnerRenounced: boolean;
  isOpenSource: boolean;
  isProxy: boolean;
  creatorAddress?: string;
  ownerAddress?: string;
  holderCount?: number | null;
  lpLockedPercent: number;
  riskIssues: string[];
  positiveBadges: string[];
  timestamp?: number;
}

export interface DexWhaleSwap {
  id: string;
  txHash: string;
  timestamp: number;
  type: 'BUY' | 'SELL';
  amountUsd: number;
  tokenAmount: number;
  priceUsd: number;
  walletAddress: string;
  walletLabel: string;
  category: 'WHALE' | 'SMART_MONEY' | 'RETAIL';
  chainId: string;
}

// ==========================================
// TWITTER & SOCIAL ALPHA RADAR TYPES
// ==========================================

export interface TwitterDetectedToken {
  symbol: string;
  name?: string;
  contractAddress?: string;
  chain?: 'bsc' | 'solana' | 'ethereum' | 'base' | string;
  confidencePct: number;
  role: 'PRIMARY' | 'MENTIONED' | 'METAPHOR';
  dexUrl?: string;
}

export interface TwitterMemeLore {
  originStory: string;
  narrativeCategory: string;
  originalAuthorOrMeme: string;
  isDerivativeOrCopycat: boolean;
  originalCanonicalToken?: string;
  warningAgainstClones?: string;
}

export interface TwitterBotForensics {
  botActivityScore: number; // 0 - 100 (100 = 100% fake bot spam)
  botRiskLevel: 'ORGANIC' | 'SUSPICIOUS' | 'BOT_FARM_MANIPULATION';
  fakeEngagementSignals: string[];
  shillRingPatternDetected: boolean;
  explanation: string;
  estimatedRealAudiencePct: number;
}

export interface TwitterAlphaRating {
  alphaScore: number; // 0 - 100
  catalystImpact: 'HIGH_CATALYST' | 'MODERATE' | 'LOW' | 'TRAP_HONEYPOT';
  timeHorizon: 'IMMEDIATE_15M' | 'HOURS_1_4H' | 'DAYS' | 'NONE';
  tacticalAction: string;
  hypeVsRealityVerdict: string;
}

export interface TwitterAnalysisResult {
  id: string;
  timestamp: number;
  rawInput: string;
  authorHandle?: string;
  detectedTokens: TwitterDetectedToken[];
  memeLore: TwitterMemeLore;
  botForensics: TwitterBotForensics;
  alphaRating: TwitterAlphaRating;
  summaryHeadline: string;
  fullMarkdownVerdict: string;
}

export type SocialNewsCategory = 'ALL' | 'BREAKING' | 'MEME_CATALYST' | 'KOL_ALPHA' | 'BINANCE_CEX' | 'CHINESE_CT';

export interface SocialNewsItem {
  id: string;
  title: string;
  content: string;
  category: 'BREAKING' | 'MEME_CATALYST' | 'KOL_ALPHA' | 'BINANCE_CEX' | 'CHINESE_CT';
  source: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  isVerified: boolean;
  timestamp: number;
  url?: string;
  likes: number;
  retweets: number;
  views: number;
  relatedTokens: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impactScore: number; // 1 - 100
  isMemeOrigin?: boolean;
  canonicalCa?: string;
  chain?: string;
}

export interface MemeNarrativeItem {
  id: string;
  narrativeName: string;
  memeOriginLore: string;
  triggerEvent: string;
  keyInfluencer: string;
  canonicalSymbol: string;
  canonicalContract: string;
  chain: string;
  firstSeenDate: string;
  marketCapEst: string;
  cloneRiskWarning: string;
  status: 'ACTIVE_VIRAL' | 'COOLING_OFF' | 'ESTABLISHED_META';
}

// ==========================================
// SMART MONEY & ALPHA LISTINGS DETECTOR TYPES
// ==========================================

export type SmartMoneyArchetype = 
  | 'EARLY_SNIPER'           // Кошельки, которые рано купили монету (Block 0/1)
  | 'PROFIT_REALIZER'        // Кошельки, которые не просто купили, а реализовали чистую прибыль (Cash-out)
  | 'PRE_MARKETING_INSIDER'  // Кошельки, входящие до рекламы/шилла, НЕ деплоер (0% dev links)
  | 'NARRATIVE_SYNDICATE'    // Кошельки, покупающие одинаковые нарративы (Специализация)
  | 'SPRAY_AND_PRAY_HUNTER'; // Малые суммы в 20-50 токенов -> 1-2 Huge Runners

export interface DexSmartMoneyBuy {
  id: string;
  txHash: string;
  timestamp: number;
  walletAddress: string;
  walletLabel: string;
  walletTier: 'S_TIER' | 'A_TIER' | 'INSIDER_KOL' | 'SNIPER';
  archetype?: SmartMoneyArchetype;
  tokenSymbol: string;
  tokenName: string;
  tokenContract: string;
  chain: string;
  amountUsd: number;
  entryPrice: number;
  currentPrice: number;
  pnlPercent: number;
  isInsidersCluster: boolean;
  notes?: string;
}

export interface DexSmartMoneyWallet {
  id: string;
  address: string;
  label: string;
  chain: string;
  winRatePct: number;
  realizedPnLUsd: number;
  unrealizedPnLUsd: number;
  totalTrades: number;
  avgHoldingTime: string;
  tier: 'S_TIER' | 'A_TIER' | 'INSIDER_KOL' | 'SNIPER';
  archetype: SmartMoneyArchetype;
  archetypeLabel: string;
  archetypeDescription: string;
  tags: string[];
  recentBuys: DexSmartMoneyBuy[];
  topHoldingTokens: Array<{
    symbol: string;
    amountUsd: number;
    pnlPercent: number;
    contract: string;
    chain: string;
    entryMultiplier?: string;
  }>;
  // Forensic metrics requested by user
  earlyEntryDelayMinutes?: number;
  realizedCashOutRatio?: number; // e.g. 85% cash out
  preMarketingLeadHours?: number; // e.g. 14h before KOLs
  isDeployerVerifiedClean?: boolean; // 100% not dev / clean funding
  favoredNarrative?: string;
  sprayAndPrayStats?: {
    totalTokensAttempted: number;
    runnerCount: number;
    maxMultiplier: number;
    avgBetSizeUsd: number;
    hitRatePct: number;
  };
  riskScore: number;
  lastActiveTime: number;
  isFollowing?: boolean;
}

export interface DexAlphaListingItem {
  id: string;
  symbol: string;
  name: string;
  contractAddress: string;
  chain: string;
  dexName: string;
  pairAddress: string;
  listedTime: number;
  status: 'JUST_LISTED_15M' | 'HOT_BINANCE_ALPHA' | 'BREAKOUT_SPIKE' | 'STAGED_LP';
  narrativeCategory: 'CHINESE_MEME' | 'AI_AGENTS' | 'BNB_ALPHA' | 'SOLANA_MEMES' | 'DESCI' | 'ECOSYSTEM';
  narrativeLabel: string;
  alphaScore: number; // 0 - 100
  initialLiquidityUsd: number;
  currentLiquidityUsd: number;
  volume1hUsd: number;
  volume24hUsd: number;
  priceUsd: number;
  priceChange1h: number;
  priceChange24h: number;
  holdersCount: number;
  smartMoneyBuyersCount: number;
  smartMoneyInflowUsd: number;
  auditRisk: 'CLEAN' | 'WARNING' | 'HIGH_RISK';
  buyTax: number;
  sellTax: number;
  lpLockedPercent: number;
  loreOrigin: string;
  binanceFuturesListed: boolean;
  keySignals: string[];
}

export interface DexSmartMoneyOverview {
  smartMoneyWallets: DexSmartMoneyWallet[];
  liveSmartMoneyFeed: DexSmartMoneyBuy[];
  totalTrackedWallets: number;
  total24hSmartInflowUsd: number;
  topAccumulatedToken: { symbol: string; inflowUsd: number; buyersCount: number };
  timestamp?: number;
}

export interface DexAlphaListingsOverview {
  listings: DexAlphaListingItem[];
  totalDetected24h: number;
  highAlphaCount: number;
  topGainer1h: { symbol: string; gainPct: number };
  activeNarratives: Array<{ category: string; count: number; totalVol24h: number }>;
  timestamp?: number;
}

// ============================================================================
// 🎯 3-Tier On-Chain Audit & Early Sniper Data Types (DEX + CG + Scan)
// ============================================================================

export interface PeriodNetFlow {
  period: '5m' | '1h' | '6h' | '24h';
  periodLabel: string;
  buysCount: number;
  sellsCount: number;
  totalTxns: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  totalVolumeUsd: number;
  netFlowUsd: number; // positive = buy surplus, negative = sell surplus
  buyRatioPercent: number; // % of total dollar volume from buys
  sellRatioPercent: number; // % of total dollar volume from sells
  txBuyRatioPercent: number; // % of transaction count from buys
  isVolumeSkewPositive: boolean; // buyVolumeUsd > sellVolumeUsd
  avgBuySizeUsd: number;
  avgSellSizeUsd: number;
  verdict: 'STRONG_BUY_OVERWEIGHT' | 'BUY_OVERWEIGHT' | 'BALANCED' | 'SELL_OVERWEIGHT' | 'STRONG_SELL_OVERWEIGHT';
  verdictLabel: string;
}

export interface NewDexPairItem {
  id: string;
  tokenAddress: string;
  pairAddress: string;
  symbol: string;
  name: string;
  chain: string;
  dexId: string;
  pairCreatedAt: number;
  ageMinutes: number;
  ageFormatted: string;
  priceUsd: number;
  liquidityUsd: number;
  fdv: number;
  volume24h: number;
  volume6h?: number;
  volume1h: number;
  volume5m: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange6h?: number;
  priceChange24h: number;
  txns5m: { buys: number; sells: number };
  txns1h: { buys: number; sells: number };
  txns6h?: { buys: number; sells: number };
  txns24h?: { buys: number; sells: number };
  netFlow5m?: PeriodNetFlow;
  netFlow1h?: PeriodNetFlow;
  netFlow6h?: PeriodNetFlow;
  netFlow24h?: PeriodNetFlow;
  iconUrl?: string;
  url?: string;
}

export interface TripleDexAuditData {
  tokenAddress: string;
  symbol: string;
  name: string;
  chain: string;
  dexName: string;
  pairAddress: string;
  pairCreatedAt: number;
  ageMinutes: number;
  ageFormatted: string;
  timestamp: number;

  // Multi-Period Net Buy/Sell Flow Analysis
  multiPeriodNetFlow?: {
    p5m: PeriodNetFlow;
    p1h: PeriodNetFlow;
    p6h: PeriodNetFlow;
    p24h: PeriodNetFlow;
  };

  // Ticker Collision & Alternate Contracts
  hasTickerCollision?: boolean;
  alternativeContracts?: Array<{
    address: string;
    symbol: string;
    name: string;
    chain: string;
    liquidityUsd: number;
    fdv: number;
    dexUrl: string;
    pairAddress: string;
  }>;

  // Layer 1: DEX Screener (Primary for New Pairs, Pool Depth, Velocity)
  layer1DexScreener: {
    priceUsd: number;
    liquidityUsd: number;
    fdv: number;
    volume5m: number;
    volume1h: number;
    volume24h: number;
    priceChange5m: number;
    priceChange1h: number;
    priceChange24h: number;
    buys5m: number;
    sells5m: number;
    buys1h: number;
    sells1h: number;
    buys24h: number;
    sells24h: number;
    buyPressurePercent1h: number;
    volToLiquidityRatio: number;
    dexUrl: string;
    pairAddress?: string;
    quoteToken?: {
      symbol: string;
      address?: string;
    };
    baseToken?: {
      symbol: string;
      address?: string;
    };
    topPairs?: Array<{
      dexId: string;
      pairAddress: string;
      baseSymbol: string;
      quoteSymbol: string;
      priceUsd: number;
      liquidityUsd: number;
      volume24h: number;
      isPrimary?: boolean;
    }>;
  };

  // Layer 2: CoinGecko (Verification, Legitimacy, ATH/ATL, CEX status, Multi-Market breakdown)
  layer2CoinGecko: {
    isListed: boolean;
    coinId?: string;
    marketCapRank?: number | null;
    marketCapUsd?: number | null;
    totalCgVolumeUsd?: number | null;
    athUsd?: number | null;
    athChangePercentage?: number | null;
    atlUsd?: number | null;
    exchangesCount?: number;
    cexCount?: number;
    dexCount?: number;
    totalCexVolume24h?: number;
    totalDexVolume24h?: number;
    cexSharePercent?: number;
    dexSharePercent?: number;
    cexMarkets?: Array<{
      exchangeName: string;
      targetPair: string;
      priceUsd: number;
      volume24hUsd: number;
      trustScore: string;
      tradeUrl?: string;
      depthPlus2PctUsd?: number;
      depthMinus2PctUsd?: number;
    }>;
    dexMarkets?: Array<{
      exchangeName: string;
      targetPair: string;
      priceUsd: number;
      volume24hUsd: number;
      tradeUrl?: string;
    }>;
    coingeckoUrl?: string;
    statusMessage: string;
    isVerifiedLegit: boolean;
  };

  // Layer 3: On-Chain Scan (GoPlus / Moralis / BSCScan: Holders, LP Lock, Tax)
  layer3OnChainScan: {
    holdersCount: number;
    top10HoldersPercent: number; // Raw Top 10
    adjustedTop10Percent: number; // Top 10 excluding LP pool, dead/burn, routers
    maxSingleEoaPercent: number; // Largest single private EOA wallet
    burnedPercent: number;
    lpLockedPercent: number;
    isLpBurnedOrLocked: boolean;
    creatorPercent: number;
    creatorAddress?: string;
    buyTax: number;
    sellTax: number;
    isHoneypot: boolean;
    isMintable: boolean;
    canTakeBackOwnership: boolean;
    topHolders: Array<{
      address: string;
      percent: number;
      isLocked?: boolean;
      tag?: string;
      holderType?: 'EOA' | 'LP_POOL' | 'BURN' | 'CREATOR' | 'CEX';
    }>;
  };

  // Layer 4: CEX Hot Wallets & Exchange Gateways Registry (Binance, MEXC, OKX, Gate.io, Bybit, KuCoin, HTX)
  layer4CexGateways?: {
    totalCexHoldersPercent: number; // Суммарная доля на кошельках CEX (%)
    totalCexHoldersUsd: number;     // Стоимость токенов на CEX в USD
    cexWalletsCount: number;         // Количество обнаруженных биржевых адресов
    detectedWallets: Array<{
      address: string;
      exchangeName: string;
      walletLabel: string;
      percent: number;
      balanceTokens?: number;
      balanceUsd: number;
      depositStatus: 'HOT_WALLET' | 'DEPOSIT_GATEWAY' | 'COLD_STORAGE';
      riskLevel: 'HIGH_DUMP_RISK' | 'MODERATE' | 'SAFE_DISTRIBUTED';
      explorerUrl: string;
    }>;
    inflowPressureStatus: 'LOW' | 'MODERATE' | 'HIGH_SELL_PRESSURE';
    arbitrageReadiness: 'READY_FOR_CEX_EXIT' | 'DEX_ONLY_TWAP_REQUIRED';
    cexVsDexCapacityAdvice: string;
    trackedExchanges: string[];      // ['Binance', 'MEXC', 'OKX', 'Gate.io', 'Bybit', 'Bitget', 'KuCoin', 'HTX']
  };

  // Layer 5 (Social & Viral Intelligence)
  layer4SocialSentiment?: {
    sentimentScore: number; // 0 - 100
    sentimentStatus: 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'SUSPICIOUS_SHILL';
    uniqueAuthorsCount: number;
    engagement24h: number;
    primaryNarrative: string;
    dominantLanguages: string[];
    coordinatedShillRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    organicInterestVsFomo: 'ORGANIC' | 'FOMO_DRIVEN' | 'BOT_FARM';
    keySignals: string[];
  };

  // Scenarios with Invalidation conditions (Strict Rule 10)
  scenarios?: {
    bull: {
      targetPrice: number;
      targetFdv: string;
      targetMultiplier: string;
      condition: string;
      requiredVolume24h: string;
      invalidation: string;
    };
    base: {
      targetPrice: number;
      targetFdv: string;
      range: string;
      condition: string;
      invalidation: string;
    };
    bear: {
      targetPrice: number;
      targetFdv: string;
      targetMultiplier: string;
      condition: string;
      invalidation: string;
    };
    extremeBear: {
      targetPrice: number;
      targetFdv: string;
      targetMultiplier: string;
      condition: string;
      invalidation: string;
    };
  };

  // Capital & Depth Targets ("До куда может дойти" - Rule 5 & Fib Inflow Engine)
  depthTargets?: Array<{
    level: string;
    priceUsd: number;
    fdvUsd: number;
    requiredCapUsd: number;
    requiredVol24hUsd: number;
    requiredNetInflowUsd?: number;
    impactSlippage: {
      size1kPct: number;
      size10kPct: number;
      size50kPct: number;
    };
    feasibility: 'HIGH' | 'MODERATE' | 'LOW' | 'EXTREME_RISK';
  }>;

  // Layer 5: Gemini AI Comprehensive Forensic Verdict
  aiVerdict: {
    safetyScore: number; // 0 - 100
    riskCategory: 'LOW_RISK' | 'MODERATE' | 'HIGH_RISK' | 'CRITICAL_RUGPULL_RISK';
    cycleStage: string;
    summary: string;
    redFlags: string[];
    greenFlags: string[];
    tacticalPlan: {
      action: string;
      entryZone: string;
      stopLoss: string;
      tp1: string;
      tp2: string;
      maxSafeOrderUsd: number;
      maxSafeOrderPercentOfLp: number;
      sniperAdvice: string;
    };
  };

  // AMM Pool Decoder & MEV Forensics Intelligence
  poolDecoder?: PoolDecoderData;
}

// ==========================================
// BINANCE AGENT OS & MCP PROTOCOL TYPES
// ==========================================

export interface TopPositionRatio {
  symbol: string;
  longShortRatio: string;
  longPosition: string;
  shortPosition: string;
  timestamp: string | number;
}

export interface SmartMoneyDivergence {
  accountRatio: number;
  positionRatio: number;
  accountLongPct: number;
  positionLongPct: number;
  divergenceType: 'BULLISH_WHALE_ACCUMULATION' | 'BEARISH_WHALE_HEDGING' | 'ALIGNED_BULL' | 'ALIGNED_BEAR' | 'NEUTRAL';
  summary: string;
  riskFlag: 'LOW' | 'MEDIUM' | 'HIGH';
  spreadRatio: number; // positionRatio / accountRatio
}

export interface LiquidationCluster {
  priceLevel: number;
  distancePct: number;
  side: 'LONG_LIQ' | 'SHORT_LIQ';
  estimatedVolUsd: number;
  leverageTier: '100x' | '50x' | '25x' | '10x';
  isMagnetZone: boolean;
  intensityScore: number; // 0 - 100
}

export interface LiquidationDensityMap {
  symbol: string;
  currentPrice: number;
  markPrice: number;
  totalLongExposureUsd: number;
  totalShortExposureUsd: number;
  clusters: LiquidationCluster[];
  primaryLongMagnet: number;
  primaryShortMagnet: number;
  cascadeRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  shortSqueezePrice: number;
  longCascadePrice: number;
  timestamp: number;
}

export interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpServerState {
  endpoint: string;
  status: 'ONLINE' | 'STANDBY';
  tools: McpToolDescriptor[];
  totalCalls: number;
  lastCallTime?: number;
}

// ==========================================
// DEX AMM POOL DECODER & MEV FORENSICS
// ==========================================

export interface PoolDecoderSnapshot {
  timestamp: number;
  timeLabel: string; // e.g. "Now", "-5m", "-10m", "-55m"
  price: number;
  reserveToken: number;
  reserveQuote: number;
  quoteSymbol: string; // 'WBNB' | 'ETH' | 'SOL' | 'USDT'
  deltaReserveToken: number; // < 0 means token is being bought out of pool
  deltaReserveQuote: number;
  buys5m: number;
  sells5m: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  grossNetFlowUsd: number;
  organicNetFlowUsd: number; // Net flow after MEV / Sandwich deduction
  mevVolumeUsd: number;
  sandwichPercent: number; // 0 - 100%
  uniqueBuyers: number;
  uniqueSellers: number;
  lpAdditions: number;
  lpRemovals: number;
  lpNetDeltaUsd: number;
  totalLiquidityUsd: number;
}

export interface PriceImpactTier {
  sizeUsd: number; // 1000, 10000, 50000
  impactPct: number; // e.g. 0.4%, 4.2%, 18.5%
  executionPrice: number;
  tokensReceived: number;
  slippageWarning: string;
  canExitSafely: boolean;
}

export interface PoolPhaseSignal {
  label: string;
  status: 'CONFIRMED' | 'VIOLATED' | 'NEUTRAL';
  detail: string;
}

export interface OrganicFlowPeriodBreakdown {
  period: '5m' | '1h' | '6h' | '24h';
  periodLabel: string;
  grossBuyVolumeUsd: number;
  grossSellVolumeUsd: number;
  grossNetFlowUsd: number;
  totalBuys: number;
  totalSells: number;
  // Breakdown of excluded noise
  washVolumeUsd: number;
  mevSandwichVolumeUsd: number;
  lpRebalanceEffectUsd: number;
  clusterSelfTradeUsd: number;
  removedInorganicVolumeUsd: number;
  // Clean Organic Flow
  organicNetFlowUsd: number;
  organicBuysUsd: number;
  organicSellsUsd: number;
  // Vital Ratios
  organicFlowToLiquidityPct: number;
  organicFlowPerUniqueBuyerUsd: number;
  uniqueBuyersCount: number;
  uniqueSellersCount: number;
  buyerToSellerRatio: number;
  top3VolumeSharePercent: number;
  isWashTradingSuspected: boolean;
  sandwichPercent: number;
  // Status interpretation
  flowHealth: 'BULLISH_ORGANIC' | 'HEALTHY_ACCUMULATION' | 'NEUTRAL' | 'INORGANIC_TRAP' | 'DISTRIBUTION_RISK';
  flowHealthLabel: string;
}

export interface PoolDecoderData {
  symbol: string;
  pairAddress: string;
  chainId: string;
  dexId: string;
  currentPrice: number;
  quoteToken: {
    symbol: string;
    reserve: number;
    reserveUsd: number;
    priceUsd: number;
  };
  baseToken: {
    symbol: string;
    reserve: number;
    reserveUsd: number;
  };
  kConstant: number; // x * y
  priceImpactMatrix: PriceImpactTier[];
  summary1h: {
    totalBuys: number;
    totalSells: number;
    grossBuyVolumeUsd: number;
    grossSellVolumeUsd: number;
    grossNetFlowUsd: number;
    organicNetFlowUsd: number;
    mevSandwichVolumeUsd: number;
    mevSandwichTxCount: number;
    sandwichPercent: number;
    uniqueBuyersCount: number;
    uniqueSellersCount: number;
    buyerToSellerRatio: number;
    top3VolumeSharePercent: number; // Wash trading heuristic
    isWashTradingSuspected: boolean;
    lpHourlyEvents: {
      mintCount: number;
      burnCount: number;
      netLpChangeUsd: number;
      lpWallStatus: 'NO_WALL' | 'RESISTANCE_CEILING' | 'SUPPORT_FLOOR' | 'LIQUIDITY_PULL_RISK';
    };
    cexArbitrageGapPct: number | null;
  };
  // Multi-Period Clean Organic Flow (5m, 1h, 6h, 24h)
  multiPeriodOrganicFlow?: {
    p5m: OrganicFlowPeriodBreakdown;
    p1h: OrganicFlowPeriodBreakdown;
    p6h: OrganicFlowPeriodBreakdown;
    p24h: OrganicFlowPeriodBreakdown;
  };
  poolPhase: 'ORGANIC_ACCUMULATION' | 'MEV_WASH_TRAP' | 'EXPLOSION_READY' | 'NEUTRAL_CHURN';
  poolPhaseTitle: string;
  poolPhaseDescription: string;
  phaseSignals: PoolPhaseSignal[];
  snapshots: PoolDecoderSnapshot[];
  aiPoolDecoderVerdict: {
    summary: string;
    reserveTokenTrend: string;
    trueDemandVerdict: string;
    mevTrapAnalysis: string;
    lpWallImpact: string;
    keyTakeaway: string;
  };
  timestamp: number;
}

// ============================================================================
// QUOTE-BASKET ROTATION RADAR (getReserves on-chain engine)
// ============================================================================
export interface BasketPoolReserveSnapshot {
  poolAddress: string;
  dexId: string; // 'pancakeswap'
  protocolVersion: 'v2' | 'v3';
  basket: 'QQQB' | 'TSLAB' | 'SPCXB';
  isExitGate: boolean;
  pairName: string; // e.g. '牛来 / QQQB'
  baseSymbol: string; // e.g. '牛来'
  quoteSymbol: string; // e.g. 'QQQB'
  baseContract: string;
  quoteContract: string;
  role: 'GATE' | 'LEADER' | 'SATELLITE_1' | 'SATELLITE_2';
  currentReserves: {
    baseToken: number;
    quoteToken: number;
    baseDecimals: number;
    quoteDecimals: number;
    quoteUsdPrice: number;
    tvlUsd: number;
    priceRatio: number;
    priceUsd: number;
  };
  delta1m: {
    baseDelta: number;
    quoteDelta: number;
    quoteDeltaUsd: number;
    pctChangeQuote: number;
    direction: 'INFLOW' | 'OUTFLOW' | 'STABLE';
  };
  delta5m: {
    baseDelta: number;
    quoteDelta: number;
    quoteDeltaUsd: number;
    pctChangeQuote: number;
    direction: 'INFLOW' | 'OUTFLOW' | 'STABLE';
  };
  delta15m: {
    baseDelta: number;
    quoteDelta: number;
    quoteDeltaUsd: number;
    pctChangeQuote: number;
    direction: 'INFLOW' | 'OUTFLOW' | 'STABLE';
  };
  blockNumber: number;
  blockTimestamp: number;
  slippageEstimates: {
    size1k: number;
    size5k: number;
    size10k: number;
    maxSafeSizeUsd: number;
  };
}

export interface BasketRotationRadarResponse {
  currentBscBlock: number;
  blockTimeSec: number;
  timestamp: number;
  scanIntervalSec: number;
  rpcProvider: string;
  hierarchySignals: {
    level1_exitGate: {
      status: 'NET_INFLOW' | 'NET_OUTFLOW' | 'NEUTRAL';
      leadTimeMinutes: number; // 10-15 min
      qqqbUsdtFlowUsd5m: number;
      tslabUsdtFlowUsd5m: number;
      wbnbGatewayFlowUsd5m?: number;
      wbnbNetDirection?: 'ACCUMULATING_BNB' | 'EXITING_TO_BNB' | 'BALANCED';
      verdict: string;
    };
    level2_getReserves: {
      status: 'ROTATION_ACTIVE' | 'ACCUMULATION' | 'CONSOLIDATION' | 'DUMP';
      leadTimeMinutes: number; // 5-10 min
      leaderFlow: string;
      satelliteInflowTarget: string | null;
      confidenceScore: number;
      verdict: string;
    };
    level3_walletLinkage: {
      status: 'IDENTIFIED' | 'MONITORING';
      sharedHoldersEstimatedCount: number;
      leadTimeMinutes: number; // 2-5 min
      gmgnObservation: string;
    };
    level4_dexScreenerLag: {
      status: 'LAGGING';
      lagSeconds: number; // 60-120s
      note: string;
    };
    level5_priceReaction: {
      status: 'PENDING' | 'REACTING' | 'PRICED_IN';
      note: string;
    };
  };
  baskets: {
    QQQB: {
      name: string;
      anchorContract: string;
      anchorUsdPrice: number;
      gatePool: BasketPoolReserveSnapshot;
      wbnbGatePool?: BasketPoolReserveSnapshot;
      wbnbBridgeContract?: string;
      leaderPool: BasketPoolReserveSnapshot;
      satellites: BasketPoolReserveSnapshot[];
      rotationIntensity: number;
      flowSummary: string;
      divergenceSignal: {
        active: boolean;
        sourceToken: string;
        targetToken: string;
        sourceQuoteDeltaUsd: number;
        targetQuoteDeltaUsd: number;
        divergenceRatio: number;
        estimatedWindowMinutes: number;
        actionableCall: string;
      };
    };
    TSLAB: {
      name: string;
      anchorContract: string;
      anchorUsdPrice: number;
      gatePool: BasketPoolReserveSnapshot;
      wbnbGatePool?: BasketPoolReserveSnapshot;
      wbnbBridgeContract?: string;
      leaderPool: BasketPoolReserveSnapshot;
      satellites: BasketPoolReserveSnapshot[];
      rotationIntensity: number;
      flowSummary: string;
      divergenceSignal: {
        active: boolean;
        sourceToken: string;
        targetToken: string;
        sourceQuoteDeltaUsd: number;
        targetQuoteDeltaUsd: number;
        divergenceRatio: number;
        estimatedWindowMinutes: number;
        actionableCall: string;
      };
    };
    SPCXB: {
      name: string;
      anchorContract: string;
      anchorUsdPrice: number;
      gatePool: BasketPoolReserveSnapshot;
      wbnbGatePool?: BasketPoolReserveSnapshot;
      wbnbBridgeContract?: string;
      leaderPool: BasketPoolReserveSnapshot;
      satellites: BasketPoolReserveSnapshot[];
      rotationIntensity: number;
      flowSummary: string;
      divergenceSignal: {
        active: boolean;
        sourceToken: string;
        targetToken: string;
        sourceQuoteDeltaUsd: number;
        targetQuoteDeltaUsd: number;
        divergenceRatio: number;
        estimatedWindowMinutes: number;
        actionableCall: string;
      };
    };
  };
  allTrackedPools: BasketPoolReserveSnapshot[];
}

// ============================================================================
// VISUAL CAPITAL FLOW TOPOLOGY (BUBBLEMAPS × AI × TRADER NEXUS FLOW LINES)
// ============================================================================
export interface CapitalFlowNode {
  id: string;
  label: string;
  subLabel: string;
  type: 'SOURCE' | 'SATELLITE' | 'WBNB_GATE' | 'USDT_GATE' | 'CEX_DEPOSIT' | 'AMM_POOL';
  symbol: string;
  contract?: string;
  amountUsd: number;
  percentage: number;
  txCount?: number;
  color: string;
  iconType: string;
  status: 'ACTIVE_FLOW' | 'MODERATE' | 'LOW';
  roleDescription: string;
}

export interface CapitalFlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  amountUsd: number;
  percentage: number;
  directionLabel: string;
  speed: 'FAST' | 'NORMAL' | 'SLOW';
  leadTimeMinutes?: number;
  whaleTxCount: number;
  color: string;
  notes: string;
}

export interface ContractCapitalFlowResponse {
  timestamp: string;
  token: {
    symbol: string;
    name: string;
    contract: string;
    chain: string;
    priceUsd: number;
    priceChange5m: number;
    priceChange1h: number;
    liquidityUsd: number;
    volume24hUsd: number;
    totalSellsUsd: number;
    totalBuysUsd: number;
    netOutflowUsd: number;
    basketName?: string;
  };
  timeframe: '5m' | '1h' | '6h' | '24h';
  flowType: 'SELL_OUTFLOW' | 'BUY_INFLOW';
  retentionScorePct: number; // % retained within chain/basket
  verdict: {
    title: string;
    summary: string;
    ecosystemRetention: string;
    whaleAction: string;
    leadTimeAdvantage: string;
    riskVerdict: 'BULLISH_ROTATION' | 'NEUTRAL_BALANCED' | 'HEAVY_EXIT_RISK';
  };
  nodes: CapitalFlowNode[];
  edges: CapitalFlowEdge[];
  topWhaleTransfers?: {
    wallet: string;
    amountUsd: number;
    destination: string;
    timeAgo: string;
    isCex: boolean;
  }[];
}







