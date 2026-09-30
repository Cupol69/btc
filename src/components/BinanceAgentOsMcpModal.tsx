import React, { useState, useEffect } from 'react';
import { binanceRest } from '../services/binanceRest';
import {
  Cpu,
  CheckCircle,
  Copy,
  Terminal,
  Play,
  Layers,
  X,
  RefreshCw,
  ExternalLink,
  Code2,
  Share2,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface BinanceAgentOsMcpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
}

export const BinanceAgentOsMcpModal: React.FC<BinanceAgentOsMcpModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
}) => {
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<string>('binance_get_liquidation_clusters');
  const [testSymbol, setTestSymbol] = useState<string>(currentSymbol || 'BTCUSDT');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'TOOLS' | 'TESTER' | 'INTEGRATE'>('TOOLS');

  const mcpUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : '/api/mcp';

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await binanceRest.getMcpStatus();
      if (data) setStatus(data);
    } catch (err) {
      console.warn('Failed to load MCP status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setTestSymbol(currentSymbol || 'BTCUSDT');
    }
  }, [isOpen, currentSymbol]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mcpUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleRunTool = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const args: any = { symbol: testSymbol };
      if (selectedTool === 'binance_get_ticker') {
        args.market = 'SPOT';
      } else if (selectedTool === 'binance_get_orderbook_imbalance') {
        args.limit = 50;
      } else if (selectedTool === 'binance_get_cvd_delta') {
        args.interval = '15m';
      } else if (selectedTool === 'binance_get_smart_money_divergence') {
        args.period = '1h';
      } else if (selectedTool === 'dex_get_pool_metrics') {
        args.tokenOrContract = testSymbol || '0xFe189E97832DA1573e4e4Ff034F4fFC3a15c7777';
      } else if (selectedTool === 'dex_security_and_contract_audit') {
        args.contractAddress = testSymbol?.startsWith('0x') ? testSymbol : '0xFe189E97832DA1573e4e4Ff034F4fFC3a15c7777';
        args.chainId = '56';
      } else if (selectedTool === 'onchain_get_smart_money_activity') {
        args.token = testSymbol || 'MARS';
        args.tier = 'ALL';
        args.chain = 'ALL';
      } else if (selectedTool === 'onchain_get_syndicate_cluster_graph') {
        args.tokenAddress = testSymbol?.startsWith('0x') ? testSymbol : '0xFe189E97832DA1573e4e4Ff034F4fFC3a15c7777';
        args.network = 'bsc';
        args.limit = 20;
      } else if (selectedTool === 'cross_market_get_cme_and_etf_intelligence') {
        args.symbol = testSymbol || 'BTCUSDT';
      } else if (selectedTool === 'bstocks_get_basket_rotation_radar') {
        args.basket = 'ALL';
      }

      const res = await binanceRest.callMcpTool(selectedTool, args);
      setTestResult(res?.result || res || { error: 'No response' });
      loadStatus(); // refresh invocations count
    } catch (err: any) {
      setTestResult({ error: err.message || 'Execution failed' });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  const toolsList = [
    {
      name: 'binance_get_ticker',
      title: '24h Market Ticker',
      description: 'Real-time 24h ticker metrics, price velocity, 24h high/low and volumes.',
    },
    {
      name: 'binance_get_orderbook_imbalance',
      title: 'Order Book Depth Imbalance',
      description: 'Calculates notional USD bid/ask volumes and dominant buyer/seller liquidity.',
    },
    {
      name: 'binance_get_derivatives_sentiment',
      title: 'Derivatives Health & Basis APR',
      description: 'Funding rate (8h), Mark price, Open Interest and Contango vs Backwardation.',
    },
    {
      name: 'binance_get_smart_money_divergence',
      title: 'Smart Money Divergence',
      description: 'Top Trader Accounts Ratio vs Position Volume Ratio (whales vs retail crowd).',
    },
    {
      name: 'binance_get_liquidation_clusters',
      title: 'Liquidation Density Clusters',
      description: 'High-leverage wipeout zones (10x-100x), magnet prices, and cascade squeeze risks.',
    },
    {
      name: 'binance_get_cvd_delta',
      title: 'CVD & Aggressive Taker Flow',
      description: 'Cumulative Volume Delta measuring market buy vs sell aggression.',
    },
    {
      name: 'binance_detect_market_regime',
      title: 'Market Regime Classifier',
      description: 'Identifies Squeeze Risk, Trend Expansion, Distribution, or Liquidity Harvesting.',
    },
    {
      name: 'dex_get_pool_metrics',
      title: 'DEX Screener Pool Engine',
      description: 'Multi-chain pool liquidity TVL, 24h volume, buy/sell txn flows across BSC, ETH, Solana.',
    },
    {
      name: 'dex_security_and_contract_audit',
      title: 'GoPlus Smart Contract Audit',
      description: 'Honeypot detection, buy/sell tax rate, mint & proxy functions, blacklist validation.',
    },
    {
      name: 'onchain_get_smart_money_activity',
      title: 'Smart Money Radar & Snipers',
      description: 'Block-0 Snipers, Profit Realizers, Win rates, realized PnL and insider cash-out ratios.',
    },
    {
      name: 'onchain_get_syndicate_cluster_graph',
      title: 'Bitquery Syndicate Clustering',
      description: 'GraphQL multi-wallet genesis mint traces, deployer links and market maker wash loops.',
    },
    {
      name: 'cross_market_get_cme_and_etf_intelligence',
      title: 'CME Futures & ETF Grounding',
      description: 'CME Friday close gap tracker, basis carry APR, and US Spot ETF daily flows.',
    },
    {
      name: 'bstocks_get_basket_rotation_radar',
      title: 'bStocks Basket Rotation',
      description: 'Tokenized equity meme baskets (QQQB, TSLAB, SPCXB) lead time and AMM divergence.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="binance-mcp-modal"
        className="bg-slate-900 border border-amber-500/30 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  Binance Agent OS • Model Context Protocol (MCP) Server
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                JSON-RPC 2.0 • Protocol 2024-11-05 • Read-Only Market Intelligence Suite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Endpoint Bar */}
        <div className="bg-slate-950 p-3 px-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">MCP Connection Endpoint:</span>
            <code className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-amber-300 font-semibold selection:bg-amber-500/30">
              {mcpUrl}
            </code>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              title="Copy URL"
            >
              {copiedUrl ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Tools: <strong className="text-white">{status?.toolsCount ?? 7}</strong></span>
            <span>•</span>
            <span>Invocations: <strong className="text-amber-400">{status?.invocationsCount ?? 0}</strong></span>
            <span>•</span>
            <button
              onClick={loadStatus}
              disabled={loadingStatus}
              className="hover:text-amber-300 transition-colors p-0.5"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 font-mono text-xs gap-2">
          <button
            onClick={() => setActiveTab('TOOLS')}
            className={`pb-2 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'TOOLS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Tool Catalog ({toolsList.length})
          </button>
          <button
            onClick={() => setActiveTab('TESTER')}
            className={`pb-2 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'TESTER'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Interactive Live Tester
          </button>
          <button
            onClick={() => setActiveTab('INTEGRATE')}
            className={`pb-2 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'INTEGRATE'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> AI Agent Integration Config
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: TOOL CATALOG */}
          {activeTab === 'TOOLS' && (
            <div className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Сервер <strong>Binance Agent OS MCP</strong> строго ограничен публичными аналитическими запросами (Read-Only). Все 7 инструментов предоставляют стандартизированные данные стакана, ликвидаций, деривативов и ончейн-метрик для ИИ-агентов (Gemini, Claude, Cursor, ChatGPT).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {toolsList.map((tool) => (
                  <div
                    key={tool.name}
                    className="bg-slate-950/70 rounded-xl border border-slate-800 p-3 hover:border-amber-500/40 transition-colors flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-amber-400" />
                          {tool.title}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          GET / POST
                        </span>
                      </div>
                      <code className="text-[10px] text-amber-300/90 font-mono block mt-0.5">
                        {tool.name}
                      </code>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTool(tool.name);
                        setActiveTab('TESTER');
                      }}
                      className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1 border-t border-slate-850"
                    >
                      <span>Запустить тест вживую</span> →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE TESTER */}
          {activeTab === 'TESTER' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Выбор MCP Инструмента:</label>
                    <select
                      value={selectedTool}
                      onChange={(e) => setSelectedTool(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {toolsList.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Торговый символ (Pair):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testSymbol}
                        onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                        placeholder="BTCUSDT"
                        className="flex-1 bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleRunTool}
                        disabled={testing}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs"
                      >
                        {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        <span>Выполнить</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live JSON Output Screen */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-850 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    MCP JSON-RPC Execution Output
                  </span>
                  <span>
                    Tool: <strong className="text-amber-400">{selectedTool}</strong> • Target: <strong className="text-white">{testSymbol}</strong>
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                  {testing ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span className="text-xs">Вызов инструмента через Binance MCP Server...</span>
                    </div>
                  ) : testResult ? (
                    <pre className="text-emerald-300 text-[11px] leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/20">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Нажмите кнопку «Выполнить», чтобы запустить {selectedTool} в реальном времени.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRATION INSTRUCTIONS */}
          {activeTab === 'INTEGRATE' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-white font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Подключение к Cursor / Windsurf / Claude Desktop
                </h4>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Добавьте конфигурацию в ваш <code>claude_desktop_config.json</code> или настройки Cursor MCP:
                </p>
                <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-amber-300 text-[11px] overflow-x-auto">
{`{
  "mcpServers": {
    "binance-agent-os": {
      "url": "${mcpUrl}",
      "transport": "http"
    }
  }
}`}
                </pre>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-white font-bold flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  Прямой JSON-RPC 2.0 запрос (Python / TypeScript / cURL)
                </h4>
                <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-cyan-300 text-[11px] overflow-x-auto">
{`curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "binance_get_liquidation_clusters",
      "arguments": { "symbol": "BTCUSDT" }
    }
  }'`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Binance Agent OS Core v1.0.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
