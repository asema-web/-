import type { Entry } from '../types';
import { formatMoney } from '../lib/money';
import { formatDateTime } from '../lib/dates';

interface Props {
  label: string;
  total: number;
  entries: Entry[];
}

export default function TotalCard({ label, total, entries }: Props) {
  const last = entries.length > 0 ? entries[entries.length - 1] : null;
  return (
    <section className="total-card" aria-label="Итоговая сумма">
      <p className="total-label">{label}</p>
      <p className="total-amount">{formatMoney(total)}</p>
      <div className="total-meta">
        <span>Записей: {entries.length}</span>
        {last && (
          <span>
            Последняя: {last.name}, {formatMoney(last.amount)} ({formatDateTime(last.createdAt).slice(-5)})
          </span>
        )}
      </div>
    </section>
  );
}
