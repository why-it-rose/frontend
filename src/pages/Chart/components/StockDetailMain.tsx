import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import LoginModal from "@/features/auth/components/LoginModal";
import { useAuth } from "@/features/auth/context/AuthContext";
import { invalidateAuthTransitionQueries } from "@/features/auth/query/authQuerySync";
import {
  fetchStockDetail,
  fetchStockPrices,
  getCachedStockIdByTicker,
  resolveStockIdByTicker,
} from "@/features/stock/api";
import { fetchEvents } from "@/features/event/api/eventApi";
import { useInterestStocksQuery } from "@/features/stock/hooks/useInterestStocks";
import { ROUTES } from "@/shared/constants/routes";
import { stockEventKeys } from "@/shared/queryKeys";

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
import StockDetailAside from "@/pages/StockDetail/components/StockDetailaside";
import { useEventDetail } from "@/features/event/hooks/useEventDetail";
import { useMemos } from "@/features/event/hooks/useMemos";
import { useLearningPin } from "@/features/news/hooks/useLearningPin";
import {
  sharedEventPanelTab,
  pendingMobileNav,
  requestResponsiveRouteNavigation,
} from "@/features/event/sharedEventPanelTab";
import TodayLearningSidebar from "@/features/news/components/TodayLearningSidebar";

/** 기간별로 한 화면에 보일 최대 봉 수(많을수록 조금 더 축소된 느낌) — 봉이 적으면 전체 표시 */
const PERIOD_ORDER = ["년", "월", "주", "일"] as const;

function visibleBarsForPeriod(tab: PeriodTab): number {
  switch (tab) {
    case "일":
      return 80;
    case "주":
      return 50;
    case "월":
      return 40;
    case "년":
      return 28;
    default:
      return 80;
  }
}

function visibleBarsForPeriodMobile(tab: PeriodTab): number {
  switch (tab) {
    case "일":
      return 16;
    case "주":
      return 12;
    case "월":
      return 10;
    case "년":
      return 7;
    default:
      return 70;
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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshAuth, isLoggedIn } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<number | null>(null);
  const [pendingMobileTabAfterLogin, setPendingMobileTabAfterLogin] = useState<
    "오늘의 학습" | null
  >(null);
  const { stockCode: stockCodeParam } = useParams<{ stockCode?: string }>();
  const [searchParams] = useSearchParams();
  const mobileEventId = useMemo(() => {
    const p = searchParams.get("eventId");
    return p ? Number(p) : null;
  }, [searchParams]);
  const { data: interestItems = [] } = useInterestStocksQuery();

  const cachedRouteStockId =
    stockId == null && stockCodeParam
      ? getCachedStockIdByTicker(stockCodeParam)
      : undefined;
  const [resolvedTickerStockId, setResolvedTickerStockId] = useState<
    number | undefined
  >(cachedRouteStockId);
  // 검색이 완료된 코드 — stockCodeParam과 다르면 아직 검색 중
  const [searchedCode, setSearchedCode] = useState<string | undefined>(
    cachedRouteStockId != null && stockCodeParam ? stockCodeParam : undefined,
  );

  useEffect(() => {
    if (stockId != null || !stockCodeParam) return;

    let cancelled = false;
    resolveStockIdByTicker(stockCodeParam, 20)
      .then((resolvedStockId) => {
        if (cancelled) return;
        setResolvedTickerStockId(resolvedStockId);
        setSearchedCode(stockCodeParam);

        if (resolvedStockId == null || resolvedStockId <= 0) return;

        void fetchStockDetail(resolvedStockId).catch(() => undefined);
        void fetchStockPrices(resolvedStockId, "1D").catch(() => undefined);
        void queryClient.prefetchQuery({
          queryKey: stockEventKeys.list(resolvedStockId),
          queryFn: () => fetchEvents(resolvedStockId, undefined, 0, 200),
          staleTime: 5 * 60 * 1000,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedTickerStockId(undefined);
          setSearchedCode(stockCodeParam);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [stockId, stockCodeParam, queryClient]);

  // 검색 완료 여부: stockId 직접 제공 / stockCodeParam 없음 / 현재 코드 검색 완료
  const searchSettled =
    stockId != null || !stockCodeParam || searchedCode === stockCodeParam;
  // stockCodeParam 없으면 stale resolvedTickerStockId 무시
  const chartStockId =
    stockId ?? (stockCodeParam ? resolvedTickerStockId : undefined);
  const displayCode = stockCodeParam ?? code ?? "";
  const routeHasTicker = Boolean(stockCodeParam);
  const holdEmptyChart = Boolean(stockCodeParam && !stockId && !searchSettled);
  const isInterested = useMemo(
    () =>
      chartStockId != null &&
      chartStockId > 0 &&
      interestItems.some((i) => i.stockId === chartStockId),
    [chartStockId, interestItems],
  );

  const { activePeriod, setActivePeriod } = useChartPeriod("일");
  const [mobileTab, setMobileTab] = useState<
    "차트" | "기업 정보" | "이벤트" | "메모" | "오늘의 학습"
  >(
    mobileMode === "event"
      ? "이벤트"
      : mobileMode === "today-learning"
        ? "오늘의 학습"
        : "차트",
  );
  const { data: learningPinData } = useLearningPin(chartStockId);

  const {
    event: mobileEvent,
    scrapping: mobileEventScrapping,
    toggleScrap,
  } = useEventDetail(mobileMode === "event" ? mobileEventId : null);
  const {
    memos,
    save: saveMemo,
    update: updateMemo,
    remove: removeMemo,
  } = useMemos(mobileMode === "event" ? mobileEventId : null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    pendingMobileNav.path =
      mobileTab === "오늘의 학습" ? "today-learning" : null;
  }, [isMobile, mobileTab]);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    mobileEventId ?? null,
  );
  const [eventPanelTab, setEventPanelTabState] = useState<"이벤트" | "메모">(
    sharedEventPanelTab.value === "memo" ? "메모" : "이벤트",
  );
  const setEventPanelTab = useCallback((t: "이벤트" | "메모") => {
    sharedEventPanelTab.value = t === "메모" ? "memo" : "event";
    setEventPanelTabState(t);
  }, []);
  const {
    event: selectedEvent,
    scrapping: selectedScrapping,
    toggleScrap: toggleSelectedScrap,
  } = useEventDetail(selectedEventId);
  const {
    memos: selectedMemos,
    save: saveSelected,
    update: updateSelected,
    remove: removeSelected,
  } = useMemos(selectedEventId);

  const [focusDate, setFocusDate] = useState<string | undefined>(undefined);
  const [chartAnimClass, setChartAnimClass] = useState<
    "chart-drill-in" | "chart-drill-out" | ""
  >("");
  const [chartKey, setChartKey] = useState(0);

  const changePeriod = useCallback(
    (next: typeof activePeriod, currentPeriod: typeof activePeriod) => {
      const dir =
        PERIOD_ORDER.indexOf(next) > PERIOD_ORDER.indexOf(currentPeriod)
          ? "chart-drill-in"
          : "chart-drill-out";
      setChartAnimClass(dir);
      setChartKey((k) => k + 1);
      setActivePeriod(next);
    },
    [setActivePeriod],
  );

  const handlePeriodChange = useCallback(
    (p: typeof activePeriod) => {
      changePeriod(p, activePeriod);
      setFocusDate(undefined);
    },
    [activePeriod, changePeriod],
  );

  const handleEventClick = useCallback(
    (eventId: number, date: string) => {
      if (activePeriod === "년") {
        changePeriod("월", activePeriod);
        setFocusDate(date);
      } else if (activePeriod === "월") {
        changePeriod("주", activePeriod);
        setFocusDate(date);
      } else if (activePeriod === "주") {
        changePeriod("일", activePeriod);
        setFocusDate(date);
      } else {
        if (window.innerWidth < 768) {
          if (!isLoggedIn) {
            setPendingEventId(eventId);
            setLoginModalOpen(true);
          } else {
            setSelectedEventId(eventId);
            setEventPanelTab("이벤트");
          }
        } else {
          const code = stockCodeParam ?? "";
          sharedEventPanelTab.value = "event";
          navigate(`/chart/${code}/event?eventId=${eventId}&tab=event`);
        }
      }
    },
    [activePeriod, navigate, stockCodeParam, changePeriod, isLoggedIn],
  );
  const { stock: fetchedHeader } = useChartStockHeader(
    chartStockId,
    displayCode,
    routeHasTicker,
  );
  const { bars: fetchedBars } = useOhlcDataWithEvents(
    chartStockId,
    activePeriod,
    holdEmptyChart,
  );
  const stock = stockProp ?? fetchedHeader;
  const bars = useMemo(
    () => fetchedBars ?? barsProp ?? [],
    [fetchedBars, barsProp],
  );

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

  useEffect(() => {
    if (selectedEventId === null) return;
    if (isMobile) return;
    if (pathname.endsWith("/today-learning")) return;
    if (pathname.endsWith("/event")) return;

    const code = stockCodeParam ?? "";
    const params = new URLSearchParams({
      eventId: String(selectedEventId),
    });

    if (eventPanelTab === "메모") {
      params.set("tab", "memo");
    }

    navigate(`/chart/${code}/event?${params.toString()}`, { replace: true });
  }, [eventPanelTab, isMobile, navigate, pathname, selectedEventId, stockCodeParam]);

  const chartVisibleBars = visibleBarsForPeriod(activePeriod);
  const mobileChartVisibleBars = visibleBarsForPeriodMobile(activePeriod);
  const mobileTabs =
    mobileMode === "event"
      ? (["차트", "이벤트", "메모"] as const)
      : learningPinData !== null
        ? (["차트", "기업 정보", "오늘의 학습"] as const)
        : (["차트", "기업 정보"] as const);

  return (
    <>
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6fb] ${className}`}
      >
        {/* 모바일 레이아웃 */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:hidden">
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

          <div
            className={`grid shrink-0 border-b border-[#eff1f8] ${mobileTabs.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
          >
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
              <div className="shrink-0 bg-white px-4 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <PeriodTabs
                    active={activePeriod}
                    onChange={handlePeriodChange}
                  />
                  {summary && <OhlcSummaryBar summary={summary} />}
                </div>
              </div>

              <div
                key={chartKey}
                className={`min-h-0 flex-1 px-1 pt-2 ${chartAnimClass}`}
              >
                <LightweightCandleChart
                  bars={bars}
                  visibleBars={mobileChartVisibleBars}
                  onHoverBar={handleHoverBar}
                  onEventClick={handleEventClick}
                  learningPin={learningPinData}
                  onLearningPinClick={() => setMobileTab("오늘의 학습")}
                  focusDate={focusDate}
                  activePeriod={activePeriod}
                  isMobile
                />
              </div>
            </>
          )}

          {mobileTab === "오늘의 학습" && (
            <div className="flex-1 min-h-0">
              <TodayLearningSidebar
                stockId={chartStockId}
                isOpen
                isLoggedIn={isLoggedIn}
                onLoginRequired={() => {
                  setPendingMobileTabAfterLogin("오늘의 학습");
                  setLoginModalOpen(true);
                }}
              />
            </div>
          )}

          {mobileTab === "기업 정보" && (
            <div
              className="scrollbar-subtle flex-1 min-h-0 overflow-y-auto"
              style={{ scrollbarGutter: "stable" }}
            >
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
              eventInfo={
                mobileEvent
                  ? {
                      eventType: mobileEvent.eventType,
                      stockName: mobileEvent.stockName,
                      changeRate: mobileEvent.changeRate,
                    }
                  : undefined
              }
              onSave={saveMemo}
              onUpdate={updateMemo}
              onDelete={removeMemo}
            />
          )}

          {/* 이벤트 상세 오버레이 */}
          {selectedEventId !== null && (
            <div className="absolute inset-0 z-20 flex flex-col bg-white md:hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-[#eff1f8] px-1">
                <div className="flex flex-1">
                  {(["이벤트", "메모"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setEventPanelTab(tab)}
                      className={`flex-1 py-2.5 text-center text-sm font-medium border-b-2 ${
                        eventPanelTab === tab
                          ? "border-primary text-primary"
                          : "border-transparent text-[#9ca3af]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventId(null);
                    if (mobileMode === "event") {
                      navigate(`/chart/${stockCodeParam ?? ""}/stock-detail`);
                    }
                  }}
                  className="mr-2 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f3f4f6]"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
                {eventPanelTab === "이벤트" && selectedEvent && (
                  <EventTab
                    event={selectedEvent}
                    scrapping={selectedScrapping}
                    onScrap={toggleSelectedScrap}
                  />
                )}
                {eventPanelTab === "메모" && (
                  <MemoTab
                    memos={selectedMemos}
                    eventInfo={
                      selectedEvent
                        ? {
                            eventType: selectedEvent.eventType,
                            stockName: selectedEvent.stockName,
                            changeRate: selectedEvent.changeRate,
                          }
                        : undefined
                    }
                    onSave={saveSelected}
                    onUpdate={updateSelected}
                    onDelete={removeSelected}
                  />
                )}
              </div>
            </div>
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
              <PeriodTabs active={activePeriod} onChange={handlePeriodChange} />
              {summary && <OhlcSummaryBar summary={summary} />}
            </div>
          </div>

          <main
            key={chartKey}
            className={`min-h-0 flex-1 overflow-hidden border-t border-[#eff1f8] bg-white ${chartAnimClass}`}
          >
            <LightweightCandleChart
              bars={bars}
              visibleBars={chartVisibleBars}
              onHoverBar={handleHoverBar}
              onEventClick={handleEventClick}
              learningPin={learningPinData}
              onLearningPinClick={() => requestResponsiveRouteNavigation("today-learning")}
              focusDate={focusDate}
              activePeriod={activePeriod}
            />
          </main>

          <div className="shrink-0 border-t border-[#eff1f8] bg-[#f9fafc]">
            <MarketIndexBar />
          </div>
        </div>
      </div>

      {loginModalOpen && (
        <LoginModal
          onClose={() => {
            setLoginModalOpen(false);
            setPendingMobileTabAfterLogin(null);
          }}
          onSignup={() => {
            setLoginModalOpen(false);
            setPendingMobileTabAfterLogin(null);
            navigate("/signup");
          }}
          onLoginSuccess={async () => {
            await refreshAuth();
            await invalidateAuthTransitionQueries(queryClient);
            setLoginModalOpen(false);
            if (pendingMobileTabAfterLogin === "오늘의 학습") {
              setMobileTab("오늘의 학습");
              setPendingMobileTabAfterLogin(null);
            }
            if (pendingEventId !== null) {
              setSelectedEventId(pendingEventId);
              setEventPanelTab("이벤트");
              setPendingEventId(null);
            }
          }}
        />
      )}
    </>
  );
}
