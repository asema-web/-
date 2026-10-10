import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Entry } from '../types';
import { parseAmount } from '../lib/money';

interface Props {
  initial?: Entry;
  onSave: (name: string, amount: number) => boolean;
  onCancel: () => void;
}

export default function EntryForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount).replace('.', ',') : '');
  const [nameError, setNameError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [formError, setFormError] = useState('');
  const busy = useRef(false); // защита от двойного нажатия

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;

    const cleanName = name.trim().replace(/\s+/g, ' ');
    const value = parseAmount(amount);
    let bad = false;

    if (!cleanName) {
      setNameError('Напишите имя человека.');
      bad = true;
    } else setNameError('');

    if (value === null) {
      setAmountError('Введите сумму больше нуля, например 2000 или 2500,50.');
      bad = true;
    } else setAmountError('');

    if (bad || value === null) return;

    busy.current = true;
    const ok = onSave(cleanName, value);
    if (!ok) {
      busy.current = false;
      setFormError('Не удалось сохранить запись. Проверьте, что в телефоне есть свободное место, и нажмите ещё раз.');
    }
  }

  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <form
        className="sheet"
        onSubmit={submit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="form-title"
      >
        <h2 id="form-title">{initial ? 'Изменить запись' : 'Новая запись'}</h2>

        <label className="field">
          <span>Имя человека</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            autoComplete="off"
            maxLength={80}
            aria-invalid={!!nameError}
          />
          {nameError && <em className="error">{nameError}</em>}
        </label>

        <label className="field">
          <span>Сумма, сом</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoComplete="off"
            aria-invalid={!!amountError}
          />
          {amountError && <em className="error">{amountError}</em>}
        </label>

        {formError && <p className="notice notice-error">{formError}</p>}

        <div className="sheet-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            Сохранить запись
          </button>
        </div>
      </form>
    </div>
  );
}
