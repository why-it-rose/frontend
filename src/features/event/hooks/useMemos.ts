import { useEffect, useState } from 'react';
import type { StockMemo } from '../types/event.types';
import { fetchMemos, createMemo, deleteMemo, updateMemo } from '../api/memoApi';

export function useMemos(eventId: number | null) {
  const [memos, setMemos] = useState<StockMemo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId === null) { setMemos([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMemos(eventId)
      .then((list) => { if (!cancelled) setMemos(Array.isArray(list) ? list : []); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : '오류가 발생했습니다.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  const save = async (content: string) => {
    if (eventId === null) return;
    const created = await createMemo(eventId, content);
    setMemos((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
  };

  const update = async (memoId: number, content: string) => {
    const updated = await updateMemo(memoId, content);
    setMemos((prev) => (Array.isArray(prev) ? prev : []).map((m) => (m.memoId === memoId ? updated : m)));
  };

  const remove = async (memoId: number) => {
    await deleteMemo(memoId);
    setMemos((prev) => (Array.isArray(prev) ? prev : []).filter((m) => m.memoId !== memoId));
  };

  return { memos, loading, error, save, update, remove };
}
