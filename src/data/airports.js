// Danh mục sân bay. Chỉ dùng để hiển thị tên; danh sách tuyến thật luôn lấy từ flights.json.
export const AIRPORTS = {
  SGN: { code: 'SGN', city: 'TP. Hồ Chí Minh', short: 'TP.HCM', airport: 'Sân bay Tân Sơn Nhất', destination: 'tp-ho-chi-minh' },
  HAN: { code: 'HAN', city: 'Hà Nội', short: 'Hà Nội', airport: 'Sân bay Nội Bài', destination: 'ha-noi' },
  DAD: { code: 'DAD', city: 'Đà Nẵng', short: 'Đà Nẵng', airport: 'Sân bay Đà Nẵng', destination: 'da-nang' },
  PQC: { code: 'PQC', city: 'Phú Quốc', short: 'Phú Quốc', airport: 'Sân bay Phú Quốc', destination: 'phu-quoc' },
  DLI: { code: 'DLI', city: 'Đà Lạt', short: 'Đà Lạt', airport: 'Sân bay Liên Khương', destination: 'da-lat' },
  CXR: { code: 'CXR', city: 'Nha Trang', short: 'Nha Trang', airport: 'Sân bay Cam Ranh' },
  HUI: { code: 'HUI', city: 'Huế', short: 'Huế', airport: 'Sân bay Phú Bài' },
  VDO: { code: 'VDO', city: 'Quảng Ninh', short: 'Vân Đồn', airport: 'Sân bay Vân Đồn' },
  UIH: { code: 'UIH', city: 'Quy Nhơn', short: 'Quy Nhơn', airport: 'Sân bay Phù Cát' },
  VCA: { code: 'VCA', city: 'Cần Thơ', short: 'Cần Thơ', airport: 'Sân bay Cần Thơ' },
};

export const cityOf = (code) => AIRPORTS[code]?.city || code || '—';
export const shortCityOf = (code) => AIRPORTS[code]?.short || code || '—';
export const airportOf = (code) => AIRPORTS[code]?.airport || `Sân bay ${code}`;
