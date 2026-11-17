import { useMemo, useState } from 'react';
import { PARKINGS, PRICING, fmt, getParking, partnerHistory } from '../data';
import { stats, useStore } from '../store';
import SpotGrid, { Legend } from './SpotGrid';

const PARTNERS = PARKINGS.filter((p) => p.type === 'partner');

export default function PartnerDashboard() {
  const { state } = useStore();
  const [pid, setPid] = useState(PARTNERS[0].id);
  const p = getParking(pid);
  const s = stats(state.spots[pid]);
  const hist = useMemo(() => partnerHistory(pid), [pid]);

  const nowH = new Date().getHours();
  const mine = state.bookings.filter((b) => b.parkingId === pid && b.status !== 'cancelled');
  const pastCount = hist.byHour.slice(0, nowH + 1).reduce((a, x) => a + x, 0);
  const todayCount = pastCount + mine.length;
  const avgHours = 2;
  const gross = pastCount * avgHours * p.price + mine.reduce((a, b) => a + b.parkingCost, 0);
  const commission = gross * PRICING.ownerCommission;
  const net = gross - commission;
  const occ = Math.round(((s.total - s.free) / s.total) * 100);

  const maxH = Math.max(...hist.byHour, 1);

  const recent = [
    ...mine.map((b) => ({ id: b.id, driver: `${state.user.name} (сіз, демо)`, plate: state.user.plate, spot: b.spotId, time: new Date(b.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), hours: b.hours, amount: b.parkingCost, live: b.status === 'active' })),
    ...hist.recent,
  ].slice(0, 9);

  return (
    <div className="partner">
      <div className="partner-head">
        <div>
          <p className="eyebrow">СЕРІКТЕС ПАНЕЛІ · B2B</p>
          <h2>{p.name}</h2>
          <small>{p.address} · {p.hours} · {p.price} ₸/сағ</small>
        </div>
        <select value={pid} onChange={(e) => setPid(e.target.value)}>
          {PARTNERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>

      <div className="kpi-row">
        <Kpi label="Қазіргі толымдылық" value={`${occ}%`} sub={`${s.total - s.free} / ${s.total} орын`} />
        <Kpi label="Бүгінгі брондар" value={fmt(todayCount)} sub="Орынтап арқылы" />
        <Kpi label="Брондаудан түсім" value={`${fmt(gross)} ₸`} sub="бүгін, мок" />
        <Kpi label="Сіздің табысыңыз" value={`${fmt(net)} ₸`} sub={`Орынтап комиссиясы 10%: ${fmt(commission)} ₸`} accent />
      </div>

      <div className="partner-grid">
        <section className="card">
          <div className="card-head">
            <h3>Тірі схема</h3>
            <span className="live-row"><i className="pulse" /> AI-камера + индикаторлар</span>
          </div>
          <SpotGrid spots={state.spots[pid]} compact />
          <Legend />
        </section>

        <section className="card">
          <div className="card-head"><h3>Сағат бойынша брондар (бүгін)</h3><small className="note">сұр — болжам</small></div>
          <div className="bars" role="img" aria-label="Сағат бойынша брондар саны">
            {hist.byHour.map((v, h) => (
              <div key={h} className="bar-col" title={`${h}:00 — ${v} бронь`}>
                <span className="bar-val">{h === nowH || v === maxH ? v : ''}</span>
                <i className={`bar ${h === nowH ? 'bar--now' : ''} ${h > nowH ? 'bar--future' : ''}`} style={{ height: `${(v / maxH) * 100}%` }} />
                <small>{h % 3 === 0 ? h : ''}</small>
              </div>
            ))}
          </div>
          <div className="split">
            <div><small>Жүргізуші төлейді</small><b>паркинг тарифі + {PRICING.bookingFee} ₸</b></div>
            <div><small>Сіз аласыз</small><b>тарифтің 90%</b></div>
            <div><small>Жабдық</small><b>камера + индикатор — Орынтап есебінен</b></div>
          </div>
        </section>

        <section className="card card--wide">
          <div className="card-head"><h3>Соңғы брондар</h3></div>
          <table className="table">
            <thead>
              <tr><th>Уақыт</th><th>Жүргізуші</th><th>Нөмір</th><th>Орын</th><th>Ұзақтығы</th><th className="r">Сома</th><th className="r">Сізге (90%)</th></tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className={r.live ? 'is-live' : ''}>
                  <td>{r.time}</td>
                  <td>{r.driver}</td>
                  <td><code>{r.plate}</code></td>
                  <td>{r.spot}</td>
                  <td>{r.hours} сағ</td>
                  <td className="r">{fmt(r.amount)} ₸</td>
                  <td className="r">{fmt(r.amount * 0.9)} ₸</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">Жүргізуші қосымшасында осы паркингте бронь жасасаңыз, ол осы кестеде бірден пайда болады.</p>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className={`kpi ${accent ? 'kpi--accent' : ''}`}>
      <small>{label}</small>
      <b>{value}</b>
      <span>{sub}</span>
    </div>
  );
}
