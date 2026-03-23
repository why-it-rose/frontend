import type { StockInfo, OhlcBar, TickerItem, ChartPin } from "../types";

// ─── 종목 정보 목업 ────────────────────────────────────────────────────────────
export const MOCK_STOCK_INFO: StockInfo = {
  name:          "삼성전자",
  code:          "005930",
  market:        "KOSPI",
  price:         "184,000원",
  change:        "▼ -3,900",
  changePercent: "-2.08%",
  positive:      false,
};

// ─── 하단 티커 목업 ────────────────────────────────────────────────────────────
export const MOCK_TICKERS: TickerItem[] = [
  { label: "코스닥", value: "1498.36", change: "48.01(1.71%)",  positive: true  },
  { label: "코스피", value: "5487.24", change: "-96.01(1.71%)", positive: false },
  { label: "코스피", value: "5487.24", change: "-96.01(1.71%)", positive: false },
  { label: "코스닥", value: "1498.36", change: "48.01(1.71%)",  positive: true  },
  { label: "코스피", value: "5487.24", change: "-96.01(1.71%)", positive: false },
];

// ─── OHLCV 목업 생성기 ─────────────────────────────────────────────────────────
export function generateMockBars(n = 100): OhlcBar[] {
  const bars: OhlcBar[] = [];
  let base = 52000;
  const labelEvery = Math.floor(n / 9);
  const labels = [
    "2023.1", "2023.4", "2023.7", "2023.10",
    "2024.1", "2024.4", "2024.7", "2024.10",
    "2025.1",
  ];

  for (let i = 0; i < n; i++) {
    const open  = base + (Math.random() - 0.5) * 2000;
    const close = open + (Math.random() - 0.45) * 2400;
    const high  = Math.max(open, close) + Math.random() * 800;
    const low   = Math.min(open, close) - Math.random() * 800;
    const volume = Math.floor(Math.random() * 8_000_000 + 1_000_000);
    base = close;

    const labelIdx = Math.floor(i / labelEvery);
    bars.push({
      date:   i % labelEvery === 0 && labelIdx < labels.length ? labels[labelIdx] : "",
      open, high, low, close, volume,
      ...(i === 20 ? { event: { label: "+17.2%", positive: true  } } : {}),
      ...(i === 45 ? { event: { label: "+12.4%", positive: true  } } : {}),
      ...(i === 80 ? { event: { label: "-8.1%",  positive: false } } : {}),
    });
  }
  return bars;
}

// ─── 핀 목업 ───────────────────────────────────────────────────────────────────
export const MOCK_PINS: ChartPin[] = [
  { id: "pin-1", barIndex: 15, memo: "1분기 실적 발표"  },
  { id: "pin-2", barIndex: 40, memo: "배당 기준일",      color: "#8b5cf6" },
  { id: "pin-3", barIndex: 70, memo: "신제품 출시",      color: "#e03131" },
  { id: "pin-4", barIndex: 88, memo: "외국인 대량 매수", color: "#059669" },
];