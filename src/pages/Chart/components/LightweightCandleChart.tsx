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
    barToTimeKey(a).localeCompare(barToTimeKey(b)),
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
  o: unknown,
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
  visibleBars: number,
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
  /** 이벤트 핀 클릭 시 호출 — eventId + 해당 봉 date(YYYY-MM-DD) 전달 */
  onEventClick,
  /** 오늘의 학습 핀 데이터 — null이면 미표시 */
  learningPin,
  /** 오늘의 학습 핀 클릭 콜백 */
  onLearningPinClick,
  /** 이 날짜(YYYY-MM-DD 또는 YYYY.MM.DD)를 화면 중앙으로 스크롤 */
  focusDate,
  activePeriod,
}: {
  bars: OhlcBar[];
  visibleBars?: number;
  onHoverBar?: (bar: OhlcBar | null) => void;
  onEventClick?: (eventId: number, date: string) => void;
  learningPin?: { digestDate: string; newsCount: number } | null;
  onLearningPinClick?: () => void;
  focusDate?: string;
  /** 현재 기간 탭 — 뷰별 핀/툴팁 동작 분기에 사용 */
  activePeriod?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(onHoverBar);
  hoverRef.current = onHoverBar;
  const eventClickRef = useRef(onEventClick);
  eventClickRef.current = onEventClick;
  const learningPinClickRef = useRef(onLearningPinClick);
  learningPinClickRef.current = onLearningPinClick;
  const focusDateRef = useRef(focusDate);
  focusDateRef.current = focusDate;
  const activePeriodRef = useRef(activePeriod);
  activePeriodRef.current = activePeriod;

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
      })),
    );
    volSeries.setData(
      clean.map((b) => ({
        time: barToTimeKey(b),
        value: b.volume,
        color: b.close >= b.open ? "#fecaca" : "#bfdbfe",
      })),
    );

    applyZoomedVisibleRange(chart, clean.length, visibleBars);

    // focusDate가 있으면 해당 날짜 근처를 화면 중앙으로
    const fd = focusDateRef.current;
    if (fd) {
      const targetKey = fd.replace(/\./g, "-").slice(0, 10);
      let targetIdx = clean.findIndex((b) => barToTimeKey(b) === targetKey);
      if (targetIdx < 0) {
        // 정확한 날짜 없으면 가장 가까운 봉으로
        const targetMs = new Date(targetKey).getTime();
        let minDist = Infinity;
        clean.forEach((b, i) => {
          const dist = Math.abs(new Date(barToTimeKey(b)).getTime() - targetMs);
          if (dist < minDist) {
            minDist = dist;
            targetIdx = i;
          }
        });
      }
      if (targetIdx >= 0) {
        const windowSize = Math.min(visibleBars, clean.length);
        const half = Math.floor(windowSize / 2);
        const from = Math.max(0, targetIdx - half);
        const to = Math.min(clean.length - 1, from + windowSize - 1);
        chart.timeScale().setVisibleLogicalRange({ from, to });
      }
    }

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

    // 펼쳐진 핀의 bar.date를 추적 (일 뷰 멀티 펼침)
    const expandedDates = new Set<string>();

    /** changePct를 부호 포함 퍼센트 문자열로 변환 */
    function pctLabel(positive: boolean, changePct: number): string {
      return `${positive ? "+" : "-"}${Math.abs(changePct).toFixed(1)}%`;
    }

    function makeBubble(label: string, positive: boolean): HTMLDivElement {
      const color = positive ? "#be123c" : "#1d4ed8";
      const bg = positive ? "#fff1f2" : "#eff6ff";
      const border = positive ? "#fecdd3" : "#bfdbfe";
      const div = document.createElement("div");
      div.style.cssText = [
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
      ].join(";");
      div.textContent = `${positive ? "↑" : "↓"} ${label}`;
      return div;
    }

    function makePinHead(
      positive: boolean,
      onClick?: () => void,
    ): HTMLDivElement {
      const ringBg = positive ? "rgba(190,18,60,0.12)" : "rgba(29,78,216,0.12)";
      const innerBg = positive ? "#be123c" : "#1d4ed8";

      const outer = document.createElement("div");
      outer.style.cssText = [
        "width:32px",
        "height:32px",
        "border-radius:50%",
        `background:${ringBg}`,
        "display:flex",
        "align-items:center",
        "justify-content:center",
        onClick ? "cursor:pointer;pointer-events:auto" : "",
      ].join(";");

      const inner = document.createElement("div");
      inner.style.cssText = [
        "width:22px",
        "height:22px",
        "border-radius:50%",
        `background:${innerBg}`,
        "display:flex",
        "align-items:center",
        "justify-content:center",
      ].join(";");

      const arrow = document.createElement("div");
      arrow.style.cssText = positive
        ? "width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:5px solid white;margin-bottom:1px"
        : "width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid white;margin-top:1px";

      inner.appendChild(arrow);
      outer.appendChild(inner);
      if (onClick)
        outer.addEventListener("click", (e) => {
          e.stopPropagation();
          onClick();
        });
      return outer;
    }

    function makeStem(positive: boolean): HTMLDivElement {
      const color = positive ? "#be123c" : "#1d4ed8";
      const div = document.createElement("div");
      div.style.cssText = `width:2px;height:14px;background:${color};border-radius:1px`;
      return div;
    }

    function renderHtmlPins() {
      pinsEl.innerHTML = "";
      for (const b of eventBars) {
        const evList = b.events!; // 이미 changePct 내림차순 정렬
        const primary = evList[0];
        const timeKey = barToTimeKey(b) as Time;
        const x = chart.timeScale().timeToCoordinate(timeKey);
        const y = volSeries.priceToCoordinate(b.volume);
        if (x === null || y === null) continue;

        const period = activePeriodRef.current;
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

        if (period === "일") {
          // ── 일: 캡슐 표시 (클릭 없음), 핀 헤드로 이벤트 이동 ──
          if (multi && isExpanded) {
            for (const ev of evList) {
              const bubble = makeBubble(
                pctLabel(ev.positive, ev.changePct),
                ev.positive,
              );
              bubble.style.pointerEvents = "auto";
              bubble.style.cursor = "pointer";
              bubble.addEventListener("click", (e) => {
                e.stopPropagation();
                if (ev.eventId != null)
                  eventClickRef.current?.(ev.eventId, b.date);
              });
              pin.appendChild(bubble);
            }
          } else {
            const bubble = makeBubble(
              pctLabel(primary.positive, primary.changePct),
              primary.positive,
            );
            if (multi) {
              bubble.textContent = `${primary.positive ? "↑ +" : "↓ -"}${Math.abs(primary.changePct).toFixed(1)}%  +${evList.length - 1}`;
            }
            if (!multi) {
              bubble.style.pointerEvents = "auto";
              bubble.style.cursor = "pointer";
              bubble.addEventListener("click", (e) => {
                e.stopPropagation();
                if (primary.eventId != null)
                  eventClickRef.current?.(primary.eventId, b.date);
              });
            }
            pin.appendChild(bubble);
          }

          // 핀 헤드: 단일이면 이벤트 이동, 멀티이면 펼치기/접기
          const head = makePinHead(
            primary.positive,
            multi
              ? () => {
                  if (expandedDates.has(b.date)) expandedDates.delete(b.date);
                  else expandedDates.add(b.date);
                  renderHtmlPins();
                }
              : () => {
                  if (primary.eventId != null)
                    eventClickRef.current?.(primary.eventId, b.date);
                },
          );
          pin.appendChild(head);
        } else {
          // ── 년/월/주: 핀 헤드만 표시, 호버 시 캡슐 표시 ──

          // 호버 시 표시할 캡슐 컨테이너
          const hoverArea = document.createElement("div");
          hoverArea.style.cssText = [
            "display:none",
            "flex-direction:column",
            "align-items:center",
            "gap:3px",
            "pointer-events:none",
          ].join(";");

          if (period === "년") {
            // n건 — 중립 색상
            const cap = document.createElement("div");
            cap.style.cssText = [
              "background:#f3f4f6",
              "color:#374151",
              "border:1.5px solid #d1d5db",
              "border-radius:9999px",
              "padding:3px 10px",
              "font-size:11px",
              "font-weight:700",
              "white-space:nowrap",
              "line-height:1.5",
              "letter-spacing:-0.2px",
              "box-shadow:0 1px 6px rgba(0,0,0,0.08)",
            ].join(";");
            cap.textContent = `${evList.length}건`;
            hoverArea.appendChild(cap);
          } else if (period === "월") {
            // ↑ n건 / ↓ n건
            const posCount = evList.filter((e) => e.positive).length;
            const negCount = evList.filter((e) => !e.positive).length;
            const cap = document.createElement("div");
            cap.style.cssText = [
              "background:#fff",
              "border:1.5px solid #e5e7eb",
              "border-radius:9999px",
              "padding:3px 10px",
              "font-size:11px",
              "font-weight:700",
              "white-space:nowrap",
              "line-height:1.5",
              "letter-spacing:-0.2px",
              "box-shadow:0 1px 6px rgba(0,0,0,0.08)",
              "display:flex",
              "align-items:center",
              "gap:3px",
            ].join(";");
            const upSpan = document.createElement("span");
            upSpan.style.color = "#be123c";
            upSpan.textContent = `↑ ${posCount}건`;
            const sep = document.createElement("span");
            sep.style.color = "#9ca3af";
            sep.textContent = "/";
            const downSpan = document.createElement("span");
            downSpan.style.color = "#1d4ed8";
            downSpan.textContent = `↓ ${negCount}건`;
            cap.appendChild(upSpan);
            cap.appendChild(sep);
            cap.appendChild(downSpan);
            hoverArea.appendChild(cap);
          } else {
            // 주: ↑ +n.n% / ↓ -n.n% (여러 개 스택)
            for (const ev of evList) {
              hoverArea.appendChild(
                makeBubble(pctLabel(ev.positive, ev.changePct), ev.positive),
              );
            }
          }

          pin.appendChild(hoverArea);

          const head = makePinHead(primary.positive, () => {
            if (primary.eventId != null)
              eventClickRef.current?.(primary.eventId, b.date);
          });
          head.addEventListener("mouseenter", () => {
            hoverArea.style.display = "flex";
          });
          head.addEventListener("mouseleave", () => {
            hoverArea.style.display = "none";
          });
          pin.appendChild(head);
        }

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
      const targetBar =
        clean.find((b) => barToTimeKey(b) === targetKey) ??
        clean[clean.length - 1];
      if (!targetBar) return;

      const x = chart
        .timeScale()
        .timeToCoordinate(barToTimeKey(targetBar) as Time);
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
          "width:32px",
          "height:32px",
          "border-radius:50%",
          "background:rgba(234,179,8,0.15)",
          "display:flex",
          "align-items:center",
          "justify-content:center",
          "cursor:pointer",
          "pointer-events:auto",
        ].join(";");
        const inner = document.createElement("div");
        inner.style.cssText = [
          "width:22px",
          "height:22px",
          "border-radius:50%",
          "background:#EAB308",
          "display:flex",
          "align-items:center",
          "justify-content:center",
        ].join(";");
        const icon = document.createElement("div");
        icon.style.cssText = [
          "width:8px",
          "height:8px",
          "background:white",
          "transform:rotate(45deg)",
          "border-radius:1px",
        ].join(";");
        inner.appendChild(icon);
        outer.appendChild(inner);
        outer.addEventListener("click", (e) => {
          e.stopPropagation();
          learningPinClickRef.current?.();
        });
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
      <div className="flex h-full w-full min-h-50 items-center justify-center text-sm text-gray-300">
        데이터 없음
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-70"
      aria-label="종목 캔들 차트"
    />
  );
}
