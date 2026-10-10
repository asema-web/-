import type { AppData, DayStatus, Entry, WorkDay } from '../types';
import { formatDate, formatDateTime } from './dates';
import { formatMoneyPlain, sumAmounts } from './money';

export function isEditable(day: WorkDay): boolean {
  return day.status === 'open' || day.editing;
}

export function dayEntries(data: AppData, dayId: string): Entry[] {
  return data.entries
    .filter((e) => e.dayId === dayId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function entriesTotal(entries: Entry[]): number {
  return sumAmounts(entries.map((e) => e.amount));
}

export function statusLabel(day: WorkDay): string {
  if (day.editing) return 'Исправляется';
  const map: Record<DayStatus, string> = {
    open: 'День открыт',
    completed: 'День завершён',
    amended: 'Исправлен',
  };
  return map[day.status];
}

export function buildReportText(day: WorkDay, entries: Entry[]): string {
  const lines: string[] = [`ОТЧЁТ ЗА ${formatDate(day.date)}`, ''];
  if (entries.length === 0) {
    lines.push('Записей нет.');
  } else {
    entries.forEach((e, i) => lines.push(`${i + 1}. ${e.name} — ${formatMoneyPlain(e.amount)}`));
  }
  lines.push('');
  lines.push(`Количество записей: ${entries.length}`);
  lines.push('');
  lines.push(`ВСЕГО ПОЛУЧЕНО: ${formatMoneyPlain(entriesTotal(entries))}`);
  lines.push('');
  if (day.editing || day.status === 'open') {
    lines.push('Статус: рабочий день ещё не завершён.');
  } else if (day.status === 'amended') {
    lines.push('Статус: рабочий день завершён, отчёт исправлен.');
  } else {
    lines.push('Статус: рабочий день завершён.');
  }
  return lines.join('\n');
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** CSV для Excel: разделитель «;», сумма с запятой, BOM для кириллицы */
export function buildCSV(data: AppData): string {
  const header = ['Дата', 'Статус дня', '№', 'Имя', 'Сумма (сом)', 'Время записи'];
  const rows: string[] = [header.map(csvCell).join(';')];
  const days = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of days) {
    dayEntries(data, day.id).forEach((e, i) => {
      rows.push(
        [
          formatDate(day.date),
          statusLabel(day),
          String(i + 1),
          e.name,
          String(e.amount).replace('.', ','),
          formatDateTime(e.createdAt),
        ]
          .map(csvCell)
          .join(';')
      );
    });
  }
  return '\ufeff' + rows.join('\r\n');
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* пробуем запасной способ */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
