import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StockMarket, StockPeriod, StockSort } from '@/features/stock/types';
import favoriteIco from '@/assets/favorite.svg';
import favoriteClickIco from '@/assets/favorite_click.svg';
import InterestStockAside from '@/pages/InterestStock/components/InterestStockAside';
import MarketIndexBar from '@/pages/widgets/MarketIndexBar/MarketIndexBar';
import { useNavigate } from 'react-router';

interface HomeLayoutProps {
  market: StockMarket;
  sort: StockSort;
  period: StockPeriod;
  onChangeMarket: (market: StockMarket) => void;
  onChangeSort: (sort: StockSort) => void;
  onChangePeriod: (period: StockPeriod) => void;
}

interface HomeStockRow {
  rank: number;
  ticker: string;
  name: string;
  market: Exclude<StockMarket, 'ALL'>;
  currentPrice: number;
  changeRate: number;
  tradingAmount: string;
  tradingVolume: string;
  eventType?: 'SURGE' | 'DROP';
}

const MARKET_LABEL: Record<StockMarket, string> = {
  ALL: '전체',
  KOSPI: '코스피',
  KOSDAQ: '코스닥',
};

const SORT_LABEL: Record<StockSort, string> = {
  TRADING_AMOUNT: '거래대금',
  TRADING_VOLUME: '거래량',
  SURGE: '급상승',
  DROP: '급하락',
};

const MOCK_STOCKS: HomeStockRow[] = [
  { rank: 1, ticker: '005930', name: '삼성전자', market: 'KOSPI', currentPrice: 82100, changeRate: 2.14, tradingAmount: '1,204억원', tradingVolume: '842만주', eventType: 'SURGE' },
  { rank: 2, ticker: '000660', name: 'SK하이닉스', market: 'KOSPI', currentPrice: 197200, changeRate: 1.88, tradingAmount: '9,821억원', tradingVolume: '501만주' },
  { rank: 3, ticker: '035420', name: 'NAVER', market: 'KOSPI', currentPrice: 215000, changeRate: -1.04, tradingAmount: '4,101억원', tradingVolume: '190만주', eventType: 'DROP' },
  { rank: 4, ticker: '051910', name: 'LG화학', market: 'KOSPI', currentPrice: 312500, changeRate: 0.96, tradingAmount: '2,932억원', tradingVolume: '94만주' },
  { rank: 5, ticker: '068270', name: '셀트리온', market: 'KOSPI', currentPrice: 178900, changeRate: 3.62, tradingAmount: '3,540억원', tradingVolume: '211만주', eventType: 'SURGE' },
  { rank: 6, ticker: '035720', name: '카카오', market: 'KOSPI', currentPrice: 45200, changeRate: -0.83, tradingAmount: '1,870억원', tradingVolume: '412만주' },
  { rank: 7, ticker: '207940', name: '삼성바이오로직스', market: 'KOSPI', currentPrice: 954000, changeRate: 0.52, tradingAmount: '1,192억원', tradingVolume: '13만주' },
  { rank: 8, ticker: '012330', name: '현대모비스', market: 'KOSPI', currentPrice: 251000, changeRate: 0.31, tradingAmount: '920억원', tradingVolume: '37만주' },
  { rank: 9, ticker: '329180', name: 'HD현대중공업', market: 'KOSPI', currentPrice: 134200, changeRate: -2.41, tradingAmount: '887억원', tradingVolume: '63만주', eventType: 'DROP' },
  { rank: 10, ticker: '000080', name: '하이트진로', market: 'KOSPI', currentPrice: 134200, changeRate: -2.41, tradingAmount: '887억원', tradingVolume: '63만주', eventType: 'DROP' },
  { rank: 11, ticker: '030520', name: '한글과컴퓨터', market: 'KOSDAQ', currentPrice: 134200, changeRate: -2.41, tradingAmount: '887억원', tradingVolume: '63만주', eventType: 'DROP' },
  { rank: 12, ticker: '035760', name: 'CJ ENM', market: 'KOSDAQ', currentPrice: 134200, changeRate: -2.41, tradingAmount: '887억원', tradingVolume: '63만주', eventType: 'DROP' },
  { rank: 13, ticker: '058470', name: '리노공업', market: 'KOSDAQ', currentPrice: 134200, changeRate: -2.41, tradingAmount: '887억원', tradingVolume: '63만주', eventType: 'DROP' },
  { rank: 14, ticker: '069080', name: '웹젠', market: 'KOSDAQ', currentPrice: 134200, changeRate: -2.41, tradingAmount: '887억원', tradingVolume: '63만주', eventType: 'DROP' },
  { rank: 15, ticker: '095340', name: 'ISC', market: 'KOSDAQ', currentPrice: 134200, changeRate: -2.41, tradingAmount: '887억원', tradingVolume: '63만주', eventType: 'DROP' },
];

const LIST_PAGE_SIZE = 5;

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

export default function HomeLayout({
  market,
  sort,
  period,
  onChangeMarket,
  onChangeSort,
  onChangePeriod,
}: HomeLayoutProps) {
  const navigate = useNavigate();
  const marketOptions: StockMarket[] = ['ALL', 'KOSPI', 'KOSDAQ'];
  const sortOptions: StockSort[] = ['TRADING_AMOUNT', 'TRADING_VOLUME', 'SURGE', 'DROP'];
  /** 리스트 등락률 기준 기간(스톡 프라이스 차트 기간과 다름) */
  const periodOptions: Array<{ value: StockPeriod; label: string }> = [
    { value: 'DAILY', label: '1일' },
    { value: 'WEEKLY', label: '1주일' },
    { value: 'MONTHLY', label: '1개월' },
    { value: 'THREE_MONTHS', label: '3개월' },
    { value: 'SIX_MONTHS', label: '6개월' },
  ];

  const filteredStocks = useMemo(
    () =>
      MOCK_STOCKS.filter(stock => {
        if (market === 'ALL') return true;
        return stock.market === market;
      }),
    [market],
  );

  const [listLoaded, setListLoaded] = useState(LIST_PAGE_SIZE);

  useEffect(() => {
    setListLoaded(LIST_PAGE_SIZE);
  }, [market, sort, period]);

  const displayedStocks = useMemo(
    () => filteredStocks.slice(0, listLoaded),
    [filteredStocks, listLoaded],
  );

  const listScrollRef = useRef<HTMLDivElement>(null);
  const listSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = listScrollRef.current;
    const target = listSentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting) return;
        setListLoaded(c => Math.min(c + LIST_PAGE_SIZE, filteredStocks.length));
      },
      { root, rootMargin: '80px', threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredStocks.length]);

  useEffect(() => {
    const root = listScrollRef.current;
    if (!root || listLoaded >= filteredStocks.length) return;
    if (root.scrollHeight <= root.clientHeight + 2) {
      setListLoaded(c => Math.min(c + LIST_PAGE_SIZE, filteredStocks.length));
    }
  }, [listLoaded, filteredStocks.length]);

  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  const toggleFavorite = useCallback((ticker: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  }, []);

  return (
    <main className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f4f6fb]">
      <section className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-[#eff1f8]">
          <div className="border-b border-[#eff1f8] bg-white px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg bg-[#f0f2f8] p-1">
                {marketOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChangeMarket(option)}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      market === option ? 'bg-white text-[#4e5968]' : 'text-[#9ca3af]'
                    }`}
                  >
                    {MARKET_LABEL[option]}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-[#d8e2f8]" />

              <div className="flex rounded-lg bg-[#f0f2f8] p-1">
                {sortOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChangeSort(option)}
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      sort === option ? 'bg-white text-[#4e5968]' : 'text-[#9ca3af]'
                    }`}
                  >
                    {SORT_LABEL[option]}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
                {periodOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChangePeriod(option.value)}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                      period === option.value ? 'bg-[#014d9d] text-white' : 'text-[#9ca3af]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-[28px_44px_1fr_110px_88px_100px_100px_80px] items-center border-b border-[#eff1f8] bg-[#f0f4f9] px-4 py-2 text-[11px] font-semibold text-[#9ca3af] lg:grid">
            <div />
            <div className="text-center" />
            <div />
            <div className="text-right">현재가</div>
            <div className="text-right">등락률</div>
            <div className="text-right">거래대금</div>
            <div className="text-right">거래량</div>
            <div className="text-center">이벤트</div>
          </div>

          <div
            ref={listScrollRef}
            className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white"
          >
            <div className="hidden lg:block" onClick={()=>{navigate('/chart/stock-detail')}}>
              {displayedStocks.map(stock => (
                <div
                  key={`${stock.ticker}-${stock.rank}`}
                  className="grid grid-cols-[28px_44px_1fr_110px_88px_100px_100px_80px] items-center border-b border-[#eff1f8] px-4 py-2.5 transition-colors duration-150 hover:bg-[#f4f6fb]"
                >
                  <button
                    type="button"
                    onClick={() => toggleFavorite(stock.ticker)}
                    className="pl-1 text-gray-300"
                    aria-pressed={favorites.has(stock.ticker)}
                  >
                    <img
                      src={favorites.has(stock.ticker) ? favoriteClickIco : favoriteIco}
                      alt="관심 종목"
                      className="h-4 w-4"
                    />
                  </button>
                  <div className="text-center text-xs font-bold text-[#9ca3af]">{stock.rank}</div>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                      style={{ backgroundColor: logoSeedColor(stock.ticker) }}
                    >
                      {getLogoText(stock.name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">{stock.name}</p>
                      <p className="text-[11px] text-[#9ca3af]">
                        {stock.ticker} · {stock.market}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-[#111827]">{formatPrice(stock.currentPrice)}</div>
                  <div className={`text-right text-xs font-semibold ${changeColor(stock.changeRate)}`}>{changeText(stock.changeRate)}</div>
                  <div className="text-right text-xs text-[#4b5563]">{stock.tradingAmount}</div>
                  <div className="text-right text-xs text-[#4b5563]">{stock.tradingVolume}</div>
                  <div className="text-center">
                    {stock.eventType ? (
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${stock.eventType === 'SURGE' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        {stock.eventType === 'SURGE' ? '▲ 급등' : '▼ 급락'}
                      </span>
                    ) : (
                      <span className="text-xs text-[#9ca3af]">-</span>
                    )}
                  </div>
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
              {displayedStocks.map(stock => (
                <div
                  key={`${stock.ticker}-${stock.rank}`}
                  className="grid min-h-[62px] grid-cols-[minmax(0,1fr)_82px_78px] items-center border-b border-[#eff1f8] px-4 py-2 transition-colors duration-150 hover:bg-[#f4f6fb]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(stock.ticker)}
                      className="shrink-0 text-gray-300"
                      aria-pressed={favorites.has(stock.ticker)}
                    >
                      <img
                        src={favorites.has(stock.ticker) ? favoriteClickIco : favoriteIco}
                        alt="관심 종목"
                        className="h-4 w-4"
                      />
                    </button>
                    <span className="w-4 shrink-0 text-center text-xs font-semibold text-[#9ca3af]">{stock.rank}</span>
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                      style={{ backgroundColor: logoSeedColor(stock.ticker) }}
                    >
                      {getLogoText(stock.name)}
                    </div>
                    <div className="min-w-0">
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
                    <div className={`text-[11px] font-bold ${changeColor(stock.changeRate)}`}>{changeText(stock.changeRate)}</div>
                    <div className="text-[10px] text-[#6b7280]">{stock.tradingAmount}</div>
                  </div>
                </div>
              ))}
              <div className="border-t border-[#eff1f8] bg-[#f9fafc] px-4 py-3 text-center text-xs text-[#9ca3af]">순위 기준: 추후 API 기준 시각 연동 예정</div>
            </div>

            <div ref={listSentinelRef} className="h-px w-full shrink-0" aria-hidden />
          </div>

          <MarketIndexBar />
        </div>


      </section>
    </main>
  );
}
