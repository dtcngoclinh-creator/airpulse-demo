import { IMAGES } from './images.js';

export const CATEGORIES = [
  { key: 'sea', label: 'Biển xanh', emoji: '🌊' },
  { key: 'nature', label: 'Núi rừng & chữa lành', emoji: '🌿' },
  { key: 'food', label: 'Ăn ngon', emoji: '🍜' },
  { key: 'culture', label: 'Văn hóa & di sản', emoji: '🏮' },
  { key: 'resort', label: 'Nghỉ dưỡng', emoji: '🌴' },
];

// Nội dung cảm hứng du lịch (không phải dữ liệu chuyến bay).
// "airport" là sân bay gần nhất có trong danh mục; giá/chuyến luôn lấy từ flights.json.
export const DESTINATIONS = [
  {
    slug: 'da-nang',
    name: 'Đà Nẵng',
    airport: 'DAD',
    region: 'Miền Trung',
    categories: ['sea', 'food', 'resort'],
    tagline: 'Sáng ngắm biển, chiều ăn ngon, tối dạo bên sông Hàn.',
    description:
      'Thành phố biển dễ đi nhất cho chuyến ngắn ngày: bãi Mỹ Khê ngay trung tâm, bán đảo Sơn Trà xanh mát, ẩm thực đường phố phong phú và chỉ cách Hội An chừng 45 phút xe.',
    bestTime: 'Tháng 3 – 8, nắng đẹp, biển êm',
    transfer: 'Sân bay nằm gần trung tâm, đi xe khoảng 10–15 phút',
    image: IMAGES.danang,
    highlights: ['Biển Mỹ Khê', 'Bán đảo Sơn Trà', 'Cầu Rồng cuối tuần', 'Mì Quảng, bánh xèo'],
    itinerary: [
      { title: 'Biển và thành phố', items: ['Tắm biển Mỹ Khê buổi sáng', 'Cà phê ven sông Hàn', 'Dạo cầu Rồng buổi tối'] },
      { title: 'Sơn Trà và ẩm thực', items: ['Lên bán đảo Sơn Trà sớm', 'Ăn trưa hải sản', 'Tối thử mì Quảng, bánh tráng cuốn'] },
      { title: 'Ghé Hội An', items: ['Chiều đi Hội An', 'Dạo phố cổ lúc lên đèn', 'Quay về Đà Nẵng hoặc ngủ lại'] },
    ],
  },
  {
    slug: 'hoi-an',
    name: 'Hội An',
    airport: 'DAD',
    region: 'Miền Trung',
    categories: ['culture', 'food'],
    tagline: 'Phố cổ lên đèn, một ly cà phê và không cần vội.',
    description:
      'Phố cổ với những ngôi nhà tường vàng, đèn lồng và nhịp sống chậm. Bay đến Đà Nẵng rồi đi xe khoảng 45 phút là tới.',
    bestTime: 'Tháng 2 – 4, mát và ít mưa',
    transfer: 'Bay đến Đà Nẵng (DAD), đi xe khoảng 45 phút',
    image: IMAGES.hoian,
    highlights: ['Phố cổ về đêm', 'Làng rau Trà Quế', 'Biển An Bàng', 'Cao lầu, bánh mì'],
    itinerary: [
      { title: 'Làm quen phố cổ', items: ['Đến từ sân bay Đà Nẵng', 'Dạo phố cổ chiều muộn', 'Thả đèn hoa đăng'] },
      { title: 'Làng quê và biển', items: ['Đạp xe làng rau Trà Quế', 'Chiều ra biển An Bàng', 'Tối ăn cao lầu'] },
    ],
  },
  {
    slug: 'phu-quoc',
    name: 'Phú Quốc',
    airport: 'PQC',
    region: 'Đảo phía Nam',
    categories: ['sea', 'resort'],
    tagline: 'Một kỳ nghỉ mà lịch trình chỉ có biển và hoàng hôn.',
    description:
      'Đảo lớn nhất Việt Nam với bãi cát trắng, nước trong và hoàng hôn phía tây rất đẹp. Phù hợp nghỉ dưỡng gia đình hoặc chuyến đi đôi.',
    bestTime: 'Tháng 11 – 4, mùa khô, biển lặng',
    transfer: 'Sân bay cách khu Dương Đông khoảng 15–20 phút xe',
    image: IMAGES.phuquoc,
    highlights: ['Bãi Sao', 'Hoàng hôn Dinh Cậu', 'Chợ đêm', 'Lặn ngắm san hô phía Nam đảo'],
    itinerary: [
      { title: 'Nhận phòng, ngắm hoàng hôn', items: ['Đến đảo, nhận phòng', 'Hoàng hôn ở bờ tây', 'Chợ đêm Phú Quốc'] },
      { title: 'Khám phá Nam đảo', items: ['Tour cano các hòn đảo nhỏ', 'Tắm biển Bãi Sao', 'Hải sản buổi tối'] },
      { title: 'Ngày thong thả', items: ['Ngủ nướng, hồ bơi', 'Mua đặc sản trước khi về'] },
    ],
  },
  {
    slug: 'da-lat',
    name: 'Đà Lạt',
    airport: 'DLI',
    region: 'Tây Nguyên',
    categories: ['nature', 'food'],
    tagline: 'Cà phê nóng, rừng thông và những buổi sáng chậm rãi.',
    description:
      'Thành phố cao nguyên se lạnh quanh năm, nhiều đồi thông, hồ nước và quán cà phê có view. Lựa chọn quen thuộc cho một chuyến chữa lành cuối tuần.',
    bestTime: 'Tháng 12 – 3, trời trong và mát',
    transfer: 'Sân bay Liên Khương cách trung tâm khoảng 30–40 phút xe',
    image: IMAGES.dalat,
    highlights: ['Hồ Xuân Hương', 'Đồi chè, rừng thông', 'Chợ đêm Đà Lạt', 'Lẩu gà lá é'],
    itinerary: [
      { title: 'Thành phố sương', items: ['Dạo hồ Xuân Hương', 'Cà phê đồi thông', 'Chợ đêm và bánh tráng nướng'] },
      { title: 'Ra ngoại ô', items: ['Đồi chè buổi sớm', 'Thác nước gần thành phố', 'Tối ăn lẩu gà lá é'] },
    ],
  },
  {
    slug: 'ha-noi',
    name: 'Hà Nội',
    airport: 'HAN',
    region: 'Miền Bắc',
    categories: ['culture', 'food'],
    tagline: 'Đi bộ qua phố cổ, tìm một quán ăn ruột của riêng mình.',
    description:
      'Thủ đô nghìn năm với phố cổ, hồ Gươm, những con đường rợp cây và một bản đồ ẩm thực đường phố không bao giờ đi hết.',
    bestTime: 'Tháng 9 – 11, mùa thu dễ chịu',
    transfer: 'Sân bay Nội Bài cách trung tâm khoảng 45 phút xe',
    image: IMAGES.hanoi,
    highlights: ['Hồ Gươm', 'Phố cổ 36 phố phường', 'Văn Miếu', 'Phở, bún chả'],
    itinerary: [
      { title: 'Phố cổ và hồ Gươm', items: ['Sáng ăn phở', 'Dạo hồ Gươm, phố cổ', 'Tối phố đi bộ cuối tuần'] },
      { title: 'Di sản và cà phê', items: ['Văn Miếu – Quốc Tử Giám', 'Cà phê trứng', 'Hoàng hôn hồ Tây'] },
    ],
  },
  {
    slug: 'tp-ho-chi-minh',
    name: 'TP. Hồ Chí Minh',
    airport: 'SGN',
    region: 'Miền Nam',
    categories: ['food', 'culture'],
    tagline: 'Thành phố không ngủ, góc phố nào cũng có chuyện để kể.',
    description:
      'Nhịp sống sôi động, kiến trúc xưa xen lẫn cao ốc, và một nền ẩm thực đêm khó cưỡng. Cũng là điểm trung chuyển thuận tiện đi miền Tây.',
    bestTime: 'Tháng 12 – 4, mùa khô',
    transfer: 'Sân bay Tân Sơn Nhất nằm trong nội thành, 20–40 phút xe',
    image: IMAGES.saigon,
    highlights: ['Nhà thờ Đức Bà, Bưu điện', 'Chợ Bến Thành', 'Phố ẩm thực Quận 4', 'Cơm tấm, hủ tiếu'],
    itinerary: [
      { title: 'Trung tâm thành phố', items: ['Bưu điện thành phố', 'Chợ Bến Thành', 'Tối ăn ốc Quận 4'] },
      { title: 'Ăn và chơi', items: ['Bảo tàng buổi sáng', 'Cà phê chung cư cũ', 'Sky bar ngắm thành phố'] },
    ],
  },
  {
    slug: 'ninh-binh',
    name: 'Ninh Bình',
    airport: 'HAN',
    region: 'Miền Bắc',
    categories: ['nature', 'culture'],
    tagline: 'Thuyền trôi giữa núi đá vôi và cánh đồng lúa.',
    description:
      'Tràng An, Tam Cốc với những dãy núi đá vôi soi bóng xuống sông. Bay đến Hà Nội rồi đi xe khoảng 2 giờ.',
    bestTime: 'Tháng 5 – 6, mùa lúa chín Tam Cốc',
    transfer: 'Bay đến Hà Nội (HAN), đi xe khoảng 2 giờ',
    image: IMAGES.ninhbinh,
    highlights: ['Tràng An', 'Tam Cốc – Bích Động', 'Hang Múa', 'Cơm cháy, dê núi'],
    itinerary: [
      { title: 'Sông nước Tràng An', items: ['Đi thuyền Tràng An', 'Leo Hang Múa ngắm hoàng hôn'] },
      { title: 'Tam Cốc', items: ['Đạp xe đồng lúa', 'Đi thuyền Tam Cốc', 'Về Hà Nội buổi chiều'] },
    ],
  },
  {
    slug: 'ha-long',
    name: 'Vịnh Hạ Long',
    airport: 'HAN',
    region: 'Miền Bắc',
    categories: ['sea', 'nature', 'resort'],
    tagline: 'Một đêm ngủ trên du thuyền giữa hàng nghìn đảo đá.',
    description:
      'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi. Trong dữ liệu hiện tại, cách gần nhất là bay đến Hà Nội rồi đi xe khoảng 2,5 giờ.',
    bestTime: 'Tháng 4 – 6 và 9 – 11',
    transfer: 'Bay đến Hà Nội (HAN), đi xe khoảng 2,5 giờ',
    image: IMAGES.halong,
    highlights: ['Du thuyền qua đêm', 'Chèo kayak', 'Hang động', 'Hải sản'],
    itinerary: [
      { title: 'Lên du thuyền', items: ['Di chuyển từ Hà Nội', 'Chèo kayak buổi chiều', 'Ngắm hoàng hôn trên boong'] },
      { title: 'Bình minh trên vịnh', items: ['Tập thể dục sáng', 'Thăm hang động', 'Về Hà Nội'] },
    ],
  },
];

// Hành trình gợi ý (sequence ngày -> dùng số thứ tự là hợp lý).
export const TRIP_IDEAS = [
  { slug: 'da-lat', title: 'Cuối tuần chữa lành ở Đà Lạt', length: '3 ngày 2 đêm', mood: 'nature', blurb: 'Rời phố tối thứ Sáu, Chủ nhật về với đầu óc nhẹ tênh.' },
  { slug: 'da-nang', title: 'Biển miền Trung: Đà Nẵng và Hội An', length: '4 ngày 3 đêm', mood: 'sea', blurb: 'Hai ngày biển, một buổi tối phố cổ, ăn không ngừng nghỉ.' },
  { slug: 'phu-quoc', title: 'Đảo ngọc cho cả nhà', length: '4 ngày 3 đêm', mood: 'resort', blurb: 'Lịch trình nhẹ, nhiều thời gian ở biển và hồ bơi.' },
  { slug: 'ninh-binh', title: 'Hà Nội và Ninh Bình', length: '3 ngày 2 đêm', mood: 'culture', blurb: 'Một ngày phố cổ, hai ngày giữa núi đá vôi và đồng lúa.' },
];

export const destinationBySlug = (slug) => DESTINATIONS.find((d) => d.slug === slug) || null;
export const destinationsForAirport = (code) => DESTINATIONS.filter((d) => d.airport === code);
const PRIMARY = { DAD: 'da-nang', PQC: 'phu-quoc', DLI: 'da-lat', HAN: 'ha-noi', SGN: 'tp-ho-chi-minh' };
export const primaryDestinationForAirport = (code) =>
  destinationBySlug(PRIMARY[code]) || DESTINATIONS.find((d) => d.airport === code) || null;
