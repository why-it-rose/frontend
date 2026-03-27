import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "@/shared/constants/routes";
import type { ChartPin, StockDetailMainProps } from "../types";
import {
  useChartPeriod,
  useOhlcData,
  useOhlcSummary,
  useStockInfo,
} from "../hook";
import { CandlestickChart } from "./CandlestickChart";
import { StockInfoBar } from "./StockInfoBar";
import { PeriodTabs } from "./PeriodTabs";
import { OhlcSummaryBar } from "./OhlcSummaryBar";
import { MOCK_STOCK_INFO } from "../api";
import MarketIndexBar from "@/pages/widgets/MarketIndexBar/MarketIndexBar";
import { MOCK_PINS } from "../api/mockData";
import EventTab from "@/features/event/components/EventTab";
import MemoTab from "@/features/event/components/MemoTab";
import type { StockEvent, StockMemo } from "@/features/event/types/event.types";

const MOCK_EVENT: StockEvent = {
  eventId: 1,
  stockCode: "005930",
  stockName: "삼성전자",
  eventType: "SURGE",
  occurredAt: "2025-11-26T09:00:00",
  changeRate: 17.2,
  priceBefore: 125000,
  priceAfter: 146500,
  aiSummary:
    "이 구간에서는 엔비디아 GTC 컨퍼런스 이후 HBM3E 공급 기대감이 급격히 확대되었습니다. 삼성전자의 AI 칩 납품 재개 가능성이 보도되며 외국인 매수세가 집중된 것으로 확인됩니다.",
  relatedNews: [
    {
      newsId: 1,
      title: "외국인, 삼성전자 3일 연속 순매수 2조원 돌파",
      body: "외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.",
      source: "연합인포맥스",
      publishedAt: "2025-11-26T10:00:00",
      url: "#",
      tag: "외국인",
    },
    {
      newsId: 2,
      title: "삼성전자 HBM3E 납품 재개 기대감 확산",
      body: "엔비디아향 HBM3E 공급 재개 가능성이 제기되며 반도체 섹터 전반에 매수세가 유입됐다.",
      source: "한국경제",
      publishedAt: "2025-11-26T11:00:00",
      url: "#",
      tag: "반도체",
    },
  ],
  isScrapped: false,
};

const INITIAL_MEMOS: StockMemo[] = [
  {
    memoId: 1,
    eventType: "SURGE",
    stockName: "삼성전자",
    changeRate: 19.47,
    date: "03.16",
    text: "HBM 납품 기대감으로 외국인 매수세가 강하게 붙은 구간.",
  },
];

/** 목업 `MOCK_PINS` 등 — 초록 이벤트 핀 (`#059669`) */
const GREEN_EVENT_PIN_HEX = "059669";

function isGreenEventPin(pin: ChartPin): boolean {
  const hex = (pin.color ?? "").replace(/^#/, "").trim().toLowerCase();
  return hex === GREEN_EVENT_PIN_HEX;
}

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
  const [mobileTab, setMobileTab] = useState<"차트" | "이벤트" | "메모">(
    "차트",
  );
  const [memos, setMemos] = useState<StockMemo[]>(INITIAL_MEMOS);

  const handleMemoSave = (text: string) => {
    setMemos((prev) => [
      {
        memoId: Date.now(),
        eventType: "SURGE",
        stockName: "삼성전자",
        changeRate: 17.2,
        date: new Date()
          .toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })
          .replace(/\. /g, ".")
          .slice(0, -1),
        text,
      },
      ...prev,
    ]);
  };

  const handleMemoDelete = (memoId: number) => {
    setMemos((prev) => prev.filter((m) => m.memoId !== memoId));
  };
  const { stock: fetchedStock } = useStockInfo(code, useMock);
  const { bars: fetchedBars } = useOhlcData(code, activePeriod, useMock);
  const stock = stockProp ?? fetchedStock ?? MOCK_STOCK_INFO;
  const bars = barsProp ?? fetchedBars;
  const pins = pinsProp ?? (useMock ? MOCK_PINS : []);

  const summary = useOhlcSummary(bars);
  const handlePinClick = (pin: ChartPin) => {
    if (isGreenEventPin(pin)) {
      navigate("/chart/event");
      return;
    }
    onPinClick?.(pin);
  };
  const mobileEventChips = useMemo(() => {
    const chips: { label: string; positive: boolean; date: string }[] = [];
    bars.forEach((bar) => {
      if (!bar.event) return;
      chips.push({
        label: bar.event.label,
        positive: bar.event.positive,
        date: bar.date || "날짜 미정",
      });
    });
    return chips.slice(-3);
  }, [bars]);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6fb] ${className}`}
    >
      {/* 모바일 레이아웃 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:hidden">
        <div className="shrink-0 bg-white px-4 py-2.5">
          <StockInfoBar
            stock={stock}
            onBack={() => navigate(ROUTES.HOME)}
            onAddWatchlist={() => {}}
          />
        </div>

        <div className="grid grid-cols-3 shrink-0 border-b border-[#eff1f8]">
          {(["차트", "이벤트", "메모"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`border-b-2 py-2.5 text-sm font-medium ${
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

        {mobileTab === "차트" && (
          <>
            <div className="scrollbar-hide flex flex-nowrap gap-2 overflow-x-auto border-b border-[#eef2f7] px-4 py-3">
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
                <div className="text-xs text-[#9ca3af]">
                  이벤트 핀 데이터가 없습니다.
                </div>
              )}
            </div>

            <div className="shrink-0 bg-white px-4 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <PeriodTabs active={activePeriod} onChange={setActivePeriod} />
                {summary && <OhlcSummaryBar summary={summary} />}
              </div>
            </div>

            <div className="min-h-0 flex-1 px-1 pb-2 pt-2">
              <CandlestickChart
                bars={bars}
                pins={pins}
                onPinClick={handlePinClick}
              />
            </div>
          </>
        )}

        {mobileTab === "이벤트" && (
          <EventTab
            event={MOCK_EVENT}
            onScrap={(id, s) => console.log(id, s)}
          />
        )}

        {mobileTab === "메모" && (
          <MemoTab
            memos={memos}
            eventInfo={{
              eventType: MOCK_EVENT.eventType,
              stockName: MOCK_EVENT.stockName,
              changeRate: MOCK_EVENT.changeRate,
            }}
            onSave={handleMemoSave}
            onDelete={handleMemoDelete}
          />
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
          <CandlestickChart
            bars={bars}
            pins={pins}
            onPinClick={handlePinClick}
          />
        </main>

        <div className="shrink-0 border-t border-[#eff1f8] bg-[#f9fafc]">
          <MarketIndexBar />
        </div>
      </div>
    </div>
  );
}
