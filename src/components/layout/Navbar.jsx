import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, Menu, X, UserRound } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import { useUserData } from '../../context/UserDataContext.jsx';

export const NAV_LINKS = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/flights', label: 'Tìm chuyến bay' },
  { to: '/explore', label: 'Khám phá' },
  { to: '/saved', label: 'Đã lưu' },
  { to: '/about', label: 'Về AirPulse' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { saved, watch, profile } = useUserData();
  const count = saved.length + watch.length;
  const overHero = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = overHero && !scrolled && !open;

  return (
    <header className={`navbar ${transparent ? 'is-transparent' : ''}`}>
      <div className="nav-inner">
        <Logo light={transparent} />
        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Điều hướng chính">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
              {l.to === '/saved' && count > 0 && <span className="nav-count">{count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <Link to="/saved" className="icon-btn nav-heart" aria-label={`Đã lưu (${count})`}>
            <Heart size={19} />
            {count > 0 && <span className="dot-count">{count}</span>}
          </Link>
          <Link to="/account" className="account-chip">
            {profile ? (
              <span className="avatar" aria-hidden="true">
                {profile.name?.[0]?.toUpperCase() || 'A'}
              </span>
            ) : (
              <UserRound size={18} aria-hidden="true" />
            )}
            <span className="account-label">{profile ? profile.name : 'Đăng nhập'}</span>
          </Link>
          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Đóng menu' : 'Mở menu'}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
