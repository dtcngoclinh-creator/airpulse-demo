// Ảnh minh họa (Unsplash). Toàn bộ ảnh gom tại đây để dễ thay bằng ảnh có giấy phép
// hoặc ảnh tự chụp: đặt file vào public/images/ rồi đổi đường dẫn, ví dụ '/images/da-nang.jpg'.
// Nếu ảnh không tải được, component SmartImage tự hiển thị nền thay thế.
const u = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  hero: u('1436491865332-7a61a109cc05', 2200),
  heroAlt: u('1476514525535-07fb3b4ae5f1', 2000),
  planning: u('1488085061387-422e29b40080', 1200),
  account: u('1500534623283-312aade485b7', 1200),
  roadTrip: u('1469854523086-cc02fe5d8800', 1400),
  saigon: u('1583417319070-4a69db38a482'),
  hanoi: u('1509030450996-dd1a26dda07a'),
  hoian: "/images/hoian.jpg",  danang: u('1507525428034-b723cf961d3e'),
  phuquoc: u('1500375592092-40eb2168fd21'),
  dalat: u('1441974231531-c6227db76b6e'),
  halong: u('1528127269322-539801943592'),
  ninhbinh: u('1528181304800-259b08848526'),
};
