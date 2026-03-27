import type { OhlcBar, TickerItem, StockInfo } from "../types";

// ─── 엔드포인트 상수 ────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:4000";

// ─── 종목 기본 정보 조회 ────────────────────────────────────────────────────────
export async function fetchStockInfo(code: string): Promise<StockInfo> {
  const res = await fetch(`${BASE_URL}/api/stocks/${code}/info`);
  if (!res.ok) throw new Error(`fetchStockInfo failed: ${res.status}`);
  return res.json();
}

// ─── OHLCV 데이터 조회 ─────────────────────────────────────────────────────────
export type PeriodParam = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export async function fetchOhlcData(
  code: string,
  period: PeriodParam
): Promise<OhlcBar[]> {
  const res = await fetch(
    `${BASE_URL}/api/stocks/${code}/ohlc?period=${period}`
  );
  if (!res.ok) throw new Error(`fetchOhlcData failed: ${res.status}`);
  return res.json();
}

// ─── 하단 시세 티커 조회 ────────────────────────────────────────────────────────
export async function fetchTickers(): Promise<TickerItem[]> {
  const res = await fetch(`${BASE_URL}/api/market/tickers`);
  if (!res.ok) throw new Error(`fetchTickers failed: ${res.status}`);
  return res.json();
}

// ─── 목업 데이터 (개발/테스트용) ───────────────────────────────────────────────
export function generateMockBars(n = 100): OhlcBar[] {
  const bars: OhlcBar[] = [];
  let base = 52000;
  const startDate = new Date(2024, 0, 1);

  for (let i = 0; i < n; i++) {
    const open = base + (Math.random() - 0.5) * 2000;
    const close = open + (Math.random() - 0.45) * 2400;
    const high = Math.max(open, close) + Math.random() * 800;
    const low = Math.min(open, close) - Math.random() * 800;
    const volume = Math.floor(Math.random() * 8_000_000 + 1_000_000);
    base = close;

    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i * 3);
    const yyyy = String(currentDate.getFullYear());
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const eventDate = `${yyyy}.${mm}.${dd}`;
    bars.push({
      date: eventDate,
      open, high, low, close, volume,
      ...(i === 20 ? { event: { label: "+17.2%", positive: true } } : {}),
      ...(i === 45 ? { event: { label: "+12.4%", positive: true } } : {}),
      ...(i === 80 ? { event: { label: "-8.1%",  positive: false } } : {}),
    });
  }
  return bars;
}

export const MOCK_STOCK_INFO: StockInfo = {
  name: "삼성전자",
  code: "005930",
  market: "KOSPI",
  price: "184,000원",
  change: "▼ -3,900",
  changePercent: "-2.08%",
  positive: false,
};

export const MOCK_TICKERS: TickerItem[] = [
  { label: "코스닥", value: "1498.36", change: "48.01(1.71%)",   positive: true  },
  { label: "코스피", value: "5487.24", change: "-96.01(1.71%)",  positive: false },
  { label: "코스피", value: "5487.24", change: "-96.01(1.71%)",  positive: false },
  { label: "코스닥", value: "1498.36", change: "48.01(1.71%)",   positive: true  },
  { label: "코스피", value: "5487.24", change: "-96.01(1.71%)",  positive: false },
];