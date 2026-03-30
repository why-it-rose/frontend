import type { StockListParams, StockListResponseDto } from '@/features/stock/types';

type StockListPeriod = NonNullable<StockListParams['period']>;
type StockListQuery = StockListParams;

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';

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

