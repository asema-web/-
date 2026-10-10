import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { DayStatus, View } from '../types';
import type { Store } from '../hooks/useStore';
import { dayEntries, entriesTotal, statusLabel } from '../lib/reports';
import { formatDate } from '../lib/dates';
import { formatMoney } from '../lib/money';

interface Props {
  store: Store;
  onNavigate: (v: View) => void;
}

type Filter = 'all' | DayStatus;

export default function HistoryPage({ store, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => {
    return [...store.data.days]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((day) => {
        const entries = dayEntries(store.data, day.id);
        return { day, count: entries.length, total: entriesTotal(entries) };
      })
      // пустой открытый день — это просто «сегодня», в истории он не нужен
      .filter((r) => !(r.day.status === 'open' && r.count === 0 && !r.day.editing));
  }, [store.data]);

  const q = query.trim();
  const shown = rows.filter(
    (r) => (filter === 'all' || r.day.status === filter) && (q === '' || formatDate(r.day.date).includes(q))
  );

  return (
    <main className="page">
      <h1 className="page-title">История отчётов</h1>

      {rows.length === 0 ? (
        <section className="empty">
          <p>История пока пуста.</p>
          <p className="muted">Здесь появятся ваши рабочие дни после первых записей.</p>
        </section>
      ) : (
        <>
          <div className="filters">
            <label className="search">
              <Search size={20} />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Поиск по дате, например 10.10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Поиск по дате"
              />
            </label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Фильтр по статусу">
              <option value="all">Все дни</option>
              <option value="open">Открытые</option>
              <option value="completed">Завершённые</option>
              <option value="amended">Исправленные</option>
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="muted">Ничего не найдено. Измените поиск или фильтр.</p>
          ) : (
            <ul className="history">
              {shown.map(({ day, count, total }) => (
                <li key={day.id} className="history-card">
                  <div className="history-head">
                    <strong>{formatDate(day.date)}</strong>
                    <span className={`pill ${day.status === 'open' || day.editing ? 'pill-open' : 'pill-done'}`}>
                      {statusLabel(day)}
                    </span>
                  </div>
                  <div className="history-body">
                    <span>Записей: {count}</span>
                    <strong>{formatMoney(total)}</strong>
                  </div>
                  <button className="btn btn-secondary" onClick={() => onNavigate({ name: 'report', dayId: day.id })}>
                    Посмотреть отчёт
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
