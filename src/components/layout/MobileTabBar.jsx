import { NavLink } from 'react-router-dom';
import { Home, Search, Compass, Heart, UserRound } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Trang chủ', Icon: Home, end: true },
  { to: '/flights', label: 'Tìm vé', Icon: Search },
  { to: '/explore', label: 'Khám phá', Icon: Compass },
  { to: '/saved', label: 'Đã lưu', Icon: Heart },
  { to: '/account', label: 'Tài khoản', Icon: UserRound },
];

export default function MobileTabBar() {
  return (
    <nav className="tabbar" aria-label="Điều hướng nhanh">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
