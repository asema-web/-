import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData, Entry, SaveState, WorkDay } from '../types';
import { isValidData, loadData, saveData, uid } from '../lib/storage';
import { todayISO } from '../lib/dates';
import { isEditable } from '../lib/reports';

/** Если на сегодня ещё нет рабочего дня — создаём ровно один, пустой */
function ensureToday(d: AppData): AppData {
  const t = todayISO();
  if (d.days.some((x) => x.date === t)) return d;
  const now = new Date().toISOString();
  const day: WorkDay = {
    id: uid(),
    date: t,
    status: 'open',
    editing: false,
    completedAt: null,
    amendedAt: null,
    sharedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  return { ...d, days: [...d.days, day] };
}

function touchDay(d: AppData, dayId: string): AppData {
  const now = new Date().toISOString();
  return {
    ...d,
    days: d.days.map((x) =>
      x.id === dayId ? { ...x, updatedAt: now, amendedAt: x.editing ? now : x.amendedAt } : x
    ),
  };
}

export function useStore() {
  const initial = useRef<AppData | null>(null);
  if (initial.current === null) {
    const loaded = loadData();
    const ensured = ensureToday(loaded);
    if (ensured !== loaded) saveData({ ...ensured, lastSavedAt: ensured.lastSavedAt });
    initial.current = ensured;
  }

  const dataRef = useRef<AppData>(initial.current);
  const [data, setData] = useState<AppData>(initial.current);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const timer = useRef<number | undefined>(undefined);

  /**
   * Единственное место, где меняются данные.
   * Если запись в память не удалась — состояние НЕ меняется, возвращаем false.
   */
  const update = useCallback((fn: (d: AppData) => AppData): boolean => {
    const prev = dataRef.current;
    let next = ensureToday(fn(prev));
    if (next === prev) return true;
    next = { ...next, lastSavedAt: new Date().toISOString() };
    setSaveState('saving');
    if (!saveData(next)) {
      setSaveState('error');
      return false;
    }
    dataRef.current = next;
    setData(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaveState('saved'), 400);
    return true;
  }, []);

  // Новый день: проверяем при возврате в приложение и раз в минуту
  useEffect(() => {
    const check = () => update((d) => d);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    const id = window.setInterval(check, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(id);
    };
  }, [update]);

  const addEntry = useCallback(
    (dayId: string, name: string, amount: number) =>
      update((d) => {
        const day = d.days.find((x) => x.id === dayId);
        if (!day || !isEditable(day)) return d;
        const now = new Date().toISOString();
        const entry: Entry = { id: uid(), dayId, name, amount, createdAt: now, updatedAt: now };
        return touchDay({ ...d, entries: [...d.entries, entry] }, dayId);
      }),
    [update]
  );

  const editEntry = useCallback(
    (entryId: string, name: string, amount: number) =>
      update((d) => {
        const entry = d.entries.find((e) => e.id === entryId);
        const day = entry && d.days.find((x) => x.id === entry.dayId);
        if (!entry || !day || !isEditable(day)) return d;
        const now = new Date().toISOString();
        return touchDay(
          { ...d, entries: d.entries.map((e) => (e.id === entryId ? { ...e, name, amount, updatedAt: now } : e)) },
          entry.dayId
        );
      }),
    [update]
  );

  const deleteEntry = useCallback(
    (entryId: string) =>
      update((d) => {
        const entry = d.entries.find((e) => e.id === entryId);
        const day = entry && d.days.find((x) => x.id === entry.dayId);
        if (!entry || !day || !isEditable(day)) return d;
        return touchDay({ ...d, entries: d.entries.filter((e) => e.id !== entryId) }, entry.dayId);
      }),
    [update]
  );

  const finishDay = useCallback(
    (dayId: string) =>
      update((d) => {
        const day = d.days.find((x) => x.id === dayId);
        if (!day || !isEditable(day)) return d; // повторное нажатие ничего не дублирует
        const now = new Date().toISOString();
        return {
          ...d,
          days: d.days.map((x) =>
            x.id === dayId
              ? {
                  ...x,
                  editing: false,
                  status: x.amendedAt ? 'amended' : 'completed',
                  completedAt: now,
                  updatedAt: now,
                }
              : x
          ),
        };
      }),
    [update]
  );

  /** Сегодняшний завершённый день можно открыть снова */
  const reopenDay = useCallback(
    (dayId: string) =>
      update((d) => {
        const now = new Date().toISOString();
        return {
          ...d,
          days: d.days.map((x) =>
            x.id === dayId ? { ...x, status: 'open', editing: false, completedAt: null, updatedAt: now } : x
          ),
        };
      }),
    [update]
  );

  /** Старый день открывается для исправления */
  const startAmend = useCallback(
    (dayId: string) =>
      update((d) => {
        const day = d.days.find((x) => x.id === dayId);
        if (!day || day.editing) return d;
        const now = new Date().toISOString();
        return {
          ...d,
          days: d.days.map((x) => (x.id === dayId ? { ...x, editing: true, updatedAt: now } : x)),
        };
      }),
    [update]
  );

  const markShared = useCallback(
    (dayId: string) =>
      update((d) => {
        const now = new Date().toISOString();
        return { ...d, days: d.days.map((x) => (x.id === dayId ? { ...x, sharedAt: now } : x)) };
      }),
    [update]
  );

  const setOwnerName = useCallback(
    (name: string) => update((d) => (d.ownerName === name ? d : { ...d, ownerName: name })),
    [update]
  );

  const restore = useCallback(
    (incoming: unknown): boolean => {
      if (!isValidData(incoming)) return false;
      return update(() => ({ ...incoming }));
    },
    [update]
  );

  return {
    data,
    saveState,
    addEntry,
    editEntry,
    deleteEntry,
    finishDay,
    reopenDay,
    startAmend,
    markShared,
    setOwnerName,
    restore,
  };
}

export type Store = ReturnType<typeof useStore>;
