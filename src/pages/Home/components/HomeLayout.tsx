import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchStockList } from '@/features/stock/api';
import {
  useAddInterestStockMutation,
  useInterestStocksQuery,
  useRemoveInterestStockMutation,
} from '@/features/stock/hooks/useInterestStocks';
import type { HomeStockItemDto, StockMarket, StockPeriod, StockSort } from '@/features/stock/types';
import favoriteIco from '@/assets/favorite.svg';
import favoriteClickIco from '@/assets/favorite_click.svg';
import MarketIndexBar from '@/pages/widgets/MarketIndexBar/MarketIndexBar';
import { useNavigate } from 'react-router';
import { toChartStockDetail } from '@/shared/constants/routes';

interface HomeLayoutProps {
  market: StockMarket;
  sort: StockSort;
  period: StockPeriod;
  onChangeMarket: (market: StockMarket) => void;
  onChangeSort: (sort: StockSort) => void;
  onChangePeriod: (period: StockPeriod) => void;
  /** 비로그인 시 홈에서 관심(별) 클릭 */
  onRequireLoginForFavorite?: () => void;
}

interface HomeStockRow {
  stockId: number;
  rank: number;
  ticker: string;
  name: string;
  market: Exclude<StockMarket, 'ALL'>;
  logoUrl?: string | null;
  currentPrice: number;
  changeRate: number;
  tradingAmount: string;
  tradingVolume: string;
}

const MARKET_LABEL: Record<StockMarket, string> = {
  ALL: '전체',
  KOSPI: '코스피',
  KOSDAQ: '코스닥',
};

const SORT_LABEL: Record<StockSort, string> = {
  MARKET_CAP: '시가총액',
  TRADING_AMOUNT: '거래대금',
  TRADING_VOLUME: '거래량',
  SURGE: '급상승',
  DROP: '급하락',
};

const LIST_PAGE_SIZE = 20;

function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function changeText(rate: number) {
  if (rate > 0) return `+${rate.toFixed(2)}%`;
  if (rate < 0) return `${rate.toFixed(2)}%`;
  return '0.00%';
}

function changeColor(rate: number) {
  if (rate > 0) return 'text-red-500';
  if (rate < 0) return 'text-blue-500';
  return 'text-gray-400';
}

function logoSeedColor(seed: string) {
  const palette = ['#002C5F', '#002C5F', '#002C5F', '#002C5F', '#002C5F', '#002C5F', '#002C5F', '#002C5F'];
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function getLogoText(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

function formatTradingAmountKR(value: number) {
  if (value >= 100_000_000) {
    const eok = value / 100_000_000;
    return `${eok.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억원`;
  }
  const manWon = Math.round(value / 10_000);
  return `${manWon.toLocaleString('ko-KR')}만원`;
}

function formatTradingVolumeKR(value: number) {
  if (value >= 10_000) {
    const manJu = value / 10_000;
    return `${manJu.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만주`;
  }
  return `${value.toLocaleString('ko-KR')}주`;
}

function toHomeStockRow(item: HomeStockItemDto): HomeStockRow {
  return {
    stockId: item.stockId,
    rank: item.rank,
    ticker: item.ticker,
    name: item.name,
    market: item.market === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI',
    logoUrl: item.logoUrl ?? null,
    currentPrice: item.currentPrice,
    changeRate: item.changeRate,
    tradingAmount: formatTradingAmountKR(item.tradingAmount),
    tradingVolume: formatTradingVolumeKR(item.tradingVolume),
  };
}

export default function HomeLayout({
  market,
  sort,
  period,
  onChangeMarket,
  onChangeSort,
  onChangePeriod,
  onRequireLoginForFavorite,
}: HomeLayoutProps) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: interestItems = [] } = useInterestStocksQuery();
  const interestIdSet = useMemo(
    () => new Set(interestItems.map((i) => i.stockId)),
    [interestItems]
  );
  const addInterestMut = useAddInterestStockMutation();
  const removeInterestMut = useRemoveInterestStockMutation();
  const marketOptions: StockMarket[] = ['ALL', 'KOSPI', 'KOSDAQ'];
  const sortOptions: StockSort[] = ['MARKET_CAP', 'TRADING_AMOUNT', 'TRADING_VOLUME', 'SURGE', 'DROP'];
  /** 리스트 등락률 기준 기간(스톡 프라이스 차트 기간과 다름) */
  const periodOptions: Array<{ value: StockPeriod; label: string }> = [
    { value: '1D', label: '1일' },
    { value: '1W', label: '1주일' },
    { value: '1M', label: '1개월' },
    { value: '3M', label: '3개월' },
    { value: '6M', label: '6개월' },
  ];

  const [stocks, setStocks] = useState<HomeStockRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const listScrollRef = useRef<HTMLDivElement>(null);
  const listSentinelRef = useRef<HTMLDivElement>(null);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetchStockList({
        market,
        sort,
        period,
        size: LIST_PAGE_SIZE,
      });
      const page = res.data;
      setStocks(page.items.map(toHomeStockRow));
      setNextCursor(page.nextCursor ?? null);
      setHasNext(page.hasNext);
    } catch {
      setStocks([]);
      setNextCursor(null);
      setHasNext(false);
      setLoadError('종목 리스트를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [market, sort, period]);

  const loadNextPage = useCallback(async () => {
    if (!hasNext || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetchStockList({
        market,
        sort,
        period,
        cursor: nextCursor,
        size: LIST_PAGE_SIZE,
      });
      const page = res.data;
      setStocks(prev => [...prev, ...page.items.map(toHomeStockRow)]);
      setNextCursor(page.nextCursor ?? null);
      setHasNext(page.hasNext);
    } catch {
      setLoadError('추가 종목을 불러오지 못했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasNext, isLoadingMore, market, nextCursor, period, sort]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    const root = listScrollRef.current;
    const target = listSentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting) return;
        void loadNextPage();
      },
      { root, rootMargin: '80px', threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const toggleFavorite = useCallback(
    (stockId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) {
        onRequireLoginForFavorite?.();
        return;
      }
      if (interestIdSet.has(stockId)) {
        removeInterestMut.mutate(stockId);
      } else {
        addInterestMut.mutate(stockId);
      }
    },
    [
      isLoggedIn,
      interestIdSet,
      addInterestMut,
      removeInterestMut,
      onRequireLoginForFavorite,
    ]
  );

  return (
    <main className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f4f6fb]">
      <section className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-[#eff1f8]">
          <div className="border-b border-[#eff1f8] bg-white px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg bg-[#f0f2f8] p-1 max-[451px]:-translate-x-[2px]">
                {marketOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChangeMarket(option)}
                    className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium ${
                      market === option ? 'bg-white text-[#4e5968]' : 'text-[#9ca3af]'
                    }`}
                  >
                    {MARKET_LABEL[option]}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-[#d8e2f8] max-[451px]:hidden" />

              <div className="flex rounded-lg bg-[#f0f2f8] p-1 max-[451px]:hidden">
                {sortOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChangeSort(option)}
                    className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium ${
                      sort === option ? 'bg-white text-[#4e5968]' : 'text-[#9ca3af]'
                    }`}
                  >
                    {SORT_LABEL[option]}
                  </button>
                ))}
              </div>

              <div className="hidden h-px basis-full bg-[#d8e2f8] max-[451px]:relative max-[451px]:left-1/2 max-[451px]:block max-[451px]:w-screen max-[451px]:-translate-x-1/2" />

              <div className="ml-auto flex flex-wrap items-center justify-end gap-1 max-[451px]:ml-0 max-[451px]:basis-full max-[451px]:justify-start">
                {periodOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChangePeriod(option.value)}
                    className={`inline-flex min-w-[44px] cursor-pointer justify-center rounded-md px-2 py-1 text-[11px] font-semibold ${
                      period === option.value ? 'bg-[#014d9d] text-white' : 'text-[#9ca3af]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-[28px_44px_1fr_110px_88px_100px_100px] items-center border-b border-[#eff1f8] bg-[#f0f4f9] px-4 py-2 text-[11px] font-semibold text-[#9ca3af] lg:grid">
            <div />
            <div className="text-center" />
            <div />
            <div className="text-right">현재가</div>
            <div className="text-right">등락률</div>
            <div className="text-right">거래대금</div>
            <div className="pr-[6px] text-right">거래량</div>
          </div>

          <div
            ref={listScrollRef}
            className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white"
          >
            <div className="hidden lg:block">
              {isLoading && (
                <div className="px-4 py-6 text-center text-sm text-[#9ca3af]">종목 리스트를 불러오는 중...</div>
              )}
              {!isLoading && loadError && (
                <div className="px-4 py-6 text-center text-sm text-[#ef4444]">{loadError}</div>
              )}
              {stocks.map(stock => (
                <div
                  key={`${stock.ticker}-${stock.rank}`}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(toChartStockDetail(stock.ticker))
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(toChartStockDetail(stock.ticker));
                    }
                  }}
                  className="grid cursor-pointer grid-cols-[28px_44px_1fr_110px_88px_100px_100px] items-center border-b border-[#eff1f8] px-4 py-2.5 transition-colors duration-150 hover:bg-[#f4f6fb]"
                >
                  <button
                    type="button"
                    onClick={e => toggleFavorite(stock.stockId, e)}
                    className="pl-1 translate-x-1 text-gray-300"
                    aria-pressed={interestIdSet.has(stock.stockId)}
                    disabled={addInterestMut.isPending || removeInterestMut.isPending}
                  >
                    <img
                      src={interestIdSet.has(stock.stockId) ? favoriteClickIco : favoriteIco}
                      alt="관심 종목"
                      className="h-[18px] w-[18px]"
                    />
                  </button>
                  <div className="text-center text-xs font-bold text-[#9ca3af]">{stock.rank}</div>
                  <div className="flex items-center gap-2.5">
                    {stock.logoUrl ? (
                      <img
                        src={stock.logoUrl}
                        alt={`${stock.name} 로고`}
                        className="h-8 w-8 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                        style={{ backgroundColor: logoSeedColor(stock.ticker) }}
                      >
                        {getLogoText(stock.name)}
                      </div>
                    )}
                    <div className="ml-1">
                      <p className="text-sm font-bold text-[#111827]">{stock.name}</p>
                      <p className="text-[11px] text-[#9ca3af]">
                        {stock.ticker} · {stock.market}
                      </p>
                    </div>
                  </div>
                  <div className="pr-[5px] text-right text-sm font-semibold text-[#111827]">{formatPrice(stock.currentPrice)}</div>
                  <div className={`pr-[5px] text-right text-xs font-semibold ${changeColor(stock.changeRate)}`}>{changeText(stock.changeRate)}</div>
                  <div className="pr-[5px] text-right text-xs text-[#4b5563]">{stock.tradingAmount}</div>
                  <div className="pr-[9px] text-right text-xs text-[#4b5563]">{stock.tradingVolume}</div>
                </div>
              ))}
            </div>

            <div className="lg:hidden">
              <div className="grid min-h-[42px] grid-cols-[minmax(0,1fr)_82px_78px] items-center border-b border-[#eff1f8] bg-[#f0f4f9] px-4 py-2">
                <div />
                <div className="text-right">
                  <div className="text-[10.5px] font-bold text-[#9ca3af]">현재가</div>
                  <div className="text-[8.8px] font-normal text-[#c8cdd4]">거래량</div>
                </div>
                <div className="text-right">
                  <div className="text-[10.5px] font-bold text-[#9ca3af]">등락률</div>
                  <div className="text-[8.8px] font-normal text-[#c8cdd4]">거래대금</div>
                </div>
              </div>
              {isLoading && (
                <div className="px-4 py-6 text-center text-sm text-[#9ca3af]">종목 리스트를 불러오는 중...</div>
              )}
              {!isLoading && loadError && (
                <div className="px-4 py-6 text-center text-sm text-[#ef4444]">{loadError}</div>
              )}
              {stocks.map(stock => (
                <div
                  key={`${stock.ticker}-${stock.rank}`}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(toChartStockDetail(stock.ticker))
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(toChartStockDetail(stock.ticker));
                    }
                  }}
                  className="grid min-h-[62px] cursor-pointer grid-cols-[minmax(0,1fr)_82px_78px] items-center border-b border-[#eff1f8] px-4 py-2 transition-colors duration-150 hover:bg-[#f4f6fb]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={e => toggleFavorite(stock.stockId, e)}
                      className="shrink-0 -translate-x-0.8 text-gray-300"
                      aria-pressed={interestIdSet.has(stock.stockId)}
                      disabled={addInterestMut.isPending || removeInterestMut.isPending}
                    >
                      <img
                        src={interestIdSet.has(stock.stockId) ? favoriteClickIco : favoriteIco}
                        alt="관심 종목"
                        className="h-[18px] w-[18px]"
                      />
                    </button>
                    <span className="w-4 shrink-0 -translate-x-0.5 text-center text-xs font-semibold text-[#9ca3af]">{stock.rank}</span>
                    {stock.logoUrl ? (
                      <img
                        src={stock.logoUrl}
                        alt={`${stock.name} 로고`}
                        className="h-8 w-8 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                        style={{ backgroundColor: logoSeedColor(stock.ticker) }}
                      >
                        {getLogoText(stock.name)}
                      </div>
                    )}
                    <div className="min-w-0 ml-0.5">
                      <p className="truncate text-[13px] font-bold text-[#111827]">{stock.name}</p>
                      <p className="truncate text-[10px] text-[#9ca3af]">
                        {stock.ticker} · {stock.market}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold text-[#111827]">{stock.currentPrice.toLocaleString('ko-KR')}</div>
                    <div className="text-[10px] text-[#6b7280]">{stock.tradingVolume}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[12px] font-bold ${changeColor(stock.changeRate)}`}>{changeText(stock.changeRate)}</div>
                    <div className="text-[10px] text-[#6b7280]">{stock.tradingAmount}</div>
                  </div>
                </div>
              ))}
              <div className="border-t border-[#eff1f8] bg-[#f9fafc] px-4 py-3 text-center text-xs text-[#9ca3af]">순위 기준: 추후 API 기준 시각 연동 예정</div>
            </div>

            {isLoadingMore && (
              <div className="px-4 py-3 text-center text-xs text-[#9ca3af]">추가 종목을 불러오는 중...</div>
            )}
            <div ref={listSentinelRef} className="h-px w-full shrink-0" aria-hidden />
          </div>

          <MarketIndexBar />
        </div>


      </section>
    </main>
  );
}
