import { Home, History, Settings } from 'lucide-react';
import type { View } from '../types';

interface Props {
  view: View;
  onNavigate: (v: View) => void;
}

export default function BottomNav({ view, onNavigate }: Props) {
  const items = [
    { name: 'home' as const, label: 'Главная', icon: Home, active: view.name === 'home' || view.name === 'day' },
    { name: 'history' as const, label: 'История отчётов', icon: History, active: view.name === 'history' || view.name === 'report' },
    { name: 'settings' as const, label: 'Настройки', icon: Settings, active: view.name === 'settings' },
  ];
  return (
    <nav className="nav" aria-label="Основное меню">
      {items.map(({ name, label, icon: Icon, active }) => (
        <button
          key={name}
          className={`nav-item ${active ? 'active' : ''}`}
          onClick={() => onNavigate({ name })}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={26} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
