/**
 * GitHub Persistent Sync Service
 * Allows the app and agent to persist all generated analyses, e-books, and on-chain forensics
 * directly into a user's GitHub repository via GitHub REST API, eliminating sandbox wipeout.
 */

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface GitHubFileCommitResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  message?: string;
  error?: string;
}

const GITHUB_CONFIG_STORAGE_KEY = 'onchain_github_sync_config';

export function getStoredGitHubConfig(): GitHubSyncConfig {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse GitHub config', e);
  }
  return {
    owner: '',
    repo: 'crypto-terminal-vault',
    branch: 'main',
    token: '',
  };
}

export function saveGitHubConfig(config: GitHubSyncConfig): void {
  localStorage.setItem(GITHUB_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Commit or update a file directly in GitHub repository
 */
export async function commitFileToGitHub(
  config: GitHubSyncConfig,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<GitHubFileCommitResult> {
  if (!config.token || !config.owner || !config.repo) {
    return {
      success: false,
      error: 'Укажите GitHub Token, владельца (Owner) и название репозитория (Repo).',
    };
  }

  try {
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;
    
    // 1. Check if file already exists to get its SHA (required for updating in GitHub API)
    let existingSha: string | undefined;
    try {
      const getRes = await fetch(apiUrl + `?ref=${config.branch || 'main'}`, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
      }
    } catch (e) {
      // File doesn't exist yet, proceed with creation
    }

    // 2. Encode UTF-8 content to Base64 safely
    const utf8Bytes = new TextEncoder().encode(content);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Content = btoa(binary);

    // 3. Put request to create/update file
    const payload: any = {
      message: commitMessage || `Update ${filePath} via OnChain Core Sync`,
      content: base64Content,
      branch: config.branch || 'main',
    };
    if (existingSha) {
      payload.sha = existingSha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.message || `GitHub API error: HTTP ${putRes.status}`,
      };
    }

    const resData = await putRes.json();
    return {
      success: true,
      commitSha: resData.commit?.sha,
      commitUrl: resData.commit?.html_url,
      message: `✅ Файл "${filePath}" успешно сохранен в ветку ${config.branch}!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Сбой соединения с GitHub API',
    };
  }
}
