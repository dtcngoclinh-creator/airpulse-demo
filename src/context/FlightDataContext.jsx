import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FLIGHTS_URL, buildIndex, parseFlightPayload } from '../data/flights.js';

const FlightDataContext = createContext(null);

export function FlightDataProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', flights: [], metadata: {}, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    fetch(FLIGHTS_URL, { signal: ctrl.signal, cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`Máy chủ trả mã ${r.status} khi đọc flights.json`);
        return r.json();
      })
      .then((payload) => {
        const { flights, metadata } = parseFlightPayload(payload);
        setState({ status: 'ready', flights, metadata, error: '' });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'error', flights: [], metadata: {}, error: err.message || 'Không đọc được dữ liệu' });
      });
    return () => ctrl.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const index = useMemo(() => buildIndex(state.flights), [state.flights]);
  const byId = useMemo(() => new Map(state.flights.map((f) => [f.id, f])), [state.flights]);

  const value = useMemo(() => ({ ...state, index, byId, retry }), [state, index, byId, retry]);
  return <FlightDataContext.Provider value={value}>{children}</FlightDataContext.Provider>;
}

export function useFlightData() {
  const ctx = useContext(FlightDataContext);
  if (!ctx) throw new Error('useFlightData phải nằm trong FlightDataProvider');
  return ctx;
}
