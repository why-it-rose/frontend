import { useEffect, useState } from 'react';
import type { StockEvent } from '../types/event.types';
import { fetchEventDetail } from '../api/eventApi';

export function useEventDetail(eventId: number | null) {
  const [event, setEvent] = useState<StockEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId === null) return;
    setLoading(true);
    setError(null);
    fetchEventDetail(eventId)
      .then(setEvent)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  return { event, loading, error };
}
