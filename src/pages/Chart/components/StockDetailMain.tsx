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
import { LearningPin } from "./LearningPin";
import { StockInfoBar } from "./StockInfoBar";
import { PeriodTabs } from "./PeriodTabs";
import { OhlcSummaryBar } from "./OhlcSummaryBar";
import MarketIndexBar from "@/pages/widgets/MarketIndexBar/MarketIndexBar";
import EventTab from "@/features/event/components/EventTab";
import MemoTab from "@/features/event/components/MemoTab";
import StockDetailAside from "@/pages/StockDetail/components/StockDetailaside";
import { useEventDetail } from "@/features/event/hooks/useEventDetail";
import { useMemos } from "@/features/event/hooks/useMemos";
import { useLearningPin } from "@/features/news/hooks/useLearningPin";
import TodayLearningSidebar from "@/features/news/components/TodayLearningSidebar";


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

export interface StockDetailMainAllProps extends StockDetailMainProps {
  /** 티커 폴백 (라우트에 없을 때만) */
  code?: string;
  /** 직접 전달 시 검색 생략 — `GET /api/stocks/{stockId}/prices` */
  stockId?: number;
  useMock?: boolean;
  mobileMode?: "stock-detail" | "event" | "news" | "today-learning";
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
  const { refreshAuth, isLoggedIn } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { stockCode: stockCodeParam } = useParams<{ stockCode?: string }>();
  const [searchParams] = useSearchParams();
  const mobileEventId = useMemo(() => {
    const p = searchParams.get("eventId");
    return p ? Number(p) : null;
  }, [searchParams]);
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
    "차트" | "기업 정보" | "이벤트" | "메모" | "오늘의 뉴스" | "오늘의 학습"
  >(
    mobileMode === "event"
      ? "이벤트"
      : mobileMode === "news"
        ? "오늘의 뉴스"
        : "기업 정보"
  );
  const { data: learningPinData } = useLearningPin(chartStockId);

  const { event: mobileEvent, scrapping: mobileEventScrapping, toggleScrap } = useEventDetail(
    mobileMode === "event" ? mobileEventId : null
  );
  const { memos, save: saveMemo, update: updateMemo, remove: removeMemo } = useMemos(
    mobileMode === "event" ? mobileEventId : null
  );

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
        : learningPinData !== null
          ? (["차트", "기업 정보", "오늘의 학습"] as const)
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

        <div className={`grid shrink-0 border-b border-[#eff1f8] ${mobileTabs.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
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
              {learningPinData !== null && learningPinData !== undefined && (
                <LearningPin
                  data={learningPinData}
                  onClick={() => setMobileTab("오늘의 학습")}
                />
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
                learningPin={learningPinData}
                onLearningPinClick={() => setMobileTab("오늘의 학습")}
              />
            </div>
          </>
        )}

        {mobileTab === "오늘의 학습" && (
          <div className="flex-1 min-h-0">
            <TodayLearningSidebar
              stockId={chartStockId}
              isOpen
              onClose={() => setMobileTab("차트")}
              isLoggedIn={isLoggedIn}
              onLoginRequired={() => setLoginModalOpen(true)}
            />
          </div>
        )}

        {mobileTab === "기업 정보" && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <StockDetailAside hideHeader />
          </div>
        )}

        {mobileTab === "이벤트" && mobileEvent && (
          <EventTab
            event={mobileEvent}
            scrapping={mobileEventScrapping}
            onScrap={toggleScrap}
          />
        )}

        {mobileTab === "메모" && (
          <MemoTab
            memos={memos}
            eventInfo={mobileEvent ? {
              eventType: mobileEvent.eventType,
              stockName: mobileEvent.stockName,
              changeRate: mobileEvent.changeRate,
            } : undefined}
            onSave={saveMemo}
            onUpdate={updateMemo}
            onDelete={removeMemo}
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
            learningPin={learningPinData}
            onLearningPinClick={() => navigate(`/chart/${stockCodeParam ?? ""}/today-learning`)}
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
