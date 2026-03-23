export type StockMarket = 'ALL' | 'KOSPI' | 'KOSDAQ';

export type StockSort = 'TRADING_AMOUNT' | 'TRADING_VOLUME' | 'SURGE' | 'DROP';

export type StockPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'THREE_MONTHS' | 'SIX_MONTHS';

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
