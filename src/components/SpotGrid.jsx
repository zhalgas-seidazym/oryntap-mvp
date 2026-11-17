import { ROW_SIZE } from '../data';

// Схема паркинга: каждое место = индикатор (жасыл / қызыл), как на слайде 5
export default function SpotGrid({ spots, selected, onSelect, compact }) {
  const rows = [];
  for (let i = 0; i < spots.length; i += ROW_SIZE) rows.push(spots.slice(i, i + ROW_SIZE));
  return (
    <div className={`grid ${compact ? 'grid--compact' : ''}`}>
      {rows.map((row, ri) => (
        <div key={ri} className="grid-row">
          <span className="grid-label">{String.fromCharCode(65 + ri)}</span>
          {row.map((s) => {
            const can = onSelect && s.status === 'free';
            return (
              <button
                key={s.id}
                disabled={!can}
                onClick={() => can && onSelect(s.id)}
                className={`spot spot--${s.status} ${s.mine ? 'spot--mine' : ''} ${selected === s.id ? 'spot--selected' : ''}`}
                title={`${s.id} · ${s.status === 'free' ? 'бос' : s.status === 'booked' ? 'брондалған' : 'көлік тұр'}`}
              >
                <i className="led" />
                <span>{s.mine ? 'МЕН' : s.id}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function Legend() {
  return (
    <div className="legend">
      <span><i className="dot dot--free" /> Бос</span>
      <span><i className="dot dot--booked" /> Брондалған</span>
      <span><i className="dot dot--occupied" /> Көлік тұр</span>
    </div>
  );
}
