import { PARKINGS, PRICING, fmt } from '../data';
import { stats, useStore } from '../store';

export default function Landing({ go }) {
  const { state } = useStore();
  const totalFree = PARKINGS.reduce((a, p) => a + stats(state.spots[p.id]).free, 0);

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">SMART PARKING · АЛМАТЫ</p>
          <h1>Қаладағы барлық тұрақтың бос орны — бір қосымшада</h1>
          <p className="lead">
            Қоғамдық та, жеке де тұрақта орынның бос не бос емес екенін бірден көресіз. Серіктес паркингте орынды
            алдын ала брондайсыз — орын алдындағы индикатор жасылдан қызылға ауысады.
          </p>
          <div className="hero-cta">
            <button className="btn btn--primary" onClick={() => go('driver')}>Жүргізуші қосымшасын ашу →</button>
            <button className="btn btn--ghost" onClick={() => go('partner')}>Серіктес панелі</button>
          </div>
          <div className="live-pill"><i className="pulse" /> Қазір картада <b>{totalFree}</b> бос орын · {PARKINGS.length} тұрақ</div>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="lot">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`lot-spot ${[1, 4, 6, 9, 10].includes(i) ? 'is-free' : 'is-busy'}`}>
                <i />{[1, 4, 6, 9, 10].includes(i) ? '' : 'P'}
              </div>
            ))}
            <div className="lot-tag">БРОНЬ</div>
          </div>
        </div>
      </section>

      <section className="features">
        <Feature n="01" title="Нақты уақыттағы карта" text="AI-камералар орынның бос/бос еместігін анықтайды. Картада әр тұрақтың бос орын саны көрінеді." />
        <Feature n="02" title="Брондау" text="Серіктес паркингте орынды кассир мен күзетшісіз, тікелей қосымшадан брондайсыз." />
        <Feature n="03" title="Жасыл / қызыл индикатор" text="Әр орынның алдында жарық: брондалған орынға басқа көлік тұрмайды." />
        <Feature n="04" title="Қосымша қызмет" text="Брондалған орында көлік жуу немесе электр зарядтауға тапсырыс." />
      </section>

      <section className="pricing">
        <h2>Бағасы</h2>
        <div className="price-cards">
          <div className="price-card">
            <span className="price-label">Сынақ</span>
            <b>0 ₸</b>
            <p>алғашқы {PRICING.trialDays} күн тегін</p>
          </div>
          <div className="price-card price-card--hl">
            <span className="price-label">1–6 ай</span>
            <b>{fmt(PRICING.firstMonthsPrice)} ₸<small>/ай</small></b>
            <p>барлық тұрақтың бос орны</p>
          </div>
          <div className="price-card">
            <span className="price-label">7-айдан</span>
            <b>{fmt(PRICING.regularPrice)} ₸<small>/ай</small></b>
            <p>стандартты жазылым</p>
          </div>
          <div className="price-card">
            <span className="price-label">Брондау</span>
            <b>{PRICING.bookingFee} ₸</b>
            <p>+ паркинг тарифі · иесінен 10%</p>
          </div>
        </div>
      </section>

      <section className="roadmap">
        <h2>MVP жоспары</h2>
        <ol>
          <li><b>0-ай</b> Қосымша (iOS, Android, сервер, AI) · 20 паркингке камера + индикатор</li>
          <li><b>5–10-ай</b> Ай сайын +5 серіктес паркинг → 10-айда 50 паркинг</li>
          <li><b>8-ай</b> Ай плюспен жабыла бастайды</li>
          <li><b>15-ай</b> Инвестиция толық қайтады</li>
        </ol>
        <p className="note">Бұл — фронтенд-макет. Барлық деректер (тұрақтар, орындар, брондар, табыс) — мок-деректер, сервер жоқ.</p>
      </section>
    </div>
  );
}

function Feature({ n, title, text }) {
  return (
    <div className="feature">
      <span className="feature-n">{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
