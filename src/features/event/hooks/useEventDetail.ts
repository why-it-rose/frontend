import { useEffect, useState } from 'react';
import type { StockEvent } from '../types/event.types';
import { addEventScrap, fetchEventDetail, removeEventScrap } from '../api/eventApi';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong.';

// 페이지 내 탐색 시 서버가 isScrapped를 못 돌려줘도 상태 유지
const scrapCache = new Map<number, boolean>();

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
      .then((ev) => {
        if (scrapCache.has(ev.eventId)) {
          return { ...ev, isScrapped: scrapCache.get(ev.eventId)! };
        }
        return ev;
      })
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
      scrapCache.set(targetEventId, nextScrapped);
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
