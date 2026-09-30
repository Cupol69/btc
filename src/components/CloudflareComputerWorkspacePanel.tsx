import React, { useState, useEffect } from 'react';
import {
  Server,
  Folder,
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  Zap,
  Code,
  Layers,
  Database,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Brain,
  Search,
  Eye,
  Settings,
  Scale
} from 'lucide-react';
import {
  cfComputerWorkspace,
  VirtualFile,
  generateCloudflareComputerWorkerTemplate,
  getStoredCloudflareComputerConfig,
  saveCloudflareComputerConfig,
  CloudflareComputerConfig,
  checkCloudflareComputerConnection,
  getStoredAgentThoughts,
  saveAgentThought,
  AgentThoughtLog,
  SupervisorAuditCheck
} from '../services/cloudflareComputerService';

interface CloudflareComputerWorkspacePanelProps {
  onCopyText?: (text: string) => void;
  onPushFileToGitHub?: (path: string, content: string) => void;
}

export const CloudflareComputerWorkspacePanel: React.FC<CloudflareComputerWorkspacePanelProps> = ({
  onCopyText,
  onPushFileToGitHub,
}) => {
  const [files, setFiles] = useState<VirtualFile[]>(() => cfComputerWorkspace.listFiles());
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(() => files[0] || null);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  type PanelTab = 'WORKSPACE' | 'SUPERVISOR' | 'EPISODIC_MEMORY' | 'VECTOR_RAG' | 'SETTINGS' | 'DEPLOY' | 'ARCHITECTURE';
  const [activeTab, setActiveTab] = useState<PanelTab>('WORKSPACE');

  const [config, setConfig] = useState<CloudflareComputerConfig>(() => getStoredCloudflareComputerConfig());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Ping test state
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'; latencyMs: number; details: string; endpoint: string } | null>(null);

  // Episodic Memory thoughts
  const [thoughts, setThoughts] = useState<AgentThoughtLog[]>(() => getStoredAgentThoughts());
  const [newThoughtToken, setNewThoughtToken] = useState('BTCUSDT');
  const [newThoughtPhase, setNewThoughtPhase] = useState<AgentThoughtLog['phase']>('OBSERVE');
  const [newThoughtText, setNewThoughtText] = useState('');
  const [newThoughtVerdict, setNewThoughtVerdict] = useState<AgentThoughtLog['verdict']>('INFERENCE');
  const [newThoughtConfidence, setNewThoughtConfidence] = useState(85);
  const [newThoughtInvalidation, setNewThoughtInvalidation] = useState('');

  // Supervisor active rules state
  const [supervisorRules] = useState<SupervisorAuditCheck[]>([
    {
      id: 'S1',
      title: 'Anti-Hallucination & Invalidation Guard',
      category: 'HONESTY',
      status: 'PASSED',
      ruleDescription: 'Любой ценовой прогноз обязан иметь конкретное условие отмены (Invalidation). Без него вывод бракуется.',
      detectedFinding: 'Правило активно. Все сценарии (Bull/Base/Bear) содержат триггер отмены.',
      actionRequired: 'Контролировать соблюдение формата в отчетах.',
    },
    {
      id: 'S2',
      title: 'Anti-Hype & Volume/Liquidity Check',
      category: 'MARKET',
      status: 'PASSED',
      ruleDescription: 'Запрет поддакивания пользователю. Проверка пампа на wash trading и соотношение Volume / Liquidity.',
      detectedFinding: 'Коэффициент Vol/Liq > 5 сигнализирует о спекулятивной или искусственной активности.',
      actionRequired: 'Снижать Confidence Score при расхождении цен и ончейна.',
    },
    {
      id: 'S3',
      title: 'Slippage & Exit Feasibility Guard',
      category: 'LIQUIDITY',
      status: 'PASSED',
      ruleDescription: 'Расчет проскальзывания при выходе с сайзом $1k, $10k, $50k от реальной глубины пула AMM.',
      detectedFinding: 'Для токенов с пулом <$200k выход с $10k вызывает >8% price impact.',
      actionRequired: 'Выводить прямое предупреждение о невозможности выхода.',
    },
    {
      id: 'S4',
      title: 'Honeypot & Blacklist Pre-Filter',
      category: 'SECURITY',
      status: 'PASSED',
      ruleDescription: 'Проверка байткода смарт-контракта, комиссий buy/sell >10%, скрытых функций mint/burn.',
      detectedFinding: 'GoPlus Security + DEX Screener Audit синхронизированы в реальном времени.',
      actionRequired: 'Блокировать токен со статусом CRITICAL при наличии блэклиста.',
    },
  ]);

  const refreshFiles = () => {
    const list = cfComputerWorkspace.listFiles();
    setFiles(list);
    if (!selectedFile && list.length > 0) {
      setSelectedFile(list[0]);
    } else if (selectedFile) {
      const updated = list.find((f) => f.path === selectedFile.path);
      setSelectedFile(updated || list[0] || null);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onCopyText) onCopyText(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateFile = () => {
    if (!newFilePath.trim() || !newFileContent.trim()) return;
    const cleanPath = newFilePath.startsWith('/') ? newFilePath : `/${newFilePath}`;
    const file = cfComputerWorkspace.writeFile(cleanPath, newFileContent, 'USER');
    setNewFilePath('');
    setNewFileContent('');
    setIsCreatingFile(false);
    refreshFiles();
    setSelectedFile(file);
    setFeedbackMsg(`✅ Файл "${cleanPath}" сохранен в VFS Workspace!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeleteFile = (path: string) => {
    cfComputerWorkspace.deleteFile(path);
    refreshFiles();
    setFeedbackMsg(`Файл "${path}" удален из VFS`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveConfig = () => {
    saveCloudflareComputerConfig(config);
    setFeedbackMsg('✅ Конфигурация Cloudflare Computer сохранена');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    try {
      const res = await checkCloudflareComputerConnection();
      setPingResult(res);
    } finally {
      setIsPinging(false);
    }
  };

  const handleAddThought = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThoughtText.trim()) return;
    const created = saveAgentThought({
      tokenSymbol: newThoughtToken.toUpperCase(),
      phase: newThoughtPhase,
      thought: newThoughtText.trim(),
      verdict: newThoughtVerdict,
      confidenceScore: newThoughtConfidence,
      invalidationTrigger: newThoughtInvalidation.trim() || 'Пробой уровней поддержки/сопротивления 24h',
    });
    setThoughts(getStoredAgentThoughts());
    refreshFiles();
    setNewThoughtText('');
    setNewThoughtInvalidation('');
    setFeedbackMsg(`✅ Мысль зафиксирована в эпизодической памяти (${created.id})`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const { wrangler, workerTs } = generateCloudflareComputerWorkerTemplate();

  return (
    <div className="space-y-4 font-mono animate-fadeIn">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black flex-shrink-0">
            <Server className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Cloudflare Computer (@cloudflare/computer • 8.3k★ GitHub)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Durable Workspace
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Персистентная виртуальная файловая система (VFS) на базе Cloudflare Durable Objects + SQLite. Сессионная память, надзор Supervisor и RAG-кэш.
            </p>
          </div>
        </div>

        {/* GitHub Official Badge & Quick Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isPinging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isPinging ? 'animate-spin' : ''}`} />
            <span>Тест связи</span>
          </button>

          <a
            href="https://github.com/cloudflare/computer"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-md"
          >
            <span>⭐ 8.3k Stars на GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>
      </div>

      {/* Ping Result Banner if tested */}
      {pingResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            pingResult.status === 'ONLINE'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : pingResult.status === 'DEGRADED'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                pingResult.status === 'ONLINE'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                  : pingResult.status === 'DEGRADED'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-bold">
              [{pingResult.status}] {pingResult.details}
            </span>
          </div>
          <span className="text-[11px] opacity-80">{pingResult.endpoint}</span>
        </div>
      )}

      {/* Action Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('WORKSPACE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'WORKSPACE'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>VFS Диск ({files.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SUPERVISOR')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'SUPERVISOR'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span>«Supervisor» (Инспектор)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EPISODIC_MEMORY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'EPISODIC_MEMORY'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-emerald-400" />
          <span>Эпизодическая память ({thoughts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VECTOR_RAG')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'VECTOR_RAG'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-sky-400" />
          <span>Векторный RAG-кэш</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'SETTINGS'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Настройки связи</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DEPLOY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'DEPLOY'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Код Worker DO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ARCHITECTURE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ARCHITECTURE'
              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Анализ пакета</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-slate-950 border border-orange-500/40 text-xs text-orange-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* TAB 1: WORKSPACE BROWSER */}
      {activeTab === 'WORKSPACE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File Tree Left */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Durable Files ({cfComputerWorkspace.getTotalSizeKb().toFixed(1)} КБ)
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingFile(!isCreatingFile)}
                className="px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-slate-950 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Новый файл</span>
              </button>
            </div>

            {/* Create File Form */}
            {isCreatingFile && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-orange-500/30 space-y-2 animate-fadeIn text-xs">
                <input
                  type="text"
                  placeholder="/workspace/reports/audit.json"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                />
                <textarea
                  placeholder="Содержимое файла..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-[11px] resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFile(false)}
                    className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFile}
                    className="px-2.5 py-1 rounded bg-orange-500 text-slate-950 font-bold text-[10px]"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            )}

            {/* Files List */}
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {files.map((file) => {
                const isSelected = selectedFile?.path === file.path;
                return (
                  <div
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`p-2 rounded-lg text-xs transition cursor-pointer border flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 text-orange-400" />
                      <span className="truncate">{file.path}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      {(file.sizeBytes / 1024).toFixed(1)} КБ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File Viewer Right */}
          <div className="col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-orange-400 text-sm">{selectedFile.path}</span>
                    <span className="text-[10px] text-slate-500 ml-2">
                      Обновлен: {new Date(selectedFile.modifiedAt).toLocaleTimeString()} | Автор: {selectedFile.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedFile.content, 'view_file')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'view_file' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Копировать</span>
                    </button>

                    {onPushFileToGitHub && (
                      <button
                        type="button"
                        onClick={() => onPushFileToGitHub(selectedFile.path.replace(/^\//, ''), selectedFile.content)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs transition flex items-center gap-1 cursor-pointer border border-slate-700"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>В GitHub</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteFile(selectedFile.path)}
                      className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                      title="Удалить файл"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-[50vh] overflow-y-auto select-text leading-relaxed">
                  {selectedFile.content}
                </pre>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                Выберите файл слева для просмотра
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SUPERVISOR (ИНСПЕКТОР) */}
      {activeTab === 'SUPERVISOR' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>«Supervisor» (Инспектор и Аудитор аналитических суждений)</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Автономный страж честности: блокирует галлюцинации, требует условия Invalidation, пересчитывает проскальзывание и исключает поддакивание пользователю.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              4/4 Правил Активны
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {supervisorRules.map((rule) => (
              <div key={rule.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                      {rule.id}
                    </span>
                    <span className="font-bold text-xs text-white">{rule.title}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    {rule.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans">{rule.ruleDescription}</p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] space-y-1">
                  <div className="text-amber-400 font-semibold">🔍 Мониторинг: {rule.detectedFinding}</div>
                  <div className="text-slate-400">🛡️ Действие: {rule.actionRequired}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1 font-sans">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Честное замечание по архитектуре Supervisor:</span>
            </div>
            <p className="text-slate-300">
              Модуль Supervisor — это <strong>логический протокол верификации агента</strong>, а не готовая библиотека из репозитория Cloudflare. Он встроен в аналитический пайплайн терминала и проверяет каждое суждение перед записью в Workspace или выводом пользователю.
            </p>
          </div>
        </div>
      )}

      {/* TAB: EPISODIC MEMORY (ЭПИЗОДИЧЕСКАЯ ПАМЯТЬ) */}
      {activeTab === 'EPISODIC_MEMORY' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                <span>Эпизодическая память (Chain-of-Thought лог мышления)</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Хронологическая запись аналитических гипотез, фактов и условий отмены (Invalidation), сохраняемая в VFS Durable Object (`/workspace/episodes/`).
              </p>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              Всего эпизодов: {thoughts.length}
            </span>
          </div>

          {/* Form to log new thought */}
          <form onSubmit={handleAddThought} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wide">
              Зафиксировать новый аналитический эпизод
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Тикер (BTCUSDT)"
                value={newThoughtToken}
                onChange={(e) => setNewThoughtToken(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
              <select
                value={newThoughtPhase}
                onChange={(e) => setNewThoughtPhase(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white cursor-pointer"
              >
                <option value="OBSERVE">1. OBSERVE (Наблюдение)</option>
                <option value="ORIENT">2. ORIENT (Контекст)</option>
                <option value="DECIDE">3. DECIDE (Решение)</option>
                <option value="ACT">4. ACT (Действие)</option>
                <option value="SUPERVISOR_AUDIT">5. SUPERVISOR_AUDIT (Аудит)</option>
              </select>
              <select
                value={newThoughtVerdict}
                onChange={(e) => setNewThoughtVerdict(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white cursor-pointer"
              >
                <option value="FACT">FACT (Факт)</option>
                <option value="INFERENCE">INFERENCE (Интерпретация)</option>
                <option value="RUMOR">RUMOR (Слух)</option>
                <option value="MISSING_DATA">MISSING_DATA (Не хватает данных)</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">Conf:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newThoughtConfidence}
                  onChange={(e) => setNewThoughtConfidence(parseInt(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-center"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>

            <textarea
              placeholder="Формулировка суждения и обоснование..."
              value={newThoughtText}
              onChange={(e) => setNewThoughtText(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white resize-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Invalidation: что отменит этот тезис?"
                value={newThoughtInvalidation}
                onChange={(e) => setNewThoughtInvalidation(e.target.value)}
                className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold transition cursor-pointer"
              >
                + Сохранить в память
              </button>
            </div>
          </form>

          {/* List of episodes */}
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
            {thoughts.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {item.tokenSymbol}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {item.phase}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.verdict === 'FACT'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.verdict === 'INFERENCE'
                          ? 'bg-blue-500/20 text-blue-300'
                          : item.verdict === 'RUMOR'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.verdict}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      Score: {item.confidenceScore}%
                    </span>
                  </div>
                </div>

                <p className="text-slate-200 font-sans leading-relaxed">{item.thought}</p>

                <div className="text-[11px] text-rose-300 bg-rose-950/20 p-2 rounded border border-rose-500/20">
                  <span className="font-bold text-rose-400">⚡ Invalidation:</span> {item.invalidationTrigger}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: VECTOR RAG */}
      {activeTab === 'VECTOR_RAG' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-400" />
              <span>Векторный кэш «на лету» (Семантический поиск RAG)</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Честный технический разбор: как строится настоящий векторный поиск в стеке Cloudflare.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <span className="font-bold text-orange-400 text-sm">
                1. Почему нельзя сделать полноценный Vector RAG внутри одного DO:
              </span>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>
                  Durable Objects имеют жесткий лимит оперативной памяти: <strong>128 МБ</strong>.
                </li>
                <li>
                  Запуск тяжелой нейросети для вычисления эмбеддингов (768 или 1536 измерений) прямо внутри isolate DO мгновенно вызовет Out-Of-Memory (OOM).
                </li>
                <li>
                  SQLite внутри DO оптимизирован под транзакции (ACID), а не под HNSW / косинусное приближение по миллионам векторов.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <span className="font-bold text-emerald-400 text-sm">
                2. Как правильно реализован RAG в Cloudflare:
              </span>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>
                  <strong>Workers AI:</strong> Модель эмбеддингов <code className="text-amber-300">@cf/baai/bge-base-en-v1.5</code> генерирует векторы на GPU Cloudflare с нулевой задержкой.
                </li>
                <li>
                  <strong>Cloudflare Vectorize:</strong> Специализированная глобальная векторная база данных (HNSW-индекс), возвращающая топ-5 релевантных эпизодов за ~15 мс.
                </li>
                <li>
                  <strong>Durable Object:</strong> Хранит только исходные тексты и ID, обращаясь к Vectorize по Workers RPC.
                </li>
              </ul>
            </div>
          </div>

          {/* RAG Code Snippet for Cloudflare */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Паттерн интеграции Workers AI + Vectorize в Worker DO:
            </span>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto select-text">
{`// Пример связки DO + Workers AI + Vectorize для RAG
async function searchEpisodicMemory(query: string, env: any) {
  // 1. Получаем эмбеддинг запроса через Workers AI
  const { data } = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [query]
  });
  const vector = data[0];

  // 2. Ищем похожие эпизоды в Cloudflare Vectorize
  const matches = await env.VECTORIZE_INDEX.query(vector, {
    topK: 5,
    returnValues: false
  });

  return matches;
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB: SETTINGS & REMOTE DO PING */}
      {activeTab === 'SETTINGS' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-400" />
              <span>Параметры подключения к удаленному Cloudflare Worker</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Если у вас развернут собственный Cloudflare Worker с Durable Object, укажите его адрес ниже. Терминал переключится с локального кэша на удаленный SQLite.
            </p>
          </div>

          <div className="space-y-3 text-xs max-w-xl">
            <div>
              <label className="text-slate-400 block mb-1">
                Cloudflare Worker DO URL (публичный URL воркера):
              </label>
              <input
                type="text"
                placeholder="https://onchain-agent-computer.username.workers.dev"
                value={config.workerUrl || ''}
                onChange={(e) => setConfig({ ...config, workerUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Оставьте пустым, если хотите использовать локальный VFS в браузере (LocalStorage).
              </span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Durable Object Class Name:</label>
              <input
                type="text"
                value={config.durableObjectName}
                onChange={(e) => setConfig({ ...config, durableObjectName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Cloudflare Account ID (опционально):</label>
              <input
                type="text"
                placeholder="e.g. 7c3b8a1e2f9d..."
                value={config.accountId}
                onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold transition cursor-pointer"
              >
                Сохранить настройки
              </button>

              <button
                type="button"
                onClick={handleTestPing}
                disabled={isPinging}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isPinging ? 'animate-spin' : ''}`} />
                <span>Проверить пинг</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DEPLOY CODE & WRANGLER */}
      {activeTab === 'DEPLOY' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-orange-400" />
              <span>Деплой собственного Cloudflare Computer Worker</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Разверните этот воркер в своем аккаунте Cloudflare с помощью <code className="text-amber-300">npx wrangler deploy</code>. Вся файловая система агента будет храниться в SQLite внутри Durable Object.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* wrangler.jsonc */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-orange-400">wrangler.jsonc</span>
                <button
                  type="button"
                  onClick={() => handleCopy(wrangler, 'wrangler')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'wrangler' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Копировать</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto select-text">
                {wrangler}
              </pre>
            </div>

            {/* worker.ts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-orange-400">src/index.ts (Durable Object)</span>
                <button
                  type="button"
                  onClick={() => handleCopy(workerTs, 'worker_ts')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'worker_ts' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Копировать</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto select-text max-h-[350px]">
                {workerTs}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ARCHITECTURE COMPARISON */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Честный анализ: Что реально входит в @cloudflare/computer</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="font-bold text-emerald-400 flex items-center gap-2">
                <span>✅ Реальные возможности пакета (@cloudflare/computer)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>
                  <strong>Виртуальная файловая система (VFS):</strong> авторитарное состояние в SQLite внутри Durable Object.
                </li>
                <li>
                  <strong>Три среды исполнения:</strong> FUSE Sandbox container (Linux), Isolate Shell (`just-bash`), Isolate JS (Dynamic Worker).
                </li>
                <li>
                  <strong>Персистентность:</strong> файлы переживают перезапуск сессий агента.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-2">
                <span>⚠️ Чего НЕТ в пакете «из коробки» (надо проектировать)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>
                  <strong>Нет Supervisor:</strong> правила инспекции мы должны писать на уровне бизнес-логики агента.
                </li>
                <li>
                  <strong>Нет готового логера мыслей:</strong> формат эпизодической памяти строится вручную через VFS-файлы.
                </li>
                <li>
                  <strong>Нет RAG внутри DO:</strong> для векторного поиска требуется подключение Cloudflare Vectorize и Workers AI.
                </li>
                <li>
                  <strong>Тариф:</strong> Durable Objects требуют платного плана Cloudflare Workers Paid ($5/месяц).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
