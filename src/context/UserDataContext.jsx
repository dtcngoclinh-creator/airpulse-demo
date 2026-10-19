// Dữ liệu cá nhân của người dùng (lưu chuyến, theo dõi giá, hành trình yêu thích,
// so sánh, hồ sơ demo). Tất cả nằm trong localStorage của trình duyệt, không gửi đi đâu.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readJSON, writeJSON, removeKey } from '../utils/storage.js';

const KEYS = {
  saved: 'airpulse_saved', // tương thích dữ liệu đã lưu từ V3
  watch: 'airpulse_watch',
  routes: 'airpulse_fav_routes',
  profile: 'airpulse_profile',
  compare: 'airpulse_compare',
};
export const COMPARE_LIMIT = 3;

const UserDataContext = createContext(null);

export function snapshotOf(f) {
  return {
    id: String(f.id),
    origin: f.origin,
    destination: f.destination,
    airline: f.airline,
    flight_number: f.flight_number,
    departure_at: f.departure_at,
    arrival_at: f.arrival_at,
    price_vnd: Number.isFinite(Number(f.price_vnd)) ? Number(f.price_vnd) : null,
    last_observed_at: f.last_observed_at || null,
  };
}

function usePersisted(key, fallback, sanitize = (v) => v) {
  const [value, setValue] = useState(() => sanitize(readJSON(key, fallback)));
  useEffect(() => {
    writeJSON(key, value);
  }, [key, value]);
  return [value, setValue];
}

const asArray = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);

export function UserDataProvider({ children }) {
  const [saved, setSaved] = usePersisted(KEYS.saved, [], (v) =>
    asArray(v)
      .filter((x) => x.id || x.flight_number)
      .map((x) => ({ ...snapshotOf(x), savedAt: x.savedAt || null })),
  );
  const [watch, setWatch] = usePersisted(KEYS.watch, [], asArray);
  const [routes, setRoutes] = usePersisted(KEYS.routes, [], asArray);
  const [compare, setCompare] = usePersisted(KEYS.compare, [], (v) => (Array.isArray(v) ? v.map(String).slice(0, COMPARE_LIMIT) : []));
  const [profile, setProfile] = usePersisted(KEYS.profile, null, (v) => (v && typeof v === 'object' && v.email ? v : null));

  // ---- Lưu chuyến
  const isSaved = useCallback((id) => saved.some((x) => x.id === String(id)), [saved]);
  const toggleSaved = useCallback(
    (f) => {
      const id = String(f.id);
      const exists = saved.some((x) => x.id === id);
      setSaved(exists ? saved.filter((x) => x.id !== id) : [{ ...snapshotOf(f), savedAt: new Date().toISOString() }, ...saved]);
      return !exists;
    },
    [saved, setSaved],
  );
  const removeSaved = useCallback((id) => setSaved((s) => s.filter((x) => x.id !== String(id))), [setSaved]);

  // ---- Theo dõi giá
  const isWatched = useCallback((id) => watch.some((x) => x.id === String(id)), [watch]);
  const watchFlight = useCallback(
    (f, targetPrice = null) => {
      const id = String(f.id);
      setWatch((w) => {
        const rest = w.filter((x) => x.id !== id);
        const prev = w.find((x) => x.id === id);
        return [
          {
            id,
            flight: snapshotOf(f),
            priceAtWatch: prev?.priceAtWatch ?? (Number.isFinite(f.price_vnd) ? f.price_vnd : null),
            targetPrice: Number.isFinite(Number(targetPrice)) && Number(targetPrice) > 0 ? Number(targetPrice) : null,
            createdAt: prev?.createdAt || new Date().toISOString(),
          },
          ...rest,
        ];
      });
    },
    [setWatch],
  );
  const unwatch = useCallback((id) => setWatch((w) => w.filter((x) => x.id !== String(id))), [setWatch]);

  // ---- Hành trình yêu thích
  const isFavRoute = useCallback((o, d) => routes.some((r) => r.origin === o && r.destination === d), [routes]);
  const toggleFavRoute = useCallback(
    (o, d) => {
      const exists = routes.some((r) => r.origin === o && r.destination === d);
      setRoutes(exists ? routes.filter((r) => !(r.origin === o && r.destination === d)) : [{ origin: o, destination: d, createdAt: new Date().toISOString() }, ...routes]);
      return !exists;
    },
    [routes, setRoutes],
  );

  // ---- So sánh
  const inCompare = useCallback((id) => compare.includes(String(id)), [compare]);
  const toggleCompare = useCallback(
    (f) => {
      const id = String(f.id);
      if (compare.includes(id)) {
        setCompare(compare.filter((x) => x !== id));
        return { ok: true, added: false };
      }
      if (compare.length >= COMPARE_LIMIT) return { ok: false, added: false };
      setCompare([...compare, id]);
      return { ok: true, added: true };
    },
    [compare, setCompare],
  );
  const clearCompare = useCallback(() => setCompare([]), [setCompare]);
  const setCompareIds = useCallback((ids) => setCompare(ids.map(String).slice(0, COMPARE_LIMIT)), [setCompare]);

  // ---- Hồ sơ demo (không có xác thực thật, không lưu mật khẩu)
  const signIn = useCallback(
    (data) => {
      const existing = readJSON(KEYS.profile, null);
      const sameUser = existing && existing.email === data.email;
      setProfile({
        homeAirport: 'SGN',
        interests: [],
        ...(sameUser ? existing : {}),
        ...data,
        name: data.name || (sameUser ? existing.name : '') || data.email.split('@')[0],
        createdAt: sameUser ? existing.createdAt : new Date().toISOString(),
      });
    },
    [setProfile],
  );
  const updateProfile = useCallback((patch) => setProfile((p) => (p ? { ...p, ...patch } : p)), [setProfile]);
  const signOut = useCallback(() => setProfile(null), [setProfile]);
  const clearAll = useCallback(() => {
    Object.values(KEYS).forEach(removeKey);
    setSaved([]);
    setWatch([]);
    setRoutes([]);
    setCompare([]);
    setProfile(null);
  }, [setSaved, setWatch, setRoutes, setCompare, setProfile]);

  const value = useMemo(
    () => ({
      saved, isSaved, toggleSaved, removeSaved,
      watch, isWatched, watchFlight, unwatch,
      routes, isFavRoute, toggleFavRoute,
      compare, inCompare, toggleCompare, clearCompare, setCompareIds,
      profile, signIn, updateProfile, signOut, clearAll,
      homeAirport: profile?.homeAirport || 'SGN',
    }),
    [saved, isSaved, toggleSaved, removeSaved, watch, isWatched, watchFlight, unwatch, routes, isFavRoute, toggleFavRoute,
      compare, inCompare, toggleCompare, clearCompare, setCompareIds, profile, signIn, updateProfile, signOut, clearAll],
  );
  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData phải nằm trong UserDataProvider');
  return ctx;
}
