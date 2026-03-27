import { useRef, useEffect, useState } from "react";
import type { CandlestickChartProps } from "../types";

const PIN_R      = 6;   // 핀 원 반지름
const PIN_OFFSET = 14;  // 캔들 high 위로 띄우는 거리

export function CandlestickChart({
  bars,
  pins = [],
  onPinClick,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize]           = useState({ width: 900, height: 300 });
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;
  const volH   = Math.round(height * 0.2);
  const chartH = height - volH - 20;

  const PAD_L = 36, PAD_R = 8, PAD_T = 20, PAD_B = 4;

  if (!bars.length) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
        데이터 없음
      </div>
    );
  }

  const allPrices  = bars.flatMap((b) => [b.high, b.low]);
  const minP       = Math.min(...allPrices);
  const maxP       = Math.max(...allPrices);
  const priceRange = maxP - minP || 1;
  const maxVol     = Math.max(...bars.map((b) => b.volume));

  const innerW  = width - PAD_L - PAD_R;
  const innerH  = chartH - PAD_T - PAD_B;
  const barW    = innerW / bars.length;
  const candleW = Math.max(1, barW * 0.6);

  const py = (p: number) => PAD_T + innerH - ((p - minP) / priceRange) * innerH;
  const bx = (i: number) => PAD_L + i * barW + barW / 2;

  const yLabels  = Array.from({ length: 5 }, (_, k) => minP + (priceRange / 4) * k);
  const volBaseY = chartH + 20;
  const maxDateLabels = Math.max(4, Math.floor(innerW / 90));
  const dateLabelStep = Math.max(1, Math.ceil(bars.length / maxDateLabels));
  const shouldShowDateLabel = (barIndex: number) => {
    const isLast = barIndex === bars.length - 1;
    return barIndex % dateLabelStep === 0 || isLast;
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {/* ── Y축 그리드 + 가격 레이블 ── */}
        {yLabels.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L} y1={py(v)} x2={width - PAD_R} y2={py(v)}
              stroke="#e5e9f0" strokeWidth="0.5" strokeDasharray="3 3"
            />
            <text x={PAD_L - 4} y={py(v)}
              textAnchor="end" fontSize="9" fill="#8da0b3" dominantBaseline="middle">
              {Math.round(v / 1000)}k
            </text>
          </g>
        ))}

        {/* ── 캔들스틱 ── */}
        {bars.map((bar, i) => {
          const x       = bx(i);
          const isUp    = bar.close >= bar.open;
          const color   = isUp ? "#e03131" : "#1971c2";
          const bodyTop = py(Math.max(bar.open, bar.close));
          const bodyBot = py(Math.min(bar.open, bar.close));
          const bodyH   = Math.max(1, bodyBot - bodyTop);
          return (
            <g key={i}>
              <line x1={x} y1={py(bar.high)} x2={x} y2={py(bar.low)}
                stroke={color} strokeWidth="0.8" />
              <rect x={x - candleW / 2} y={bodyTop}
                width={candleW} height={bodyH} fill={color} rx="0.5" />
            </g>
          );
        })}

        {/* ── 이벤트 어노테이션 ── */}
        {bars.map((bar, i) => {
          if (!bar.event) return null;
          const x    = bx(i);
          const tipY = py(bar.high) - 18;
          const c    = bar.event.positive ? "#e03131" : "#1971c2";
          const bg   = bar.event.positive ? "#fff0f0" : "#f0f5ff";
          return (
            <g key={`ev-${i}`}>
              <line x1={x} y1={py(bar.high) - 2} x2={x} y2={tipY + 14}
                stroke={c} strokeWidth="0.8" strokeDasharray="2 2" />
              <rect x={x - 18} y={tipY - 10} width={36} height={14}
                rx={3} fill={bg} stroke={c} strokeWidth="0.5" />
              <text x={x} y={tipY - 2}
                textAnchor="middle" fontSize="7" fill={c} fontWeight="600">
                {bar.event.positive ? "▲" : "▼"} {bar.event.label}
              </text>
            </g>
          );
        })}

        {/* ── 핀 ── */}
        {pins.map((pin) => {
          const idx = Math.max(0, Math.min(pin.barIndex, bars.length - 1));
          const bar = bars[idx];
          const x   = bx(idx);
          const c   = pin.color ?? "#f59e0b";

          // 핀 원 중심: 캔들 high 위로 PIN_OFFSET
          const cy       = py(bar.high) - PIN_OFFSET;
          // 줄기: 원 아래 → 캔들 high 바로 위
          const stemTopY = cy + PIN_R;
          const stemBotY = py(bar.high);

          const isHovered = hoveredPin === pin.id;

          // 말풍선
          const maxChars  = 14;
          const label     = pin.memo.length > maxChars ? pin.memo.slice(0, maxChars - 1) + "…" : pin.memo;
          const bubbleW   = label.length * 7 + 16;
          const bubbleH   = 20;
          const bubbleX   = x + bubbleW > width - PAD_R ? x - bubbleW - 4 : x + 4;
          const bubbleY   = cy - bubbleH - 6;

          return (
            <g
              key={pin.id}
              style={{ cursor: "pointer" }}
              onClick={() => onPinClick?.(pin)}
              onMouseEnter={() => setHoveredPin(pin.id)}
              onMouseLeave={() => setHoveredPin(null)}
            >
              {/* 줄기 */}
              <line
                x1={x} y1={stemTopY}
                x2={x} y2={stemBotY}
                stroke={c} strokeWidth="1.2"
              />

              {/* 핀 원 */}
              <circle
                cx={x} cy={cy}
                r={isHovered ? PIN_R + 1 : PIN_R}
                fill={c}
                stroke="white" strokeWidth="1.5"
              />

              {/* 원 안 흰 점 */}
              <circle cx={x} cy={cy} r={1.8} fill="white" />

              {/* 호버 말풍선 */}
              {isHovered && (
                <g>
                  <rect
                    x={bubbleX} y={bubbleY}
                    width={bubbleW} height={bubbleH}
                    rx={4} fill="#1a2236" opacity={0.92}
                  />
                  {/* 꼬리 */}
                  <polygon
                    points={`${x - 4},${bubbleY + bubbleH} ${x + 4},${bubbleY + bubbleH} ${x},${bubbleY + bubbleH + 5}`}
                    fill="#1a2236" opacity={0.92}
                  />
                  <text
                    x={bubbleX + bubbleW / 2}
                    y={bubbleY + bubbleH / 2 + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="9" fill="white" fontWeight="500"
                  >
                    {label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ── 구분선 ── */}
        <line x1={PAD_L} y1={volBaseY - 2} x2={width - PAD_R} y2={volBaseY - 2}
          stroke="#e5e9f0" strokeWidth="0.5" />

        {/* ── X축 날짜 레이블 ── */}
        {bars.map((bar, i) =>
          bar.date && shouldShowDateLabel(i) ? (
            <text key={`d-${i}`} x={bx(i)} y={chartH + 14}
              textAnchor="middle" fontSize="8" fill="#8da0b3">
              {bar.date}
            </text>
          ) : null
        )}

        {/* ── 거래량 바 ── */}
        {bars.map((bar, i) => {
          const x    = bx(i);
          const isUp = bar.close >= bar.open;
          const bh   = (bar.volume / maxVol) * volH;
          return (
            <rect key={`vol-${i}`}
              x={x - candleW / 2} y={volBaseY + volH - bh}
              width={candleW} height={bh}
              fill={isUp ? "#ffa8a8" : "#a5c8f4"}
              rx="0.5" opacity="0.8"
            />
          );
        })}
      </svg>
    </div>
  );
}