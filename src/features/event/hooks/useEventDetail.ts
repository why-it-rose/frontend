import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { StockEvent } from '../types/event.types';
import { fetchEventDetail } from '../api/eventApi';
import { addEventScrap, fetchMyScraps, removeEventScrap, type ScrapApiError } from '@/features/scrap/api/scrapApi';
import { predictionKeys } from '@/shared/queryKeys';
import { emitScrapSync } from '@/features/scrap/scrapSync';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong.';

export function useEventDetail(eventId: number | null, authSyncKey?: boolean) {
  const queryClient = useQueryClient();
  const [event, setEvent] = useState<StockEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [scrapping, setScrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapError, setScrapError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId === null) {
      setEvent(null);
      setError(null);
      setScrapError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setScrapError(null);

    Promise.all([
      fetchEventDetail(eventId),
      fetchMyScraps().catch(() => []), // 목록 실패해도 상세는 보여주기
    ])
        .then(([detail, scraps]) => {
          const isScrapped = scraps.some((s) => s.eventId === eventId);
          setEvent({ ...detail, isScrapped });
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE);
        })
        .finally(() => setLoading(false));
  }, [eventId, authSyncKey]);

  const toggleScrap = async (targetEventId: number, isScrapped: boolean) => {
    const nextScrapped = !isScrapped;
    const statsQueryKey = predictionKeys.myStats();

    setScrapping(true);
    setScrapError(null);

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
      emitScrapSync({
        eventId: targetEventId,
        isScrapped: nextScrapped,
        delta: nextScrapped ? 1 : -1,
      });
      void queryClient.invalidateQueries({ queryKey: statsQueryKey });
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
