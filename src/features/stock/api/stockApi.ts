import type {
  StockListParams,
  StockListResponseDto,
  StockChartPeriod,
  StockPricesDataDto,
  StockSearchItemDto,
  StockDetailDto,
} from '@/features/stock/types';

type StockListPeriod = NonNullable<StockListParams['period']>;
type StockListQuery = StockListParams;

const BASE_URL = '';

function mapPeriodToApi(period?: StockListPeriod): StockListPeriod | undefined {
  if (!period) return undefined;
  return period;
}

function toQueryString(params: StockListQuery) {
  const query = new URLSearchParams();
  if (params.market) query.set('market', params.market);
  if (params.sort) query.set('sort', params.sort);

  const apiPeriod = mapPeriodToApi(params.period);
  if (apiPeriod) query.set('period', apiPeriod);

  if (params.cursor) query.set('cursor', params.cursor);
  if (typeof params.size === 'number') query.set('size', String(params.size));
  return query.toString();
}

/**
 * 홈 종목 리스트 조회
 * - Swagger: GET /api/stocks
 */
export async function fetchStockList(params: StockListQuery = {}): Promise<StockListResponseDto> {
  const qs = toQueryString(params);
  const url = `${BASE_URL}/api/stocks${qs ? `?${qs}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchStockList failed: ${res.status}`);
  }
  const json = await res.json();

  if (json?.result?.items) {
    return {
      code: String(json.responseCode ?? 'SUCCESS'),
      message: String(json.responseMessage ?? ''),
      data: json.result,
    };
  }
  throw new Error('fetchStockList failed: invalid response shape');
}

/**
 * 종목 가격(캔들) 조회 — 이벤트 핀 등은 응답에 있어도 클라이언트에서 무시 가능
 * Swagger: GET /api/stocks/{stockId}/prices?period=1D|1W|1M|1Y
 */
export async function fetchStockPrices(
  stockId: number,
  period: StockChartPeriod
): Promise<StockPricesDataDto> {
  const url = `${BASE_URL}/api/stocks/${stockId}/prices?period=${encodeURIComponent(period)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchStockPrices failed: ${res.status}`);
  }
  const json = await res.json();

  if (json?.result?.candles && Array.isArray(json.result.candles)) {
    return {
      stockId: Number(json.result.stockId ?? stockId),
      period: String(json.result.period ?? period),
      candles: json.result.candles,
    };
  }
  throw new Error('fetchStockPrices failed: invalid response shape');
}

/**
 * 종목 검색 — Swagger: GET /api/stocks/search?q=&limit=
 */
export async function fetchStockSearch(
  q: string,
  limit = 10,
  signal?: AbortSignal
): Promise<StockSearchItemDto[]> {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  const url = `${BASE_URL}/api/stocks/search?${qs.toString()}`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) {
    throw new Error(`fetchStockSearch failed: ${res.status}`);
  }
  const json = await res.json();
  const items = json?.result?.items ?? json?.data?.items;
  if (Array.isArray(items)) {
    return items;
  }
  throw new Error('fetchStockSearch failed: invalid response shape');
}

/**
 * 종목 기본 정보 — Swagger: GET /api/stocks/{stockId}
 */
export async function fetchStockDetail(stockId: number): Promise<StockDetailDto> {
  const url = `${BASE_URL}/api/stocks/${stockId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchStockDetail failed: ${res.status}`);
  }
  const json = await res.json();
  const row = json?.result ?? json?.data;
  if (row && typeof row.stockId === 'number' && row.ticker) {
    return row as StockDetailDto;
  }
  throw new Error('fetchStockDetail failed: invalid response shape');
}

