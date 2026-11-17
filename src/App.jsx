import { useEffect, useState } from 'react';
import Landing from './components/Landing';
import DriverApp from './components/DriverApp';
import PartnerDashboard from './components/PartnerDashboard';
import { useStore } from './store';

const TABS = [
  { id: 'about', label: 'Жоба' },
  { id: 'driver', label: 'Жүргізуші қосымшасы' },
  { id: 'partner', label: 'Серіктес панелі' },
];

const fromHash = () => {
  const h = window.location.hash.replace('#/', '');
  return TABS.some((t) => t.id === h) ? h : 'about';
};

export default function App() {
  const [tab, setTab] = useState(fromHash);
  const { dispatch } = useStore();

  useEffect(() => {
    const on = () => setTab(fromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = (id) => { window.location.hash = `/${id}`; setTab(id); };

  return (
    <div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => go('about')}>
          <span className="brand-mark">P</span>
          <span className="brand-name">Орынтап</span>
          <span className="badge-mvp">MVP · demo</span>
        </button>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => go(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className="reset" title="Демо-деректерді қалпына келтіру" onClick={() => dispatch({ type: 'RESET' })}>↺ Reset</button>
      </header>

      <main className="content">
        {tab === 'about' && <Landing go={go} />}
        {tab === 'driver' && <DriverApp />}
        {tab === 'partner' && <PartnerDashboard />}
      </main>
    </div>
  );
}
