import { useEffect, useMemo, useState } from 'react';
import { PARKINGS, PRICING, SERVICES, fmt, getParking } from '../data';
import { stats, trialInfo, useStore } from '../store';
import MapView from './MapView';
import SpotGrid, { Legend } from './SpotGrid';

export default function DriverApp() {
  return (
    <div className="driver">
      <aside className="driver-side">
        <h2>Жүргізуші қосымшасы</h2>
        <p>Телефон экранындағы кликабельді прототип. Тұрақты таңдаңыз, бос орынды басып, брондаңыз.</p>
        <ul className="hint-list">
          <li><b>Карта</b> — әр белгіде бос орын саны. «БРОНЬ» — серіктес паркинг, «P» — қоғамдық.</li>
          <li><b>Тірі деректер</b> — орындар әр 2–3 секунд сайын өзгереді (AI-камераларды имитациялайды).</li>
          <li><b>Брондау</b> — орын қызылға ауысады, «Серіктес панелінде» де көрінеді.</li>
          <li><b>Профиль</b> — жазылым: {PRICING.trialDays} күн тегін → {PRICING.firstMonthsPrice} ₸ → {fmt(PRICING.regularPrice)} ₸.</li>
        </ul>
        <Legend />
      </aside>
      <div className="phone">
        <div className="phone-notch" />
        <PhoneApp />
      </div>
    </div>
  );
}

function PhoneApp() {
  const { state } = useStore();
  const [tab, setTab] = useState('map'); // map | bookings | profile
  const [view, setView] = useState(null); // {name:'parking'|'book'|'active', ...}
  const active = state.bookings.find((b) => b.status === 'active');

  const open = (v) => setView(v);
  const close = () => setView(null);

  return (
    <div className="app">
      <StatusBar />
      <div className="app-body">
        {tab === 'map' && <MapScreen onOpen={(id) => open({ name: 'parking', id })} active={active} onActive={() => open({ name: 'active', id: active.id })} />}
        {tab === 'bookings' && <BookingsScreen onOpen={(id) => open({ name: 'active', id })} />}
        {tab === 'profile' && <ProfileScreen />}

        {view?.name === 'parking' && (
          <ParkingScreen id={view.id} onBack={close} onBook={(spotId) => open({ name: 'book', id: view.id, spotId })} hasActive={!!active} />
        )}
        {view?.name === 'book' && (
          <BookScreen
            parkingId={view.id}
            spotId={view.spotId}
            onBack={() => open({ name: 'parking', id: view.id })}
            onDone={(bid) => open({ name: 'active', id: bid, fresh: true })}
          />
        )}
        {view?.name === 'active' && <ActiveScreen id={view.id} fresh={view.fresh} onBack={close} />}
      </div>
      <nav className="app-nav">
        {[
          ['map', '🗺️', 'Карта'],
          ['bookings', '🎫', 'Брондар'],
          ['profile', '👤', 'Профиль'],
        ].map(([id, ic, label]) => (
          <button key={id} className={tab === id && !view ? 'is-active' : ''} onClick={() => { setTab(id); close(); }}>
            <span>{ic}</span>{label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function StatusBar() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 30000); return () => clearInterval(i); }, []);
  return (
    <div className="statusbar">
      <span>{t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
      <span>5G ▮▮▮ 84%</span>
    </div>
  );
}

/* ---------- Карта ---------- */
function MapScreen({ onOpen, active, onActive }) {
  const { state } = useStore();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);

  const list = useMemo(
    () => PARKINGS.filter((p) => (filter === 'all' || p.type === filter) && (p.name + p.address).toLowerCase().includes(q.toLowerCase())),
    [filter, q]
  );
  const selected = sel && getParking(sel);
  const nearby = [...list].sort((a, b) => stats(state.spots[b.id]).free - stats(state.spots[a.id]).free);

  return (
    <div className="screen screen--map">
      <MapView parkings={list} spots={state.spots} selectedId={sel} onSelect={setSel} />
      <div className="map-top">
        <div className="search">
          <span>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Тұрақ немесе мекенжай іздеу" />
        </div>
        <div className="chips">
          {[['all', 'Барлығы'], ['partner', 'Брондауға болады'], ['public', 'Қоғамдық']].map(([id, l]) => (
            <button key={id} className={`chip ${filter === id ? 'is-active' : ''}`} onClick={() => setFilter(id)}>{l}</button>
          ))}
        </div>
      </div>

      {active && (
        <button className="active-banner" onClick={onActive}>
          <i className="pulse pulse--red" /> Белсенді бронь: {getParking(active.parkingId).name} · {active.spotId}
          <span>→</span>
        </button>
      )}

      <div className="sheet">
        <div className="sheet-handle" />
        {selected ? (
          <ParkingCard p={selected} s={stats(state.spots[selected.id])} onOpen={() => onOpen(selected.id)} onClose={() => setSel(null)} />
        ) : (
          <>
            <div className="sheet-title">Жақын тұрақтар</div>
            <div className="sheet-list">
              {nearby.slice(0, 6).map((p) => {
                const s = stats(state.spots[p.id]);
                return (
                  <button key={p.id} className="row-item" onClick={() => setSel(p.id)}>
                    <FreeBadge s={s} />
                    <div className="row-main">
                      <b>{p.name}</b>
                      <small>{p.address} · {p.price} ₸/сағ</small>
                    </div>
                    {p.type === 'partner' ? <span className="tag tag--green">Бронь</span> : <span className="tag">Қоғамдық</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FreeBadge({ s }) {
  const cls = s.free === 0 ? 'full' : s.free / s.total < 0.15 ? 'low' : 'ok';
  return <span className={`free-badge free-badge--${cls}`}><b>{s.free}</b><small>бос</small></span>;
}

function ParkingCard({ p, s, onOpen, onClose }) {
  return (
    <div className="pcard">
      <div className="pcard-head">
        <div>
          <b>{p.name}</b>
          <small>{p.address}</small>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="pcard-stats">
        <div><b className="c-green">{s.free}</b><small>бос</small></div>
        <div><b>{s.total}</b><small>барлығы</small></div>
        <div><b>{p.price} ₸</b><small>сағатына</small></div>
        <div><b>★ {p.rating}</b><small>{p.hours}</small></div>
      </div>
      <OccBar s={s} />
      <button className="btn btn--primary btn--block" onClick={onOpen}>
        {p.type === 'partner' ? 'Орын таңдау және брондау' : 'Бос орындарды көру'}
      </button>
    </div>
  );
}

function OccBar({ s }) {
  return (
    <div className="occ">
      <i className="occ-free" style={{ width: `${(s.free / s.total) * 100}%` }} />
      <i className="occ-booked" style={{ width: `${(s.booked / s.total) * 100}%` }} />
      <i className="occ-occ" style={{ width: `${(s.occupied / s.total) * 100}%` }} />
    </div>
  );
}

/* ---------- Тұрақ ---------- */
function ParkingScreen({ id, onBack, onBook, hasActive }) {
  const { state } = useStore();
  const p = getParking(id);
  const spots = state.spots[id];
  const s = stats(spots);
  const [sel, setSel] = useState(null);
  const partner = p.type === 'partner';
  const selStatus = spots.find((x) => x.id === sel)?.status;
  useEffect(() => { if (sel && selStatus !== 'free') setSel(null); }, [sel, selStatus]);

  return (
    <div className="screen screen--overlay">
      <Header title={p.name} onBack={onBack} />
      <div className="scroll">
        <div className="p-meta">
          <small>{p.address} · {p.hours}</small>
          <div className="p-tags">
            {partner ? <span className="tag tag--green">Серіктес · брондау</span> : <span className="tag">Қоғамдық тұрақ</span>}
            <span className="tag">AI-камера</span>
            {p.services.map((sv) => <span key={sv} className="tag">{SERVICES[sv].icon} {SERVICES[sv].title}</span>)}
          </div>
        </div>
        <div className="kpis">
          <div><b className="c-green">{s.free}</b><small>бос</small></div>
          <div><b className="c-amber">{s.booked}</b><small>брондалған</small></div>
          <div><b className="c-red">{s.occupied}</b><small>көлік тұр</small></div>
        </div>
        <div className="live-row"><i className="pulse" /> Тірі схема · камера деректері</div>
        <SpotGrid spots={spots} selected={sel} onSelect={partner ? setSel : null} />
        <Legend />
        {!partner && (
          <div className="info-box">Қоғамдық тұрақта брондау жоқ — тек бос орындар көрсетіледі. Төлем Almaty Parking арқылы.</div>
        )}
      </div>
      {partner && (
        <div className="footer-bar">
          {hasActive ? (
            <div className="info-box info-box--warn">Сізде белсенді бронь бар. Жаңасын жасау үшін алдыңғысын аяқтаңыз.</div>
          ) : (
            <button className="btn btn--primary btn--block" disabled={!sel} onClick={() => onBook(sel)}>
              {sel ? `${sel} орнын брондау →` : 'Схемадан бос (жасыл) орынды таңдаңыз'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Брондау ---------- */
function BookScreen({ parkingId, spotId, onBack, onDone }) {
  const { state, dispatch } = useStore();
  const p = getParking(parkingId);
  const [hours, setHours] = useState(2);
  const [services, setServices] = useState([]);
  const [paying, setPaying] = useState(false);
  const servicesTotal = services.reduce((a, id) => a + SERVICES[id].price, 0);
  const total = p.price * hours + PRICING.bookingFee + servicesTotal;
  const spotFree = state.spots[parkingId].find((s) => s.id === spotId)?.status === 'free';

  const toggle = (id) => setServices((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      dispatch({ type: 'BOOK', parkingId, spotId, hours, services });
      setPaying(false);
    }, 1100);
  };
  // как только бронь появилась — открыть её
  const created = state.bookings.find((b) => b.status === 'active' && b.parkingId === parkingId && b.spotId === spotId);
  useEffect(() => { if (created) onDone(created.id); }, [created, onDone]);

  return (
    <div className="screen screen--overlay">
      <Header title="Брондау" onBack={onBack} />
      <div className="scroll">
        <div className="book-spot">
          <div className="big-led" />
          <div>
            <small>{p.name}</small>
            <b>Орын {spotId}</b>
          </div>
        </div>
        {!spotFree && !paying && <div className="info-box info-box--warn">Бұл орынды жаңа ғана басқа көлік алды. Артқа қайтып, басқа орын таңдаңыз.</div>}

        <div className="field">
          <label>Ұзақтығы</label>
          <div className="stepper">
            <button onClick={() => setHours((h) => Math.max(1, h - 1))}>−</button>
            <b>{hours} сағ</b>
            <button onClick={() => setHours((h) => Math.min(12, h + 1))}>+</button>
          </div>
        </div>

        {p.services.length > 0 && (
          <div className="field">
            <label>Қосымша қызмет</label>
            {p.services.map((id) => (
              <label key={id} className={`check ${services.includes(id) ? 'is-on' : ''}`}>
                <input type="checkbox" checked={services.includes(id)} onChange={() => toggle(id)} />
                <span>{SERVICES[id].icon} {SERVICES[id].title}</span>
                <b>{fmt(SERVICES[id].price)} ₸</b>
              </label>
            ))}
          </div>
        )}

        <div className="receipt">
          <div><span>Паркинг · {hours} × {p.price} ₸</span><b>{fmt(p.price * hours)} ₸</b></div>
          <div><span>Орынтап брондау ақысы</span><b>{PRICING.bookingFee} ₸</b></div>
          {servicesTotal > 0 && <div><span>Қызметтер</span><b>{fmt(servicesTotal)} ₸</b></div>}
          <div className="receipt-total"><span>Барлығы</span><b>{fmt(total)} ₸</b></div>
        </div>
        <div className="pay-method">💳 Kaspi Gold •• 4417 <small>(демо)</small></div>
      </div>
      <div className="footer-bar">
        <button className="btn btn--primary btn--block" disabled={!spotFree || paying} onClick={pay}>
          {paying ? 'Төлем өңделуде…' : `Төлеу және брондау · ${fmt(total)} ₸`}
        </button>
      </div>
    </div>
  );
}

/* ---------- Белсенді бронь ---------- */
function useCountdown(to) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const ms = Math.max(0, to - now);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ActiveScreen({ id, fresh, onBack }) {
  const { state, dispatch } = useStore();
  const b = state.bookings.find((x) => x.id === id);
  const left = useCountdown(b?.endsAt || 0);
  if (!b) return null;
  const p = getParking(b.parkingId);
  const isActive = b.status === 'active';

  return (
    <div className="screen screen--overlay">
      <Header title={`Бронь ${b.id}`} onBack={onBack} />
      <div className="scroll">
        {fresh && isActive && <div className="success">✓ Орын брондалды! Индикатор қызылға ауысты.</div>}
        <div className={`ticket ${isActive ? '' : 'ticket--done'}`}>
          <div className="ticket-led"><i className={isActive ? 'led-red' : 'led-green'} /></div>
          <small>{p.name}</small>
          <div className="ticket-spot">{b.spotId}</div>
          <small>{p.address}</small>
          <div className="ticket-timer">
            {isActive ? <>Қалған уақыт <b>{left}</b></> : <b>{b.status === 'done' ? 'Аяқталды' : 'Бас тартылды'}</b>}
          </div>
          <div className="ticket-qr" aria-hidden>
            {Array.from({ length: 49 }).map((_, i) => <i key={i} className={(i * 7 + b.id.charCodeAt(3)) % 3 ? 'on' : ''} />)}
          </div>
          <small>Шлагбаумда QR немесе нөмір: {state.user.plate}</small>
        </div>
        <div className="receipt">
          <div><span>Паркинг · {b.hours} сағ</span><b>{fmt(b.parkingCost)} ₸</b></div>
          <div><span>Брондау ақысы</span><b>{b.fee} ₸</b></div>
          {b.servicesTotal > 0 && <div><span>{b.services.map((s) => SERVICES[s].title).join(', ')}</span><b>{fmt(b.servicesTotal)} ₸</b></div>}
          <div className="receipt-total"><span>Төленді</span><b>{fmt(b.total)} ₸</b></div>
        </div>
      </div>
      {isActive && (
        <div className="footer-bar footer-bar--split">
          <button className="btn btn--ghost" onClick={() => dispatch({ type: 'EXTEND', id: b.id })}>+1 сағ ({p.price} ₸)</button>
          <button className="btn btn--danger" onClick={() => dispatch({ type: 'FINISH', id: b.id })}>Аяқтау</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Брондар ---------- */
function BookingsScreen({ onOpen }) {
  const { state } = useStore();
  const list = state.bookings;
  return (
    <div className="screen">
      <Header title="Менің брондарым" />
      <div className="scroll">
        {list.length === 0 && (
          <div className="empty">
            <div className="empty-ic">🎫</div>
            <b>Әзірге бронь жоқ</b>
            <p>Картадан «БРОНЬ» белгісі бар тұрақты таңдап, орынды брондаңыз.</p>
          </div>
        )}
        {list.map((b) => {
          const p = getParking(b.parkingId);
          return (
            <button key={b.id} className="row-item row-item--card" onClick={() => onOpen(b.id)}>
              <span className={`status-dot status-dot--${b.status}`} />
              <div className="row-main">
                <b>{p.name} · {b.spotId}</b>
                <small>{new Date(b.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {b.hours} сағ</small>
              </div>
              <div className="row-end">
                <b>{fmt(b.total)} ₸</b>
                <small>{b.status === 'active' ? 'Белсенді' : b.status === 'done' ? 'Аяқталды' : 'Бас тартылды'}</small>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Профиль ---------- */
function ProfileScreen() {
  const { state, dispatch } = useStore();
  const { user } = state;
  const { left } = trialInfo(user);
  const spent = state.bookings.reduce((a, b) => a + b.total, 0);
  const plans = [
    { id: 'trial', title: 'Сынақ кезеңі', price: '0 ₸', desc: `${PRICING.trialDays} күн тегін` },
    { id: 'start', title: 'Старт (1–6 ай)', price: `${PRICING.firstMonthsPrice} ₸/ай`, desc: 'Бүкіл қаланың тұрағы + брондау' },
    { id: 'standard', title: 'Стандарт (7-айдан)', price: `${fmt(PRICING.regularPrice)} ₸/ай`, desc: 'Бүкіл қаланың тұрағы + брондау' },
  ];
  return (
    <div className="screen">
      <Header title="Профиль" />
      <div className="scroll">
        <div className="profile-head">
          <div className="avatar">{user.name[0]}</div>
          <div>
            <b>{user.name}</b>
            <small>🚗 {user.plate}</small>
          </div>
        </div>
        {user.plan === 'trial' && (
          <div className="trial">
            <b>Тегін кезең: {left} күн қалды</b>
            <div className="trial-bar"><i style={{ width: `${((PRICING.trialDays - left) / PRICING.trialDays) * 100}%` }} /></div>
            <small>Содан кейін {PRICING.firstMonthsPrice} ₸/ай — алғашқы 6 ай</small>
          </div>
        )}
        <div className="field"><label>Жазылым</label></div>
        {plans.map((pl) => (
          <button key={pl.id} className={`plan ${user.plan === pl.id ? 'is-on' : ''}`} onClick={() => dispatch({ type: 'SET_PLAN', plan: pl.id })}>
            <div><b>{pl.title}</b><small>{pl.desc}</small></div>
            <span>{pl.price}</span>
          </button>
        ))}
        <div className="kpis kpis--profile">
          <div><b>{state.bookings.length}</b><small>бронь</small></div>
          <div><b>{fmt(spent)} ₸</b><small>жұмсалды</small></div>
        </div>
        <div className="menu">
          <div>🔔 Хабарламалар</div>
          <div>💳 Төлем әдістері</div>
          <div>💬 24/7 чат-қолдау</div>
          <div>🌐 Тіл: Қазақша</div>
        </div>
      </div>
    </div>
  );
}

function Header({ title, onBack }) {
  return (
    <div className="hdr">
      {onBack ? <button className="icon-btn" onClick={onBack}>←</button> : <span className="hdr-spacer" />}
      <b>{title}</b>
      <span className="hdr-spacer" />
    </div>
  );
}
