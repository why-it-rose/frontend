export type StockMarket = 'ALL' | 'KOSPI' | 'KOSDAQ';

export type StockSort = 'TRADING_AMOUNT' | 'TRADING_VOLUME' | 'SURGE' | 'DROP';

export type StockPeriod = '1D' | '1W' | '1M' | '3M' | '6M';

export type StockChangeDirection = 'UP' | 'DOWN' | 'FLAT';

export type StockEventType = 'SURGE' | 'DROP';

export interface StockListParams {
  market?: StockMarket;
  sort?: StockSort;
  period?: StockPeriod;
  cursor?: string;
  size?: number;
}

export interface HomeStockItemDto {
  rank: number;
  stockId: number;
  ticker: string;
  name: string;
  market: StockMarket;
  logoUrl?: string | null;
  currentPrice: number;
  priceChange: number;
  changeRate: number;
  changeDirection: StockChangeDirection;
  tradingAmount: number;
  tradingVolume: number;
  hasEvent: boolean;
  eventType?: StockEventType | null;
  isInterested?: boolean;
  // Optional until backend finalizes an explicit "rank as-of" timestamp.
  asOf?: string;
}

export interface CursorPageDto<T> {
  nextCursor?: string | null;
  hasNext: boolean;
  size: number;
  items: T[];
}

export type StockListDataDto = CursorPageDto<HomeStockItemDto>;

export interface ApiEnvelope<T> {
  code: string;
  message: string;
  data: T;
}

export type StockListResponseDto = ApiEnvelope<StockListDataDto>;

/** 종목 상세 차트 — Swagger `GET /api/stocks/{stockId}/prices?period=` */
export type StockChartPeriod = '1D' | '1W' | '1M' | '1Y';

export interface StockPriceCandleDto {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockPricesDataDto {
  stockId: number;
  period: string;
  candles: StockPriceCandleDto[];
}

export interface StockSearchItemDto {
  stockId: number;
  ticker: string;
  name: string;
  market: string;
  logoUrl?: string | null;
  currentPrice?: number;
  changeRate?: number;
  changeDirection?: StockChangeDirection;
}

/** Swagger: GET /api/stocks/{stockId} */
export interface StockDetailDto {
  stockId: number;
  ticker: string;
  name: string;
  market: string;
  sector?: string;
  logoUrl?: string | null;
  currentPrice: number;
  priceChange: number;
  changeRate: number;
  changeDirection: StockChangeDirection;
  todayOhlcv?: {
    open: number;
    high: number;
    low: number;
    volume: number;
  };
  isInterested?: boolean;
}
