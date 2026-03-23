import { useState, useEffect, useCallback, useMemo } from "react";
import type { OhlcBar, OhlcSummary, PeriodTab, TickerItem, StockInfo } from "../types";
import {
  fetchOhlcData,
  fetchTickers,
  fetchStockInfo,
  generateMockBars,
  MOCK_TICKERS,
  MOCK_STOCK_INFO,
  type PeriodParam,
} from "../api";

// ─── 기간 탭 → API 파라미터 매핑 ───────────────────────────────────────────────
const PERIOD_MAP: Record<PeriodTab, PeriodParam> = {
  "1개월": "1m",
  "3개월": "3m",
  "6개월": "6m",
  "1년":   "1y",
};

// ─── useChartPeriod ─────────────────────────────────────────────────────────────
/** 활성 기간 탭 상태 관리 */
export function useChartPeriod(initial: PeriodTab = "3개월") {
  const [activePeriod, setActivePeriod] = useState<PeriodTab>(initial);
  return { activePeriod, setActivePeriod };
}

// ─── useOhlcData ────────────────────────────────────────────────────────────────
/** OHLCV 데이터 fetch + 목업 폴백 */
export function useOhlcData(
  code: string,
  period: PeriodTab,
  useMock = true
) {
  const [bars, setBars] = useState<OhlcBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = useMock
        ? generateMockBars(100)
        : await fetchOhlcData(code, PERIOD_MAP[period]);
      setBars(data);
    } catch (e) {
      setError((e as Error).message);
      setBars(generateMockBars(100)); // 오류 시 목업으로 폴백
    } finally {
      setLoading(false);
    }
  }, [code, period, useMock]);

  useEffect(() => { load(); }, [load]);

  return { bars, loading, error, refetch: load };
}

// ─── useOhlcSummary ─────────────────────────────────────────────────────────────
/** bars 배열에서 OHLC 요약 계산 (메모이즈) */
export function useOhlcSummary(bars: OhlcBar[]): OhlcSummary | null {
  return useMemo(() => {
    if (!bars.length) return null;
    const last = bars[bars.length - 1];
    const allHighs = bars.map((b) => b.high);
    const allLows  = bars.map((b) => b.low);
    const totalVol = bars.reduce((s, b) => s + b.volume, 0);

    return {
      open:   Math.round(last.open).toLocaleString(),
      high:   Math.round(Math.max(...allHighs)).toLocaleString(),
      low:    Math.round(Math.min(...allLows)).toLocaleString(),
      close:  Math.round(last.close).toLocaleString(),
      volume: (totalVol / 1e8).toFixed(1) + "억",
    };
  }, [bars]);
}

// ─── useStockInfo ───────────────────────────────────────────────────────────────
/** 종목 기본 정보 fetch */
export function useStockInfo(code: string, useMock = true) {
  const [stock, setStock] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const data = useMock ? MOCK_STOCK_INFO : await fetchStockInfo(code);
        if (!cancelled) setStock(data);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setStock(MOCK_STOCK_INFO);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [code, useMock]);

  return { stock, loading, error };
}

// ─── useTickerData ──────────────────────────────────────────────────────────────
/** 하단 시세 티커 fetch */
export function useTickerData(useMock = true) {
  // mock이면 effect 없이 초기값으로 바로 세팅 → 동기 setState 제거
  const [tickers, setTickers] = useState<TickerItem[]>(
    useMock ? MOCK_TICKERS : []
  );

  useEffect(() => {
    if (useMock) return; // mock 모드는 fetch 불필요

    fetchTickers()
      .then(setTickers)
      .catch(() => setTickers(MOCK_TICKERS));
  }, [useMock]);

  return { tickers };
}