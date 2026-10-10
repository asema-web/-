import type { AppData } from '../types';

const KEY = 'moya-kassa-data-v1';

export function emptyData(): AppData {
  return { version: 1, ownerName: '', days: [], entries: [], lastSavedAt: null };
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isValidData(x: unknown): x is AppData {
  if (!x || typeof x !== 'object') return false;
  const d = x as Partial<AppData>;
  return d.version === 1 && Array.isArray(d.days) && Array.isArray(d.entries);
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed: unknown = JSON.parse(raw);
    return isValidData(parsed) ? parsed : emptyData();
  } catch {
    return emptyData();
  }
}

/** Возвращает true только если данные реально записаны */
export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}
