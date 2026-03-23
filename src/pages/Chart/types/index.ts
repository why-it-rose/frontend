// ─── 종목 기본 정보 ────────────────────────────────────────────────────────────
export interface StockInfo {
  name: string;
  code: string;
  market: string;
  price: string;
  change: string;
  changePercent: string;
  positive: boolean;
}

// ─── OHLCV 캔들 데이터 ─────────────────────────────────────────────────────────
export interface OhlcBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  event?: {
    label: string;
    positive: boolean;
  };
}

// ─── 핀 ────────────────────────────────────────────────────────────────────────
export interface ChartPin {
  id: string;
  /** bars 배열의 인덱스 (0-based) */
  barIndex: number;
  memo: string;
  color?: string;
}

// ─── 하단 시세 티커 ────────────────────────────────────────────────────────────
export interface TickerItem {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

// ─── OHLC 요약 ─────────────────────────────────────────────────────────────────
export interface OhlcSummary {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// ─── 기간 탭 ───────────────────────────────────────────────────────────────────
export type PeriodTab = "1개월" | "3개월" | "6개월" | "1년";

// ─── 컴포넌트 Props ────────────────────────────────────────────────────────────
export interface StockDetailMainProps {
  stock?: StockInfo;
  bars?: OhlcBar[];
  tickers?: TickerItem[];
  pins?: ChartPin[];
  className?: string;
}

export interface CandlestickChartProps {
  bars: OhlcBar[];
  pins?: ChartPin[];
  onPinClick?: (pin: ChartPin) => void;
  volumeHeight?: number;
}

export interface PeriodTabsProps {
  active: PeriodTab;
  onChange: (period: PeriodTab) => void;
}

export interface OhlcSummaryBarProps {
  summary: OhlcSummary;
}

export interface StockInfoBarProps {
  stock: StockInfo;
  onAddWatchlist?: () => void;
}

export interface TickerBarProps {
  items: TickerItem[];
}