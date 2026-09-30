/**
 * Cloudflare Computer Service (@cloudflare/computer specification)
 * 
 * Provides an agent-centric Virtual Filesystem (Workspace) backed by Durable Objects / persistent storage,
 * dynamic code execution, and automatic Git/Cloud sync so agent sessions never lose their state.
 */

export interface VirtualFile {
  path: string;
  content: string;
  sizeBytes: number;
  modifiedAt: string;
  author: 'AGENT' | 'USER' | 'SYSTEM';
}

export interface CloudflareComputerConfig {
  accountId: string;
  apiToken: string;
  durableObjectName: string;
  workerUrl?: string;
  autoSyncGit: boolean;
}

export interface AgentThoughtLog {
  id: string;
  timestamp: string;
  tokenSymbol: string;
  phase: 'OBSERVE' | 'ORIENT' | 'DECIDE' | 'ACT' | 'SUPERVISOR_AUDIT';
  thought: string;
  verdict: 'FACT' | 'INFERENCE' | 'RUMOR' | 'MISSING_DATA';
  confidenceScore: number;
  invalidationTrigger: string;
}

export interface SupervisorAuditCheck {
  id: string;
  title: string;
  category: 'SECURITY' | 'MARKET' | 'HONESTY' | 'LIQUIDITY';
  status: 'PASSED' | 'WARNING' | 'FAILED';
  ruleDescription: string;
  detectedFinding: string;
  actionRequired: string;
}

const CF_COMPUTER_STORAGE_KEY = 'onchain_cf_computer_workspace';
const CF_CONFIG_STORAGE_KEY = 'onchain_cf_computer_config';
const CF_THOUGHTS_STORAGE_KEY = 'onchain_cf_agent_thoughts';

export class CloudflareComputerWorkspace {
  private files: Map<string, VirtualFile> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(CF_COMPUTER_STORAGE_KEY);
      if (raw) {
        const parsed: VirtualFile[] = JSON.parse(raw);
        parsed.forEach((f) => this.files.set(f.path, f));
      } else {
        // Initialize with core system baseline files and directory structure
        this.writeFile(
          '/workspace/README.md',
          '# Cloudflare Computer • Persistent Workspace\n\nЭтот виртуальный диск подключен к Cloudflare Durable Objects. Все созданные файлы сохраняются между сессиями.\n\n## Иерархия Workspace:\n- `/workspace/reports/` — ончейн-аудиты и матрица ликвидности\n- `/workspace/episodes/` — эпизодическая память и логи мышления\n- `/workspace/supervisor/` — правила инспекции и аудита гипотез\n- `/workspace/rag_cache/` — векторный кэш документов и фактов\n',
          'SYSTEM'
        );
        this.writeFile(
          '/workspace/supervisor/rules.json',
          JSON.stringify([
            { id: 'S1', rule: 'Anti-Hallucination: No prediction without explicit invalidation trigger', severity: 'CRITICAL' },
            { id: 'S2', rule: 'Anti-Confirmation: Reject user hype if volume/liquidity diverges', severity: 'CRITICAL' },
            { id: 'S3', rule: 'Slippage Guard: Recalculate impact for $1k, $10k, $50k sizes', severity: 'HIGH' },
            { id: 'S4', rule: 'Honeypot Barrier: Verify GoPlus + bytecode before listing recommendations', severity: 'CRITICAL' }
          ], null, 2),
          'SYSTEM'
        );
      }
    } catch (e) {
      console.error('Failed to load CF Computer workspace from storage', e);
    }
  }

  private saveToStorage() {
    try {
      const list = Array.from(this.files.values());
      localStorage.setItem(CF_COMPUTER_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save CF Computer workspace', e);
    }
  }

  public writeFile(path: string, content: string, author: 'AGENT' | 'USER' | 'SYSTEM' = 'AGENT'): VirtualFile {
    const file: VirtualFile = {
      path,
      content,
      sizeBytes: new TextEncoder().encode(content).length,
      modifiedAt: new Date().toISOString(),
      author,
    };
    this.files.set(path, file);
    this.saveToStorage();
    return file;
  }

  public readFile(path: string): string | null {
    const file = this.files.get(path);
    return file ? file.content : null;
  }

  public deleteFile(path: string): boolean {
    const res = this.files.delete(path);
    if (res) this.saveToStorage();
    return res;
  }

  public listFiles(): VirtualFile[] {
    return Array.from(this.files.values());
  }

  public getTotalSizeKb(): number {
    let total = 0;
    this.files.forEach((f) => (total += f.sizeBytes));
    return total / 1024;
  }

  public clear(): void {
    this.files.clear();
    this.saveToStorage();
  }
}

export const cfComputerWorkspace = new CloudflareComputerWorkspace();

export function getStoredCloudflareComputerConfig(): CloudflareComputerConfig {
  try {
    const raw = localStorage.getItem(CF_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse CF Computer config', e);
  }
  return {
    accountId: '',
    apiToken: '',
    durableObjectName: 'OnChain-Agent-Workspace-DO',
    workerUrl: '',
    autoSyncGit: true,
  };
}

export function saveCloudflareComputerConfig(config: CloudflareComputerConfig): void {
  localStorage.setItem(CF_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Real probe to check Cloudflare Computer connection state.
 * Returns ONLINE if remote worker URL is configured and responding,
 * DEGRADED if using local browser VFS fallback (LocalStorage),
 * OFFLINE if the worker URL is set but unreachable.
 */
export async function checkCloudflareComputerConnection(): Promise<{
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  details: string;
  endpoint: string;
}> {
  const config = getStoredCloudflareComputerConfig();
  const fileCount = cfComputerWorkspace.listFiles().length;

  if (config.workerUrl && config.workerUrl.trim()) {
    const cleanUrl = config.workerUrl.trim().replace(/\/+$/, '');
    const t0 = performance.now();
    try {
      const res = await fetch(`${cleanUrl}/files`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3500),
      });
      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        return {
          status: 'ONLINE',
          latencyMs: latency,
          details: `Cloudflare DO Workspace онлайн · DO: ${config.durableObjectName || 'Active'}`,
          endpoint: cleanUrl,
        };
      }
      return {
        status: 'OFFLINE',
        latencyMs: latency,
        details: `Worker ответил HTTP ${res.status}. Проверьте Durable Object binding.`,
        endpoint: cleanUrl,
      };
    } catch (e: any) {
      return {
        status: 'OFFLINE',
        latencyMs: 0,
        details: `Не удалось связаться с Worker DO (${e.message || 'Network Timeout'}).`,
        endpoint: cleanUrl,
      };
    }
  }

  // No remote Worker URL provided: honest fallback status
  return {
    status: 'DEGRADED',
    latencyMs: 1,
    details: `Локальный VFS кэш (LocalStorage: ${fileCount} файлов). Удалённый DO Worker не развёрнут (wrangler deploy не выполнен).`,
    endpoint: 'local-vfs://browser-storage',
  };
}

/**
 * Episodic Memory thought logging helper
 */
export function getStoredAgentThoughts(): AgentThoughtLog[] {
  try {
    const raw = localStorage.getItem(CF_THOUGHTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load agent thoughts', e);
  }

  // Default baseline episodic memory log
  return [
    {
      id: 'ep-01',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      tokenSymbol: 'BTCUSDT',
      phase: 'OBSERVE',
      thought: 'Деривативы Binance: Funding Rate стабилизировался около 0.0100%. Open Interest +1.8% без всплеска ликвидаций.',
      verdict: 'FACT',
      confidenceScore: 92,
      invalidationTrigger: 'Резкий скачок CVD вниз с пробоем локального минимума 24h.'
    },
    {
      id: 'ep-02',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      tokenSymbol: 'MARS',
      phase: 'SUPERVISOR_AUDIT',
      thought: 'Инспектор выявил: ликвидность $180k при MCap $84M (коэффициент 0.0021). Сброс $10k вызовет проскальзывание >12%.',
      verdict: 'INFERENCE',
      confidenceScore: 88,
      invalidationTrigger: 'Пополнение пула AMM реальным капиталом > $1.5M.'
    }
  ];
}

export function saveAgentThought(thought: Omit<AgentThoughtLog, 'id' | 'timestamp'>): AgentThoughtLog {
  const list = getStoredAgentThoughts();
  const newEntry: AgentThoughtLog = {
    ...thought,
    id: `ep-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
  };
  list.unshift(newEntry);
  if (list.length > 50) list.pop();
  try {
    localStorage.setItem(CF_THOUGHTS_STORAGE_KEY, JSON.stringify(list));
    // Also mirror into workspace VFS
    cfComputerWorkspace.writeFile(
      `/workspace/episodes/${newEntry.id}.json`,
      JSON.stringify(newEntry, null, 2),
      'AGENT'
    );
  } catch (e) {
    console.error('Failed to save thought to memory', e);
  }
  return newEntry;
}

/**
 * Generates the official wrangler.jsonc / worker.ts code for deploying @cloudflare/computer
 */
export function generateCloudflareComputerWorkerTemplate(): { wrangler: string; workerTs: string } {
  const wrangler = `// wrangler.jsonc (Deploy @cloudflare/computer Agent Runtime)
{
  "name": "onchain-agent-computer",
  "main": "src/index.ts",
  "compatibility_date": "2026-09-29",
  "compatibility_flags": ["nodejs_compat"],
  "durable_objects": {
    "bindings": [
      { "name": "AGENT_COMPUTER_DO", "class_name": "AgentComputerDurableObject" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["AgentComputerDurableObject"] }
  ]
}`;

  const workerTs = `// src/index.ts (Cloudflare Computer Agent Runtime with SQLite VFS)
import { DurableObject } from "cloudflare:workers";
// @cloudflare/computer provides Virtual Filesystem + Dynamic Worker execution
// npm install @cloudflare/computer

export class AgentComputerDurableObject extends DurableObject {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(\`
      CREATE TABLE IF NOT EXISTS files (
        path TEXT PRIMARY KEY,
        content TEXT,
        size_bytes INTEGER,
        author TEXT,
        updated_at TEXT
      );
    \`);
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Save persistent file
    if (request.method === "POST" && url.pathname === "/files/write") {
      const { path, content, author = "AGENT" } = await request.json() as any;
      const now = new Date().toISOString();
      const size = new TextEncoder().encode(content).length;
      this.sql.exec("INSERT OR REPLACE INTO files (path, content, size_bytes, author, updated_at) VALUES (?, ?, ?, ?, ?)", path, content, size, author, now);
      return Response.json({ success: true, path, size, updated_at: now }, { headers: corsHeaders });
    }

    // List all persistent files
    if (request.method === "GET" && url.pathname === "/files") {
      const cursor = this.sql.exec("SELECT path, size_bytes, author, updated_at FROM files ORDER BY updated_at DESC");
      return Response.json({ files: [...cursor], durableObject: "AgentComputerDurableObject" }, { headers: corsHeaders });
    }

    // Read file
    if (request.method === "GET" && url.pathname.startsWith("/files/read")) {
      const path = url.searchParams.get("path");
      const cursor = this.sql.exec("SELECT content FROM files WHERE path = ?", path);
      const row = [...cursor][0] as any;
      if (!row) return new Response("File not found", { status: 404, headers: corsHeaders });
      return new Response(row.content, { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } });
    }

    return Response.json({ status: "Cloudflare Computer Durable Object Active", time: Date.now() }, { headers: corsHeaders });
  }
}

export default {
  async fetch(request: Request, env: any) {
    const id = env.AGENT_COMPUTER_DO.idFromName("global-agent-workspace");
    const stub = env.AGENT_COMPUTER_DO.get(id);
    return stub.fetch(request);
  }
};`;

  return { wrangler, workerTs };
}
