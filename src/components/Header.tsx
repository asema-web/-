import { Check, Loader2, AlertTriangle } from 'lucide-react';
import type { SaveState, WorkDay } from '../types';
import { formatLongDate } from '../lib/dates';
import { statusLabel } from '../lib/reports';

interface Props {
  day: WorkDay;
  saveState: SaveState;
}

export default function Header({ day, saveState }: Props) {
  const open = day.status === 'open' || day.editing;
  return (
    <header className="header">
      <div className="header-top">
        <h1>Моя касса</h1>
        <span className={`save save-${saveState}`} role="status">
          {saveState === 'saved' && (
            <>
              <Check size={18} /> Сохранено
            </>
          )}
          {saveState === 'saving' && (
            <>
              <Loader2 size={18} className="spin" /> Сохраняем…
            </>
          )}
          {saveState === 'error' && (
            <>
              <AlertTriangle size={18} /> Не сохранено
            </>
          )}
        </span>
      </div>
      <p className="date">{formatLongDate(day.date)}</p>
      <span className={`pill ${open ? 'pill-open' : 'pill-done'}`}>{statusLabel(day)}</span>
    </header>
  );
}
