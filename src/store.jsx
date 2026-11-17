import { createContext, useContext, useEffect, useReducer } from 'react';
import { PARKINGS, PRICING, SERVICES, getParking, initSpots } from './data';

const Ctx = createContext(null);
const LS_KEY = 'oryntap-mvp-v1';
const DAY = 86400000;

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; }
}

function initState() {
  const saved = loadSaved();
  const spots = initSpots();
  const bookings = saved?.bookings || [];
  // восстановить свои активные брони на схеме
  bookings.filter((b) => b.status === 'active').forEach((b) => {
    const s = spots[b.parkingId]?.find((x) => x.id === b.spotId);
    if (s) { s.status = 'booked'; s.mine = true; }
  });
  return {
    spots,
    bookings,
    user: saved?.user || {
      name: 'Жалғас',
      plate: '777 ORN 02',
      subscribedAt: Date.now() - 2 * DAY, // триал начат 2 дня назад
      plan: 'trial',
    },
  };
}

function setSpot(spots, parkingId, spotId, patch) {
  return { ...spots, [parkingId]: spots[parkingId].map((s) => (s.id === spotId ? { ...s, ...patch } : s)) };
}

function reducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      let { spots, bookings } = state;
      // 1) завершить свои истёкшие брони
      const now = Date.now();
      bookings = bookings.map((b) => {
        if (b.status === 'active' && b.endsAt <= now) {
          spots = setSpot(spots, b.parkingId, b.spotId, { status: 'free', mine: false });
          return { ...b, status: 'done' };
        }
        return b;
      });
      // 2) «живой город»: камеры фиксируют приезд/уезд машин
      for (let k = 0; k < 4; k++) {
        const p = PARKINGS[Math.floor(Math.random() * PARKINGS.length)];
        const list = spots[p.id];
        const candidates = list.filter((s) => !s.mine);
        const s = candidates[Math.floor(Math.random() * candidates.length)];
        if (!s) continue;
        const occ = list.filter((x) => x.status !== 'free').length / list.length;
        let next = s.status;
        if (s.status === 'free' && Math.random() < occ + 0.05) next = p.type === 'partner' && Math.random() < 0.25 ? 'booked' : 'occupied';
        else if (s.status !== 'free' && Math.random() < 1 - occ + 0.15) next = 'free';
        if (next !== s.status) spots = setSpot(spots, p.id, s.id, { status: next });
      }
      return { ...state, spots, bookings };
    }
    case 'BOOK': {
      const { parkingId, spotId, hours, services } = action;
      const p = getParking(parkingId);
      const servicesTotal = services.reduce((a, id) => a + SERVICES[id].price, 0);
      const booking = {
        id: 'B' + Math.floor(100000 + Math.random() * 899999),
        parkingId, spotId, hours, services,
        createdAt: Date.now(),
        endsAt: Date.now() + hours * 3600000,
        parkingCost: p.price * hours,
        fee: PRICING.bookingFee,
        servicesTotal,
        total: p.price * hours + PRICING.bookingFee + servicesTotal,
        status: 'active',
      };
      return {
        ...state,
        spots: setSpot(state.spots, parkingId, spotId, { status: 'booked', mine: true }),
        bookings: [booking, ...state.bookings],
      };
    }
    case 'EXTEND': {
      return {
        ...state,
        bookings: state.bookings.map((b) => {
          if (b.id !== action.id) return b;
          const p = getParking(b.parkingId);
          return { ...b, hours: b.hours + 1, endsAt: b.endsAt + 3600000, parkingCost: b.parkingCost + p.price, total: b.total + p.price };
        }),
      };
    }
    case 'FINISH':
    case 'CANCEL': {
      const b = state.bookings.find((x) => x.id === action.id);
      return {
        ...state,
        spots: setSpot(state.spots, b.parkingId, b.spotId, { status: 'free', mine: false }),
        bookings: state.bookings.map((x) => (x.id === action.id ? { ...x, status: action.type === 'FINISH' ? 'done' : 'cancelled', endsAt: Date.now() } : x)),
      };
    }
    case 'SET_PLAN':
      return { ...state, user: { ...state.user, plan: action.plan, subscribedAt: action.plan === 'trial' ? Date.now() : state.user.subscribedAt } };
    case 'RESET':
      try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
      return initState();
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'TICK' }), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ bookings: state.bookings, user: state.user })); } catch { /* ignore */ }
  }, [state.bookings, state.user]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export function stats(spots) {
  const free = spots.filter((s) => s.status === 'free').length;
  const booked = spots.filter((s) => s.status === 'booked').length;
  return { free, booked, occupied: spots.length - free - booked, total: spots.length };
}

export function trialInfo(user) {
  const left = Math.max(0, PRICING.trialDays - Math.floor((Date.now() - user.subscribedAt) / DAY));
  return { left };
}
