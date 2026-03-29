import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
} from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import type { OhlcBar } from "../types";

const MAIN = "#014d9d";

/** `YYYY.MM.DD` / `YYYY-MM-DD` → `YYYY-MM-DD` (lightweight-charts 일봉 time) */
function barToTimeKey(bar: OhlcBar): string {
  const d = bar.date.trim();
  const m = d.match(/^(\d{4})[.-](\d{2})[.-](\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return d.slice(0, 10);
}

function dedupeSortedByTime(bars: OhlcBar[]): OhlcBar[] {
  const sorted = [...bars].sort((a, b) =>
    barToTimeKey(a).localeCompare(barToTimeKey(b))
  );
  const seen = new Set<string>();
  return sorted.filter((b) => {
    const t = barToTimeKey(b);
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

/** 한 화면에 넣을 최대 봉 수 — 값이 클수록 조금 더 축소(넓은 구간) */
const DEFAULT_VISIBLE_BARS = 120;

function applyZoomedVisibleRange(
  chart: IChartApi,
  barCount: number,
  visibleBars: number
) {
  const ts = chart.timeScale();
  if (barCount <= 1) {
    ts.fitContent();
    return;
  }
  const windowSize = Math.min(visibleBars, barCount);
  if (barCount > windowSize) {
    const from = barCount - windowSize;
    const to = barCount - 1;
    ts.setVisibleLogicalRange({ from, to });
  } else {
    ts.fitContent();
  }
}

export function LightweightCandleChart({
  bars,
  /** 기본 72봉. 일봉이 많을 때 최근 구간만 확대 */
  visibleBars = DEFAULT_VISIBLE_BARS,
}: {
  bars: OhlcBar[];
  visibleBars?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !bars.length) return;

    const clean = dedupeSortedByTime(bars);

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      /** 트랙패드/핀치/휠 스케일 — 기본값이면 충분히 넓게 허용 */
      handleScale: {
        axisPressedMouseMove: { time: true, price: true },
        axisDoubleClickReset: { time: true, price: true },
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#64748b",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#eff1f8" },
        horzLines: { color: "#eff1f8" },
      },
      rightPriceScale: { borderColor: "#eff1f8" },
      timeScale: {
        borderColor: "#eff1f8",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        /** 기본 min/max가 줌 한도를 걸 수 있어, 사실상 제한 없이 */
        barSpacing: 9,
        minBarSpacing: 0.5,
        maxBarSpacing: 1000,
      },
      crosshair: {
        vertLine: { color: `${MAIN}40`, width: 1 },
        horzLine: { color: `${MAIN}40`, width: 1 },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#e03131",
      downColor: "#1971c2",
      borderVisible: false,
      wickUpColor: "#e03131",
      wickDownColor: "#1971c2",
    });

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    candleSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.08, bottom: 0.22 },
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    candleSeries.setData(
      clean.map((b) => ({
        time: barToTimeKey(b),
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    );
    volSeries.setData(
      clean.map((b) => ({
        time: barToTimeKey(b),
        value: b.volume,
        color: b.close >= b.open ? "#fecaca" : "#bfdbfe",
      }))
    );

    applyZoomedVisibleRange(chart, clean.length, visibleBars);

    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      /** 리사이즈마다 가시범위를 다시 잡으면 사용자 줌이 풀림 → 크기만 갱신 */
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [bars, visibleBars]);

  if (!bars.length) {
    return (
      <div className="flex h-full w-full min-h-[200px] items-center justify-center text-sm text-gray-300">
        데이터 없음
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[280px]"
      aria-label="종목 캔들 차트"
    />
  );
}
