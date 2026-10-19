// Website chính thức của các hãng. Liên kết dẫn tới trang đặt vé CHUNG của hãng,
// không giữ chỗ, không giữ giá và không phải deep-link tới đúng chuyến.
const AIRLINES = [
  {
    key: 'vietnam-airlines',
    name: 'Vietnam Airlines',
    code: 'VN',
    match: ['vietnam airlines'],
    url: 'https://www.vietnamairlines.com/vi-vn/ve-may-bay',
    tone: '#0B5E73',
  },
  {
    key: 'vietjet',
    name: 'Vietjet Air',
    code: 'VJ',
    match: ['vietjet'],
    url: 'https://www.vietjetair.com/vi',
    tone: '#C8102E',
  },
  {
    key: 'sun-phuquoc',
    name: 'Sun PhuQuoc Airways',
    code: '9G',
    match: ['sun phuquoc', 'sun phu quoc'],
    url: 'https://sunphuquocairways.com',
    tone: '#B7791F',
  },
  {
    key: 'vietravel',
    name: 'Vietravel Airlines',
    code: 'VU',
    match: ['vietravel'],
    url: 'https://www.vietravelairlines.com/vi',
    tone: '#5B3E96',
  },
  {
    key: 'bamboo',
    name: 'Bamboo Airways',
    code: 'QH',
    match: ['bamboo'],
    url: 'https://www.bambooairways.com/',
    tone: '#2E7D4F',
  },
];

export function findAirline(name = '', flightNumber = '') {
  const n = String(name).toLowerCase();
  const byName = AIRLINES.find((a) => a.match.some((m) => n.includes(m)));
  if (byName) return byName;
  const prefix = String(flightNumber).trim().slice(0, 2).toUpperCase();
  return AIRLINES.find((a) => a.code === prefix) || null;
}

export function airlineCode(name, flightNumber) {
  return findAirline(name, flightNumber)?.code || String(flightNumber || name || '?').slice(0, 2).toUpperCase();
}

export function airlineTone(name, flightNumber) {
  return findAirline(name, flightNumber)?.tone || '#3C5470';
}

/** Liên kết đối chiếu trên Google Flights (tìm theo tuyến + ngày, không giữ chỗ). */
export function googleFlightsUrl(origin, destination, date) {
  const q = `Flights from ${origin} to ${destination} on ${date} one way`;
  return `https://www.google.com/travel/flights?hl=vi&curr=VND&q=${encodeURIComponent(q)}`;
}

export default AIRLINES;
