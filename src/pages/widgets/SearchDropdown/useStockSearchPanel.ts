import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { fetchStockSearch } from "@/features/stock/api";
import type { StockSearchItemDto } from "@/features/stock/types";
import { toChartStockDetail } from "@/shared/constants/routes";
import {
  DEBOUNCE_MS,
  MAX_RECENT,
  readRecent,
  SEARCH_LIMIT,
  writeRecent,
  type RecentItem,
} from "./searchShared";

type Options = {
  /** 패널이 열려 있을 때만 포커스·동기화 */
  active: boolean;
  /** 종목 선택 후 (패널 닫기 등) */
  onAfterPick?: () => void;
};

export function useStockSearchPanel({ active, onAfterPick }: Options) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [recent, setRecent] = useState<RecentItem[]>(() => readRecent());
  const [results, setResults] = useState<StockSearchItemDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onAfterPickRef = useRef(onAfterPick);
  onAfterPickRef.current = onAfterPick;

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 1) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetchStockSearch(debounced, SEARCH_LIMIT, ac.signal)
      .then((items) => {
        if (!ac.signal.aborted) setResults(items);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("검색에 실패했습니다.");
        setResults([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [debounced]);

  useEffect(() => {
    if (active) {
      setRecent(readRecent());
      inputRef.current?.focus();
    } else {
      setQuery("");
      setDebounced("");
      setResults(null);
      setError(null);
    }
  }, [active]);

  const persistRecent = useCallback((items: RecentItem[]) => {
    writeRecent(items);
    setRecent(items);
  }, []);

  const pushRecent = useCallback(
    (ticker: string, name: string, logoUrl?: string | null) => {
      const next = [
        { ticker, name, logoUrl: logoUrl ?? null },
        ...readRecent().filter((x) => x.ticker !== ticker),
      ].slice(0, MAX_RECENT);
      persistRecent(next);
    },
    [persistRecent]
  );

  const goToStock = useCallback(
    (ticker: string, name: string, logoUrl?: string | null) => {
      pushRecent(ticker, name, logoUrl);
      navigate(toChartStockDetail(ticker));
      onAfterPickRef.current?.();
    },
    [navigate, pushRecent]
  );

  const removeRecent = useCallback(
    (ticker: string) => {
      persistRecent(readRecent().filter((t) => t.ticker !== ticker));
    },
    [persistRecent]
  );

  const goToFirstResult = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const firstLoaded = results?.[0];
    if (firstLoaded) {
      goToStock(firstLoaded.ticker, firstLoaded.name, firstLoaded.logoUrl);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const items = await fetchStockSearch(trimmed, SEARCH_LIMIT);
      setResults(items);
      const first = items[0];
      if (!first) return;
      goToStock(first.ticker, first.name, first.logoUrl);
    } catch {
      setError("검색에 실패했습니다.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, results, goToStock]);

  const showResults = debounced.length >= 1;

  return {
    query,
    setQuery,
    debounced,
    recent,
    results,
    loading,
    error,
    inputRef,
    showResults,
    goToStock,
    goToFirstResult,
    removeRecent,
  };
}
