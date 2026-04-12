const STORAGE_KEY = 'nc-recent-searches-v1';
const MAX = 10;

export interface RecentSearchEntry {
  sido?: string;
  sigungu?: string;
  hospitalName?: string;
  label: string;
  at: string;
}

function readAll(): RecentSearchEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is RecentSearchEntry =>
        x &&
        typeof x === 'object' &&
        typeof (x as RecentSearchEntry).label === 'string' &&
        typeof (x as RecentSearchEntry).at === 'string'
    );
  } catch {
    return [];
  }
}

function writeAll(entries: RecentSearchEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // quota / private mode
  }
}

export function loadRecentSearches(): RecentSearchEntry[] {
  return readAll();
}

export function pushRecentSearch(entry: Omit<RecentSearchEntry, 'at'>): void {
  const at = new Date().toISOString();
  const prev = readAll().filter(
    (e) =>
      e.label !== entry.label ||
      e.sido !== entry.sido ||
      e.sigungu !== entry.sigungu ||
      e.hospitalName !== entry.hospitalName
  );
  writeAll([{ ...entry, at }, ...prev]);
}
