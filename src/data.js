// Мок-данные MVP «Орынтап». Все цифры — демонстрационные (из презентации: тарифы, комиссия, цена брони).

export const PRICING = {
  trialDays: 7,
  firstMonthsPrice: 500, // 1–6 ай
  regularPrice: 1000, // 7-айдан
  bookingFee: 200, // жүргізушіден әр брондау
  ownerCommission: 0.1, // паркинг иесінен 10%
};

export const SERVICES = {
  wash: { id: 'wash', title: 'Көлік жуу', price: 2500, icon: '🧽' },
  charge: { id: 'charge', title: 'Электр зарядтау', price: 1500, icon: '⚡' },
};

export const PARKINGS = [
  { id: 'mega', name: 'MEGA Alma-Ata', address: 'Розыбакиев к-сі, 247А', lat: 43.2023, lng: 76.8921, type: 'partner', total: 48, price: 300, hours: '24/7', services: ['wash', 'charge'], rating: 4.8 },
  { id: 'dostyk', name: 'Dostyk Plaza', address: 'Самал-2 ш/а, 111', lat: 43.2335, lng: 76.9567, type: 'partner', total: 36, price: 400, hours: '08:00–23:00', services: ['wash'], rating: 4.7 },
  { id: 'esentai', name: 'Esentai Mall', address: 'Әл-Фараби даңғ., 77/8', lat: 43.2186, lng: 76.9279, type: 'partner', total: 40, price: 500, hours: '24/7', services: ['wash', 'charge'], rating: 4.9 },
  { id: 'airport', name: 'Әуежай P1', address: 'Майлин к-сі, 2', lat: 43.3519, lng: 77.0396, type: 'partner', total: 60, price: 350, hours: '24/7', services: ['charge'], rating: 4.5 },
  { id: 'adk', name: 'ADK', address: 'Сайын к-сі, 81', lat: 43.2369, lng: 76.8651, type: 'partner', total: 32, price: 250, hours: '09:00–22:00', services: ['wash'], rating: 4.4 },
  { id: 'moskva', name: 'Moskva Metropolitan', address: 'Абай даңғ., 109В', lat: 43.2407, lng: 76.8709, type: 'partner', total: 28, price: 250, hours: '10:00–22:00', services: [], rating: 4.3 },
  { id: 'arbat', name: 'Арбат тұрағы', address: 'Жібек жолы к-сі', lat: 43.2612, lng: 76.9446, type: 'public', total: 30, price: 200, hours: '24/7', services: [], rating: 4.1 },
  { id: 'bazar', name: 'Көк базар', address: 'Жібек жолы к-сі, 53', lat: 43.2655, lng: 76.9561, type: 'public', total: 42, price: 200, hours: '07:00–20:00', services: [], rating: 3.9 },
  { id: 'republic', name: 'Республика алаңы', address: 'Желтоқсан к-сі', lat: 43.2381, lng: 76.9455, type: 'public', total: 36, price: 150, hours: '24/7', services: [], rating: 4.2 },
  { id: 'botanic', name: 'Ботаникалық бақ', address: 'Тимирязев к-сі, 36Д', lat: 43.2210, lng: 76.9130, type: 'public', total: 24, price: 150, hours: '08:00–21:00', services: [], rating: 4.6 },
  { id: 'medeu', name: 'Медеу', address: 'Горная к-сі, 465', lat: 43.1576, lng: 77.0588, type: 'public', total: 50, price: 300, hours: '24/7', services: [], rating: 4.5 },
];

export const getParking = (id) => PARKINGS.find((p) => p.id === id);

// Детерминированный рандом, чтобы стартовая картина была одинаковой
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ROW_SIZE = 8;

export function initSpots() {
  const rand = mulberry32(2026);
  const all = {};
  PARKINGS.forEach((p) => {
    const occupancy = 0.55 + rand() * 0.35;
    all[p.id] = Array.from({ length: p.total }, (_, i) => {
      const row = String.fromCharCode(65 + Math.floor(i / ROW_SIZE));
      const r = rand();
      let status = 'free';
      if (r < occupancy) status = p.type === 'partner' && r < 0.12 ? 'booked' : 'occupied';
      return { id: `${row}${(i % ROW_SIZE) + 1}`, status, mine: false };
    });
  });
  return all;
}

// Мок-история броней «других водителей» для панели партнёра
export function partnerHistory(parkingId) {
  const p = getParking(parkingId);
  const rand = mulberry32(parkingId.length * 977 + p.total);
  const names = ['Айбек С.', 'Дана Қ.', 'Ерлан М.', 'Асель Т.', 'Нұрлан Б.', 'Мадина Ж.', 'Тимур А.', 'Әсем Н.', 'Руслан О.', 'Жанар Е.'];
  const plates = ['777 ABA 02', '123 KZA 02', '505 BBK 02', '010 ALM 02', '888 TTT 02', '341 NUR 02', '662 QAZ 02'];
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const peak = Math.exp(-((h - 13) ** 2) / 18) + 0.7 * Math.exp(-((h - 19) ** 2) / 6);
    return h < 7 ? Math.round(rand() * 1) : Math.round(peak * (p.total / 4) * (0.7 + rand() * 0.6));
  });
  const recent = Array.from({ length: 8 }, (_, i) => {
    const hours = 1 + Math.floor(rand() * 3);
    return {
      id: `h${i}`,
      driver: names[Math.floor(rand() * names.length)],
      plate: plates[Math.floor(rand() * plates.length)],
      spot: `${String.fromCharCode(65 + Math.floor(rand() * Math.ceil(p.total / ROW_SIZE)))}${1 + Math.floor(rand() * ROW_SIZE)}`,
      time: `${String(9 + i).padStart(2, '0')}:${rand() < 0.5 ? '00' : '30'}`,
      hours,
      amount: hours * p.price,
    };
  }).reverse();
  return { byHour, recent };
}

export const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
