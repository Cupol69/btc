/**
 * Event & Thesis Historical Analysis Engine (v3 Full-Stack Architecture)
 * 
 * Решение 4 ключевых ограничений и ловушек ончейна:
 * 1. Throwaway deployers -> Root Funding Graph (Funder-of-Deployers)
 * 2. False Merges -> CEX/Bridge Blacklist & False Merge Guard
 * 3. Macro Hierarchy -> Wallet Graph ДОПОЛНЯЕТ пирамиду (BTC -> Sector -> Basket -> Token -> Wallet)
 * 4. Time-Weighted Confidence -> Cold Start vs Long-Horizon Maturing Database
 */

export type AssetClass = 'btc' | 'alt' | 'meme';

export type StageHealth = 'EARLY' | 'HEATING' | 'OVERHEATED' | 'EXHAUSTION' | 'DEAD';

export type ThesisStatus = 'ACTIVE' | 'CONFIRMED' | 'WEAKENED' | 'INVALIDATED' | 'REPLACED';

export type BTCRegimeType = 'RISK_ON' | 'RISK_OFF' | 'RANGE' | 'CHOP_ACCUMULATION';

export interface BaseSnapshotHeader {
  assetId: string;
  assetType: AssetClass;
  name: string;
  contract?: string;
  chain?: string;
  snapshotAt: string;
  snapshotId: string;
  prevSnapshotId?: string;
  dataQuality: number; // 0-100
  structuralStage: number; // 1-5
  stageHealth: StageHealth;
  marketPhase: 'accumulation' | 'markup' | 'holding' | 'distribution' | 'capitulation';
  primaryDriver?: number; // 1-15 (из спецификации)
  driverSustainability?: number; // 1-5
  aiVerdictShort: string;
  aiConfidence: number; // 0-100
  invalidation: string[]; // Условия отмены тезиса
}

export interface BTCBody {
  price: number;
  session: 'US_OPEN' | 'US_CLOSE' | 'EU' | 'ASIA' | 'DEAD_ZONE';
  sessionHandoff: string;
  trendHtf: 'up' | 'down' | 'range';
  etfNetflowEstUsd: string;
  fundingRatePct: number;
  openInterestUsd: string;
  oiChange24hPct: number;
  spotVsPerpBasis: string;
  correlationNasdaq: number;
  regime: BTCRegimeType;
  impactOnAlts: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  impactOnMemes: 'HIGH_BETA_ALLOWED' | 'SELECTIVE' | 'FORBIDDEN_RISK_OFF';
}

export interface AltBody {
  sector: 'AI' | 'DeFi' | 'L1_L2' | 'RWA' | 'Gaming' | 'Infra';
  sectorRelativeStrength: number; // -100 to +100
  narrative: string;
  correlationBtc: number;
  cleanNetFlow24hUsd: string;
  holdersTrend: 'growing' | 'flat' | 'declining';
  whaleNetflow7dUsd: string;
  cexVolumeSharePct: number;
  primaryExchange: string;
}

export interface MemeBody {
  social: {
    mentions24h: number;
    uniqueAuthors24h: number;
    narrativeStage: 'stealth' | 'meme' | 'expansion' | 'price_fomo' | 'exhaustion';
    dominantNarrative: string;
    socialVsPrice: 'leads' | 'follows' | 'decoupled';
    shillCoordination: 'low' | 'med' | 'high';
  };
  flow: {
    cleanNetFlow1hUsd: string;
    cleanNetFlow24hUsd: string;
    flowToLiquidity: string;
    uniqueBuyers1h: number;
    buyerRetention6hPct: number;
    absorptionScore: number; // 0-100
    supplyExhaustionScore: number; // 0-100
  };
  basket: {
    quoteAsset: string; // e.g. QQQB, USDT, BNB
    basketId: string;
    flowSharePct: number;
    flowShareChangePct: number;
    role: 'L1' | 'L2' | 'L3';
    rotationSignal: 'leader_exhaustion' | 'rotating_in' | 'none' | 'distributing';
  };
  onchainBitquery: {
    creatorClusterPct: number;
    clusterWalletsCount: number;
    controlEntity: 'single' | 'distributed' | 'unknown';
    earlyCohortSelling24h: 'none' | 'dca_selling' | 'aggressive_dump';
    cexDepositsFromEarly: 'yes' | 'no';
    lastDeepScanAt: string;
    graphConfidence: number;
  };
  liquidity: {
    pureUsdtLiquidity: string;
    liqChange1hPct: number;
    exitSlippage1kPct: number;
    exitSlippage10kPct: number;
    exitSlippage50kPct: number;
    lpVacuumRisk: boolean;
  };
  cex: {
    listed: string[];
    cexDexPremium: number;
    listingWasTop: boolean | null;
  };
}

export interface ParentCascadeContext {
  btcRegime: BTCRegimeType;
  btcImpact: string;
  sectorName?: string;
  sectorStrength?: string;
  basketId?: string;
  basketLeader?: string;
  basketRotationSignal?: string;
}

export interface AnalysisRunItem {
  id: string;
  assetId: string;
  assetType: AssetClass;
  timestampUtc: string;
  header: BaseSnapshotHeader;
  parentCascade?: ParentCascadeContext;
  btcBody?: BTCBody;
  altBody?: AltBody;
  memeBody?: MemeBody;
  verdict: {
    action: 'BUY' | 'WATCH' | 'TAKE_PROFIT' | 'AVOID' | 'RUN_AWAY';
    bias: 'BULLISH' | 'NEUTRAL_BULLISH' | 'NEUTRAL' | 'BEARISH' | 'CRITICAL_RISK';
    mainThesis: string;
    mainDrivers: string[];
    mainRisks: string[];
  };
  deltaVsPrevious?: {
    previousAction: string;
    newAction: string;
    whatChanged: string[];
    thesisStatus: ThesisStatus;
  };
}

export interface ThesisItem {
  id: string;
  assetId: string;
  assetName: string;
  openedAt: string;
  lastUpdatedAt: string;
  status: ThesisStatus;
  direction: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  statement: string;
  requiredConfirmations: string[];
  invalidationRules: string[];
  linkedAnalysisId: string;
  linkedWallets?: string[]; // Адреса отслеживаемых кошельков для инвалидации/подтверждения
}

export interface RiskAlertItem {
  id: string;
  assetId: string;
  assetName: string;
  timestampUtc: string;
  riskType: 'CLUSTER_SELLING' | 'LIQUIDITY_VACUUM' | 'HIGH_SLIPPAGE' | 'BTC_RISK_OFF' | 'UNUSUAL_TAX' | 'HONEYPOT_RISK' | 'FALSE_MERGE_WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string[];
  effectOnThesis: 'CONFIRMS' | 'WEAKENS' | 'KILLS';
  sourceWallet?: string;
}

export interface StageTransitionItem {
  id: string;
  assetId: string;
  assetName: string;
  timestampUtc: string;
  fromStage: number;
  toStage: number;
  reason: string;
  evidence: string[];
}

/**
 * Arkham-style Knowledge Graph Entities with Level-2 Root Funding & Anti-False-Merge Guards
 */
export interface WalletHistoryEvent {
  id: string;
  timestampUtc: string;
  eventType: 'ACCUMULATION' | 'PARTIAL_DUMP' | 'FULL_DUMP' | 'TRANSFER_TO_CEX' | 'LP_DRAIN' | 'CROSS_DEPLOY' | 'FUNDED_NEW_DEPLOYER';
  tokenSymbol: string;
  tokenAddress: string;
  amountUsd: string;
  impactOnThesis: 'CONFIRMS_BULLISH' | 'TRIGGERS_INVALIDATION' | 'NEUTRAL_ROTATION' | 'WARNING_OVERHEAT';
  details: string;
  txHash?: string;
}

export type ClusterNodeType =
  | 'ROOT_FUNDER'          // Первоисточник ликвидности деплоеров (Level 2)
  | 'INSIDER_SYNDICATE'    // Ранний синдикат/команда
  | 'DEV_DEPLOYER'         // Непосредственный создатель токена (часто одноразовый)
  | 'BLOCK0_SNIPER'        // MEV-снайпер блока 0
  | 'MARKET_MAKER_HUB'     // Маркет-мейкер / роутер
  | 'EXCLUDED_CEX_OR_BRIDGE' // Исключенный адрес биржи/моста (защита от False Merge)
  | 'SMART_SWING';         // Проверенный смарт-свингер

export interface WalletGraphNode {
  address: string;
  label: string;
  clusterType: ClusterNodeType;
  clusterDescription: string;
  confidenceScore: number; // 0-100 (рассчитывается с учетом зрелости базы и времени накопления)
  firstSeenAt: string;
  lastActiveAt: string;
  daysInObservation: number; // Зрелость истории (п. 4: ценность растет со временем)
  totalHoldingsUsd: string;
  isKnownCexOrBridge?: boolean; // Флаг исключения из кластеризации (п. 2)
  rootFundingSource?: {
    funderAddress: string;
    funderLabel: string;
    txHash: string;
    initialFundedAmountBnb: string;
  };
  connectedTokens: {
    symbol: string;
    address: string;
    sharePct: number;
    quoteAsset: string;
    entryStage: number;
  }[];
  connectedWallets: {
    targetAddress: string;
    targetLabel: string;
    relationType: 'ROOT_FUNDER_OF' | 'FUNDED_BY' | 'FUNDS_DEPLOYER' | 'SAME_PROXY_ROUTER' | 'CO_SNIPER' | 'FALSE_MERGE_DISCARDED';
  }[];
  historyEvents: WalletHistoryEvent[];
  linkedThesesIds: string[];
}
