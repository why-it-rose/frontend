import { useState, useEffect, useCallback, useMemo } from "react";
import type { OhlcBar, OhlcSummary, PeriodTab, TickerItem, StockInfo } from "../types";
import { fetchTickers, fetchStockInfo, MOCK_TICKERS, MOCK_STOCK_INFO } from "../api";
import { fetchStockDetail, fetchStockPrices } from "@/features/stock/api";
import { mapStockDetailToStockInfo } from "../lib/mapStockDetail";
import type { StockChartPeriod, StockPriceCandleDto } from "@/features/stock/types";

// ─── 기간 탭 → Swagger period ──────────────────────────────────────────────────
const PERIOD_MAP: Record<PeriodTab, StockChartPeriod> = {
  일: "1D",
  주: "1W",
  월: "1M",
  년: "1Y",
};

function candleDtoToBar(c: StockPriceCandleDto): OhlcBar {
  const raw = c.date.trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const display = iso ? `${iso[1]}.${iso[2]}.${iso[3]}` : raw;
  return {
    date: display,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  };
}

// ─── useChartPeriod ─────────────────────────────────────────────────────────────
/** 활성 기간 탭 상태 관리 */
export function useChartPeriod(initial: PeriodTab = "일") {
  const [activePeriod, setActivePeriod] = useState<PeriodTab>(initial);
  return { activePeriod, setActivePeriod };
}

// ─── useOhlcData ────────────────────────────────────────────────────────────────
/**
 * OHLCV — API `GET /api/stocks/{stockId}/prices`만 사용 (목업 없음).
 * `holdEmpty`: 티커→stockId 해석 전에는 캔들 요청 안 함.
 */
export function useOhlcData(
  stockId: number | undefined,
  period: PeriodTab,
  holdEmpty = false
) {
  const [bars, setBars] = useState<OhlcBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (holdEmpty) {
        setBars([]);
        return;
      }
      const hasStock =
        stockId != null && !Number.isNaN(Number(stockId)) && Number(stockId) > 0;
      if (!hasStock) {
        setBars([]);
        return;
      }
      const { candles } = await fetchStockPrices(stockId!, PERIOD_MAP[period]);
      setBars(candles.map(candleDtoToBar));
    } catch (e) {
      setError((e as Error).message);
      setBars([]);
    } finally {
      setLoading(false);
    }
  }, [stockId, period, holdEmpty]);

  useEffect(() => {
    load();
  }, [load]);

  return { bars, loading, error, refetch: load };
}

// ─── useChartStockHeader ───────────────────────────────────────────────────────
const EMPTY_STOCK_INFO: StockInfo = {
  name: "—",
  code: "—",
  market: "—",
  price: "—",
  change: "",
  changePercent: "—",
  positive: true,
};

/** `/chart/:ticker/stock-detail`에서만 API; 그 외 라우트(예: 이벤트 옆 패널)는 빈 칸 */
export function useChartStockHeader(
  stockId: number | undefined,
  tickerLabel: string,
  routeHasTicker: boolean
): { stock: StockInfo } {
  const [info, setInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!routeHasTicker) {
      setInfo(null);
      return;
    }
    if (!stockId || stockId <= 0) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchStockDetail(stockId)
      .then((d) => {
        if (!cancelled) setInfo(mapStockDetailToStockInfo(d));
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stockId, routeHasTicker]);

  const stock = useMemo((): StockInfo => {
    if (!routeHasTicker) return EMPTY_STOCK_INFO;
    if (info) return info;
    const label = tickerLabel || "—";
    if (!stockId || stockId <= 0) {
      return {
        name: label,
        code: label,
        market: "—",
        price: "—",
        change: "",
        changePercent: "—",
        positive: true,
      };
    }
    if (loading) {
      return {
        name: label,
        code: label,
        market: "—",
        price: "—",
        change: "",
        changePercent: "—",
        positive: true,
      };
    }
    return {
      name: label,
      code: label,
      market: "—",
      price: "—",
      change: "",
      changePercent: "—",
      positive: true,
    };
  }, [routeHasTicker, info, tickerLabel, stockId, loading]);

  return { stock };
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