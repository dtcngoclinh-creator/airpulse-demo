import { Link } from 'react-router-dom';

export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <rect width="64" height="64" rx="16" fill="currentColor" />
      <path d="M10 36h11l5-12 8 22 6-14 4 4h10" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ onClick, light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo-light' : ''}`} onClick={onClick} aria-label="AirPulse – về trang chủ">
      <LogoMark />
      <span>airpulse</span>
    </Link>
  );
}
