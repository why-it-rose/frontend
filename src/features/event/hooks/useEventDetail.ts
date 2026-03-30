import { useCallback, useEffect, useState } from "react";
import {
  fetchEventDetail,
  type EventDetailApiResponse,
} from "../api/eventDetailApi";

type UseEventDetailOptions = {
  enabled?: boolean;
};

export function useEventDetail<T = unknown>(
  eventId: number | null,
  options?: UseEventDetailOptions,
) {
  const [data, setData] = useState<EventDetailApiResponse<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled ?? true;

  const refetch = useCallback(async () => {
    if (eventId === null) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchEventDetail<T>(eventId);
      setData(response);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!enabled || eventId === null) return;
    void refetch();
  }, [enabled, eventId, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
