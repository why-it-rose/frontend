import { useEffect, useState } from 'react';
import type { StockEvent } from '../types/event.types';
import { fetchEventDetail } from '../api/eventApi';
import { addScrap, removeScrap, type ScrapApiError } from '@/features/scrap/api/scrapApi';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong.';

export function useEventDetail(eventId: number | null) {
  const [event, setEvent] = useState<StockEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [scrapping, setScrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapError, setScrapError] = useState<string | null>(null);

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
    setScrapError(null);

    setEvent((prev) => {
      if (!prev || prev.eventId !== targetEventId) return prev;
      return { ...prev, isScrapped: nextScrapped };
    });

    try {
      if (nextScrapped) {
        await addScrap(targetEventId);
      } else {
        await removeScrap(targetEventId);
      }
    } catch (e: unknown) {
      setEvent((prev) => {
        if (!prev || prev.eventId !== targetEventId) return prev;
        return { ...prev, isScrapped };
      });

      const responseCode = (e as ScrapApiError)?.responseCode;
      if (responseCode === 4023) {
        setScrapError('스크랩은 최대 50개까지 가능합니다.');
      } else {
        setScrapError(e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE);
      }
    } finally {
      setScrapping(false);
    }
  };

  return { event, loading, scrapping, error, scrapError, toggleScrap };
}
