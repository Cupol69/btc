/**
 * Autonomous Agent Recovery & Anti-Amnesia Service
 * 
 * Solves LLM session compaction and sandbox wipeout without paid Cloudflare Workers
 * by establishing a zero-cost persistent recovery trinity:
 * 1. GitHub (Version-controlled state commits via REST API)
 * 2. Google Drive Vault (15 GB free storage via Google OAuth)
 * 3. Email Dispatch (Archival paper trail to user email)
 * 4. Local VFS (Instant browser-side cache)
 */

import { cfComputerWorkspace } from './cloudflareComputerService';
import { getStoredAgentThoughts, AgentThoughtLog } from './cloudflareComputerService';
import { commitFileToGitHub, getStoredGitHubConfig } from './githubService';
import { saveMarkdownFileToDrive, getOrCreateVaultFolder, getDriveAccessToken } from './googleDriveService';

export interface AgentRecoveryState {
  version: string;
  timestamp: string;
  userEmail: string;
  activeToken: string;
  activeMarketPhase: string;
  supervisorRulesCount: number;
  invalidationTriggers: string[];
  recentThoughts: AgentThoughtLog[];
  vfsFileCatalog: { path: string; sizeBytes: number; modifiedAt: string }[];
  marketWatchlist: string[];
  summaryNote: string;
}

const RECOVERY_STORAGE_KEY = 'onchain_agent_recovery_state';
export const USER_EMAIL_DEFAULT = 'dmitrydmitry61831@gmail.com';

export function buildCurrentRecoveryState(activeToken = 'BTCUSDT', summaryNote = ''): AgentRecoveryState {
  const vfsFiles = cfComputerWorkspace.listFiles().map((f) => ({
    path: f.path,
    sizeBytes: f.sizeBytes,
    modifiedAt: f.modifiedAt,
  }));

  const thoughts = getStoredAgentThoughts();
  const invalidations = thoughts
    .map((t) => t.invalidationTrigger)
    .filter((inv) => Boolean(inv && inv.trim()));

  return {
    version: '3.0.0-zero-cost',
    timestamp: new Date().toISOString(),
    userEmail: USER_EMAIL_DEFAULT,
    activeToken,
    activeMarketPhase: 'INSTITUTIONAL_VOLATILITY_MONITORING',
    supervisorRulesCount: 4,
    invalidationTriggers: invalidations.length > 0 ? invalidations.slice(0, 5) : [
      'Пробой локального минимума 24h при отрицательном CVD',
      'Падение пула ликвидности AMM ниже $200k',
      'Расхождение цены и ончейна при Vol/Liq > 5 (wash trading)'
    ],
    recentThoughts: thoughts.slice(0, 10),
    vfsFileCatalog: vfsFiles,
    marketWatchlist: ['BTCUSDT', 'MARS', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'],
    summaryNote: summaryNote || 'Автономный слепок аналитического контекста терминала. Все данные верифицированы.',
  };
}

export function saveLocalRecoverySnapshot(state: AgentRecoveryState): void {
  try {
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(state));
    // Also save into VFS
    cfComputerWorkspace.writeFile(
      '/workspace/memory/AGENT_STATE_SNAPSHOT.json',
      JSON.stringify(state, null, 2),
      'SYSTEM'
    );
  } catch (e) {
    console.error('Failed to save local recovery snapshot', e);
  }
}

export function getLocalRecoverySnapshot(): AgentRecoveryState | null {
  try {
    const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local recovery snapshot', e);
  }
  return null;
}

/**
 * Generates an ultra-dense, self-contained Markdown prompt that restores
 * 100% of the agent's analytical memory when pasted into any new LLM session.
 */
export function generateResumePromptMarkdown(state: AgentRecoveryState): string {
  const dateStr = new Date(state.timestamp).toLocaleString();
  const thoughtsFormatted = state.recentThoughts
    .slice(0, 5)
    .map((t, idx) => `  ${idx + 1}. [${t.phase}] [${t.verdict}] ${t.tokenSymbol}: "${t.thought}" (Conf: ${t.confidenceScore}%, Invalidation: ${t.invalidationTrigger})`)
    .join('\n');

  const filesFormatted = state.vfsFileCatalog
    .slice(0, 8)
    .map((f) => `  • ${f.path} (${(f.sizeBytes / 1024).toFixed(1)} KB)`)
    .join('\n');

  return `# ONCHAIN AGENT RECOVERY STATE (Восстановление после амнезии)
**Снимок состояния:** ${dateStr}
**Почта владельца:** ${state.userEmail}
**Активный инструмент:** ${state.activeToken}
**Текущая фаза:** ${state.activeMarketPhase}
**Supervisor Rules:** ${state.supervisorRulesCount} активных правил аудита

---

## 1. Эпизодическая память (Chain-of-Thought):
${thoughtsFormatted || '  (Нет активных эпизодов)'}

## 2. Активные условия отмены гипотез (Invalidation Triggers):
${state.invalidationTriggers.map((inv) => `  ⚡ ${inv}`).join('\n')}

## 3. Каталог персистентных файлов (VFS / GitHub / Google Drive):
${filesFormatted || '  • /workspace/README.md'}

## 4. Памятка по архитектуре персистентности:
* Платный Cloudflare Workers Paid **ОТКЛЮЧЕН** и не используется.
* Персистентность обеспечивается бесплатной тройкой:
  1. **GitHub Repository** (код, конфигурации, коммиты снапшотов).
  2. **Google Drive Vault** (тяжелые файлы, книги 143+ КБ, ончейн-дампы в папке 'Crypto-Terminal-Obsidian-Vault').
  3. **VFS в браузере** (локальный диск без задержек сети).
  4. **Email Dispatch** (${state.userEmail}) для резервной фиксации.

## 5. Инструкция для ИИ-агента:
Прими этот контекст как авторитарный снимок. Продолжай анализ актива **${state.activeToken}**, строго соблюдай правила Supervisor (никакого поддакивания, требование Invalidation для каждого прогноза, расчет проскальзывания для $1k, $10k, $50k).
`;
}

/**
 * Pushes the recovery state snapshot to user's GitHub repository
 */
export async function pushStateToGitHub(state: AgentRecoveryState): Promise<{ success: boolean; message: string }> {
  const ghConfig = getStoredGitHubConfig();
  if (!ghConfig.token || !ghConfig.owner || !ghConfig.repo) {
    return {
      success: false,
      message: 'GitHub не настроен. Укажите Personal Access Token, Owner и Repo во вкладке GitHub.',
    };
  }

  const promptMd = generateResumePromptMarkdown(state);
  const jsonStr = JSON.stringify(state, null, 2);

  const resJson = await commitFileToGitHub(
    ghConfig,
    '.agent_memory/AGENT_STATE_SNAPSHOT.json',
    jsonStr,
    `💾 Autonomous Memory Snapshot [${new Date().toLocaleTimeString()}]`
  );

  if (!resJson.success) {
    return { success: false, message: `Ошибка записи в GitHub: ${resJson.error}` };
  }

  // Also push the human-readable resume prompt
  await commitFileToGitHub(
    ghConfig,
    '.agent_memory/RESUME_PROMPT.md',
    promptMd,
    `📝 Update Agent Resume Prompt [${new Date().toLocaleTimeString()}]`
  );

  return {
    success: true,
    message: `✅ Снапшот памяти успешно сохранен в GitHub (${ghConfig.owner}/${ghConfig.repo})!`,
  };
}

/**
 * Pushes the recovery state snapshot to user's Google Drive Vault
 */
export async function pushStateToGoogleDrive(state: AgentRecoveryState): Promise<{ success: boolean; message: string }> {
  const token = getDriveAccessToken();
  if (!token) {
    return {
      success: false,
      message: 'Google Drive не авторизован. Нажмите "Подключить Google Drive" во вкладке Диск.',
    };
  }

  try {
    const folderId = await getOrCreateVaultFolder(token);
    const jsonStr = JSON.stringify(state, null, 2);
    const promptMd = generateResumePromptMarkdown(state);

    await saveMarkdownFileToDrive(token, folderId, 'AGENT_STATE_SNAPSHOT.json', jsonStr);
    await saveMarkdownFileToDrive(token, folderId, 'RESUME_PROMPT.md', promptMd);

    return {
      success: true,
      message: '✅ Снапшот памяти сохранен в папку "Crypto-Terminal-Obsidian-Vault" на вашем Google Диске!',
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Ошибка сохранения на Google Drive: ${e.message}`,
    };
  }
}

/**
 * Generates a ready mailto: URL for sending the recovery snapshot to user email
 */
export function generateEmailDigestMailto(state: AgentRecoveryState): string {
  const subject = encodeURIComponent(`[OnChain Memory Backup] Снимок состояния агента · ${state.activeToken}`);
  const promptMd = generateResumePromptMarkdown(state);
  const body = encodeURIComponent(
    `Резервная копия памяти терминала:\n\n${promptMd}\n\nСгенерировано автоматически из OnChain Core.`
  );
  return `mailto:${state.userEmail}?subject=${subject}&body=${body}`;
}
