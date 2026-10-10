import { useState } from 'react';
import { Plus, FileText, CheckCircle2, Lock, RotateCcw, AlertTriangle } from 'lucide-react';
import type { Entry, View, WorkDay } from '../types';
import type { Store } from '../hooks/useStore';
import Header from '../components/Header';
import TotalCard from '../components/TotalCard';
import EntriesList from '../components/EntriesList';
import EntryForm from '../components/EntryForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { dayEntries, entriesTotal, isEditable } from '../lib/reports';
import { formatDate } from '../lib/dates';
import { formatMoney } from '../lib/money';

interface Props {
  store: Store;
  day: WorkDay;
  isToday: boolean;
  notify: (message: string, kind?: 'success' | 'error') => void;
  onNavigate: (v: View) => void;
}

type FormState = { mode: 'add' } | { mode: 'edit'; entry: Entry } | null;

export default function DayPage({ store, day, isToday, notify, onNavigate }: Props) {
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Entry | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);

  const entries = dayEntries(store.data, day.id);
  const total = entriesTotal(entries);
  const editable = isEditable(day);

  function saveEntry(name: string, amount: number): boolean {
    if (!form) return false;
    const ok = form.mode === 'add' ? store.addEntry(day.id, name, amount) : store.editEntry(form.entry.id, name, amount);
    if (ok) {
      setForm(null);
      notify(form.mode === 'add' ? 'Запись успешно сохранена' : 'Запись изменена');
    }
    return ok;
  }

  function removeEntry() {
    if (!toDelete) return;
    const ok = store.deleteEntry(toDelete.id);
    setToDelete(null);
    notify(ok ? 'Запись удалена' : 'Не удалось удалить запись. Попробуйте ещё раз.', ok ? 'success' : 'error');
  }

  function finish() {
    const ok = store.finishDay(day.id);
    setConfirmFinish(false);
    if (ok) {
      notify(day.editing ? 'Исправление сохранено' : 'Рабочий день успешно завершён');
      onNavigate({ name: 'report', dayId: day.id });
    } else {
      notify('День не завершён: данные не сохранились. Нажмите «Завершить день» ещё раз.', 'error');
    }
  }

  function reopen() {
    const ok = store.reopenDay(day.id);
    setConfirmReopen(false);
    notify(ok ? 'День снова открыт' : 'Не удалось открыть день. Попробуйте ещё раз.', ok ? 'success' : 'error');
  }

  return (
    <main className="page">
      <Header day={day} saveState={store.saveState} />

      {store.saveState === 'error' && (
        <p className="notice notice-error">
          <AlertTriangle size={20} /> Данные не удалось сохранить. Освободите место в телефоне и повторите действие.
        </p>
      )}

      {day.editing && (
        <p className="notice notice-warn">
          <AlertTriangle size={20} /> Вы исправляете день за {formatDate(day.date)}. Когда закончите, нажмите «Завершить исправление».
        </p>
      )}

      <TotalCard
        label={isToday ? 'ВСЕГО ПОЛУЧЕНО СЕГОДНЯ' : `ВСЕГО ПОЛУЧЕНО ЗА ${formatDate(day.date)}`}
        total={total}
        entries={entries}
      />

      {!editable && (
        <p className="notice notice-info">
          <Lock size={20} /> День завершён. Записи защищены от случайных изменений.
        </p>
      )}

      <EntriesList
        entries={entries}
        total={total}
        editable={editable}
        onEdit={(entry) => setForm({ mode: 'edit', entry })}
        onDelete={setToDelete}
      />

      <div className="actions">
        {editable && (
          <button className="btn btn-primary" onClick={() => setForm({ mode: 'add' })}>
            <Plus size={24} /> Добавить запись
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => onNavigate({ name: 'report', dayId: day.id })}>
          <FileText size={24} /> Сформировать отчёт
        </button>
        {editable && (
          <button className="btn btn-outline" onClick={() => setConfirmFinish(true)}>
            <CheckCircle2 size={24} /> {day.editing ? 'Завершить исправление' : 'Завершить день'}
          </button>
        )}
        {!editable && isToday && (
          <button className="btn btn-outline" onClick={() => setConfirmReopen(true)}>
            <RotateCcw size={24} /> Открыть день снова
          </button>
        )}
      </div>

      {form && (
        <EntryForm
          initial={form.mode === 'edit' ? form.entry : undefined}
          onSave={saveEntry}
          onCancel={() => setForm(null)}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Удалить запись?"
          confirmLabel="Да, удалить"
          cancelLabel="Не удалять"
          danger
          onConfirm={removeEntry}
          onCancel={() => setToDelete(null)}
        >
          <p>
            {toDelete.name} — {formatMoney(toDelete.amount)}
          </p>
          <p>Итоговая сумма будет пересчитана.</p>
        </ConfirmDialog>
      )}

      {confirmFinish && (
        <ConfirmDialog
          title={day.editing ? 'Завершить исправление?' : 'Завершить рабочий день?'}
          confirmLabel={day.editing ? 'Да, завершить исправление' : 'Да, завершить день'}
          onConfirm={finish}
          onCancel={() => setConfirmFinish(false)}
        >
          <p>
            Все записи сохранятся. После завершения новые записи добавлять нельзя, пока день не будет открыт снова.
            Отчёт можно будет посмотреть в истории.
          </p>
          <dl className="summary">
            <dt>Дата</dt>
            <dd>{formatDate(day.date)}</dd>
            <dt>Записей</dt>
            <dd>{entries.length}</dd>
            <dt>Всего</dt>
            <dd>{formatMoney(total)}</dd>
          </dl>
        </ConfirmDialog>
      )}

      {confirmReopen && (
        <ConfirmDialog
          title="Открыть день снова?"
          confirmLabel="Да, открыть"
          onConfirm={reopen}
          onCancel={() => setConfirmReopen(false)}
        >
          <p>Вы сможете добавлять и менять записи за сегодня. Потом день нужно будет завершить ещё раз.</p>
        </ConfirmDialog>
      )}
    </main>
  );
}
