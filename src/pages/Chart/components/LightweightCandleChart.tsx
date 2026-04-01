import { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
} from "lightweight-charts";
import type { IChartApi, MouseEventParams, Time } from "lightweight-charts";
import type { OhlcBar } from "../types";

const MAIN = "#014d9d";

/** `YYYY.MM.DD` / `YYYY-MM-DD` / 기타 → Date */
function parseBarDate(raw: string): Date {
  const normalized = raw.trim().replace(/\./g, "-").slice(0, 10);
  const [y, m, d] = normalized.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/** Date → `YYYY-MM-DD` */
function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** lightweight-charts time key */
function barToTimeKey(bar: OhlcBar): string {
  return toIsoDate(parseBarDate(bar.date));
}

function startOfWeekMonday(date: Date): Date {
  const day = date.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + diff);
  return new Date(Date.UTC(copy.getUTCFullYear(), copy.getUTCMonth(), copy.getUTCDate()));
}

function getPeriodBucketKey(bar: OhlcBar, period?: string): string {
  const dt = parseBarDate(bar.date);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + 1;

  switch (period) {
    case "년":
      return `${y}`;
    case "월":
      return `${y}-${String(m).padStart(2, "0")}`;
    case "주": {
      const monday = startOfWeekMonday(dt);
      return toIsoDate(monday);
    }
    case "일":
    default:
      return toIsoDate(dt);
  }
}

function getDisplayDateForBucket(period: string | undefined, bucketKey: string): string {
  switch (period) {
    case "년":
      return `${bucketKey}.01.01`;
    case "월":
      return `${bucketKey}.01`;
    case "주":
      return bucketKey.replace(/-/g, ".");
    case "일":
    default:
      return bucketKey.replace(/-/g, ".");
  }
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

function aggregateBarsByPeriod(bars: OhlcBar[], period?: string): OhlcBar[] {
  const sorted = [...bars].sort((a, b) =>
    barToTimeKey(a).localeCompare(barToTimeKey(b)),
  );

  if (period === "일" || !period) {
    return dedupeSortedByTime(sorted);
  }

  const grouped = new Map<string, OhlcBar[]>();

  for (const bar of sorted) {
    const key = getPeriodBucketKey(bar, period);
    const arr = grouped.get(key);
    if (arr) arr.push(bar);
    else grouped.set(key, [bar]);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketKey, items]) => {
      const first = items[0];
      const last = items[items.length - 1];
      const high = Math.max(...items.map((v) => v.high));
      const low = Math.min(...items.map((v) => v.low));
      const volume = items.reduce((sum, v) => sum + (v.volume ?? 0), 0);

      const allEvents = items
        .flatMap((v) => v.events ?? [])
        .sort((a, b) => Math.abs((b.changePct ?? 0)) - Math.abs((a.changePct ?? 0)));

      return {
        ...first,
        date: getDisplayDateForBucket(period, bucketKey),
        open: first.open,
        high,
        low,
        close: last.close,
        volume,
        events: allEvents.length ? allEvents : undefined,
      };
    });
}

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
  visibleBars = DEFAULT_VISIBLE_BARS,
  onHoverBar,
  onEventClick,
  learningPin,
  onLearningPinClick,
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
  activePeriod?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(onHoverBar);
  const eventClickRef = useRef(onEventClick);
  const learningPinClickRef = useRef(onLearningPinClick);
  const focusDateRef = useRef(focusDate);
  const activePeriodRef = useRef<string | undefined>(activePeriod);


  useEffect(() => {
    hoverRef.current = onHoverBar;
    eventClickRef.current = onEventClick;
    learningPinClickRef.current = onLearningPinClick;
    focusDateRef.current = focusDate;
    activePeriodRef.current = activePeriod;
  }, [onHoverBar, onEventClick, onLearningPinClick, focusDate, activePeriod]);

  const processedBars = useMemo(() => {
    return aggregateBarsByPeriod(bars, activePeriod);
  }, [bars, activePeriod]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !processedBars.length) return;

    const clean = dedupeSortedByTime(processedBars);

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
      scaleMargins: { top: 0.08, bottom: 0.32 },
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.87, bottom: 0 },
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

    const fd = focusDateRef.current;
    if (fd) {
      const fdDate = parseBarDate(fd);
      let targetIdx = -1;
      let minDist = Infinity;

      clean.forEach((b, i) => {
        const dist = Math.abs(parseBarDate(b.date).getTime() - fdDate.getTime());
        if (dist < minDist) {
          minDist = dist;
          targetIdx = i;
        }
      });

      if (targetIdx >= 0) {
        const windowSize = Math.min(visibleBars, clean.length);
        const half = Math.floor(windowSize / 2);
        const from = Math.max(0, targetIdx - half);
        const to = Math.min(clean.length - 1, from + windowSize - 1);
        chart.timeScale().setVisibleLogicalRange({ from, to });
      }
    }

    const eventBars = clean.filter((b) => b.events?.length);

    const pinsEl = document.createElement("div");
    pinsEl.style.cssText = [
      "position:absolute",
      "inset:0",
      "pointer-events:none",
      "overflow:hidden",
      "z-index:10",
    ].join(";");
    el.appendChild(pinsEl);

    const expandedDates = new Set<string>();

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

      if (onClick) {
        outer.addEventListener("click", (e) => {
          e.stopPropagation();
          onClick();
        });
      }

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
      // 차트가 렌더링된 후 정확한 pane 너비로 클립 영역 갱신
      pinsEl.style.width = `${chart.paneSize().width}px`;
      for (const b of eventBars) {
        const evList = b.events!;
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
          const hoverArea = document.createElement("div");
          hoverArea.style.cssText = [
            "display:none",
            "flex-direction:column",
            "align-items:center",
            "gap:3px",
            "pointer-events:none",
          ].join(";");

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
                if (ev.eventId != null) {
                  eventClickRef.current?.(ev.eventId, b.date);
                }
              });
              hoverArea.appendChild(bubble);
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
                if (primary.eventId != null) {
                  eventClickRef.current?.(primary.eventId, b.date);
                }
              });
            }
            hoverArea.appendChild(bubble);
          }

          pin.appendChild(hoverArea);

          const head = makePinHead(
            primary.positive,
            multi
              ? () => {
                  if (expandedDates.has(b.date)) expandedDates.delete(b.date);
                  else expandedDates.add(b.date);
                  renderHtmlPins();
                }
              : () => {
                  if (primary.eventId != null) {
                    eventClickRef.current?.(primary.eventId, b.date);
                  }
                },
          );

          head.addEventListener("mouseenter", () => {
            hoverArea.style.display = "flex";
            pin.style.zIndex = "100";
          });
          head.addEventListener("mouseleave", () => {
            hoverArea.style.display = "none";
            pin.style.zIndex = "";
          });

          pin.appendChild(head);
        } else {
          const hoverArea = document.createElement("div");
          hoverArea.style.cssText = [
            "display:none",
            "flex-direction:column",
            "align-items:center",
            "gap:3px",
            "pointer-events:none",
          ].join(";");

          if (period === "년") {
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
            for (const ev of evList) {
              hoverArea.appendChild(
                makeBubble(pctLabel(ev.positive, ev.changePct), ev.positive),
              );
            }
          }

          pin.appendChild(hoverArea);

          const head = makePinHead(primary.positive, () => {
            if (primary.eventId != null) {
              eventClickRef.current?.(primary.eventId, b.date);
            }
          });

          head.addEventListener("mouseenter", () => {
            hoverArea.style.display = "flex";
            pin.style.zIndex = "100";
          });
          head.addEventListener("mouseleave", () => {
            hoverArea.style.display = "none";
            pin.style.zIndex = "";
          });

          pin.appendChild(head);
        }

        pin.appendChild(makeStem(primary.positive));
        pinsEl.appendChild(pin);
      }
    }

    renderHtmlPins();

    const learningPinEl = document.createElement("div");
    learningPinEl.style.cssText = [
      "position:absolute",
      "inset:0",
      "pointer-events:none",
      "overflow:hidden",
      "z-index:11",
    ].join(";");
    el.appendChild(learningPinEl);

    function renderLearningPin() {
      learningPinEl.innerHTML = "";
      if (!learningPin || activePeriodRef.current !== "일") return;

      const targetDate = parseBarDate(learningPin.digestDate);
      let targetBar = clean[clean.length - 1];
      let minDist = Infinity;

      clean.forEach((b) => {
        const dist = Math.abs(parseBarDate(b.date).getTime() - targetDate.getTime());
        if (dist < minDist) {
          minDist = dist;
          targetBar = b;
        }
      });
      
      learningPinEl.style.width = `${chart.paneSize().width}px`;
      if (!el || !learningPin) return;

      if (!targetBar) return;

      const x = chart.timeScale().timeToCoordinate(barToTimeKey(targetBar) as Time);
      if (x === null) return;

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

      const stem = makeStem(false);
      stem.style.background = "#EAB308";
      // 이벤트 핀과 같은 날짜면 스템을 늘려 이벤트 핀 위로 쌓기
      const hasEventPin = eventBars.some(
        (b) => barToTimeKey(b) === barToTimeKey(targetBar),
      );
      if (hasEventPin) {
        const eventPinH = activePeriodRef.current === "일" ? 80 : 50;
        stem.style.height = `${14 + eventPinH + 8}px`;
      }

      const head = (() => {
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

      wrapper.appendChild(head);
      wrapper.appendChild(stem);
      learningPinEl.appendChild(wrapper);
    }

    renderLearningPin();

    function renderAll() {
      renderHtmlPins();
      renderLearningPin();
    }

    chart.timeScale().subscribeVisibleLogicalRangeChange(renderAll);
    // 첫 페인트 후 pane 너비가 확정되면 핀 재렌더 (가격 축 클리핑 정상화)
    const initRafId = window.requestAnimationFrame(renderAll);

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
        events: row?.events,
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
      window.cancelAnimationFrame(initRafId);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(renderAll);
      ro.disconnect();
      chart.remove();
      if (pinsEl.parentNode === el) el.removeChild(pinsEl);
      if (learningPinEl.parentNode === el) el.removeChild(learningPinEl);
    };
  }, [processedBars, visibleBars, learningPin, focusDate, activePeriod]);

  if (!processedBars.length) {
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