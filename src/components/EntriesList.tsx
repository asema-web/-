import { Pencil, Trash2 } from 'lucide-react';
import type { Entry } from '../types';
import { formatMoney } from '../lib/money';

interface Props {
  entries: Entry[];
  total: number;
  editable: boolean;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export default function EntriesList({ entries, total, editable, onEdit, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <section className="empty">
        <p>Записей пока нет.</p>
        {editable && <p className="muted">Нажмите «Добавить запись», чтобы внести первую сумму.</p>}
      </section>
    );
  }

  return (
    <section aria-label="Записи за день">
      <ul className="entries">
        {entries.map((e, i) => (
          <li key={e.id} className="entry">
            <span className="entry-num">{i + 1}</span>
            <div className="entry-main">
              <strong>{e.name}</strong>
              <span className="entry-amount">{formatMoney(e.amount)}</span>
            </div>
            {editable && (
              <div className="entry-actions">
                <button className="btn-link" onClick={() => onEdit(e)} aria-label={`Изменить запись ${e.name}`}>
                  <Pencil size={18} /> Изменить
                </button>
                <button className="btn-link danger" onClick={() => onDelete(e)} aria-label={`Удалить запись ${e.name}`}>
                  <Trash2 size={18} /> Удалить
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="entries-total">
        <span>Итого</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </section>
  );
}
