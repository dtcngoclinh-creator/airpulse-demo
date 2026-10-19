import { useCallback, useEffect, useState } from 'react';
import { fetchFlightInsight } from '../services/modelApi.js';

/** Trạng thái: loading | ready | not_configured | empty | error */
export default function useFlightInsight(flight) {
  const [state, setState] = useState({ status: 'loading', data: null, source: null, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!flight) return undefined;
    const ctrl = new AbortController();
    setState({ status: 'loading', data: null, source: null, error: '' });
    fetchFlightInsight(flight, { signal: ctrl.signal })
      .then((r) => setState({ status: r.status, data: r.data || null, source: r.source || null, error: '' }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ status: 'error', data: null, source: null, error: e.message || 'Không gọi được API mô hình' });
      });
    return () => ctrl.abort();
  }, [flight, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
