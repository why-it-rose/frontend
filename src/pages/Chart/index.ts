// Types
export type {
  StockInfo,
  OhlcBar,
  TickerItem,
  OhlcSummary,
  PeriodTab,
  StockDetailMainProps,
  CandlestickChartProps,
  PeriodTabsProps,
  OhlcSummaryBarProps,
  StockInfoBarProps,
} from "./types";

// API
export {
//   fetchStockInfo,
//   fetchOhlcData,
//   fetchTickers,
  generateMockBars,
  MOCK_STOCK_INFO,
  MOCK_TICKERS,
} from "./api";
// export type { PeriodParam } from "./api";

// Hooks
export {
  useChartPeriod,
  useOhlcData,
  useOhlcSummary,
  useStockInfo,
  useTickerData,
} from "./hook";

// 원자 컴포넌트
export { CandlestickChart } from "./components/CandlestickChart";
export { StockInfoBar     } from "./components/StockInfoBar";
export { PeriodTabs       } from "./components/PeriodTabs";
export { OhlcSummaryBar   } from "./components/OhlcSummaryBar";

// 조합 컴포넌트 (좌측 패널에 바로 삽입)