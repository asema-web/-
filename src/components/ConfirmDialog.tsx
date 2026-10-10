import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Вернуться',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div
        className="sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dlg-title">{title}</h2>
        <div className="sheet-body">{children}</div>
        <div className="sheet-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
