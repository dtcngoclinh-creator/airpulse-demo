import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, LogOut, Trash2, Heart, Bell, Star, ShieldCheck, Info } from 'lucide-react';
import SmartImage from '../components/common/SmartImage.jsx';
import { useUserData } from '../context/UserDataContext.jsx';
import { useFlightData } from '../context/FlightDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIES } from '../data/destinations.js';
import { IMAGES } from '../data/images.js';
import { cityOf } from '../data/airports.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function InterestPicker({ value, onChange }) {
  const toggle = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div className="interest-picker" role="group" aria-label="Sở thích du lịch">
      {CATEGORIES.map((c) => (
        <button type="button" key={c.key} className={value.includes(c.key) ? 'on' : ''} aria-pressed={value.includes(c.key)} onClick={() => toggle(c.key)}>
          <span aria-hidden="true">{c.emoji}</span> {c.label}
        </button>
      ))}
    </div>
  );
}

function AuthForm() {
  const { signIn } = useUserData();
  const { index } = useFlightData();
  const notify = useToast();
  const [mode, setMode] = useState('login');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', homeAirport: 'SGN', interests: [] });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const airports = index.origins.length ? index.origins : ['SGN', 'HAN'];

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (mode === 'signup' && !form.name.trim()) err.name = 'Nhập tên để AirPulse biết cách gọi bạn.';
    if (!EMAIL_RE.test(form.email.trim())) err.email = 'Email chưa đúng định dạng, ví dụ ban@example.com.';
    if (form.password.length < 8) err.password = 'Mật khẩu cần ít nhất 8 ký tự.';
    setErrors(err);
    if (Object.keys(err).length) return;
    const { password, ...rest } = form; // không lưu mật khẩu
    signIn(mode === 'signup' ? { ...rest, name: rest.name.trim(), email: rest.email.trim() } : { email: rest.email.trim() });
    notify(mode === 'signup' ? 'Đã tạo hồ sơ demo trên trình duyệt này' : 'Đã đăng nhập chế độ demo');
  };

  return (
    <div className="auth">
      <div className="auth-visual">
        <SmartImage src={IMAGES.account} alt="Ảnh minh họa một chuyến đi" label="AirPulse" />
        <div className="auth-visual-copy">
          <h2>Mỗi chuyến đi bắt đầu từ một ý tưởng.</h2>
          <p>Lưu chuyến bay, theo dõi giá và nhận gợi ý điểm đến theo sở thích.</p>
        </div>
      </div>
      <div className="auth-panel">
        <h1>{mode === 'login' ? 'Chào mừng bạn quay lại' : 'Tạo hồ sơ AirPulse'}</h1>
        <p className="demo-note">
          <Info size={16} aria-hidden="true" /> Chế độ demo: không có máy chủ xác thực. Hồ sơ chỉ lưu trên trình duyệt này, mật khẩu không được lưu.
        </p>
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
            Đăng nhập
          </button>
          <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>
            Đăng ký
          </button>
        </div>
        <form className="form" onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <label className="form-field">
              <span>Tên của bạn</span>
              <input value={form.name} onChange={set('name')} placeholder="Ví dụ: Linh" autoComplete="name" aria-invalid={!!errors.name} />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
          )}
          <label className="form-field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} placeholder="ban@example.com" autoComplete="email" aria-invalid={!!errors.email} />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>
          <label className="form-field">
            <span>Mật khẩu</span>
            <div className="pw-wrap">
              <input
                type={show ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                aria-invalid={!!errors.password}
              />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>
          {mode === 'signup' && (
            <>
              <label className="form-field">
                <span>Bạn thường bay từ đâu?</span>
                <select value={form.homeAirport} onChange={set('homeAirport')}>
                  {airports.map((c) => (
                    <option key={c} value={c}>
                      {cityOf(c)} ({c})
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-field">
                <span>Bạn thích kiểu du lịch nào?</span>
                <InterestPicker value={form.interests} onChange={(v) => setForm({ ...form, interests: v })} />
              </div>
            </>
          )}
          <button className="btn btn-primary btn-block" type="submit">
            {mode === 'login' ? 'Đăng nhập' : 'Tạo hồ sơ'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Profile() {
  const { profile, updateProfile, signOut, clearAll, saved, watch, routes } = useUserData();
  const { index } = useFlightData();
  const notify = useToast();
  const [draft, setDraft] = useState({ name: profile.name, homeAirport: profile.homeAirport || 'SGN', interests: profile.interests || [] });
  const [confirm, setConfirm] = useState(false);
  const airports = index.origins.length ? index.origins : ['SGN', 'HAN'];

  return (
    <div className="profile">
      <header className="profile-head">
        <span className="avatar avatar-lg" aria-hidden="true">
          {profile.name?.[0]?.toUpperCase()}
        </span>
        <div>
          <h1>Xin chào, {profile.name}</h1>
          <p className="muted">{profile.email}</p>
        </div>
        <button
          className="btn btn-quiet btn-sm"
          onClick={() => {
            signOut();
            notify('Đã đăng xuất');
          }}
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </header>

      <div className="dash-stats">
        <Link className="dash-stat" to="/saved">
          <Heart size={20} aria-hidden="true" />
          <strong>{saved.length}</strong>
          <span>Chuyến đã lưu</span>
        </Link>
        <Link className="dash-stat" to="/saved?tab=watch">
          <Bell size={20} aria-hidden="true" />
          <strong>{watch.length}</strong>
          <span>Theo dõi giá</span>
        </Link>
        <Link className="dash-stat" to="/saved?tab=routes">
          <Star size={20} aria-hidden="true" />
          <strong>{routes.length}</strong>
          <span>Hành trình yêu thích</span>
        </Link>
      </div>

      <div className="profile-grid">
        <form
          className="card form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return notify('Tên không được để trống', 'info');
            updateProfile({ ...draft, name: draft.name.trim() });
            notify('Đã lưu thay đổi hồ sơ');
          }}
        >
          <h2>Hồ sơ du lịch</h2>
          <label className="form-field">
            <span>Tên hiển thị</span>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Sân bay thường bay</span>
            <select value={draft.homeAirport} onChange={(e) => setDraft({ ...draft, homeAirport: e.target.value })}>
              {airports.map((c) => (
                <option key={c} value={c}>
                  {cityOf(c)} ({c})
                </option>
              ))}
            </select>
            <small className="muted">Dùng làm điểm khởi hành mặc định khi bạn tìm chuyến bay.</small>
          </label>
          <div className="form-field">
            <span>Sở thích du lịch</span>
            <InterestPicker value={draft.interests} onChange={(v) => setDraft({ ...draft, interests: v })} />
            <small className="muted">Trang chủ sẽ ưu tiên gợi ý theo sở thích đầu tiên bạn chọn.</small>
          </div>
          <button className="btn btn-primary" type="submit">
            Lưu thay đổi
          </button>
        </form>

        <div className="card privacy-card">
          <h2>
            <ShieldCheck size={20} aria-hidden="true" /> Dữ liệu của bạn
          </h2>
          <p>
            Hồ sơ, chuyến đã lưu và danh sách theo dõi chỉ nằm trong bộ nhớ của trình duyệt này. Xóa dữ liệu trình duyệt hoặc dùng máy khác sẽ không
            còn thấy chúng.
          </p>
          {!confirm ? (
            <button className="btn btn-danger-quiet btn-sm" onClick={() => setConfirm(true)}>
              <Trash2 size={16} /> Xóa toàn bộ dữ liệu AirPulse
            </button>
          ) : (
            <div className="confirm-box">
              <p>Xóa hồ sơ, {saved.length} chuyến đã lưu, {watch.length} mục theo dõi và {routes.length} hành trình? Không thể hoàn tác.</p>
              <div className="row-gap">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    clearAll();
                    notify('Đã xóa toàn bộ dữ liệu AirPulse trên trình duyệt');
                  }}
                >
                  Xóa vĩnh viễn
                </button>
                <button className="btn btn-quiet btn-sm" onClick={() => setConfirm(false)}>
                  Giữ lại
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const { profile } = useUserData();
  useDocumentTitle(profile ? 'Hồ sơ của bạn' : 'Đăng nhập');
  return <div className="container subpage">{profile ? <Profile /> : <AuthForm />}</div>;
}
