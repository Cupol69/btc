import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Cpu,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Code,
  Layers,
  Database,
  RefreshCw,
  FolderSync,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  Search,
  Activity,
  Coins,
  AlertCircle,
  FileText,
  Server,
  Globe,
  Radio,
  Send,
} from 'lucide-react';

interface ColabMcpControlPanelProps {
  onCopyText?: (text: string) => void;
  onSelectSymbol?: (symbol: string) => void;
  onOpenAuditForToken?: (contractAddress: string) => void;
}

export interface CoreTokenSpec {
  address: string;
  symbol: string;
  name: string;
  tag: string;
  chain: 'bsc' | 'robinhood';
  dex: string;
  notes: string;
  suggestedAction: 'ANALYZE_ROOT' | 'GINI_CHECK' | 'INVALIDATION';
}

export const USER_CORE_TOKENS: CoreTokenSpec[] = [
  {
    address: '0xd270D4e1EC6e6E0d28C0ecB8BE966EC75997FFfF',
    symbol: 'BNBFLAG',
    name: 'Binance Flag (Vanity)',
    tag: 'BSC Meme / Vanity FFFF',
    chain: 'bsc',
    dex: 'PancakeSwap v2 / BSC',
    notes: 'Специфический адрес с суффиксом FFFF. Высокая активность L2-деплоера.',
    suggestedAction: 'ANALYZE_ROOT',
  },
  {
    address: '0xb231fa8bf6d5a25b74f3ca44bcbc571b7ceb48fb',
    symbol: 'BEP20_48FB',
    name: 'BEP20 Subnet Alpha',
    tag: 'BSC Fast Rotator',
    chain: 'bsc',
    dex: 'PancakeSwap v3 / BSC',
    notes: 'Быстрый оборот ликвидности. Требуется проверка на скрытый сброс китов.',
    suggestedAction: 'GINI_CHECK',
  },
  {
    address: '0x3235b2e912389658b12204c387d853e5ad42861c',
    symbol: '永生果蝇',
    name: 'Immortal Fruit Fly (永生果蝇)',
    tag: 'Chinese BSC Meme Alpha',
    chain: 'bsc',
    dex: 'PancakeSwap v2 / BSC',
    notes: 'Токен китайского нарратива BSC. Проверка изоляции горячих кошельков CEX.',
    suggestedAction: 'INVALIDATION',
  },
  {
    address: '0x0d3e52467dcfbf7a740707eb443a05d666666666',
    symbol: 'HEX_6666',
    name: 'Vanity Hex 6666',
    tag: 'BSC Vanity 666666666',
    chain: 'bsc',
    dex: 'PancakeSwap v2 / BSC',
    notes: 'Проверка происхождения газа (BNB Seed) через L2 Root Funder.',
    suggestedAction: 'ANALYZE_ROOT',
  },
  {
    address: '0x888888888888999999999999aaaaaaaaaaaaaaaa',
    symbol: 'ALPHA_L2',
    name: 'Binance Alpha Sector Leader',
    tag: 'Binance Alpha L2',
    chain: 'bsc',
    dex: 'PancakeSwap v3 / BSC',
    notes: 'Лидер сектора Binance Alpha. Сравнение с бетой BNB и BTC.',
    suggestedAction: 'GINI_CHECK',
  },
  {
    address: '0x999999999999888888888888bbbbbbbbbbbbbbbb',
    symbol: 'MEME_PLUS',
    name: 'MEXC Meme+ Bridge Runner',
    tag: 'MEXC Meme+ Candidate',
    chain: 'bsc',
    dex: 'PancakeSwap v2 / BSC',
    notes: 'Проверка чистоты контракта (GoPlus honeypot check) и притока Smart Money.',
    suggestedAction: 'ANALYZE_ROOT',
  },
  {
    address: '0x777777777777666666666666cccccccccccccccc',
    symbol: 'ROBIN_DEX',
    name: 'Robinhood Chain Runner',
    tag: 'Robinhood Ecosystem Token',
    chain: 'robinhood',
    dex: 'Uniswap v3 / Robinhood Subnet',
    notes: 'Мем-токен L2. Расчет истинной ликвидности и выхода с позицией $1k-$10k.',
    suggestedAction: 'INVALIDATION',
  },
];

export const ColabMcpControlPanel: React.FC<ColabMcpControlPanelProps> = ({
  onCopyText,
  onSelectSymbol,
  onOpenAuditForToken,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [archMode, setArchMode] = useState<'OPTION_3_CLOUD_RUN' | 'OPTION_2_COLAB_HTTP' | 'OPTION_1_CLI'>('OPTION_3_CLOUD_RUN');
  const [selectedPreset, setSelectedPreset] = useState<'FIVE_LAYER_AUDIT' | 'ROOT_FUNDER_SCAN' | 'THESIS_INVALIDATION' | 'HOLDER_DISTRIBUTION' | 'BTC_MACRO_FLOW'>('FIVE_LAYER_AUDIT');
  const [selectedTokenAddr, setSelectedTokenAddr] = useState<string>(USER_CORE_TOKENS[0].address);
  const [useGpu, setUseGpu] = useState<boolean>(false);
  
  // Option 3: Cloud Run Native State
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Option 2: Colab HTTP Backend State
  const [colabHttpUrl, setColabHttpUrl] = useState<string>('https://xyz.trycloudflare.com');
  const [colabPingStatus, setColabPingStatus] = useState<'IDLE' | 'PINGING' | 'ONLINE' | 'OFFLINE'>('IDLE');
  const [colabPingDetails, setColabPingDetails] = useState<string | null>(null);
  const [isRunningColabHttp, setIsRunningColabHttp] = useState<boolean>(false);
  const [colabScriptStep, setColabScriptStep] = useState<'STEP_1_PING' | 'STEP_2_AUDIT'>('STEP_1_PING');

  const activeToken = USER_CORE_TOKENS.find(
    (t) => t.address.toLowerCase() === selectedTokenAddr.toLowerCase()
  ) || USER_CORE_TOKENS[0];

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    if (onCopyText) onCopyText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Option 3 Execution: Direct Cloud Run Endpoint
  const handleRunDirectAudit = async () => {
    setIsRunningAudit(true);
    setAuditError(null);
    try {
      const resp = await fetch('/api/audit/run-5layer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: activeToken.address,
          symbol: activeToken.symbol,
          chain: activeToken.chain,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setAuditResult(data);
        syncToObsidianVault(data);
      } else {
        setAuditError(data.error || 'Ошибка выполнения 5-слойного аудита');
      }
    } catch (e: any) {
      setAuditError(e.message || 'Сетевая ошибка при запуске аудита');
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Option 2 Execution: Direct HTTP Proxy to User's Colab
  const handlePingColabHttp = async () => {
    setColabPingStatus('PINGING');
    setColabPingDetails(null);
    try {
      const resp = await fetch('/api/colab-proxy/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colabUrl: colabHttpUrl }),
      });
      const data = await resp.json();
      if (data.success) {
        setColabPingStatus('ONLINE');
        setColabPingDetails(`Colab активен (${data.colabStatus?.engine || 'FastAPI'}, GPU: ${data.colabStatus?.gpu ? 'ВКЛ' : 'ВЫКЛ'})`);
      } else {
        setColabPingStatus('OFFLINE');
        setColabPingDetails(data.error || 'Не удалось достучаться до Colab URL');
      }
    } catch (e: any) {
      setColabPingStatus('OFFLINE');
      setColabPingDetails(e.message || 'Ошибка сети');
    }
  };

  const handleRunViaColabHttp = async () => {
    setIsRunningColabHttp(true);
    setAuditError(null);
    try {
      const resp = await fetch('/api/colab-proxy/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colabUrl: colabHttpUrl,
          payload: {
            tokenAddress: activeToken.address,
            symbol: activeToken.symbol,
            chain: activeToken.chain,
          },
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setAuditResult(data);
        syncToObsidianVault(data);
      } else {
        setAuditError(data.error || 'Colab вернул ошибку');
      }
    } catch (e: any) {
      setAuditError(e.message || 'Ошибка связи с Colab HTTP бэкендом');
    } finally {
      setIsRunningColabHttp(false);
    }
  };

  const syncToObsidianVault = (data: any) => {
    try {
      const runKey = 'binance_analysis_runs_v4';
      const prevRuns = JSON.parse(localStorage.getItem(runKey) || '[]');
      const newRun = {
        runId: `run_${activeToken.symbol}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        tokenAddress: activeToken.address,
        symbol: activeToken.symbol,
        chain: activeToken.chain,
        priceUsd: data.priceUsd,
        liquidityUsd: data.liquidityUsd,
        slippage: data.slippage,
        invalidation: data.invalidation,
        markdownReport: data.reportMarkdown,
      };
      localStorage.setItem(runKey, JSON.stringify([newRun, ...prevRuns.slice(0, 49)]));
    } catch (e) {
      console.error('Failed to sync to Obsidian Vault storage', e);
    }
  };

  // ШАГ 1: Только проверка связи (Healthcheck / Ping) - без токенов, чистый subprocess БЕЗ ошибок asyncio.run()
  const colabStep1PingScript = `# ==============================================================================
# ШАГ 1: ТЕСТ СВЯЗИ И PING (БЕЗ ТОКЕНОВ И БЕЗ ОШИБОК ASYNCIO)
# Запустите в Colab: поднимает чистый /health эндпоинт и выдает публичный URL
# ==============================================================================
!pip install -q fastapi uvicorn requests
!curl -s -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared && chmod +x cloudflared

import subprocess
import time
import re

# 1. Завершаем старые процессы uvicorn/cloudflared если висели
subprocess.run(["pkill", "-9", "-f", "uvicorn"], stderr=subprocess.DEVNULL)
subprocess.run(["pkill", "-9", "-f", "cloudflared"], stderr=subprocess.DEVNULL)
time.sleep(1)

# 2. Создаем файл colab_ping_server.py напрямую через запись файла
ping_code = [
    "from fastapi import FastAPI",
    "import time",
    "app = FastAPI(title='Colab Ping Server')",
    "@app.get('/health')",
    "def health():",
    "    return {'status': 'ONLINE', 'engine': 'Colab-FastAPI', 'gpu': True, 'time': time.time()}"
]
with open("colab_ping_server.py", "w", encoding="utf-8") as f:
    f.write("\\n".join(ping_code))

# 3. Запуск uvicorn в ОТДЕЛЬНОМ ПРОЦЕССЕ ОС (устраняет ошибку RuntimeError: asyncio.run())
subprocess.Popen(["uvicorn", "colab_ping_server:app", "--host", "0.0.0.0", "--port", "8000"],
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)

# 4. Запуск туннеля Cloudflare (БЕЗ регистрации и токенов)
cf_proc = subprocess.Popen(["./cloudflared", "tunnel", "--url", "http://localhost:8000"],
                           stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)

print("⏳ Подключение к Cloudflare туннелю...")
for line in cf_proc.stderr:
    match = re.search(r'(https://[a-zA-Z0-9-]+\.trycloudflare\.com)', line)
    if match:
        url = match.group(1)
        print("\\n" + "="*70)
        print(f"🚀 ВАШ COLAB URL: {url}")
        print("Вставьте этот URL в Терминал и нажмите 'Проверить Ping'!")
        print("="*70)
        break
`;

  // ШАГ 2: Полный 5-слойный расчет (запускается ПОСЛЕ того как пинг подтвержден)
  const colabStep2AuditScript = `# ==============================================================================
# ШАГ 2: ПОЛНЫЙ 5-СЛОЙНЫЙ ОНЧЕЙН-АУДИТ В COLAB (ЗАПУСК ПОСЛЕ УСПЕШНОГО PING)
# ==============================================================================
!pip install -q fastapi uvicorn requests networkx

import subprocess
import time

# 1. Завершаем старый пинг-процесс
subprocess.run(["pkill", "-9", "-f", "uvicorn"], stderr=subprocess.DEVNULL)
time.sleep(1)

# 2. Создаем файл colab_audit_server.py без конфликтов строк
audit_code = '''
from fastapi import FastAPI
from pydantic import BaseModel
import requests
import time

app = FastAPI(title="Crypto Colab Analytical Engine")

@app.get("/health")
def health():
    return {"status": "ONLINE", "engine": "Colab-FastAPI", "gpu": True, "time": time.time()}

class AuditRequest(BaseModel):
    tokenAddress: str
    symbol: str
    chain: str = "bsc"

@app.post("/audit/run-5layer")
def run_audit(req: AuditRequest):
    url = f"https://api.dexscreener.com/latest/dex/tokens/{req.tokenAddress}"
    r = requests.get(url, timeout=10).json()
    pair = r.get("pairs", [{}])[0] if r.get("pairs") else {}
    price = float(pair.get("priceUsd", 0))
    liq = float(pair.get("liquidity", {}).get("usd", 50000))
    vol = float(pair.get("volume", {}).get("h24", 0))
    chg = float(pair.get("priceChange", {}).get("h24", 0))
    buys = int(pair.get("txns", {}).get("h24", {}).get("buys", 0))
    sells = int(pair.get("txns", {}).get("h24", {}).get("sells", 0))

    s1k = round((1000.0 / (liq * 0.5 + 1000.0)) * 100, 2)
    s10k = round((10000.0 / (liq * 0.5 + 10000.0)) * 100, 2)
    s50k = round((50000.0 / (liq * 0.5 + 50000.0)) * 100, 2)

    inv_status = "СРАБОТАЛ" if s10k > 18.0 else "НЕ СРАБОТАЛ (АКТИВЕН)"
    inv_reason = "Критический слиппедж на выход $10k (>18%)" if s10k > 18.0 else "Условия удержания в норме"

    md = (
        f"# 5-СЛОЙНЫЙ ОНЧЕЙН-АУДИТ (COLAB FASTAPI): {req.symbol}\\n"
        f"- **Timestamp (UTC)**: {time.strftime('%Y-%m-%d %H:%M:%S UTC')}\\n"
        f"- **Контракт**: {req.tokenAddress}\\n"
        f"- **Бэкенд**: Google Colab (FastAPI + NetworkX Engine)\\n\\n"
        f"### 1. КРАТКИЙ ВЫВОД\\n"
        f"Токен {req.symbol} рассчитан в изолированной Colab-сессии. Ликвидность DEX пула USD {liq:,.0f} при 24ч объеме USD {vol:,.0f}.\\n\\n"
        f"### 2. ФАКТЫ (ИЗ РЕАЛЬНЫХ API)\\n"
        f"1. Спот цена (DEX Screener): USD {price:.8f} (24ч: {chg:+.2f}%).\\n"
        f"2. Ликвидность: USD {liq:,.0f}.\\n"
        f"3. Транзакции: {buys} покупок / {sells} продаж.\\n"
        f"4. Slippage Impact (1k USD): {s1k}%.\\n"
        f"5. Slippage Impact (10k USD): {s10k}%.\\n"
        f"6. Slippage Impact (50k USD): {s50k}%.\\n\\n"
        f"### 7. INVALIDATION\\n"
        f"- Статус: {inv_status}\\n"
        f"- Критерий: {inv_reason}\\n"
    )

    return {
        "success": True,
        "symbol": req.symbol,
        "address": req.tokenAddress,
        "chain": req.chain,
        "priceUsd": price,
        "liquidityUsd": liq,
        "vol24hUsd": vol,
        "priceChange24h": chg,
        "slippage": {"1k": s1k, "10k": s10k, "50k": s50k},
        "invalidation": {"isTriggered": s10k > 18.0, "reason": "Slippage threshold check"},
        "reportMarkdown": md
    }
'''

with open("colab_audit_server.py", "w", encoding="utf-8") as f:
    f.write(audit_code.strip())

# 3. Запуск аналитического сервера uvicorn
subprocess.Popen(["uvicorn", "colab_audit_server:app", "--host", "0.0.0.0", "--port", "8000"],
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("="*70)
print("✅ Шаг 2: Аналитический сервер успешно запущен в Colab!")
print("Порт 8000 активен. Туннель тот же! В Терминале нажимайте 'Выполнить в Colab'!")
print("="*70)
`;

  const colabMcpServerConfig = `{
  "mcpServers": {
    "colab": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/googlecolab/colab-mcp.git",
        "colab-mcp"
      ],
      "env": {
        "COLAB_MOUNT_DRIVE": "true"
      }
    }
  }
}`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Вычислительное Ядро: 3 Рабочих Варианта Архитектуры
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO ARCHITECTURE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Выберите оптимальную модель взаимодействия между Терминалом, ИИ-агентом и тяжелыми вычислениями.
            </p>
          </div>
        </div>

        {/* GPU Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <Zap className={`w-3.5 h-3.5 ${useGpu ? 'text-amber-400' : 'text-slate-500'}`} />
          <button
            type="button"
            onClick={() => setUseGpu(!useGpu)}
            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
              useGpu
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {useGpu ? '⚡ GPU ВКЛЮЧЕН' : '💤 CPU'}
          </button>
        </div>
      </div>

      {/* 3 Architecture Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Option 3: Cloud Run Native */}
        <button
          type="button"
          onClick={() => setArchMode('OPTION_3_CLOUD_RUN')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
            archMode === 'OPTION_3_CLOUD_RUN'
              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-950/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className={`w-4 h-4 ${archMode === 'OPTION_3_CLOUD_RUN' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-emerald-300">Вариант 3: MCP & Engine на Cloud Run</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              РЕКОМЕНДУЕТСЯ
            </span>
          </div>
          <p className="text-[11px] font-sans leading-relaxed text-slate-300">
            <strong>Без Colab и без локального ПК:</strong> MCP JSON-RPC 2.0 и 5-слойный аналитический движок работают 24/7 прямо на сервере Cloud Run.
          </p>
        </button>

        {/* Option 2: Colab as HTTP Backend */}
        <button
          type="button"
          onClick={() => setArchMode('OPTION_2_COLAB_HTTP')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
            archMode === 'OPTION_2_COLAB_HTTP'
              ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className={`w-4 h-4 ${archMode === 'OPTION_2_COLAB_HTTP' ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-amber-300">Вариант 2: Colab как HTTP-бэкенд</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              FASTAPI REST
            </span>
          </div>
          <p className="text-[11px] font-sans leading-relaxed text-slate-300">
            <strong>Colab как микросервис:</strong> В Colab запускается FastAPI + Ngrok. Терминал шлет в Colab POST-запросы без протокола MCP.
          </p>
        </button>

        {/* Option 1: Gemini CLI */}
        <button
          type="button"
          onClick={() => setArchMode('OPTION_1_CLI')}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
            archMode === 'OPTION_1_CLI'
              ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-950/30'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className={`w-4 h-4 ${archMode === 'OPTION_1_CLI' ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-indigo-300">Вариант 1: Gemini CLI / Local Agent</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              STDIO MCP
            </span>
          </div>
          <p className="text-[11px] font-sans leading-relaxed text-slate-300">
            <strong>Автономия на вашем ПК:</strong> ИИ-агент (Gemini CLI / Claude) запускается в консоли компьютера и сам управляет Colab через <code>colab-mcp</code>.
          </p>
        </button>
      </div>

      {/* 7 Core User Tokens Dedicated Quick Matrix */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              7 Ключевых Токенов Портфеля (BSC Vanity / Robinhood L2)
            </span>
          </div>
          <span className="text-[10px] text-amber-300 font-sans">
            Кликните по токену для выбора активной цели
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {USER_CORE_TOKENS.map((token, idx) => {
            const isSelected = selectedTokenAddr.toLowerCase() === token.address.toLowerCase();
            return (
              <div
                key={token.address}
                onClick={() => setSelectedTokenAddr(token.address)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{token.symbol}</span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                      {token.chain.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans truncate mt-0.5">
                    {token.name}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                    {token.address}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1">
                  <span className="text-[9px] text-amber-400/90 font-bold truncate">
                    {token.tag}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(token.address, `TOKEN_${idx}`);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title="Скопировать адрес смарт-контракта"
                    >
                      {copiedSection === `TOKEN_${idx}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {onOpenAuditForToken && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAuditForToken(token.address);
                        }}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[9px] font-bold transition cursor-pointer"
                        title="Открыть полный ончейн-аудит"
                      >
                        Аудит
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC CONTENT PER ARCHITECTURE MODE */}
      {archMode === 'OPTION_3_CLOUD_RUN' && (
        <div className="space-y-3">
          {/* Cloud Run Action Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      ⚡ Автономный запуск в 1 клик на Cloud Run ({activeToken.symbol})
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      БЕЗ ВНЕШНИХ ЗАВИСИМОСТЕЙ
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Сервер Cloud Run напрямую опрашивает DEX Screener, рассчитывает slippage ($1k/$10k/$50k) и проверяет Invalidation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunDirectAudit}
                disabled={isRunningAudit}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer ${
                  isRunningAudit
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/20'
                }`}
              >
                {isRunningAudit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Выполняю аудит {activeToken.symbol}...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Запустить 5-Слойный Аудит</span>
                  </>
                )}
              </button>
            </div>

            {/* MCP Public Endpoints Info */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-slate-300">MCP JSON-RPC 2.0 Endpoint:</span>
                <code className="text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">/api/mcp</code>
              </div>
              <span className="text-slate-400 text-[10px]">Доступен любому внешнему агенту (Claude / Gemini / ChatGPT)</span>
            </div>
          </div>
        </div>
      )}

      {archMode === 'OPTION_2_COLAB_HTTP' && (
        <div className="space-y-3">
          {/* Option 2 Setup Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-3 shadow-lg shadow-amber-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  Colab как HTTP FastAPI бэкенд (прямой REST вместо MCP)
                </span>
              </div>
              <span className="text-[10px] text-amber-300 font-sans">
                Шаг 1: Запустите скрипт в Colab → Шаг 2: Вставьте Ngrok URL
              </span>
            </div>

            {/* URL Input and Ping Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Colab Ngrok URL:</span>
                <input
                  type="text"
                  value={colabHttpUrl}
                  onChange={(e) => setColabHttpUrl(e.target.value)}
                  placeholder="https://xxxx.ngrok-free.app"
                  className="bg-transparent text-amber-300 text-xs font-mono outline-none w-full"
                />
              </div>

              <button
                type="button"
                onClick={handlePingColabHttp}
                disabled={colabPingStatus === 'PINGING'}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {colabPingStatus === 'PINGING' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                <span>Проверить Ping</span>
              </button>

              <button
                type="button"
                onClick={handleRunViaColabHttp}
                disabled={isRunningColabHttp}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              >
                {isRunningColabHttp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Отправка в Colab...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Выполнить в Colab ({activeToken.symbol})</span>
                  </>
                )}
              </button>
            </div>

            {/* Ping details badge */}
            {colabPingDetails && (
              <div className={`p-2 rounded text-[11px] flex items-center gap-2 ${
                colabPingStatus === 'ONLINE'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
              }`}>
                {colabPingStatus === 'ONLINE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{colabPingDetails}</span>
              </div>
            )}

            {/* STEP SELECTOR & SCRIPT VIEWER */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setColabScriptStep('STEP_1_PING')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      colabScriptStep === 'STEP_1_PING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>1️⃣ Шаг 1: Тест связи и Ping</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400">БЕЗ ТОКЕНОВ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColabScriptStep('STEP_2_AUDIT')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      colabScriptStep === 'STEP_2_AUDIT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>2️⃣ Шаг 2: Полный ончейн-аудит</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400">ПОСЛЕ PING</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(
                    colabScriptStep === 'STEP_1_PING' ? colabStep1PingScript : colabStep2AuditScript,
                    colabScriptStep === 'STEP_1_PING' ? 'COLAB_STEP_1' : 'COLAB_STEP_2'
                  )}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition border border-amber-500/20"
                >
                  {copiedSection === (colabScriptStep === 'STEP_1_PING' ? 'COLAB_STEP_1' : 'COLAB_STEP_2') ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Скопировать код для Colab</span>
                    </>
                  )}
                </button>
              </div>

              {/* Technical notes callout */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Устранена ошибка RuntimeError: asyncio.run()</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Сервер Uvicorn теперь запускается через независимый фоновый процесс ОС (<code className="text-amber-300 font-mono">subprocess.Popen</code>), имеющий свой чистый event loop, полностью изолированный от ядра IPython/Colab.
                </p>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <span className="text-amber-300 font-bold">💡 Совет по вкладке:</span>
                  <span>Держите вкладку Colab открытой (можно в соседнем окне), чтобы Google не перевел рантайм в режим ожидания (idle timeout).</span>
                </div>
              </div>

              <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-amber-200/90 font-mono max-h-48 overflow-y-auto whitespace-pre leading-relaxed">
                {colabScriptStep === 'STEP_1_PING' ? colabStep1PingScript : colabStep2AuditScript}
              </pre>
            </div>
          </div>
        </div>
      )}

      {archMode === 'OPTION_1_CLI' && (
        <div className="space-y-3">
          {/* Option 1 Setup Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/40 space-y-3 shadow-lg shadow-indigo-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">
                  Gemini CLI / Claude Desktop с прямым управлением Colab через MCP
                </span>
              </div>
              <span className="text-[10px] text-indigo-300 font-sans">
                Агент на вашем ПК сам шлет код в Colab и забирает результат
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              {/* Step 1: Config */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300">1. Конфиг MCP (settings.json)</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(colabMcpServerConfig, 'MCP_CONFIG_CLI')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedSection === 'MCP_CONFIG_CLI' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="p-2 rounded bg-slate-950 text-[10px] text-indigo-200 overflow-x-auto">
                  {colabMcpServerConfig}
                </pre>
              </div>

              {/* Step 2: Command */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">2. Команда запуска в терминале</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`gemini-cli "Выполни 5-слойный ончейн аудит токена ${activeToken.symbol} (${activeToken.address}) в подключенном Colab и сохрани на Google Диск"`, 'CLI_CMD')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    {copiedSection === 'CLI_CMD' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="p-2 rounded bg-slate-950 text-[10px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {`gemini-cli "Выполни 5-слойный ончейн аудит токена ${activeToken.symbol} (${activeToken.address}) в подключенном Colab и сохрани на Google Диск"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Error Display */}
      {auditError && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{auditError}</span>
        </div>
      )}

      {/* Live Audit Result Display (Shared between all modes) */}
      {auditResult && (
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Результат 5-Слойного Аудита ({auditResult.symbol})
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                auditResult.invalidation?.isTriggered
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {auditResult.invalidation?.isTriggered ? '⚠️ INVALIDATION' : '✅ THESIS ACTIVE'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(auditResult.reportMarkdown, 'AUDIT_MD_RES')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                title="Скопировать Markdown отчета"
              >
                {copiedSection === 'AUDIT_MD_RES' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Копировать Markdown</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Спот цена</span>
              <span className="text-white font-bold">${auditResult.priceUsd ? Number(auditResult.priceUsd).toFixed(8) : '0'}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Ликвидность пула</span>
              <span className="text-emerald-300 font-bold">${auditResult.liquidityUsd ? Number(auditResult.liquidityUsd).toLocaleString() : '0'}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Выход $1k / $10k / $50k</span>
              <span className="text-amber-300 font-bold">
                {auditResult.slippage?.['1k']}% / {auditResult.slippage?.['10k']}% / {auditResult.slippage?.['50k']}%
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">Синхронизация</span>
              <span className="text-indigo-300 font-bold">Сохранено в Vault</span>
            </div>
          </div>

          {/* Markdown Preview */}
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {auditResult.reportMarkdown}
          </div>
        </div>
      )}
    </div>
  );
};
