/** 12500 -> «12 500 сом» (для экрана, с неразрывным пробелом) */
export function formatMoney(amount: number): string {
  return `${formatNumber(amount)}\u00a0сом`;
}

/** Для текста отчёта: только обычные пробелы */
export function formatMoneyPlain(amount: number): string {
  return `${formatNumber(amount)} сом`.replace(/[\u00a0\u202f]/g, ' ');
}

function formatNumber(amount: number): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Превращает введённый текст в число.
 * Принимает «2000», «2 000», «2000,50». Возвращает null, если сумма некорректна.
 */
export function parseAmount(input: string): number | null {
  const s = input.replace(/[\s\u00a0]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000_000) return null;
  return Math.round(n * 100) / 100;
}

/** Складываем в копейках, чтобы не было ошибок округления */
export function sumAmounts(values: number[]): number {
  const cents = values.reduce((acc, v) => acc + Math.round(v * 100), 0);
  return cents / 100;
}
