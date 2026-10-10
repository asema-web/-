import { useState } from 'react';
import { ArrowLeft, Copy, MessageCircle, Pencil, AlertTriangle } from 'lucide-react';
import type { View, WorkDay } from '../types';
import type { Store } from '../hooks/useStore';
import ConfirmDialog from '../components/ConfirmDialog';
import { buildReportText, copyText, dayEntries, statusLabel, whatsappUrl } from '../lib/reports';
import { formatDate, formatDateTime, todayISO } from '../lib/dates';

interface Props {
  store: Store;
  day: WorkDay;
  notify: (message: string, kind?: 'success' | 'error') => void;
  onNavigate: (v: View) => void;
}

export default function ReportPage({ store, day, notify, onNavigate }: Props) {
  const [confirmAmend, setConfirmAmend] = useState(false);
  const entries = dayEntries(store.data, day.id);
  const text = buildReportText(day, entries);
  const isToday = day.date === todayISO();
  const finished = day.status !== 'open' && !day.editing;
  const changedAfterShare = !!day.sharedAt && !!day.amendedAt && day.amendedAt > day.sharedAt;

  async function copy() {
    const ok = await copyText(text);
    notify(ok ? 'Отчёт скопирован' : 'Не удалось скопировать. Выделите текст и скопируйте вручную.', ok ? 'success' : 'error');
  }

  function share() {
    // Сообщение не отправляется само: WhatsApp откроется с готовым текстом
    window.open(whatsappUrl(text), '_blank', 'noopener');
    store.markShared(day.id);
  }

  function amend() {
    const ok = store.startAmend(day.id);
    setConfirmAmend(false);
    if (ok) onNavigate({ name: 'day', dayId: day.id });
    else notify('Не удалось открыть день для исправления. Попробуйте ещё раз.', 'error');
  }

  return (
    <main className="page">
      <h1 className="page-title">Отчёт за день</h1>
      <p className="muted">
        {formatDate(day.date)} · {statusLabel(day)}
      </p>

      {!finished && !day.editing && (
        <p className="notice notice-warn">
          <AlertTriangle size={20} /> День ещё не завершён, поэтому отчёт предварительный.
        </p>
      )}

      {changedAfterShare && (
        <p className="notice notice-warn">
          <AlertTriangle size={20} /> Отчёт изменён после отправки. Ранее отправленное сообщение в WhatsApp само не
          изменится — отправьте исправленный отчёт ещё раз.
        </p>
      )}

      <p className="muted">Так будет выглядеть сообщение:</p>
      <pre className="report" aria-label="Текст отчёта">
        {text}
      </pre>

      {day.sharedAt && <p className="muted">Последний раз открывали WhatsApp: {formatDateTime(day.sharedAt)}</p>}
      {day.amendedAt && <p className="muted">Последнее исправление: {formatDateTime(day.amendedAt)}</p>}

      <div className="actions">
        <button className="btn btn-whatsapp" onClick={share}>
          <MessageCircle size={24} /> Поделиться в WhatsApp
        </button>
        <button className="btn btn-secondary" onClick={copy}>
          <Copy size={24} /> Скопировать отчёт
        </button>
        {day.editing && (
          <button className="btn btn-outline" onClick={() => onNavigate({ name: 'day', dayId: day.id })}>
            <Pencil size={24} /> Продолжить исправление
          </button>
        )}
        {finished && !isToday && (
          <button className="btn btn-outline" onClick={() => setConfirmAmend(true)}>
            <Pencil size={24} /> Исправить прошлый день
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => onNavigate({ name: 'home' })}>
          <ArrowLeft size={24} /> Назад на главную
        </button>
      </div>

      {confirmAmend && (
        <ConfirmDialog
          title="Исправить прошлый день?"
          confirmLabel="Да, исправить"
          cancelLabel="Не исправлять"
          onConfirm={amend}
          onCancel={() => setConfirmAmend(false)}
        >
          <p>
            Отчёт за {formatDate(day.date)} будет изменён. Вы сможете менять, добавлять и удалять записи, а потом снова
            завершить день.
          </p>
          {day.sharedAt && (
            <p>
              <strong>Этот отчёт уже отправляли в WhatsApp.</strong> Старое сообщение не изменится — исправленный отчёт
              нужно будет отправить заново.
            </p>
          )}
        </ConfirmDialog>
      )}
    </main>
  );
}
