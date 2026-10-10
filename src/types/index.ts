export type DayStatus = 'open' | 'completed' | 'amended';

export interface Entry {
  id: string;
  dayId: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkDay {
  id: string;
  /** Дата рабочего дня в формате ГГГГ-ММ-ДД (по времени Бишкека) */
  date: string;
  status: DayStatus;
  /** true, пока завершённый день открыт для исправления */
  editing: boolean;
  completedAt: string | null;
  amendedAt: string | null;
  sharedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  version: 1;
  ownerName: string;
  days: WorkDay[];
  entries: Entry[];
  lastSavedAt: string | null;
}

export type SaveState = 'saved' | 'saving' | 'error';

export type View =
  | { name: 'home' }
  | { name: 'day'; dayId: string }
  | { name: 'report'; dayId: string }
  | { name: 'history' }
  | { name: 'settings' };
