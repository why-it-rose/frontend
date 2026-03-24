import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "@/shared/constants/routes";
import type { StockDetailMainProps } from "../types";
import { useChartPeriod, useOhlcData, useOhlcSummary, useStockInfo } from "../hook";
import { CandlestickChart } from "./CandlestickChart";
import { StockInfoBar } from "./StockInfoBar";
import { PeriodTabs } from "./PeriodTabs";
import { OhlcSummaryBar } from "./OhlcSummaryBar";
import { MOCK_STOCK_INFO } from "../api";
import MarketIndexBar from "@/pages/widgets/MarketIndexBar/MarketIndexBar";
import { MOCK_PINS } from "../api/mockData";

export interface StockDetailMainAllProps extends StockDetailMainProps {
  code?: string;
  useMock?: boolean;
}

export function StockDetailMain({
  stock: stockProp,
  bars: barsProp,
  pins: pinsProp,
  onPinClick,
  code = "005930",
  useMock = true,
  className = "",
}: StockDetailMainAllProps) {
  const navigate = useNavigate();
  const { activePeriod, setActivePeriod } = useChartPeriod("월");
  const [mobileTab, setMobileTab] = useState<"차트" | "이벤트" | "메모">("차트");
  const { stock: fetchedStock } = useStockInfo(code, useMock);
  const { bars: fetchedBars } = useOhlcData(code, activePeriod, useMock);
  const stock = stockProp ?? fetchedStock ?? MOCK_STOCK_INFO;
  const bars = barsProp ?? fetchedBars;
  const pins = pinsProp ?? (useMock ? MOCK_PINS : []);

  const summary = useOhlcSummary(bars);
  const mobileEventChips = useMemo(() => {
    const chips: { label: string; positive: boolean; date: string }[] = [];
    bars.forEach((bar) => {
      if (!bar.event) return;
      chips.push({
        label: bar.event.label,
        positive: bar.event.positive,
        date: "최근",
      });
    });
    return chips.slice(-3);
  }, [bars]);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6fb] ${className}`}
    >
      {/* 모바일 레이아웃 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white md:hidden">
        <div className="shrink-0 bg-white px-4 py-2.5">
          <StockInfoBar
            stock={stock}
            onBack={() => navigate(ROUTES.HOME)}
            onAddWatchlist={() => {}}
          />
        </div>

        <div className="grid grid-cols-3 border-b border-[#e5e7eb]">
          {(["차트", "이벤트", "메모"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`border-b-2 py-3 text-sm font-medium ${
                mobileTab === tab
                  ? "border-[#014d9d] text-[#014d9d]"
                  : "border-transparent text-[#9ca3af]"
              }`}
              onClick={() => setMobileTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="scrollbar-subtle flex gap-2 overflow-x-auto border-b border-[#eef2f7] px-4 py-3">
          {mobileEventChips.length > 0 ? (
            mobileEventChips.map((chip, idx) => (
              <div
                key={`${chip.label}-${idx}`}
                className={`shrink-0 rounded-2xl border px-3 py-1.5 text-xs font-medium ${
                  chip.positive
                    ? "border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]"
                    : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                }`}
              >
                {chip.positive ? "↑" : "↓"} {chip.label} · {chip.date}
              </div>
            ))
          ) : (
            <div className="text-xs text-[#9ca3af]">이벤트 핀 데이터가 없습니다.</div>
          )}
        </div>

        <div className="shrink-0 bg-white px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PeriodTabs active={activePeriod} onChange={setActivePeriod} />
            {summary && <OhlcSummaryBar summary={summary} />}
          </div>
        </div>

        {mobileTab === "차트" ? (
          <div className="h-[360px] px-1 pb-2 pt-2">
            <CandlestickChart bars={bars} pins={pins} onPinClick={onPinClick} />
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-[#9ca3af]">
            {mobileTab} 탭은 추후 연동 예정입니다.
          </div>
        )}
      </div>

      {/* 데스크톱 레이아웃 */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        <div className="shrink-0 bg-white px-5 py-2.5">
          <StockInfoBar
            stock={stock}
            onBack={() => navigate(ROUTES.HOME)}
            onAddWatchlist={() => {}}
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eff1f8] pt-2.5">
            <PeriodTabs active={activePeriod} onChange={setActivePeriod} />
            {summary && <OhlcSummaryBar summary={summary} />}
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-hidden border-t border-[#eff1f8] bg-white">
          <CandlestickChart bars={bars} pins={pins} onPinClick={onPinClick} />
        </main>

        <div className="shrink-0 border-t border-[#eff1f8] bg-[#f9fafc]">
          <MarketIndexBar />
        </div>
      </div>
    </div>
  );
}
