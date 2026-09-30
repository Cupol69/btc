import React, { useState } from 'react';
import {
  ExternalLink,
  Search,
  X,
  Copy,
  Check,
  Globe,
  Layers,
  Cpu,
  ShieldCheck,
  Radio,
  Share2,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface RobinhoodChainExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const RobinhoodChainExplorerModal: React.FC<RobinhoodChainExplorerModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      window.open('https://robinscan.io', '_blank', 'noopener,noreferrer');
      return;
    }
    // Determine whether it's tx hash (66 chars starting with 0x), address (42 chars), or block number
    if (q.startsWith('0x') && q.length === 66) {
      window.open(`https://robinscan.io/tx/${q}`, '_blank', 'noopener,noreferrer');
    } else if (q.startsWith('0x') && q.length === 42) {
      window.open(`https://robinscan.io/address/${q}`, '_blank', 'noopener,noreferrer');
    } else if (/^\d+$/.test(q)) {
      window.open(`https://robinscan.io/block/${q}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://robinscan.io/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const ETHERSCAN_FAMILY = [
    {
      name: 'RobinScan (Robinhood Chain)',
      tag: 'NEW L2',
      url: 'https://robinscan.io',
      altUrl: 'https://robin.etherscan.io',
      blockscoutUrl: 'https://robinhoodchain.blockscout.com',
      chainId: 4663,
      type: 'Arbitrum Orbit L2',
      status: 'ONLINE',
      highlight: true,
      description: 'Официальный блок-эксплорер для Robinhood Chain от команды Etherscan',
    },
    {
      name: 'Etherscan (Ethereum)',
      tag: 'L1',
      url: 'https://etherscan.io',
      chainId: 1,
      type: 'Ethereum Mainnet',
      status: 'ONLINE',
      highlight: false,
      description: 'Главный ончейн-эксплорер экосистемы Ethereum',
    },
    {
      name: 'BscScan (BNB Chain)',
      tag: 'L1',
      url: 'https://bscscan.com',
      chainId: 56,
      type: 'BNB Smart Chain',
      status: 'ONLINE',
      highlight: false,
      description: 'Эксплорер для BSC, смарт-контрактов PancakeSwap и мем-токенов',
    },
    {
      name: 'BaseScan (Base)',
      tag: 'L2',
      url: 'https://basescan.org',
      chainId: 8453,
      type: 'OP Stack L2',
      status: 'ONLINE',
      highlight: false,
      description: 'Эксплорер для сети Coinbase Base',
    },
    {
      name: 'Arbiscan (Arbitrum One)',
      tag: 'L2',
      url: 'https://arbiscan.io',
      chainId: 42161,
      type: 'Arbitrum Nitro',
      status: 'ONLINE',
      highlight: false,
      description: 'Эксплорер Arbitrum One от команды Etherscan',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl flex flex-col bg-slate-950 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>RobinScan Explorer</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-mono font-bold">
                    Powered by Etherscan
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Официальный эксплорер сети Robinhood Chain (Arbitrum Orbit L2, Chain ID: 4663)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://x.com/etherscan/status/2099482598464720972"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              title="Официальный анонс Etherscan в X (Twitter)"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Анонс Etherscan</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Official RobinScan Banner Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-white text-sm">
                  RobinScan & Robinhood Chain добавлены в обозреватели
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://robinscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  <span>Открыть robinscan.io</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Etherscan официально развернул выделенный блокчейн-эксплорер <strong>RobinScan</strong> для сети <strong>Robinhood Chain</strong>. Сеть работает как Layer-2 роллап на стеке <strong>Arbitrum Orbit</strong> с расчетом в Ethereum и нативной поддержкой Web3-кошелька Robinhood Wallet.
            </p>

            {/* Quick Network Parameters Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Chain ID</span>
                <span className="font-bold text-emerald-400">4663</span>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Архитектура</span>
                <span className="font-bold text-slate-200">Arbitrum Orbit</span>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Газ / Валюта</span>
                <span className="font-bold text-slate-200">ETH</span>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">RPC Endpoint</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[10px] truncate">rpc.robinhoodchain...</span>
                  <button
                    onClick={() => copyToClipboard('https://rpc.robinhoodchain.com', 'rpc')}
                    className="text-slate-400 hover:text-emerald-400 transition ml-1"
                    title="Скопировать RPC URL"
                  >
                    {copiedField === 'rpc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Search Bar */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Поиск по адресу, хэшу транзакции или смарт-контракту в RobinScan:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="0x... (адрес кошелька, хэш tx или адрес токена)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              >
                <span>Искать</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              При вводе адреса открывается <code>https://robinscan.io/address/0x...</code>, при хэше транзакции — <code>https://robinscan.io/tx/0x...</code>
            </p>
          </form>

          {/* Quick Links & Mirrors */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Зеркала и связанные обозреватели:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="https://robinscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <span>robinscan.io</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Primary Etherscan
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Основной домен эксплорера от команды Etherscan
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              <a
                href="https://robinhoodchain.blockscout.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <span>robinhoodchain.blockscout.com</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Blockscout
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Альтернативный независимый обозреватель Blockscout
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Etherscan Family Quick Switcher */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Семейство Etherscan по всем сетям:
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Chain IDs: 4663, 1, 56, 8453, 42161</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ETHERSCAN_FAMILY.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between group ${
                    item.highlight
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition">
                        {item.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        ID: {item.chainId}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Верифицировано по официальному релизу Etherscan</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
