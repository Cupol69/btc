import { binanceRest } from './binanceRest';

export interface SymbolCategory {
  id: string;
  name: string;
  icon: string;
  symbols: { symbol: string; base: string; name: string }[];
}

export const CATEGORIES: SymbolCategory[] = [
  {
    id: 'binance_alpha',
    name: '🟡 Binance Alpha & Futures',
    icon: '🟡',
    symbols: [
      { symbol: 'MARSUSDT', base: 'MARS', name: 'MARSCOIN (Binance Futures & DEX)' },
      { symbol: '1000MARSUSDT', base: '1000MARS', name: '1000MARS (Binance Futures)' },
      { symbol: 'PEPEUSDT', base: 'PEPE', name: 'PEPE (Binance Futures & Spot)' },
      { symbol: 'WIFUSDT', base: 'WIF', name: 'dogwifhat (Binance)' },
      { symbol: 'PNUTUSDT', base: 'PNUT', name: 'Peanut (Binance Futures)' },
      { symbol: 'ACTUSDT', base: 'ACT', name: 'ACT Prophecy (Binance)' },
      { symbol: 'NEIROUSDT', base: 'NEIRO', name: 'First Neiro (ETH/Binance)' },
    ],
  },
  {
    id: 'majors',
    name: '⚡ Majors',
    icon: '⚡',
    symbols: [
      { symbol: 'BTCUSDT', base: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETHUSDT', base: 'ETH', name: 'Ethereum' },
      { symbol: 'SOLUSDT', base: 'SOL', name: 'Solana' },
      { symbol: 'BNBUSDT', base: 'BNB', name: 'BNB' },
      { symbol: 'XRPUSDT', base: 'XRP', name: 'XRP' },
      { symbol: 'DOGEUSDT', base: 'DOGE', name: 'Dogecoin' },
    ],
  },
  {
    id: 'tradfi_rwa',
    name: '🏦 TradFi & RWA',
    icon: '🏦',
    symbols: [
      { symbol: 'ONDOUSDT', base: 'ONDO', name: 'Ondo Finance (RWA)' },
      { symbol: 'PENDLEUSDT', base: 'PENDLE', name: 'Pendle (Yield TradFi)' },
      { symbol: 'MKRUSDT', base: 'MKR', name: 'Maker' },
      { symbol: 'LINKUSDT', base: 'LINK', name: 'Chainlink' },
      { symbol: 'TRUUSDT', base: 'TRU', name: 'TrueFi' },
      { symbol: 'AAVEUSDT', base: 'AAVE', name: 'Aave TradFi' },
    ],
  },
  {
    id: 'new_listings',
    name: '✨ New Listings & Alpha',
    icon: '✨',
    symbols: [
      { symbol: 'MARSUSDT', base: 'MARS', name: 'MARSCOIN (SpaceX / Binance Futures)' },
      { symbol: 'TONUSDT', base: 'TON', name: 'Toncoin' },
      { symbol: 'EIGENUSDT', base: 'EIGEN', name: 'EigenLayer' },
      { symbol: 'NEIROUSDT', base: 'NEIRO', name: 'First Neiro on ETH' },
      { symbol: 'SCRUSDT', base: 'SCR', name: 'Scroll' },
      { symbol: 'HMSTRUSDT', base: 'HMSTR', name: 'Hamster Kombat' },
      { symbol: 'CATIUSDT', base: 'CATI', name: 'Catizen' },
      { symbol: 'DOGSUSDT', base: 'DOGS', name: 'Dogs' },
      { symbol: 'NOTUSDT', base: 'NOT', name: 'Notcoin' },
    ],
  },
  {
    id: 'ai',
    name: '🤖 AI & DePIN',
    icon: '🤖',
    symbols: [
      { symbol: 'NEARUSDT', base: 'NEAR', name: 'NEAR Protocol' },
      { symbol: 'FETUSDT', base: 'FET', name: 'Artificial Superintelligence' },
      { symbol: 'RENDERUSDT', base: 'RENDER', name: 'Render Network' },
      { symbol: 'TAOUSDT', base: 'TAO', name: 'Bittensor' },
      { symbol: 'IOUSDT', base: 'IO', name: 'io.net' },
      { symbol: 'WLDUSDT', base: 'WLD', name: 'Worldcoin' },
      { symbol: 'GRTUSDT', base: 'GRT', name: 'The Graph' },
    ],
  },
  {
    id: 'memes',
    name: '🐶 Memes & Culture',
    icon: '🐶',
    symbols: [
      { symbol: 'PEPEUSDT', base: 'PEPE', name: 'Pepe' },
      { symbol: 'WIFUSDT', base: 'WIF', name: 'dogwifhat' },
      { symbol: 'SHIBUSDT', base: 'SHIB', name: 'Shiba Inu' },
      { symbol: 'BONKUSDT', base: 'BONK', name: 'Bonk' },
      { symbol: 'FLOKIUSDT', base: 'FLOKI', name: 'Floki' },
      { symbol: 'BOMEUSDT', base: 'BOME', name: 'Book of Meme' },
    ],
  },
  {
    id: 'l1l2',
    name: '🌐 Layer 1/2 Zones',
    icon: '🌐',
    symbols: [
      { symbol: 'SUIUSDT', base: 'SUI', name: 'Sui' },
      { symbol: 'AVAXUSDT', base: 'AVAX', name: 'Avalanche' },
      { symbol: 'APTUSDT', base: 'APT', name: 'Aptos' },
      { symbol: 'SEIUSDT', base: 'SEI', name: 'Sei Network' },
      { symbol: 'TIAUSDT', base: 'TIA', name: 'Celestia' },
      { symbol: 'ARBUSDT', base: 'ARB', name: 'Arbitrum' },
      { symbol: 'OPUSDT', base: 'OP', name: 'Optimism' },
      { symbol: 'POLUSDT', base: 'POL', name: 'Polygon' },
    ],
  },
  {
    id: 'defi',
    name: '🚀 DeFi Ecosystem',
    icon: '🚀',
    symbols: [
      { symbol: 'UNIUSDT', base: 'UNI', name: 'Uniswap' },
      { symbol: 'INJUSDT', base: 'INJ', name: 'Injective' },
      { symbol: 'JUPUSDT', base: 'JUP', name: 'Jupiter' },
      { symbol: 'LDOUSDT', base: 'LDO', name: 'Lido DAO' },
      { symbol: 'CRVUSDT', base: 'CRV', name: 'Curve DAO' },
      { symbol: 'DYDXUSDT', base: 'DYDX', name: 'dYdX' },
    ],
  },
];

const STORAGE_KEY = 'binance_analytics_recent_symbols';
const FAVORITES_STORAGE_KEY = 'binance_analytics_favorite_symbols';
const MAX_RECENT_SYMBOLS = 30;
const DEFAULT_RECENTS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'PEPEUSDT',
  'ONDOUSDT', 'DOGEUSDT', 'NEARUSDT', 'SUIUSDT', 'TONUSDT',
  'PENDLEUSDT', 'EIGENUSDT', 'TAOUSDT', 'RENDERUSDT', 'WIFUSDT'
];
const DEFAULT_FAVORITES = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'PEPEUSDT'];

// Rich Coin Directory for human-readable names and tags
export const COIN_DIRECTORY: Record<string, { base: string; name: string; tag?: string }> = {
  // Binance Alpha & Futures
  MARSUSDT: { base: 'MARS', name: 'MARSCOIN (SpaceX / Binance Futures)', tag: 'Futures/Alpha' },
  MARSCOINUSDT: { base: 'MARSCOIN', name: 'MARSCOIN (SpaceX / Binance Futures)', tag: 'Futures/Alpha' },
  '1000MARSUSDT': { base: '1000MARS', name: '1000MARS Futures', tag: 'Futures/Alpha' },

  // Majors
  BTCUSDT: { base: 'BTC', name: 'Bitcoin', tag: 'Major' },
  ETHUSDT: { base: 'ETH', name: 'Ethereum', tag: 'Major' },
  SOLUSDT: { base: 'SOL', name: 'Solana', tag: 'Major' },
  BNBUSDT: { base: 'BNB', name: 'BNB', tag: 'Major' },
  XRPUSDT: { base: 'XRP', name: 'XRP', tag: 'Major' },
  DOGEUSDT: { base: 'DOGE', name: 'Dogecoin', tag: 'Meme' },
  ADAUSDT: { base: 'ADA', name: 'Cardano', tag: 'L1' },
  AVAXUSDT: { base: 'AVAX', name: 'Avalanche', tag: 'L1' },
  SUIUSDT: { base: 'SUI', name: 'Sui Network', tag: 'L1' },
  APTUSDT: { base: 'APT', name: 'Aptos', tag: 'L1' },
  NEARUSDT: { base: 'NEAR', name: 'NEAR Protocol', tag: 'AI/L1' },
  TONUSDT: { base: 'TON', name: 'Toncoin', tag: 'L1' },
  DOTUSDT: { base: 'DOT', name: 'Polkadot', tag: 'L1' },
  LTCUSDT: { base: 'LTC', name: 'Litecoin', tag: 'Major' },
  LINKUSDT: { base: 'LINK', name: 'Chainlink (Oracle)', tag: 'Oracle' },

  // TradFi & RWA
  ONDOUSDT: { base: 'ONDO', name: 'Ondo Finance (RWA)', tag: 'TradFi/RWA' },
  PENDLEUSDT: { base: 'PENDLE', name: 'Pendle (Yield TradFi)', tag: 'TradFi/RWA' },
  MKRUSDT: { base: 'MKR', name: 'MakerDAO', tag: 'TradFi/RWA' },
  TRUUSDT: { base: 'TRU', name: 'TrueFi (Uncollateralized)', tag: 'TradFi/RWA' },
  AAVEUSDT: { base: 'AAVE', name: 'Aave Protocol', tag: 'DeFi/TradFi' },
  SNXUSDT: { base: 'SNX', name: 'Synthetix', tag: 'DeFi/TradFi' },

  // New Listings & Alpha
  EIGENUSDT: { base: 'EIGEN', name: 'EigenLayer (Restaking)', tag: 'Alpha' },
  NEIROUSDT: { base: 'NEIRO', name: 'First Neiro on ETH', tag: 'Meme/Alpha' },
  SCRUSDT: { base: 'SCR', name: 'Scroll zkRollup', tag: 'L2/Alpha' },
  HMSTRUSDT: { base: 'HMSTR', name: 'Hamster Kombat', tag: 'Gaming/Alpha' },
  CATIUSDT: { base: 'CATI', name: 'Catizen', tag: 'Gaming/Alpha' },
  DOGSUSDT: { base: 'DOGS', name: 'Dogs Community', tag: 'Meme/Alpha' },
  NOTUSDT: { base: 'NOT', name: 'Notcoin', tag: 'Ecosystem' },
  IOUSDT: { base: 'IO', name: 'io.net (GPU DePIN)', tag: 'AI/DePIN' },
  BBUSDT: { base: 'BB', name: 'BounceBit', tag: 'Alpha' },

  // AI & DePIN
  FETUSDT: { base: 'FET', name: 'ASI Alliance (FET)', tag: 'AI' },
  RENDERUSDT: { base: 'RENDER', name: 'Render Network', tag: 'AI/DePIN' },
  TAOUSDT: { base: 'TAO', name: 'Bittensor AI', tag: 'AI' },
  WLDUSDT: { base: 'WLD', name: 'Worldcoin', tag: 'AI' },
  GRTUSDT: { base: 'GRT', name: 'The Graph', tag: 'AI/Data' },
  ARUSDT: { base: 'AR', name: 'Arweave DePIN', tag: 'DePIN' },
  FILUSDT: { base: 'FIL', name: 'Filecoin DePIN', tag: 'DePIN' },
  THETAUSDT: { base: 'THETA', name: 'Theta Video AI', tag: 'AI/DePIN' },

  // Memes & Community Culture
  PEPEUSDT: { base: 'PEPE', name: 'Pepe', tag: 'Meme' },
  '1000PEPEUSDT': { base: '1000PEPE', name: 'Pepe (1000x Futures)', tag: 'Meme' },
  WIFUSDT: { base: 'WIF', name: 'dogwifhat', tag: 'Meme' },
  SHIBUSDT: { base: 'SHIB', name: 'Shiba Inu', tag: 'Meme' },
  '1000SHIBUSDT': { base: '1000SHIB', name: 'Shiba Inu (1000x)', tag: 'Meme' },
  BONKUSDT: { base: 'BONK', name: 'Bonk', tag: 'Meme' },
  '1000BONKUSDT': { base: '1000BONK', name: 'Bonk (1000x Futures)', tag: 'Meme' },
  FLOKIUSDT: { base: 'FLOKI', name: 'Floki', tag: 'Meme' },
  '1000FLOKIUSDT': { base: '1000FLOKI', name: 'Floki (1000x)', tag: 'Meme' },
  BOMEUSDT: { base: 'BOME', name: 'Book of Meme', tag: 'Meme' },
  MEMEUSDT: { base: 'MEME', name: 'Memecoin', tag: 'Meme' },
  TURBOUSDT: { base: 'TURBO', name: 'Turbo', tag: 'Meme' },

  // Layer 1 / Layer 2
  TIAUSDT: { base: 'TIA', name: 'Celestia (DA Layer)', tag: 'Modular' },
  SEIUSDT: { base: 'SEI', name: 'Sei Network', tag: 'L1' },
  ARBUSDT: { base: 'ARB', name: 'Arbitrum One', tag: 'L2' },
  OPUSDT: { base: 'OP', name: 'Optimism', tag: 'L2' },
  POLUSDT: { base: 'POL', name: 'Polygon', tag: 'L2' },
  MATICUSDT: { base: 'MATIC', name: 'Polygon (Matic)', tag: 'L2' },
  INJUSDT: { base: 'INJ', name: 'Injective Protocol', tag: 'L1/DeFi' },
  FTMUSDT: { base: 'FTM', name: 'Fantom / Sonic', tag: 'L1' },

  // DeFi
  UNIUSDT: { base: 'UNI', name: 'Uniswap DEX', tag: 'DeFi' },
  JUPUSDT: { base: 'JUP', name: 'Jupiter DEX', tag: 'DeFi' },
  LDOUSDT: { base: 'LDO', name: 'Lido DAO (Liquid Staking)', tag: 'DeFi' },
  CRVUSDT: { base: 'CRV', name: 'Curve DAO', tag: 'DeFi' },
  DYDXUSDT: { base: 'DYDX', name: 'dYdX Derivatives', tag: 'DeFi' },
  RUNEUSDT: { base: 'RUNE', name: 'THORChain', tag: 'DeFi' },
  GMXUSDT: { base: 'GMX', name: 'GMX Exchange', tag: 'DeFi' },
};

// Chinese Meme & Culture Tokens Dictionary & Presets
export const CHINESE_MEME_TOKENS: Record<string, { symbol: string; base: string; name: string; tag: string; address?: string; chain?: string }> = {
  '牛来': { symbol: 'NIULAI', base: '牛来', name: '牛来 (Niu Lai / Bull is Coming)', tag: '🇨🇳 Chinese Meme / BSC', address: '0xbeea1d618e533a387d941f58a7d4c9b7bd377777', chain: 'bsc' },
  '币安人生': { symbol: '币安人生', base: '币安人生', name: '币安人生 (Binance Life · Vanity 44444)', tag: '🇨🇳 BSC 44444 / DEX', address: '0x924fa68a0FC644485b8df8AbfA0A41C2e7744444', chain: 'bsc' },
  '龙虾': { symbol: 'LONGXIA', base: '龙虾', name: '龙虾 (Lobster / LongXia)', tag: '🇨🇳 Chinese Meme / BSC', address: '0x4444444444444444444444444444444444444444', chain: 'bsc' },
  '哈基米': { symbol: 'HAJIMI', base: '哈基米', name: '哈基米 (Hajimi / Cat)', tag: '🇨🇳 Chinese Meme / SOL', address: '9x...hajimi', chain: 'solana' },
  '我踏马来了': { symbol: '我踏马来了', base: '我踏马来了', name: '我踏马来了 (WoTaMaLaiLe · Vanity 4444)', tag: '🐎 BSC 4444 / DEX', address: '0xc51A9250795c0186a6FB4A7D20A90330651e4444', chain: 'bsc' },
  '哭哭马': { symbol: 'KUKUMA', base: '哭哭马', name: '哭哭马 (Crying Horse)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },
  '客服小何': { symbol: 'XIAOHE', base: '客服小何', name: '客服小何 (CS Xiao He)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },
  '雪球': { symbol: 'XUEQIU', base: '雪球', name: '雪球 (Snowball)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },
  '人生K线': { symbol: 'RENSHENGK', base: '人生K线', name: '人生K线 (Life K-Line)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },
  '修仙': { symbol: 'XIUXIAN', base: '修仙', name: '修仙 (Cultivation / Immortal)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },
  '老子': { symbol: 'LAOZI', base: '老子', name: '老子 (Laozi / Philosopher)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },
  '安': { symbol: 'AN', base: '安', name: '安 (An / Peace & Binance)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },
  '黑马': { symbol: 'HEIMA', base: '黑马', name: '黑马 (Dark Horse)', tag: '🇨🇳 Chinese Meme / BSC', chain: 'bsc' },

  // User Core 7 Tokens (BSC Vanity 7777 / Robinhood L2 / flapsh)
  '0xd270d4e1ec6e6e0d28c0ecb8be966ec75997ffff': { symbol: 'BNBFLAG', base: 'BNBFLAG', name: 'Binance Flag (0xd270...ffff · Vanity FFFF)', tag: '🚩 Alpha / BSC FFFF', address: '0xd270D4e1EC6e6E0d28C0ecB8BE966EC75997FFfF', chain: 'bsc' },
  'BNBFLAG': { symbol: 'BNBFLAG', base: 'BNBFLAG', name: 'Binance Flag (0xd270...ffff · Vanity FFFF)', tag: '🚩 Alpha / BSC FFFF', address: '0xd270D4e1EC6e6E0d28C0ecB8BE966EC75997FFfF', chain: 'bsc' },

  '0x2b90bb9683383b6a1440e116309ba0187ef67777': { symbol: '永生果蝇', base: '永生果蝇', name: '永生果蝇 (Fruit Fly · Vanity 7777)', tag: '🪰 Chinese Meme / BSC 7777', address: '0x2b90BB9683383B6A1440e116309Ba0187ef67777', chain: 'bsc' },
  '永生果蝇': { symbol: '永生果蝇', base: '永生果蝇', name: '永生果蝇 (Fruit Fly · Vanity 7777)', tag: '🪰 Chinese Meme / BSC 7777', address: '0x2b90BB9683383B6A1440e116309Ba0187ef67777', chain: 'bsc' },
  'GUOYING': { symbol: '永生果蝇', base: '永生果蝇', name: '永生果蝇 (Fruit Fly · Vanity 7777)', tag: '🪰 Chinese Meme / BSC 7777', address: '0x2b90BB9683383B6A1440e116309Ba0187ef67777', chain: 'bsc' },

  '0xc9d825e83aada475bd4d38c8ca984ed746277777': { symbol: 'FlapshKing', base: 'FlapshKing', name: 'Flapsh King (0xc9d8...7777 · Vanity 77777)', tag: '👑 BSC 77777 / DEX', address: '0xc9d825e83aada475bd4d38c8ca984ed746277777', chain: 'bsc' },
  'FLAPSHKING': { symbol: 'FlapshKing', base: 'FlapshKing', name: 'Flapsh King (0xc9d8...7777 · Vanity 77777)', tag: '👑 BSC 77777 / DEX', address: '0xc9d825e83aada475bd4d38c8ca984ed746277777', chain: 'bsc' },

  // User Vanity 7777 & Alpha onchain tokens
  'BNBCAT': { symbol: 'BNBCAT', base: 'BNBCAT', name: 'Binance Cat (BNBCAT · Vanity 7777)', tag: '🐱 Alpha / BSC 7777', address: '0x3EFBfFf95576e1d23cF6Ead0AcD2E73F4d6A7777', chain: 'bsc' },
  '0x3efbfff95576e1d23cf6ead0acd2e73f4d6a7777': { symbol: 'BNBCAT', base: 'BNBCAT', name: 'Binance Cat (BNBCAT · Vanity 7777)', tag: '🐱 Alpha / BSC 7777', address: '0x3EFBfFf95576e1d23cF6Ead0AcD2E73F4d6A7777', chain: 'bsc' },

  '旺财': { symbol: '旺财', base: '旺财', name: '旺财 (WangCai · Prosperity Dog · Vanity 7777)', tag: '🐶 Chinese Meme / BSC 7777', address: '0x55e73A66948d49883514E70a4a594b7CC4a87777', chain: 'bsc' },
  'WANGCAI': { symbol: '旺财', base: '旺财', name: '旺财 (WangCai · Prosperity Dog · Vanity 7777)', tag: '🐶 Chinese Meme / BSC 7777', address: '0x55e73A66948d49883514E70a4a594b7CC4a87777', chain: 'bsc' },
  '0x55e73a66948d49883514e70a4a594b7cc4a87777': { symbol: '旺财', base: '旺财', name: '旺财 (WangCai · Prosperity Dog · Vanity 7777)', tag: '🐶 Chinese Meme / BSC 7777', address: '0x55e73A66948d49883514E70a4a594b7CC4a87777', chain: 'bsc' },

  'Sue': { symbol: 'Sue', base: 'Sue', name: 'Sue (施工猫 · Construction Cat · Vanity 7777)', tag: '🏗️ Alpha / BSC 7777', address: '0x2Ab8A4Dd2191989aC2898006Df350B236D2B7777', chain: 'bsc' },
  'SUE': { symbol: 'Sue', base: 'Sue', name: 'Sue (施工猫 · Construction Cat · Vanity 7777)', tag: '🏗️ Alpha / BSC 7777', address: '0x2Ab8A4Dd2191989aC2898006Df350B236D2B7777', chain: 'bsc' },
  '施工猫': { symbol: 'Sue', base: 'Sue', name: 'Sue (施工猫 · Construction Cat · Vanity 7777)', tag: '🏗️ Chinese Meme / BSC 7777', address: '0x2Ab8A4Dd2191989aC2898006Df350B236D2B7777', chain: 'bsc' },
  '0x2ab8a4dd2191989ac2898006df350b236d2b7777': { symbol: 'Sue', base: 'Sue', name: 'Sue (施工猫 · Construction Cat · Vanity 7777)', tag: '🏗️ Alpha / BSC 7777', address: '0x2Ab8A4Dd2191989aC2898006Df350B236D2B7777', chain: 'bsc' },

  'CASHCAT': { symbol: 'CASHCAT', base: 'CASHCAT', name: 'Cash Cat (CASHCAT · Robinhood Uniswap)', tag: '💵 Robinhood L2 / DEX', address: '0x020bfC650A365f8BB26819deAAbF3E21291018b4', chain: 'robinhood' },
  '0x020bfc650a365f8bb26819deaabf3e21291018b4': { symbol: 'CASHCAT', base: 'CASHCAT', name: 'Cash Cat (CASHCAT · Robinhood Uniswap)', tag: '💵 Robinhood L2 / DEX', address: '0x020bfC650A365f8BB26819deAAbF3E21291018b4', chain: 'robinhood' },

  'HMM': { symbol: 'HMM', base: 'HMM', name: 'Thinking Cat (HMM · Robinhood Uniswap)', tag: '🤔 Robinhood L2 / DEX', address: '0x7FE995a80075dF3Dc8Ae11A9b82c7FE4202CD87f', chain: 'robinhood' },
  '0x7fe995a80075df3dc8ae11a9b82c7fe4202cd87f': { symbol: 'HMM', base: 'HMM', name: 'Thinking Cat (HMM · Robinhood Uniswap)', tag: '🤔 Robinhood L2 / DEX', address: '0x7FE995a80075dF3Dc8Ae11A9b82c7FE4202CD87f', chain: 'robinhood' },

  // User Vanity 44444 & 4444 BSC contract address keys
  '0x924fa68a0FC644485b8df8AbfA0A41C2e7744444': { symbol: '币安人生', base: '币安人生', name: '币安人生 (Binance Life · Vanity 44444)', tag: '🇨🇳 BSC 44444 / DEX', address: '0x924fa68a0FC644485b8df8AbfA0A41C2e7744444', chain: 'bsc' },
  '0xc51A9250795c0186a6FB4A7D20A90330651e4444': { symbol: '我踏马来了', base: '我踏马来了', name: '我踏马来了 (WoTaMaLaiLe · Vanity 4444)', tag: '🐎 BSC 4444 / DEX', address: '0xc51A9250795c0186a6FB4A7D20A90330651e4444', chain: 'bsc' },
};

// Common Cyrillic and Chinese aliases and project names to crypto tickers
const ALIAS_MAP: Record<string, string> = {
  '币安人生': '币安人生',
  'BINANCE LIFE': '币安人生',
  'BINANCELIFE': '币安人生',
  '我踏马来了': '我踏马来了',
  'WOTAMALAILE': '我踏马来了',
  'BNBCAT': 'BNBCAT',
  'BINANCE CAT': 'BNBCAT',
  '旺财': '旺财',
  'WANGCAI': '旺财',
  'SUE': 'Sue',
  '施工猫': 'Sue',
  'CASHCAT': 'CASHCAT',
  'CASH CAT': 'CASHCAT',
  'HMM': 'HMM',
  'THINKING CAT': 'HMM',
  'БИТКОИН': 'BTCUSDT',
  'БИТОК': 'BTCUSDT',
  'БТК': 'BTCUSDT',
  'BTC': 'BTCUSDT',
  'ЭФИР': 'ETHUSDT',
  'ЭФИРИУМ': 'ETHUSDT',
  'ЕТХ': 'ETHUSDT',
  'ETH': 'ETHUSDT',
  'СОЛАНА': 'SOLUSDT',
  'СОЛ': 'SOLUSDT',
  'SOL': 'SOLUSDT',
  'БНБ': 'BNBUSDT',
  'BNB': 'BNBUSDT',
  'ДОГИ': 'DOGEUSDT',
  'ДОГЕ': 'DOGEUSDT',
  'DOGE': 'DOGEUSDT',
  'ПЕПЕ': 'PEPEUSDT',
  'PEPE': 'PEPEUSDT',
  'РИПЛ': 'XRPUSDT',
  'РИППЛ': 'XRPUSDT',
  'XRP': 'XRPUSDT',
  'ТОН': 'TONUSDT',
  'ТОНКОИН': 'TONUSDT',
  'TON': 'TONUSDT',
  'НОТ': 'NOTUSDT',
  'НОТКОИН': 'NOTUSDT',
  'NOT': 'NOTUSDT',
  'ХОМЯК': 'HMSTRUSDT',
  'ХАМСТЕР': 'HMSTRUSDT',
  'HMSTR': 'HMSTRUSDT',
  'СУИ': 'SUIUSDT',
  'SUI': 'SUIUSDT',
  'АВАКС': 'AVAXUSDT',
  'AVAX': 'AVAXUSDT',
  'ЛАЙТ': 'LTCUSDT',
  'ЛАЙТКОИН': 'LTCUSDT',
  'LTC': 'LTCUSDT',
  'ЛИНК': 'LINKUSDT',
  'LINK': 'LINKUSDT',
  'КАРДАНО': 'ADAUSDT',
  'АДА': 'ADAUSDT',
  'ADA': 'ADAUSDT',

  // 🇨🇳 Chinese Token Direct Aliases
  '牛来': '牛来',
  '龙虾': '龙虾',
  '哈基米': '哈基米',
  '哭哭马': '哭哭马',
  '客服小何': '客服小何',
  '雪球': '雪球',
  '人生K线': '人生K线',
  '修仙': '修仙',
  '老子': '老子',
  '安': '安',
  '黑马': '黑马',
  'NIULAI': '牛来',

  // 🚀 MARSCOIN & Binance Futures Tokens
  'MARS': 'MARSUSDT',
  'MARSCOIN': 'MARSUSDT',
  'МАРС': 'MARSUSDT',
  'МАРСКОИН': 'MARSUSDT',
  '1000MARS': '1000MARSUSDT',
  '1000MARSUSDT': '1000MARSUSDT',
  '0XFE189E97832DA1573E4E4FF034F4FFC3A15C7777': 'MARSUSDT',
};

let spotSymbolsSet: Set<string> | null = null;
let futuresSymbolsSet: Set<string> | null = null;
let exchangeInfoLoadingPromise: Promise<void> | null = null;

export const symbolService = {
  /**
   * Get human-readable coin info (Base, Full Name, Tag) for any symbol
   * e.g., '1000PEPEUSDT' -> { base: '1000PEPE', name: 'Pepe (1000x Futures)', tag: 'Meme' }
   * e.g., 'ONDOUSDT' -> { base: 'ONDO', name: 'Ondo Finance (RWA)', tag: 'TradFi/RWA' }
   */
  getCoinInfo(symbol: string): { symbol: string; base: string; name: string; tag?: string } {
    const sym = (symbol || '').toUpperCase().trim();
    const raw = (symbol || '').trim();

    // Check Chinese tokens dictionary
    if (CHINESE_MEME_TOKENS[raw]) {
      const c = CHINESE_MEME_TOKENS[raw];
      return { symbol: c.symbol, base: c.base, name: c.name, tag: c.tag };
    }
    for (const [, c] of Object.entries(CHINESE_MEME_TOKENS)) {
      if (c.symbol.toUpperCase() === sym || (c.address && c.address.toLowerCase() === raw.toLowerCase())) {
        return { symbol: c.symbol, base: c.base, name: c.name, tag: c.tag };
      }
    }

    if (COIN_DIRECTORY[sym]) {
      return { symbol: sym, ...COIN_DIRECTORY[sym] };
    }

    // Check categories
    for (const cat of CATEGORIES) {
      const match = cat.symbols.find((s) => s.symbol === sym);
      if (match) {
        return { symbol: sym, base: match.base, name: match.name, tag: cat.name.replace(/[^a-zA-Z0-9 &]/g, '').trim() };
      }
    }

    // Dynamic extraction
    let clean = sym;
    const quotes = ['USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'EUR', 'TRY', 'BTC', 'ETH'];
    for (const q of quotes) {
      if (clean.endsWith(q) && clean.length > q.length) {
        clean = clean.slice(0, -q.length);
        break;
      }
    }

    const base = clean || sym;
    const readableName = base.startsWith('1000')
      ? `${base.replace('1000', '')} (1000x)`
      : base;

    return {
      symbol: sym,
      base,
      name: readableName,
      tag: 'Binance',
    };
  },

  /**
   * Resolves search string to symbol if matching aliases or directory names
   */
  resolveAliasOrName(query: string): string | null {
    const upper = query.trim().toUpperCase().replace(/[\/\-_]/g, '');
    if (!upper) return null;

    if (ALIAS_MAP[upper]) {
      return ALIAS_MAP[upper];
    }

    // Search by coin name in directory
    const lower = query.trim().toLowerCase();
    for (const [sym, info] of Object.entries(COIN_DIRECTORY)) {
      if (
        info.name.toLowerCase() === lower ||
        info.base.toLowerCase() === lower ||
        info.name.toLowerCase().startsWith(lower)
      ) {
        return sym;
      }
    }

    // Search across categories
    for (const cat of CATEGORIES) {
      for (const item of cat.symbols) {
        if (
          item.name.toLowerCase() === lower ||
          item.base.toLowerCase() === lower ||
          item.name.toLowerCase().startsWith(lower)
        ) {
          return item.symbol;
        }
      }
    }

    return null;
  },

  /**
   * Normalizes raw user input:
   * e.g. "btc" -> "BTCUSDT", "pepe" -> "PEPEUSDT", "solusdt" -> "SOLUSDT", "ETH/USDT" -> "ETHUSDT"
   */
  normalizeSymbol(rawInput: string): string {
    const alias = this.resolveAliasOrName(rawInput);
    if (alias) return alias;

    let clean = rawInput.trim().toUpperCase().replace(/[\/\-_]/g, '');
    if (!clean) return '';

    // If input contains non-alphanumeric Latin characters, strip them
    clean = clean.replace(/[^A-Z0-9]/g, '');
    if (!clean) return '';

    // If not ending in standard quote like USDT, USDC, BUSD, TUSD, FDUSD, BTC, ETH -> append USDT
    const quotes = ['USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'EUR', 'TRY', 'BTC', 'ETH'];
    const hasQuote = quotes.some((q) => clean.endsWith(q) && clean.length > q.length);
    if (!hasQuote) {
      clean = `${clean}USDT`;
    }
    return clean;
  },

  /**
   * Fetch and cache exchangeInfo from Binance
   */
  async loadExchangeInfo(): Promise<void> {
    if (spotSymbolsSet) return;
    if (exchangeInfoLoadingPromise) return exchangeInfoLoadingPromise;

    exchangeInfoLoadingPromise = (async () => {
      try {
        const data = await binanceRest.getExchangeInfo();
        if (data && Array.isArray(data.symbols)) {
          const set = new Set<string>();
          data.symbols.forEach((s: any) => {
            if (s.status === 'TRADING' || s.status === 'BREAK') {
              set.add(s.symbol);
            }
          });
          spotSymbolsSet = set;
        }
      } catch (err) {
        console.warn('[SymbolService] Could not load spot exchange info:', err);
        // Fallback default set
        spotSymbolsSet = new Set(
          CATEGORIES.flatMap((c) => c.symbols.map((s) => s.symbol))
        );
      }
    })();

    return exchangeInfoLoadingPromise;
  },

  /**
   * Verify if a symbol exists on Binance (Spot or USDⓈ-M Futures)
   * Tries variations: USDT, USDC, FDUSD, 1000-multipliers for meme contracts
   */
  async validateSpotSymbol(symbol: string): Promise<{ exists: boolean; formatted: string }> {
    const alias = this.resolveAliasOrName(symbol);
    const target = alias || symbol;

    // Sanitize to alphanumeric
    const raw = target.trim().toUpperCase().replace(/[\/\-_]/g, '').replace(/[^A-Z0-9]/g, '');
    if (!raw || raw.length < 2 || raw.length > 20) {
      return { exists: false, formatted: '' };
    }

    await this.loadExchangeInfo();

    // Extract base cleanly by removing known quote suffixes
    const quotes = ['USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'EUR', 'TRY', 'BTC', 'ETH'];
    let base = raw;
    for (const q of quotes) {
      if (raw.endsWith(q) && raw.length > q.length) {
        base = raw.slice(0, -q.length);
        break;
      }
    }

    const candidateSet = new Set<string>([
      `${base}USDT`,
      raw,
      `${base}USDC`,
      `${base}FDUSD`,
      `1000${base}USDT`,
      base.replace(/^1000/, '') + 'USDT',
    ]);

    const candidates = Array.from(candidateSet).filter((c) => /^[A-Z0-9]{3,15}$/.test(c));

    // 0. Instant Directory match
    for (const cand of candidates) {
      if (COIN_DIRECTORY[cand]) {
        return { exists: true, formatted: cand };
      }
    }

    // 1. Check Spot Exchange Info
    if (spotSymbolsSet && spotSymbolsSet.size > 0) {
      for (const cand of candidates) {
        if (spotSymbolsSet.has(cand)) {
          return { exists: true, formatted: cand };
        }
      }
    }

    // 2. Direct check on Spot REST
    for (const cand of candidates.slice(0, 3)) {
      try {
        const ticker = await binanceRest.get24hTicker(cand);
        if (ticker && (ticker as any).lastPrice) {
          return { exists: true, formatted: cand };
        }
      } catch {}
    }

    // 3. Check Futures
    for (const cand of candidates) {
      try {
        const premium = await binanceRest.getPremiumIndex(cand);
        if (premium && premium.markPrice && !isNaN(parseFloat(premium.markPrice))) {
          return { exists: true, formatted: cand };
        }
      } catch {}
    }

    return { exists: false, formatted: candidates[0] || raw };
  },

  /**
   * Check if a symbol has a Futures contract (funding, mark price, OI, liquidations)
   */
  async checkFuturesAvailable(symbol: string): Promise<boolean> {
    const sym = (symbol || '').toUpperCase().trim();
    if (sym.includes('MARS') || sym.includes('1000MARS')) return true;
    try {
      const premium = await binanceRest.getPremiumIndex(symbol);
      return !!(premium && premium.markPrice && !isNaN(parseFloat(premium.markPrice)));
    } catch {
      return false;
    }
  },

  /**
   * History of last 20-30 viewed pairs stored in localStorage
   */
  getRecentSymbols(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, MAX_RECENT_SYMBOLS);
        }
      }
    } catch {}
    return DEFAULT_RECENTS.slice(0, MAX_RECENT_SYMBOLS);
  },

  addRecentSymbol(symbol: string): string[] {
    const norm = symbol.toUpperCase().trim();
    if (!norm) return this.getRecentSymbols();
    const current = this.getRecentSymbols().filter((s) => s !== norm);
    const updated = [norm, ...current].slice(0, MAX_RECENT_SYMBOLS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  removeRecentSymbol(symbol: string): string[] {
    const norm = symbol.toUpperCase().trim();
    const current = this.getRecentSymbols().filter((s) => s !== norm);
    const updated = current.length > 0 ? current : ['BTCUSDT'];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  clearRecentSymbols(): string[] {
    const fallback = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {}
    return fallback;
  },

  /**
   * Favorites management stored in localStorage
   */
  getFavoriteSymbols(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_FAVORITES;
  },

  isFavorite(symbol: string): boolean {
    const norm = symbol.toUpperCase().trim();
    const favs = this.getFavoriteSymbols();
    return favs.includes(norm);
  },

  toggleFavorite(symbol: string): string[] {
    const norm = symbol.toUpperCase().trim();
    if (!norm) return this.getFavoriteSymbols();
    const favs = this.getFavoriteSymbols();
    let updated: string[];
    if (favs.includes(norm)) {
      updated = favs.filter((s) => s !== norm);
    } else {
      updated = [norm, ...favs];
    }
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  addFavorite(symbol: string): string[] {
    const norm = symbol.toUpperCase().trim();
    if (!norm) return this.getFavoriteSymbols();
    const favs = this.getFavoriteSymbols();
    if (!favs.includes(norm)) {
      const updated = [norm, ...favs];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    }
    return favs;
  },

  removeFavorite(symbol: string): string[] {
    const norm = symbol.toUpperCase().trim();
    const favs = this.getFavoriteSymbols();
    const updated = favs.filter((s) => s !== norm);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },
};
