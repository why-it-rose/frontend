import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
} from "lightweight-charts";
import type { IChartApi, MouseEventParams, Time } from "lightweight-charts";
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

function timeToIsoDateKey(t: Time): string | null {
  if (typeof t === "string") return t.slice(0, 10);
  if (typeof t === "number") {
    const d = new Date(t * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  if (typeof t === "object" && t !== null && "year" in t) {
    const b = t as { year: number; month: number; day: number };
    return `${b.year}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;
  }
  return null;
}

function formatHoverDateTimeLabel(t: Time): string {
  const key = timeToIsoDateKey(t);
  if (!key) return "";
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return key;
  return `${m[1]}년 ${m[2]}월 ${m[3]}일`;
}

function isCandlePoint(
  o: unknown
): o is { open: number; high: number; low: number; close: number } {
  return (
    typeof o === "object" &&
    o !== null &&
    "open" in o &&
    typeof (o as { open: unknown }).open === "number"
  );
}

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
  /** 기본 120봉. 일봉이 많을 때 최근 구간만 확대 */
  visibleBars = DEFAULT_VISIBLE_BARS,
  /** 크로스헤어가 올라간 봉 — 마우스가 차트 밖이면 `null` */
  onHoverBar,
  /** 이벤트 핀 클릭 시 호출 — eventId 전달 */
  onEventClick,
  /** 오늘의 학습 핀 데이터 — null이면 미표시 */
  learningPin,
  /** 오늘의 학습 핀 클릭 콜백 */
  onLearningPinClick,
}: {
  bars: OhlcBar[];
  visibleBars?: number;
  onHoverBar?: (bar: OhlcBar | null) => void;
  onEventClick?: (eventId: number) => void;
  learningPin?: { digestDate: string; newsCount: number } | null;
  onLearningPinClick?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(onHoverBar);
  hoverRef.current = onHoverBar;
  const eventClickRef = useRef(onEventClick);
  eventClickRef.current = onEventClick;
  const learningPinClickRef = useRef(onLearningPinClick);
  learningPinClickRef.current = onLearningPinClick;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !bars.length) return;

    const clean = dedupeSortedByTime(bars);

    // overlay가 차트 위에 겹치도록 부모를 relative로
    el.style.position = "relative";

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
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
        attributionLogo: false,
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
        barSpacing: 9,
        minBarSpacing: 0.5,
        maxBarSpacing: 1000,
      },
      crosshair: {
        vertLine: { color: `${MAIN}40`, width: 1 },
        horzLine: { color: `${MAIN}40`, width: 1 },
      },
      localization: {
        timeFormatter: (time: Time) => formatHoverDateTimeLabel(time),
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

    // ─── HTML 오버레이 핀 (거래량 막대 위) ──────────────────────────────────
    const eventBars = clean.filter((b) => b.events?.length);

    const pinsEl = document.createElement("div");
    pinsEl.style.cssText = [
      "position:absolute",
      "inset:0",
      "pointer-events:none",
      "overflow:visible",
      "z-index:10",
    ].join(";");
    el.appendChild(pinsEl);

    // 펼쳐진 핀의 bar.date를 추적
    const expandedDates = new Set<string>();

    function makeBubble(
      label: string,
      positive: boolean,
      onClick?: () => void,
    ): HTMLDivElement {
      const color      = positive ? "#be123c" : "#1d4ed8";
      const bg         = positive ? "#fff1f2" : "#eff6ff";
      const border     = positive ? "#fecdd3" : "#bfdbfe";
      const el = document.createElement("div");
      el.style.cssText = [
        `background:${bg}`,
        `color:${color}`,
        `border:1.5px solid ${border}`,
        "border-radius:9999px",
        "padding:3px 10px",
        "font-size:11px",
        "font-weight:700",
        "white-space:nowrap",
        "line-height:1.5",
        "letter-spacing:-0.2px",
        "box-shadow:0 1px 6px rgba(0,0,0,0.08)",
        onClick ? "cursor:pointer;pointer-events:auto" : "",
      ].join(";");
      el.textContent = `${positive ? "↑" : "↓"} ${label}`;
      if (onClick) el.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
      return el;
    }

    function makePinHead(positive: boolean, onClick?: () => void): HTMLDivElement {
      const ringBg  = positive ? "rgba(190,18,60,0.12)" : "rgba(29,78,216,0.12)";
      const innerBg = positive ? "#be123c" : "#1d4ed8";

      const outer = document.createElement("div");
      outer.style.cssText = [
        "width:32px", "height:32px", "border-radius:50%",
        `background:${ringBg}`,
        "display:flex", "align-items:center", "justify-content:center",
        onClick ? "cursor:pointer;pointer-events:auto" : "",
      ].join(";");

      const inner = document.createElement("div");
      inner.style.cssText = [
        "width:22px", "height:22px", "border-radius:50%",
        `background:${innerBg}`,
        "display:flex", "align-items:center", "justify-content:center",
      ].join(";");

      const arrow = document.createElement("div");
      arrow.style.cssText = positive
        ? "width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:5px solid white;margin-bottom:1px"
        : "width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid white;margin-top:1px";

      inner.appendChild(arrow);
      outer.appendChild(inner);
      if (onClick) outer.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
      return outer;
    }

    function makeStem(positive: boolean): HTMLDivElement {
      const color = positive ? "#be123c" : "#1d4ed8";
      const el = document.createElement("div");
      el.style.cssText = `width:2px;height:14px;background:${color};border-radius:1px`;
      return el;
    }

    function renderHtmlPins() {
      pinsEl.innerHTML = "";
      for (const b of eventBars) {
        const evList = b.events!;        // 이미 changePct 내림차순 정렬
        const primary = evList[0];
        const timeKey = barToTimeKey(b) as Time;
        const x = chart.timeScale().timeToCoordinate(timeKey);
        const y = volSeries.priceToCoordinate(b.volume);
        if (x === null || y === null) continue;

        const isExpanded = expandedDates.has(b.date);
        const multi = evList.length > 1;

        const pin = document.createElement("div");
        pin.style.cssText = [
          "position:absolute",
          `left:${x}px`,
          `top:${y}px`,
          "transform:translate(-50%,-100%)",
          "display:flex",
          "flex-direction:column",
          "align-items:center",
          "gap:4px",
          "pointer-events:none",
        ].join(";");

        if (multi && isExpanded) {
          // ── 펼쳐진 상태: 모든 이벤트 라벨을 위에서부터 나열 ──
          for (const ev of evList) {
            const bubble = makeBubble(ev.label, ev.positive, () => {
              if (ev.eventId != null) eventClickRef.current?.(ev.eventId);
            });
            pin.appendChild(bubble);
          }
        } else {
          // ── 접힌 상태: primary 라벨 (+ 추가 개수 배지) ──
          const labelText = multi
            ? `${primary.positive ? "↑" : "↓"} ${primary.label}  +${evList.length - 1}`
            : undefined;
          const bubble = makeBubble(
            labelText ?? primary.label,
            primary.positive,
            multi
              ? undefined           // 헤드 클릭으로 토글, 버블 자체 클릭은 없음
              : () => { if (primary.eventId != null) eventClickRef.current?.(primary.eventId); },
          );
          if (multi) {
            // 멀티일 때 버블 텍스트 직접 설정 (접두 화살표 중복 방지)
            const color  = primary.positive ? "#be123c" : "#1d4ed8";
            const bg     = primary.positive ? "#fff1f2" : "#eff6ff";
            const border = primary.positive ? "#fecdd3" : "#bfdbfe";
            bubble.style.cssText = [
              `background:${bg}`, `color:${color}`,
              `border:1.5px solid ${border}`,
              "border-radius:9999px", "padding:3px 10px",
              "font-size:11px", "font-weight:700",
              "white-space:nowrap", "line-height:1.5",
              "letter-spacing:-0.2px",
              "box-shadow:0 1px 6px rgba(0,0,0,0.08)",
            ].join(";");
            bubble.textContent = `${primary.positive ? "↑" : "↓"} ${primary.label}  +${evList.length - 1}`;
          }
          pin.appendChild(bubble);
        }

        // 핀 헤드 — 멀티이면 클릭 시 펼치기/접기
        const head = makePinHead(
          primary.positive,
          multi
            ? () => {
                if (expandedDates.has(b.date)) expandedDates.delete(b.date);
                else expandedDates.add(b.date);
                renderHtmlPins();
              }
            : undefined,
        );
        pin.appendChild(head);
        pin.appendChild(makeStem(primary.positive));

        pinsEl.appendChild(pin);
      }
    }

    renderHtmlPins();

    // ─── 오늘의 학습 핀 (마름모) ────────────────────────────────────────────
    const learningPinEl = document.createElement("div");
    learningPinEl.style.cssText = [
      "position:absolute",
      "inset:0",
      "pointer-events:none",
      "overflow:visible",
      "z-index:11",
    ].join(";");
    el.appendChild(learningPinEl);

    function renderLearningPin() {
      learningPinEl.innerHTML = "";
      if (!el || !learningPin) return;

      // digestDate("yyyy-MM-dd")를 bars에서 찾고, 없으면 마지막 봉 사용
      const targetKey = learningPin.digestDate.slice(0, 10); // "yyyy-MM-dd"
      const targetBar = clean.find((b) => barToTimeKey(b) === targetKey) ?? clean[clean.length - 1];
      if (!targetBar) return;

      const x = chart.timeScale().timeToCoordinate(barToTimeKey(targetBar) as Time);
      if (x === null) return;

      // 이벤트 핀과 동일하게 거래량 바 상단 좌표 기준
      const y = volSeries.priceToCoordinate(targetBar.volume);
      if (y === null) return;

      const wrapper = document.createElement("div");
      wrapper.style.cssText = [
        "position:absolute",
        `left:${x}px`,
        `top:${y}px`,
        "transform:translate(-50%, -100%)",
        "display:flex",
        "flex-direction:column",
        "align-items:center",
        "gap:3px",
        "pointer-events:none",
      ].join(";");

      // 줄기
      const stem = makeStem(false);
      stem.style.background = "#EAB308";

      // 핀 헤드 — 노란색
      const head = ((): HTMLDivElement => {
        const outer = document.createElement("div");
        outer.style.cssText = [
          "width:32px", "height:32px", "border-radius:50%",
          "background:rgba(234,179,8,0.15)",
          "display:flex", "align-items:center", "justify-content:center",
          "cursor:pointer", "pointer-events:auto",
        ].join(";");
        const inner = document.createElement("div");
        inner.style.cssText = [
          "width:22px", "height:22px", "border-radius:50%",
          "background:#EAB308",
          "display:flex", "align-items:center", "justify-content:center",
        ].join(";");
        const icon = document.createElement("div");
        icon.style.cssText = [
          "width:8px", "height:8px",
          "background:white",
          "transform:rotate(45deg)",
          "border-radius:1px",
        ].join(";");
        inner.appendChild(icon);
        outer.appendChild(inner);
        outer.addEventListener("click", (e) => { e.stopPropagation(); learningPinClickRef.current?.(); });
        return outer;
      })();
      wrapper.appendChild(stem);
      wrapper.appendChild(head);
      learningPinEl.appendChild(wrapper);
    }

    renderLearningPin();

    function renderAll() {
      renderHtmlPins();
      renderLearningPin();
    }
    chart.timeScale().subscribeVisibleLogicalRangeChange(renderAll);

    // ─── 크로스헤어 ──────────────────────────────────────────────────────────
    const crosshairHandler = (param: MouseEventParams) => {
      const cb = hoverRef.current;
      if (!cb) return;
      if (
        param.time === undefined ||
        param.point === undefined ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        cb(null);
        return;
      }
      const candle = param.seriesData.get(candleSeries);
      if (!isCandlePoint(candle)) {
        cb(null);
        return;
      }
      const key = timeToIsoDateKey(param.time);
      if (!key) {
        cb(null);
        return;
      }
      const row = clean.find((b) => barToTimeKey(b) === key);
      const hist = param.seriesData.get(volSeries);
      let volume = row?.volume ?? 0;
      if (
        hist &&
        typeof hist === "object" &&
        "value" in hist &&
        typeof (hist as { value: unknown }).value === "number"
      ) {
        volume = (hist as { value: number }).value;
      }
      const displayDate = row?.date ?? key.replace(/-/g, ".");
      cb({
        date: displayDate,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume,
      });
    };
    chart.subscribeCrosshairMove(crosshairHandler);

    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      chart.applyOptions({ width: w, height: h });
      renderHtmlPins();
      renderLearningPin();
    });
    ro.observe(el);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(renderAll);
      ro.disconnect();
      chart.remove();
      if (pinsEl.parentNode === el) el.removeChild(pinsEl);
      if (learningPinEl.parentNode === el) el.removeChild(learningPinEl);
    };
  }, [bars, visibleBars, learningPin]);

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
