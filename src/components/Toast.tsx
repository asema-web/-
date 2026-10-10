interface Props {
  message: string;
  kind: 'success' | 'error';
}

export default function Toast({ message, kind }: Props) {
  return (
    <div className={`toast toast-${kind}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
