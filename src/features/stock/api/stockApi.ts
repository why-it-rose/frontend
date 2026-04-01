import type {
  StockCompanyDto,
  StockDetailDto,
  StockListParams,
  StockListResponseDto,
  StockChartPeriod,
  StockPricesDataDto,
  StockSearchItemDto,
} from '@/features/stock/types';

type StockListPeriod = NonNullable<StockListParams['period']>;
type StockListQuery = StockListParams;

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';
const STOCK_ID_CACHE_PREFIX = 'stock:id:';

const stockDetailCache = new Map<number, StockDetailDto>();
const stockDetailInflight = new Map<number, Promise<StockDetailDto>>();
const stockPricesCache = new Map<string, StockPricesDataDto>();
const stockPricesInflight = new Map<string, Promise<StockPricesDataDto>>();
const resolvedStockIdCache = new Map<string, number>();
const resolvedStockIdInflight = new Map<string, Promise<number | undefined>>();

function normalizeTicker(t: string): string {
  return t.replace(/\D/g, '').padStart(6, '0').slice(-6);
}

function getStockIdCacheKey(ticker: string): string {
  return `${STOCK_ID_CACHE_PREFIX}${normalizeTicker(ticker)}`;
}

function readSessionNumber(key: string): number | undefined {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeSessionNumber(key: string, value: number): void {
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    // ignore session storage failures
  }
}

function stockPricesKey(stockId: number, period: StockChartPeriod): string {
  return `${stockId}:${period}`;
}

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
  const key = stockPricesKey(stockId, period);
  const cached = stockPricesCache.get(key);
  if (cached) return cached;

  const inflight = stockPricesInflight.get(key);
  if (inflight) return inflight;

  const url = `${BASE_URL}/api/stocks/${stockId}/prices?period=${encodeURIComponent(period)}`;
  const request = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`fetchStockPrices failed: ${res.status}`);
    }
    const json = await res.json();

    if (json?.result?.candles && Array.isArray(json.result.candles)) {
      const data = {
        stockId: Number(json.result.stockId ?? stockId),
        period: String(json.result.period ?? period),
        candles: json.result.candles,
      };
      stockPricesCache.set(key, data);
      return data;
    }
    throw new Error('fetchStockPrices failed: invalid response shape');
  })();

  stockPricesInflight.set(key, request);
  try {
    return await request;
  } finally {
    stockPricesInflight.delete(key);
  }
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
  const cached = stockDetailCache.get(stockId);
  if (cached) return cached;

  const inflight = stockDetailInflight.get(stockId);
  if (inflight) return inflight;

  const url = `${BASE_URL}/api/stocks/${stockId}`;
  const request = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`fetchStockDetail failed: ${res.status}`);
    }
    const json = await res.json();
    const row = json?.result ?? json?.data;
    if (row && typeof row.stockId === 'number' && row.ticker) {
      const data = row as StockDetailDto;
      stockDetailCache.set(stockId, data);
      return data;
    }
    throw new Error('fetchStockDetail failed: invalid response shape');
  })();

  stockDetailInflight.set(stockId, request);
  try {
    return await request;
  } finally {
    stockDetailInflight.delete(stockId);
  }
}

export function getCachedStockIdByTicker(ticker: string): number | undefined {
  const normalized = normalizeTicker(ticker);
  const memoryHit = resolvedStockIdCache.get(normalized);
  if (memoryHit) return memoryHit;

  const sessionHit = readSessionNumber(getStockIdCacheKey(normalized));
  if (sessionHit) {
    resolvedStockIdCache.set(normalized, sessionHit);
    return sessionHit;
  }
  return undefined;
}

export async function resolveStockIdByTicker(
  ticker: string,
  limit = 20,
  signal?: AbortSignal
): Promise<number | undefined> {
  const normalized = normalizeTicker(ticker);
  const cached = getCachedStockIdByTicker(normalized);
  if (cached) return cached;

  const inflight = resolvedStockIdInflight.get(normalized);
  if (inflight) return inflight;

  const request = (async () => {
    const items = await fetchStockSearch(ticker, limit, signal);
    const exact = items.find((item) => normalizeTicker(item.ticker) === normalized);
    const resolved = exact?.stockId;
    if (resolved && resolved > 0) {
      resolvedStockIdCache.set(normalized, resolved);
      writeSessionNumber(getStockIdCacheKey(normalized), resolved);
    }
    return resolved;
  })();

  resolvedStockIdInflight.set(normalized, request);
  try {
    return await request;
  } finally {
    resolvedStockIdInflight.delete(normalized);
  }
}

/**
 * 기업 정보 탭 데이터 — Swagger: GET /api/stocks/{stockId}/company
 */
export async function fetchStockCompany(stockId: number): Promise<StockCompanyDto> {
  const url = `${BASE_URL}/api/stocks/${stockId}/company`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchStockCompany failed: ${res.status}`);
  }
  const json = await res.json();
  const row = json?.result ?? json?.data;
  if (row && typeof row.stockId === 'number' && row.ticker) {
    return row as StockCompanyDto;
  }
  throw new Error('fetchStockCompany failed: invalid response shape');
}
