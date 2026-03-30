import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import LoginModal from "@/features/auth/components/LoginModal";
import { useAuth } from "@/features/auth/context/AuthContext";
import { fetchStockSearch } from "@/features/stock/api";
import { useInterestStocksQuery } from "@/features/stock/hooks/useInterestStocks";
import { ROUTES } from "@/shared/constants/routes";
import type { OhlcBar, PeriodTab, StockDetailMainProps } from "../types";
import {
  useChartPeriod,
  useChartStockHeader,
  useOhlcDataWithEvents,
  useOhlcSummary,
  ohlcBarToSummary,
} from "../hook";
import { LightweightCandleChart } from "./LightweightCandleChart";
import { StockInfoBar } from "./StockInfoBar";
import { PeriodTabs } from "./PeriodTabs";
import { OhlcSummaryBar } from "./OhlcSummaryBar";
import MarketIndexBar from "@/pages/widgets/MarketIndexBar/MarketIndexBar";
import EventTab from "@/features/event/components/EventTab";
import MemoTab from "@/features/event/components/MemoTab";
import NewsTab from "@/features/news/components/NewsTab";
import StockDetailAside from "@/pages/StockDetail/components/StockDetailaside";
import type { StockEvent, StockMemo } from "@/features/event/types/event.types";
import type { TodayNews } from "@/features/news/types/news.types";
import { useEventDetail } from "@/features/event/hooks/useEventDetail";
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

/** 기간별로 한 화면에 보일 최대 봉 수(많을수록 조금 더 축소된 느낌) — 봉이 적으면 전체 표시 */
function visibleBarsForPeriod(tab: PeriodTab): number {
  switch (tab) {
    case "일":
      return 120;
    case "주":
      return 102;
    case "월":
      return 72;
    case "년":
      return 32;
    default:
      return 120;
  }
}
const MOCK_NEWS: TodayNews = {
  newsId: 1,
  stockCode: "005930",
  stockName: "삼성전자",
  eventType: "PLUNGE",
  occurredAt: "2026-03-17T09:00:00",
  changeRate: 2.08,
  priceBefore: 188000,
  priceAfter: 184000,
  aiSummary:
    "이 구간에서는 엔비디아 GTC 컨퍼런스 이후 HBM3E 공급 기대감이 급격히 확대되었습니다. 삼성전자의 AI 칩 납품 재개 가능성이 보도되며 외국인 매수세가 집중된 것으로 확인됩니다.",
  relatedNews: [
    { newsId: 1, title: "외국인, 삼성전자 3일 연속 순매수 2조원 돌파", body: "외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.", source: "연합인포맥스", publishedAt: "2026-03-16T10:00:00", url: "#", tag: "외국인" },
    { newsId: 2, title: "외국인, 삼성전자 3일 연속 순매수 2조원 돌파", body: "외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.", source: "연합인포맥스", publishedAt: "2026-03-16T11:00:00", url: "#", tag: "외국인" },
    { newsId: 3, title: "외국인, 삼성전자 3일 연속 순매수 2조원 돌파", body: "외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.", source: "연합인포맥스", publishedAt: "2026-03-16T12:00:00", url: "#", tag: "외국인" },
  ],
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

export interface StockDetailMainAllProps extends StockDetailMainProps {
  /** 티커 폴백 (라우트에 없을 때만) */
  code?: string;
  /** 직접 전달 시 검색 생략 — `GET /api/stocks/{stockId}/prices` */
  stockId?: number;
  useMock?: boolean;
  mobileMode?: "stock-detail" | "event" | "news";
}

export function StockDetailMain({
  stock: stockProp,
  bars: barsProp,
  code,
  stockId,
  className = "",
  mobileMode = "stock-detail",
}: StockDetailMainAllProps) {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { stockCode: stockCodeParam } = useParams<{ stockCode?: string }>();
  const [searchParams] = useSearchParams();
  const { data: interestItems = [] } = useInterestStocksQuery();

  const [resolvedTickerStockId, setResolvedTickerStockId] = useState<number | undefined>(undefined);
  // 검색이 완료된 코드 — stockCodeParam과 다르면 아직 검색 중
  const [searchedCode, setSearchedCode] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (stockId != null || !stockCodeParam) return;

    let cancelled = false;
    fetchStockSearch(stockCodeParam, 20)
      .then((items) => {
        if (cancelled) return;
        const exact = items.find((i) => i.ticker === stockCodeParam) ?? items[0];
        setResolvedTickerStockId(exact?.stockId);
        setSearchedCode(stockCodeParam);
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedTickerStockId(undefined);
          setSearchedCode(stockCodeParam);
        }
      });
    return () => { cancelled = true; };
  }, [stockId, stockCodeParam]);

  // 검색 완료 여부: stockId 직접 제공 / stockCodeParam 없음 / 현재 코드 검색 완료
  const searchSettled = stockId != null || !stockCodeParam || searchedCode === stockCodeParam;
  // stockCodeParam 없으면 stale resolvedTickerStockId 무시
  const chartStockId = stockId ?? (stockCodeParam ? resolvedTickerStockId : undefined);
  const displayCode = stockCodeParam ?? code ?? "";
  const routeHasTicker = Boolean(stockCodeParam);
  const holdEmptyChart = Boolean(stockCodeParam && !stockId && !searchSettled);

  const isInterested = useMemo(
    () =>
      chartStockId != null &&
      chartStockId > 0 &&
      interestItems.some((i) => i.stockId === chartStockId),
    [chartStockId, interestItems]
  );

  const { activePeriod, setActivePeriod } = useChartPeriod("일");
  const [mobileTab, setMobileTab] = useState<
    "차트" | "기업 정보" | "이벤트" | "메모" | "오늘의 뉴스"
  >(
    mobileMode === "event"
      ? "이벤트"
      : mobileMode === "news"
        ? "오늘의 뉴스"
        : "차트"
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

  const handleEventClick = useCallback((eventId: number) => {
    const code = stockCodeParam ?? "";
    navigate(`/chart/${code}/event?eventId=${eventId}`);
  }, [navigate, stockCodeParam]);
  const { stock: fetchedHeader } = useChartStockHeader(
    chartStockId,
    displayCode,
    routeHasTicker
  );
  const { bars: fetchedBars } = useOhlcDataWithEvents(
    chartStockId,
    activePeriod,
    holdEmptyChart
  );
  const stock = stockProp ?? fetchedHeader;
  const bars = barsProp ?? fetchedBars;

  const [hoverBar, setHoverBar] = useState<OhlcBar | null>(null);

  const baseSummary = useOhlcSummary(bars);
  const summary = useMemo(() => {
    if (!baseSummary) return null;
    if (hoverBar && bars.some((b) => b.date === hoverBar.date)) {
      return ohlcBarToSummary(hoverBar);
    }
    return baseSummary;
  }, [baseSummary, hoverBar, bars]);

  const handleHoverBar = useCallback((bar: OhlcBar | null) => {
    setHoverBar(bar);
  }, []);

  const chartVisibleBars = visibleBarsForPeriod(activePeriod);
  const mobileTabs =
    mobileMode === "event"
      ? (["차트", "이벤트", "메모"] as const)
      : mobileMode === "news"
        ? (["차트", "오늘의 뉴스"] as const)
        : (["차트", "기업 정보"] as const);

  const mobileEventChips = useMemo(() => {
    const chips: { label: string; positive: boolean; date: string }[] = [];
    bars.forEach((bar) => {
      if (!bar.events?.length) return;
      // 대표 이벤트(첫 번째 = changePct 최대)만 표시
      const ev = bar.events[0];
      chips.push({ label: ev.label, positive: ev.positive, date: bar.date || "날짜 미정" });
    });
    return chips.slice(-3);
  }, [bars]);

  const queryEventId = useMemo(() => {
    const rawEventId = searchParams.get("eventId");
    if (!rawEventId) return null;
    const parsed = Number(rawEventId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const { event: eventDetailData, error: eventDetailError } = useEventDetail(queryEventId);

  useEffect(() => {
    if (eventDetailData) {
      console.log("eventDetail:", eventDetailData);
    }
    if (eventDetailError) {
      console.error("eventDetail(1) error:", eventDetailError);
    }
  }, [eventDetailData, eventDetailError]);
  
  return (
    <>
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6fb] ${className}`}
    >
      {/* 모바일 레이아웃 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:hidden">
        <div className="shrink-0 bg-white px-4 py-2.5">
          <StockInfoBar
            stock={stock}
            stockId={chartStockId}
            isInterested={isInterested}
            onBack={() => navigate(ROUTES.HOME)}
            onAddWatchlist={() => {}}
            onRequireLogin={() => setLoginModalOpen(true)}
          />
        </div>

        <div className={`grid shrink-0 border-b border-[#eff1f8] ${mobileMode === "event" ? "grid-cols-3" : "grid-cols-2"}`}>
          {mobileTabs.map((tab) => (
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
              <LightweightCandleChart
                bars={bars}
                visibleBars={chartVisibleBars}
                onHoverBar={handleHoverBar}
                onEventClick={handleEventClick}
              />
            </div>
          </>
        )}

        {mobileTab === "오늘의 뉴스" && <NewsTab news={MOCK_NEWS} />}

        {mobileTab === "기업 정보" && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <StockDetailAside hideHeader />
          </div>
        )}

        {mobileTab === "이벤트" && (
          <EventTab
            event={eventDetailData ?? MOCK_EVENT}
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
            stockId={chartStockId}
            isInterested={isInterested}
            onBack={() => navigate(ROUTES.HOME)}
            onAddWatchlist={() => {}}
            onRequireLogin={() => setLoginModalOpen(true)}
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eff1f8] pt-2.5">
            <PeriodTabs active={activePeriod} onChange={setActivePeriod} />
            {summary && <OhlcSummaryBar summary={summary} />}
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-hidden border-t border-[#eff1f8] bg-white">
          <LightweightCandleChart
            bars={bars}
            visibleBars={chartVisibleBars}
            onHoverBar={handleHoverBar}
            onEventClick={handleEventClick}
          />
        </main>

        <div className="shrink-0 border-t border-[#eff1f8] bg-[#f9fafc]">
          <MarketIndexBar />
        </div>
      </div>
    </div>
    {loginModalOpen && (
      <LoginModal
        onClose={() => setLoginModalOpen(false)}
        onSignup={() => {
          setLoginModalOpen(false);
          navigate("/signup");
        }}
        onLoginSuccess={async () => {
          await refreshAuth();
          setLoginModalOpen(false);
        }}
      />
    )}
    </>
  );
}
