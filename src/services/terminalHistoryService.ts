export interface TerminalHistoryItem {
  id: string;
  symbol: string;
  name?: string;
  contract?: string;
  chain?: string;
  priceUsd?: number;
  priceChange24h?: number;
  timestamp: number;
}

const STORAGE_KEY = 'terminal_recent_tokens_history_v1';
const MAX_HISTORY_ITEMS = 30;

const INITIAL_DEFAULT_HISTORY: TerminalHistoryItem[] = [];

export function getTerminalHistory(): TerminalHistoryItem[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_HISTORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('[TerminalHistory] read error:', err);
    return [];
  }
}

export function saveTerminalHistory(items: TerminalHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
    window.dispatchEvent(new CustomEvent('terminal_history_updated', { detail: items }));
  } catch (err) {
    console.warn('[TerminalHistory] save error:', err);
  }
}

export function addTerminalHistory(item: {
  symbol: string;
  name?: string;
  contract?: string;
  chain?: string;
  priceUsd?: number;
  priceChange24h?: number;
}): TerminalHistoryItem[] {
  const current = getTerminalHistory();
  const id = (item.contract || item.symbol).toLowerCase().trim();
  if (!id) return current;

  const existingIndex = current.findIndex((x) => x.id === id || (item.contract && x.contract?.toLowerCase() === item.contract.toLowerCase()) || x.symbol.toLowerCase() === item.symbol.toLowerCase());
  
  const newItem: TerminalHistoryItem = {
    id,
    symbol: item.symbol.toUpperCase(),
    name: item.name || `${item.symbol} Token`,
    contract: item.contract,
    chain: item.chain || (item.contract?.startsWith('0x') ? 'BSC' : 'SOLANA'),
    priceUsd: item.priceUsd && item.priceUsd > 0 ? item.priceUsd : (existingIndex >= 0 ? current[existingIndex].priceUsd : undefined),
    priceChange24h: item.priceChange24h !== undefined ? item.priceChange24h : (existingIndex >= 0 ? current[existingIndex].priceChange24h : undefined),
    timestamp: Date.now(),
  };

  let updated: TerminalHistoryItem[];
  if (existingIndex >= 0) {
    updated = [
      newItem,
      ...current.filter((_, idx) => idx !== existingIndex)
    ];
  } else {
    updated = [newItem, ...current];
  }

  const finalItems = updated.slice(0, MAX_HISTORY_ITEMS);
  saveTerminalHistory(finalItems);
  return finalItems;
}

export function removeTerminalHistoryItem(idOrContract: string): TerminalHistoryItem[] {
  const current = getTerminalHistory();
  const target = idOrContract.toLowerCase().trim();
  const updated = current.filter((x) => x.id !== target && x.contract?.toLowerCase() !== target && x.symbol.toLowerCase() !== target);
  saveTerminalHistory(updated);
  return updated;
}

export function clearTerminalHistory(): void {
  saveTerminalHistory([]);
}
