import { useState, useEffect, useCallback, useMemo } from "react";
import type { OhlcBar, OhlcSummary, PeriodTab, TickerItem, StockInfo } from "../types";
import { fetchTickers, fetchStockInfo, MOCK_TICKERS, MOCK_STOCK_INFO } from "../api";
import { fetchStockDetail, fetchStockPrices } from "@/features/stock/api";
import { mapStockDetailToStockInfo } from "../lib/mapStockDetail";
import type { StockChartPeriod, StockPriceCandleDto } from "@/features/stock/types";
import { fetchEvents } from "@/features/event/api/eventApi";
import type { ApiEventItem } from "@/features/event/api/eventApi";
import type { EventPin } from "../types";

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

/** 단일 봉 거래량 표기 (홈 리스트와 유사) */
export function formatChartVolume(value: number): string {
  if (value >= 10_000) {
    const manJu = value / 10_000;
    return `${manJu.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만주`;
  }
  return `${value.toLocaleString("ko-KR")}주`;
}

/** 크로스헤어·요약바용 — 해당 일(봉)의 시고저종·거래량만 반영 */
export function ohlcBarToSummary(bar: OhlcBar): OhlcSummary {
  return {
    open: Math.round(bar.open).toLocaleString("ko-KR"),
    high: Math.round(bar.high).toLocaleString("ko-KR"),
    low: Math.round(bar.low).toLocaleString("ko-KR"),
    close: Math.round(bar.close).toLocaleString("ko-KR"),
    volume: formatChartVolume(bar.volume),
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

// ─── useOhlcDataWithEvents ──────────────────────────────────────────────────────

/** 이벤트를 기간에 맞는 bar.date에 그룹핑 */
function groupEventsByBar(
  events: ApiEventItem[],
  bars: OhlcBar[],
  period: PeriodTab,
): Map<string, EventPin[]> {
  const map = new Map<string, EventPin[]>();

  for (const e of events) {
    const pin: EventPin = {
      label: `${e.changePct > 0 ? "+" : ""}${e.changePct.toFixed(1)}%`,
      positive: e.eventType === "SURGE",
      eventId: e.eventId,
      changePct: e.changePct,
    };

    let barDate: string | undefined;
    const dotDate = e.startDate.replace(/-/g, ".");   // "2024.03.16"

    if (period === "일") {
      barDate = dotDate;
    } else if (period === "월") {
      const monthKey = dotDate.slice(0, 7);           // "2024.03"
      barDate = bars.find((b) => b.date.slice(0, 7) === monthKey)?.date;
    } else if (period === "년") {
      const yearKey = dotDate.slice(0, 4);            // "2024"
      barDate = bars.find((b) => b.date.slice(0, 4) === yearKey)?.date;
    } else if (period === "주") {
      // 이벤트 날짜와 ±6일 이내에서 가장 가까운 봉
      const eventMs = new Date(e.startDate).getTime();
      let bestBar: OhlcBar | undefined;
      let bestDiff = Infinity;
      for (const bar of bars) {
        const barMs = new Date(bar.date.replace(/\./g, "-")).getTime();
        const diff = Math.abs(eventMs - barMs);
        if (diff < bestDiff && diff <= 6 * 86_400_000) {
          bestDiff = diff;
          bestBar = bar;
        }
      }
      barDate = bestBar?.date;
    }

    if (!barDate) continue;
    const existing = map.get(barDate);
    if (existing) existing.push(pin);
    else map.set(barDate, [pin]);
  }

  return map;
}

/**
 * OHLCV + 이벤트 마커를 합친 bars 반환.
 * 기간(period)에 따라 이벤트를 적절한 봉에 그룹핑하고, 여러 이벤트가 같은 봉에 있으면
 * events 배열로 모두 포함 (changePct 절댓값 내림차순).
 */
export function useOhlcDataWithEvents(
  stockId: number | undefined,
  period: PeriodTab,
  holdEmpty = false
) {
  const { bars: rawBars, loading, error, refetch } = useOhlcData(stockId, period, holdEmpty);
  const [mergedBars, setMergedBars] = useState<OhlcBar[]>([]);

  useEffect(() => {
    if (!stockId || holdEmpty || !rawBars.length) {
      setMergedBars(rawBars);
      return;
    }
    let cancelled = false;
    fetchEvents(stockId, undefined, 0, 200)
      .then((events) => {
        if (cancelled) return;
        const grouped = groupEventsByBar(events, rawBars, period);
        setMergedBars(
          rawBars.map((bar) => {
            const evList = grouped.get(bar.date);
            if (!evList?.length) return bar;
            const sorted = [...evList].sort(
              (a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)
            );
            return { ...bar, events: sorted };
          })
        );
      })
      .catch(() => {
        if (!cancelled) setMergedBars(rawBars);
      });
    return () => { cancelled = true; };
  }, [rawBars, stockId, holdEmpty, period]);

  return { bars: mergedBars, loading, error, refetch };
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
/** 가장 최근 봉(배열 마지막) 기준 요약 — 크로스헤어 없을 때 표시 */
export function useOhlcSummary(bars: OhlcBar[]): OhlcSummary | null {
  return useMemo(() => {
    if (!bars.length) return null;
    return ohlcBarToSummary(bars[bars.length - 1]);
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