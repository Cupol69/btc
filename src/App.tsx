import React, { useState, useEffect } from 'react';
import { RobinhoodChainExplorerModal } from './components/RobinhoodChainExplorerModal';
import { BinanceAgentOsMcpModal } from './components/BinanceAgentOsMcpModal';
import { Header, DashboardTab } from './components/Header';
import { PriceChart } from './components/PriceChart';
import { MarketOverviewPanel } from './components/MarketOverviewPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { OrderBookImbalance } from './components/OrderBookImbalance';
import { AICommentary } from './components/AICommentary';
import { MultiTimeframePanel } from './components/MultiTimeframePanel';
import { SentimentGauge } from './components/SentimentGauge';
import { SessionMatrixMap } from './components/SessionMatrixMap';
import { DexAlphaIntelligenceHub } from './components/DexAlphaIntelligenceHub';
import { CrossMarketIntelligence } from './components/CrossMarketIntelligence';
import { MarketEventTimers } from './components/MarketEventTimers';
import { SmartMoneyDivergenceCard } from './components/SmartMoneyDivergenceCard';
import { LiquidationDensityZones } from './components/LiquidationDensityZones';
import { BStocksSprintHub } from './components/BStocksSprintHub';
import { MemeFilterRadar } from './components/MemeFilterRadar';
import { ObsidianKnowledgeGraphHub } from './components/ObsidianKnowledgeGraphHub';
import { MarketAnomalyBanner } from './components/MarketAnomalyBanner';
import { useMarketData } from './hooks/useMarketData';
import {
  BarChart3,
  BrainCircuit,
  Globe,
  Magnet,
  Clock,
  Network,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  Flame,
  Layers,
  Sparkles,
} from 'lucide-react';

export type IntelSubTab = 'ANALYTICS' | 'AI_BRAIN' | 'CROSS_MARKET' | 'LIQUIDATIONS' | 'TIMERS' | 'MULTI_TF' | 'ALL_GRID';

const QUICK_PAIRS = [
  { symbol: 'BTCUSDT', label: 'BTC' },
  { symbol: 'ETHUSDT', label: 'ETH' },
  { symbol: 'SOLUSDT', label: 'SOL' },
  { symbol: 'BNBUSDT', label: 'BNB' },
  { symbol: 'DOGEUSDT', label: 'DOGE' },
  { symbol: 'PEPEUSDT', label: 'PEPE' },
  { symbol: 'SUIUSDT', label: 'SUI' },
];

export default function App() {
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>('TERMINAL');
  const [activeIntelTab, setActiveIntelTab] = useState<IntelSubTab>('ANALYTICS');
  const [isWatchlistExpanded, setIsWatchlistExpanded] = useState(false);
  const [isRobinhoodModalOpen, setIsRobinhoodModalOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState('BTCUSDT');
  const [activeInterval, setActiveInterval] = useState('15m');
  const [orderBookDepth] = useState(20);
  const [auditInitialAddress, setAuditInitialAddress] = useState<string | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWidescreen, setIsWidescreen] = useState(false);

  const {
    ticker,
    klines,
    orderBook,
    premiumIndex,
    fundingInfo,
    openInterest,
    oiHistory,
    topTraderRatio,
    globalRatio,
    takerRatio,
    liquidations,
    allTickers,
    crossMarket,
    imbalance,
    basis,
    sentiment,
    cvdData,
    trends,
    anomalies,
    dumpRisk,
    tacticalPlan,
    smartMoneyDivergence,
    marketRegime,
    commentaryPayload,
    isLoading,
    refreshAll,
    hasFutures,
    generateAiCommentary,
  } = useMarketData(currentSymbol, activeInterval, orderBookDepth);

  const currentPrice = parseFloat(ticker?.lastPrice || '0');
  const priceChange = parseFloat(ticker?.priceChangePercent || '0');
  const isPositive = priceChange >= 0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div id="terminal-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        currentSymbol={currentSymbol}
        onSymbolChange={(s) => setCurrentSymbol(s)}
        ticker={ticker}
        premiumIndex={premiumIndex}
        hasFutures={hasFutures}
        activeInterval={activeInterval}
        onIntervalChange={setActiveInterval}
        onManualRefresh={refreshAll}
        isLoading={isLoading}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isWidescreen={isWidescreen}
        onToggleWidescreen={() => setIsWidescreen(!isWidescreen)}
        activeTab={activeDashboardTab}
        onTabChange={setActiveDashboardTab}
        onOpenMcpModal={() => setIsMcpModalOpen(true)}
      />

      <main className={`flex-1 p-3 sm:p-5 ${isWidescreen ? 'max-w-[2100px]' : 'max-w-7xl'} w-full mx-auto space-y-4`}>
        {/* TAB 1: Main Trading & Analytics Terminal */}
        {activeDashboardTab === 'TERMINAL' && (
          <div className="space-y-4 animate-fadeIn">
            {/* 1. Top Market Anomalies Banner */}
            <MarketAnomalyBanner anomalies={anomalies} />

            {/* 2. Quick Symbol Bar & Watchlist Toggle (Clean, Non-Intrusive) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 sm:px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 text-[11px] font-sans">Пара:</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-amber-400">
                  <span>{currentSymbol}</span>
                  <span className="text-white ml-1">
                    ${currentPrice > 0 ? (currentPrice >= 1 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : currentPrice.toFixed(4)) : '—'}
                  </span>
                  <span className={`text-[10px] ml-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-800 hidden md:block" />

                {/* Quick Switch Pills */}
                <div className="hidden lg:flex items-center gap-1">
                  {QUICK_PAIRS.map((qp) => {
                    const isCur = currentSymbol === qp.symbol;
                    return (
                      <button
                        key={qp.symbol}
                        onClick={() => setCurrentSymbol(qp.symbol)}
                        className={`px-2 py-0.5 rounded text-[11px] transition ${
                          isCur
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
                        }`}
                      >
                        {qp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Watchlist / Market Screener Drawer Toggle Button */}
              <button
                onClick={() => setIsWatchlistExpanded(!isWatchlistExpanded)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isWatchlistExpanded
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
                title="Показать / скрыть панель категорий и поиска рынков"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>{isWatchlistExpanded ? 'Скрыть список рынков' : 'Все рынки & Скринер'}</span>
                {isWatchlistExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Market Overview Drawer (When expanded, displays full width with zero cramming) */}
            {isWatchlistExpanded && (
              <div className="animate-fadeIn">
                <MarketOverviewPanel
                  topTickers={allTickers}
                  currentSymbol={currentSymbol}
                  onSelectSymbol={(s) => {
                    setCurrentSymbol(s);
                    setIsWatchlistExpanded(false);
                  }}
                />
              </div>
            )}

            {/* 3. PRIMARY TRADING DECK (Chart + Order Book side-by-side like Binance Pro) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* Left Column: Candlestick Price Chart (8 cols on XL) */}
              <div className="xl:col-span-8 space-y-4">
                <PriceChart
                  symbol={currentSymbol}
                  klines={klines}
                  activeInterval={activeInterval}
                  onIntervalChange={setActiveInterval}
                  markPrice={parseFloat(premiumIndex?.markPrice || ticker?.lastPrice || '0')}
                  tacticalPlan={tacticalPlan}
                  dumpRisk={dumpRisk}
                />
              </div>

              {/* Right Column: Order Book Imbalance & Flow Diagnostics (4 cols on XL) */}
              <div className="xl:col-span-4 space-y-3">
                <OrderBookImbalance
                  orderBook={orderBook}
                  imbalance={imbalance}
                  currentPrice={currentPrice}
                  selectedDepth={orderBookDepth}
                />

                {/* Compact Dual Cards: Smart Money & Sentiment Gauge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                  <SmartMoneyDivergenceCard
                    divergence={smartMoneyDivergence}
                    symbol={currentSymbol}
                  />

                  <SentimentGauge
                    sentiment={sentiment}
                    topTraderRatio={topTraderRatio}
                    globalRatio={globalRatio}
                    takerRatio={takerRatio}
                    fundingRate={parseFloat(fundingInfo?.fundingRate || premiumIndex?.lastFundingRate || '0.0001')}
                    hasFutures={hasFutures}
                  />
                </div>
              </div>
            </div>

            {/* 4. DEEP FORENSICS & INTELLIGENCE DECK (Organized Modular Tabs) */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-xl space-y-4">
              {/* Modular Navigation Switcher */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <button
                    onClick={() => setActiveIntelTab('ANALYTICS')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      activeIntelTab === 'ANALYTICS'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>1. Деривативы & CVD</span>
                  </button>

                  <button
                    onClick={() => setActiveIntelTab('AI_BRAIN')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all relative ${
                      activeIntelTab === 'AI_BRAIN'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                        : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800'
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. AI Аналитик (Gemini)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>

                  <button
                    onClick={() => setActiveIntelTab('CROSS_MARKET')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      activeIntelTab === 'CROSS_MARKET'
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>3. TradFi & ETF Потоки</span>
                  </button>

                  <button
                    onClick={() => setActiveIntelTab('LIQUIDATIONS')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      activeIntelTab === 'LIQUIDATIONS'
                        ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Magnet className="w-3.5 h-3.5 text-rose-400" />
                    <span>4. Карта Ликвидаций</span>
                  </button>

                  <button
                    onClick={() => setActiveIntelTab('TIMERS')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      activeIntelTab === 'TIMERS'
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>5. Таймеры Сессий</span>
                  </button>

                  <button
                    onClick={() => setActiveIntelTab('MULTI_TF')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      activeIntelTab === 'MULTI_TF'
                        ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>6. Multi-TF Тренды</span>
                  </button>
                </div>

                {/* Right side: All Panels Grid Toggle for 27" Ultra-Wide Screens */}
                <button
                  onClick={() => setActiveIntelTab(activeIntelTab === 'ALL_GRID' ? 'ANALYTICS' : 'ALL_GRID')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer border ${
                    activeIntelTab === 'ALL_GRID'
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                  title="Отобразить все аналитические модули одновременно сеткой"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{activeIntelTab === 'ALL_GRID' ? 'Свернуть в табы' : 'Сетка всех окон'}</span>
                </button>
              </div>

              {/* Tab 1 Content: Derivatives, Basis, OI, CVD & Taker Flow */}
              {activeIntelTab === 'ANALYTICS' && (
                <div className="animate-fadeIn">
                  <AnalyticsPanel
                    basis={basis}
                    openInterest={openInterest}
                    oiHistory={oiHistory}
                    takerRatio={takerRatio}
                    liquidations={liquidations}
                    cvdData={cvdData}
                    timeframe={activeInterval}
                    symbol={currentSymbol}
                    hasFutures={hasFutures}
                    priceChange24h={priceChange}
                  />
                </div>
              )}

              {/* Tab 2 Content: AI Market Intelligence & Tactical Commentary */}
              {activeIntelTab === 'AI_BRAIN' && (
                <div className="animate-fadeIn">
                  <AICommentary
                    payload={commentaryPayload}
                    isLoading={isLoading}
                    onGenerate={generateAiCommentary}
                    marketRegime={marketRegime}
                    tacticalPlan={tacticalPlan}
                  />
                </div>
              )}

              {/* Tab 3 Content: TradFi, CME Globex & ETF Flows */}
              {activeIntelTab === 'CROSS_MARKET' && (
                <div className="animate-fadeIn">
                  <CrossMarketIntelligence
                    data={crossMarket}
                    currentSymbol={currentSymbol}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Tab 4 Content: Liquidation Clusters & Density Zones */}
              {activeIntelTab === 'LIQUIDATIONS' && (
                <div className="animate-fadeIn">
                  <LiquidationDensityZones
                    symbol={currentSymbol}
                    currentPrice={currentPrice}
                  />
                </div>
              )}

              {/* Tab 5 Content: Institutional Timers, Expirations & Funding */}
              {activeIntelTab === 'TIMERS' && (
                <div className="animate-fadeIn">
                  <MarketEventTimers
                    currentSymbol={currentSymbol}
                    premiumIndex={premiumIndex}
                    fundingInfo={fundingInfo}
                    currentPrice={currentPrice}
                  />
                </div>
              )}

              {/* Tab 6 Content: Multi-Timeframe Trend Alignment */}
              {activeIntelTab === 'MULTI_TF' && (
                <div className="animate-fadeIn">
                  <MultiTimeframePanel
                    trends={trends}
                    onSelectTimeframe={setActiveInterval}
                    activeTimeframe={activeInterval}
                  />
                </div>
              )}

              {/* View All: Clean Multi-Window Grid for Power Users */}
              {activeIntelTab === 'ALL_GRID' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AnalyticsPanel
                      basis={basis}
                      openInterest={openInterest}
                      oiHistory={oiHistory}
                      takerRatio={takerRatio}
                      liquidations={liquidations}
                      cvdData={cvdData}
                      timeframe={activeInterval}
                      symbol={currentSymbol}
                      hasFutures={hasFutures}
                      priceChange24h={priceChange}
                    />

                    <AICommentary
                      payload={commentaryPayload}
                      isLoading={isLoading}
                      onGenerate={generateAiCommentary}
                      marketRegime={marketRegime}
                      tacticalPlan={tacticalPlan}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <CrossMarketIntelligence
                      data={crossMarket}
                      currentSymbol={currentSymbol}
                      isLoading={isLoading}
                    />

                    <div className="space-y-4">
                      <LiquidationDensityZones
                        symbol={currentSymbol}
                        currentPrice={currentPrice}
                      />
                      <MarketEventTimers
                        currentSymbol={currentSymbol}
                        premiumIndex={premiumIndex}
                        fundingInfo={fundingInfo}
                        currentPrice={currentPrice}
                      />
                      <MultiTimeframePanel
                        trends={trends}
                        onSelectTimeframe={setActiveInterval}
                        activeTimeframe={activeInterval}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEXC Global Meme Screener & Funnel Radar */}
        {activeDashboardTab === 'MEME_FILTER' && (
          <div className="space-y-4 animate-fadeIn">
            <MemeFilterRadar
              onOpenAuditForToken={(contractAddr) => {
                setAuditInitialAddress(contractAddr);
                setActiveDashboardTab('DEX_ALPHA_HUB');
              }}
              onSendToTerminal={(sym) => {
                setCurrentSymbol(sym);
                setActiveDashboardTab('TERMINAL');
              }}
            />
          </div>
        )}

        {/* TAB 3: DEX & Alpha Intelligence Super-Hub */}
        {activeDashboardTab === 'DEX_ALPHA_HUB' && (
          <div className="space-y-4 animate-fadeIn">
            <DexAlphaIntelligenceHub
              currentSymbol={currentSymbol}
              onSelectSymbol={(s) => setCurrentSymbol(s)}
              onSwitchToTerminal={() => setActiveDashboardTab('TERMINAL')}
              initialTokenAddress={auditInitialAddress}
            />
          </div>
        )}

        {/* TAB 4: bStocks Sprint Hub */}
        {activeDashboardTab === 'BSTOCKS_SPRINT' && (
          <div className="space-y-4 animate-fadeIn">
            <BStocksSprintHub
              onOpenAuditForToken={(contractAddr) => {
                setAuditInitialAddress(contractAddr);
                setActiveDashboardTab('DEX_ALPHA_HUB');
              }}
              onSelectSymbol={(s) => {
                setCurrentSymbol(s);
                setActiveDashboardTab('TERMINAL');
              }}
            />
          </div>
        )}

        {/* TAB 5: Global Trading Sessions Map & AI Nexus */}
        {activeDashboardTab === 'SESSIONS_MAP' && (
          <div className="space-y-4 animate-fadeIn">
            <SessionMatrixMap
              currentSymbol={currentSymbol}
              onSelectSymbol={(s) => setCurrentSymbol(s)}
              klines={klines}
              currentPrice={currentPrice}
              onSwitchToTerminalTab={() => setActiveDashboardTab('TERMINAL')}
            />
          </div>
        )}

        {/* TAB 6: Obsidian Knowledge Graph & Wallet Clustering */}
        {activeDashboardTab === 'KNOWLEDGE_GRAPH' && (
          <div className="space-y-4 animate-fadeIn">
            <ObsidianKnowledgeGraphHub
              currentSymbol={currentSymbol}
              onSelectSymbol={(s) => setCurrentSymbol(s)}
              onOpenAuditForToken={(contractAddr) => {
                setAuditInitialAddress(contractAddr);
                setActiveDashboardTab('DEX_ALPHA_HUB');
              }}
            />
          </div>
        )}
      </main>

      {/* RobinScan (Robinhood Chain L2 Explorer by Etherscan) Modal */}
      <RobinhoodChainExplorerModal
        isOpen={isRobinhoodModalOpen}
        onClose={() => setIsRobinhoodModalOpen(false)}
      />

      {/* Binance Agent OS MCP Server Control Modal */}
      {isMcpModalOpen && (
        <BinanceAgentOsMcpModal
          isOpen={isMcpModalOpen}
          onClose={() => setIsMcpModalOpen(false)}
          currentSymbol={currentSymbol}
        />
      )}
    </div>
  );
}
