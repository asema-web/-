import { useCallback, useEffect, useRef, useState } from 'react';
import type { View } from './types';
import { useStore } from './hooks/useStore';
import { todayISO } from './lib/dates';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import DayPage from './pages/DayPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const store = useStore();
  const [view, setView] = useState<View>({ name: 'home' });
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    setToast({ message, kind });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), kind === 'error' ? 6000 : 2500);
  }, []);

  const navigate = useCallback((v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const today = todayISO();
  const todayDay = store.data.days.find((d) => d.date === today);
  if (!todayDay) return null;

  let content;
  if (view.name === 'day') {
    const day = store.data.days.find((d) => d.id === view.dayId) ?? todayDay;
    content = <DayPage store={store} day={day} isToday={day.id === todayDay.id} notify={notify} onNavigate={navigate} />;
  } else if (view.name === 'report') {
    const day = store.data.days.find((d) => d.id === view.dayId) ?? todayDay;
    content = <ReportPage store={store} day={day} notify={notify} onNavigate={navigate} />;
  } else if (view.name === 'history') {
    content = <HistoryPage store={store} onNavigate={navigate} />;
  } else if (view.name === 'settings') {
    content = <SettingsPage store={store} notify={notify} />;
  } else {
    content = <DayPage store={store} day={todayDay} isToday notify={notify} onNavigate={navigate} />;
  }

  return (
    <div className="app">
      {!online && (
        <div className="offline" role="alert">
          Нет интернета. Приложение работает, а WhatsApp откроется, когда интернет появится.
        </div>
      )}
      {content}
      {toast && <Toast message={toast.message} kind={toast.kind} />}
      <BottomNav view={view} onNavigate={navigate} />
    </div>
  );
}
