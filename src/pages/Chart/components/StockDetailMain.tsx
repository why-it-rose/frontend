import type { StockDetailMainProps } from "../types";
import { useChartPeriod, useOhlcData, useOhlcSummary, useStockInfo, useTickerData } from "../hook";
import { CandlestickChart } from "./CandlestickChart";
import { StockInfoBar } from "./StockInfoBar";
import { PeriodTabs } from "./PeriodTabs";
import { OhlcSummaryBar } from "./OhlcSummaryBar";
import { MOCK_STOCK_INFO, MOCK_TICKERS } from "../api";
import MarketIndexBar from "@/pages/widgets/MarketIndexBar/MarketIndexBar";
import { MOCK_PINS } from "../api/mockData";
export interface StockDetailMainAllProps extends StockDetailMainProps {
  code?: string;
  useMock?: boolean;
}

export function StockDetailMain({
  stock: stockProp,
  bars: barsProp,
  tickers: tickersProp,
  pins: pinsProp,
  code = "005930",
  useMock = true,
  className = "",
}: StockDetailMainAllProps) {
  const { activePeriod, setActivePeriod } = useChartPeriod("3개월");
  const { stock: fetchedStock }           = useStockInfo(code, useMock);
  const { bars: fetchedBars }             = useOhlcData(code, activePeriod, useMock);
  const { tickers: fetchedTickers }       = useTickerData(useMock);

  const stock   = stockProp   ?? fetchedStock   ?? MOCK_STOCK_INFO;
  const bars    = barsProp    ?? fetchedBars;
  const tickers = tickersProp ?? fetchedTickers ?? MOCK_TICKERS;
  const pins    = pinsProp    ?? (useMock ? MOCK_PINS : []);

  const summary = useOhlcSummary(bars);

  return (
    <div className={`flex flex-col h-full bg-white overflow-hidden ${className}`}>

      {/* 종목 정보 헤더 */}
      <div className="shrink-0">
        <StockInfoBar stock={stock} />
      </div>

      {/* 기간 탭 + OHLC 요약 */}
      <div className="shrink-0 border-b border-gray-100 px-4 flex items-center justify-between gap-3 h-[44px]">
        <PeriodTabs active={activePeriod} onChange={setActivePeriod} />
        {summary && <OhlcSummaryBar summary={summary} />}
      </div>

      {/* 캔들스틱 차트 — flex-1로 나머지 높이 전부 차지 */}
      <div className="flex-1 min-h-0 w-full">
        <CandlestickChart bars={bars} pins={pins} />
      </div>

      {/* 하단 시세 티커 */}
      <div className="shrink-0">
        <MarketIndexBar />
      </div>

    </div>
  );
}