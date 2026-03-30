import { useEffect, useState } from 'react';
import type { StockEvent } from '../types/event.types';
import { addEventScrap, fetchEventDetail, removeEventScrap } from '../api/eventApi';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong.';

export function useEventDetail(eventId: number | null) {
  const [event, setEvent] = useState<StockEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [scrapping, setScrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId === null) {
      setEvent(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchEventDetail(eventId)
      .then(setEvent)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const toggleScrap = async (targetEventId: number, isScrapped: boolean) => {
    const nextScrapped = !isScrapped;

    setScrapping(true);
    setError(null);
    setEvent((prev) => {
      if (!prev || prev.eventId !== targetEventId) return prev;
      return { ...prev, isScrapped: nextScrapped };
    });

    try {
      if (nextScrapped) {
        await addEventScrap(targetEventId);
      } else {
        await removeEventScrap(targetEventId);
      }
    } catch (e: unknown) {
      setEvent((prev) => {
        if (!prev || prev.eventId !== targetEventId) return prev;
        return { ...prev, isScrapped };
      });
      setError(e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE);
    } finally {
      setScrapping(false);
    }
  };

  return { event, loading, scrapping, error, toggleScrap };
}
