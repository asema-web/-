import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Download, Upload, ShieldAlert } from 'lucide-react';
import type { Store } from '../hooks/useStore';
import ConfirmDialog from '../components/ConfirmDialog';
import { buildCSV, downloadFile } from '../lib/reports';
import { formatDateTime, todayISO } from '../lib/dates';

interface Props {
  store: Store;
  notify: (message: string, kind?: 'success' | 'error') => void;
}

export default function SettingsPage({ store, notify }: Props) {
  const [name, setName] = useState(store.data.ownerName);
  const [pending, setPending] = useState<unknown>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function saveName() {
    const ok = store.setOwnerName(name.trim());
    notify(ok ? 'Имя сохранено' : 'Не удалось сохранить имя.', ok ? 'success' : 'error');
  }

  function exportCSV() {
    downloadFile(`moya-kassa-${todayISO()}.csv`, buildCSV(store.data), 'text/csv;charset=utf-8');
    notify('Файл для Excel готов');
  }

  function exportBackup() {
    downloadFile(`moya-kassa-kopiya-${todayISO()}.json`, JSON.stringify(store.data, null, 2), 'application/json');
    notify('Резервная копия сохранена');
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      setPending(parsed);
    } catch {
      notify('Этот файл не похож на резервную копию «Моя касса».', 'error');
    }
  }

  function restore() {
    const ok = store.restore(pending);
    setPending(null);
    notify(ok ? 'Данные восстановлены' : 'Этот файл не похож на резервную копию «Моя касса».', ok ? 'success' : 'error');
  }

  return (
    <main className="page">
      <h1 className="page-title">Настройки</h1>

      <section className="card">
        <label className="field">
          <span>Имя владельца</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="off" />
        </label>
        <button className="btn btn-primary" onClick={saveName}>
          Сохранить имя
        </button>
      </section>

      <section className="card">
        <dl className="summary">
          <dt>Валюта</dt>
          <dd>Сом</dd>
          <dt>Часовой пояс</dt>
          <dd>Asia/Bishkek</dd>
          <dt>Последнее сохранение</dt>
          <dd>{formatDateTime(store.data.lastSavedAt)}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>Резервная копия</h2>
        <p className="notice notice-warn">
          <ShieldAlert size={20} /> Записи хранятся только в этом телефоне. Если очистить данные браузера или потерять
          телефон, записи пропадут. Сохраняйте резервную копию хотя бы раз в неделю и отправляйте файл себе в WhatsApp.
        </p>
        <div className="actions">
          <button className="btn btn-secondary" onClick={exportBackup}>
            <Download size={24} /> Сохранить резервную копию
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={24} /> Восстановить из копии
          </button>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={24} /> Выгрузить историю для Excel
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      </section>

      {pending !== null && (
        <ConfirmDialog
          title="Восстановить из копии?"
          confirmLabel="Да, восстановить"
          cancelLabel="Не восстанавливать"
          danger
          onConfirm={restore}
          onCancel={() => setPending(null)}
        >
          <p>Все записи, которые сейчас есть в приложении, будут заменены данными из файла.</p>
        </ConfirmDialog>
      )}
    </main>
  );
}
