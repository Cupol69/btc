import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Save,
  Copy,
  Check,
  RefreshCw,
  GitBranch,
  Cloud,
  Mail,
  HardDrive,
  Brain,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  AlertTriangle,
  Download
} from 'lucide-react';
import {
  buildCurrentRecoveryState,
  saveLocalRecoverySnapshot,
  getLocalRecoverySnapshot,
  generateResumePromptMarkdown,
  pushStateToGitHub,
  pushStateToGoogleDrive,
  generateEmailDigestMailto,
  AgentRecoveryState,
  USER_EMAIL_DEFAULT
} from '../services/agentRecoveryService';

interface AgentRecoveryHubProps {
  activeSymbol?: string;
}

export const AgentRecoveryHub: React.FC<AgentRecoveryHubProps> = ({ activeSymbol = 'BTCUSDT' }) => {
  const [state, setState] = useState<AgentRecoveryState>(() => {
    const saved = getLocalRecoverySnapshot();
    return saved || buildCurrentRecoveryState(activeSymbol);
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSyncingGh, setIsSyncingGh] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  useEffect(() => {
    const fresh = buildCurrentRecoveryState(activeSymbol);
    setState(fresh);
    saveLocalRecoverySnapshot(fresh);
  }, [activeSymbol]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateSnapshot = () => {
    const fresh = buildCurrentRecoveryState(activeSymbol);
    setState(fresh);
    saveLocalRecoverySnapshot(fresh);
    setStatusMessage('✅ Локальный снимок памяти обновлен и зафиксирован в VFS!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSyncGitHub = async () => {
    setIsSyncingGh(true);
    try {
      const res = await pushStateToGitHub(state);
      setStatusMessage(res.message);
    } catch (e: any) {
      setStatusMessage(`Ошибка GitHub: ${e.message}`);
    } finally {
      setIsSyncingGh(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const res = await pushStateToGoogleDrive(state);
      setStatusMessage(res.message);
    } catch (e: any) {
      setStatusMessage(`Ошибка Google Drive: ${e.message}`);
    } finally {
      setIsSyncingDrive(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleTripleSync = async () => {
    handleCreateSnapshot();
    await Promise.allSettled([handleSyncGitHub(), handleSyncDrive()]);
  };

  const resumePrompt = generateResumePromptMarkdown(state);
  const mailtoLink = generateEmailDigestMailto(state);

  return (
    <div className="space-y-4 font-mono animate-fadeIn">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Ядро Анти-Амнезии: GitHub + Google Drive + Почта
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Free • No Workers Paid
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Решение проблемы потери памяти LLM при перезапусках сессий без платных подписок. Автономная фиксация состояния в репозиторий, облачный диск и почтовый ящик.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTripleSync}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Zap className="w-4 h-4 text-slate-950" />
          <span>Сделать Снапшот Везде (1-Click)</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-indigo-300 flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* The 4-Pillar Zero Cost Architecture Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. GitHub */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <GitBranch className="w-4 h-4 text-amber-400" />
              <span>1. GitHub State</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Бессрочно
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Код, структура и файл состояния <code>.agent_memory/AGENT_STATE_SNAPSHOT.json</code> фиксируются в коммитах через REST API.
          </p>
          <button
            type="button"
            onClick={handleSyncGitHub}
            disabled={isSyncingGh}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isSyncingGh ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
            <span>Записать в GitHub</span>
          </button>
        </div>

        {/* 2. Google Drive */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span>2. Google Drive</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              15 GB Free
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Тяжелые файлы, книги (143+ КБ), полные дампы и слепки в папке <code>Crypto-Terminal-Obsidian-Vault</code>.
          </p>
          <button
            type="button"
            onClick={handleSyncDrive}
            disabled={isSyncingDrive}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isSyncingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
            <span>Записать на Диск</span>
          </button>
        </div>

        {/* 3. Email Dispatch */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>3. Почта (Email)</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
              Архив в Gmail
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans truncate" title={USER_EMAIL_DEFAULT}>
            Отправка снимка на <code>{USER_EMAIL_DEFAULT}</code> для резервной фиксации и алертов.
          </p>
          <a
            href={mailtoLink}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Открыть в Gmail</span>
          </a>
        </div>

        {/* 4. Local VFS */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <HardDrive className="w-4 h-4 text-orange-400" />
              <span>4. Local VFS</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-300 border border-orange-500/30">
              0 мс задержки
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Мгновенный кэш сессии в браузере: {state.vfsFileCatalog.length} файлов каталога, доступных офлайн.
          </p>
          <button
            type="button"
            onClick={handleCreateSnapshot}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Обновить VFS</span>
          </button>
        </div>
      </div>

      {/* Main Resume Prompt Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Промпт Мгновенного Восстановления (Resume Prompt)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(resumePrompt, 'resume_prompt')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {copiedKey === 'resume_prompt' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Скопировать для вставки в новый чат</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 font-sans">
          Этот текст решает проблему «амнезии»: если сессия сбросилась или контекст сжался, просто вставьте этот блок в сообщение. Агент моментально восстановит рабочую память, активный токен, правила Supervisor и ссылки на сохраненные файлы.
        </p>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap select-text max-h-[45vh] overflow-y-auto leading-relaxed">
          {resumePrompt}
        </pre>
      </div>
    </div>
  );
};
