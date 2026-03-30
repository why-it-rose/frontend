import apiClient from '@/shared/api/axios';
import type { InterestStockItemDto } from '@/features/stock/types';

type ApiEnvelope<T> = {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
};

/**
 * 관심 종목 목록 — GET /api/me/interest-stocks
 */
export async function fetchInterestStocks(): Promise<InterestStockItemDto[]> {
  const { data } = await apiClient.get<ApiEnvelope<{ items: InterestStockItemDto[] }>>(
    '/api/me/interest-stocks'
  );
  const items = data?.result?.items;
  return Array.isArray(items) ? items : [];
}

/**
 * 관심 종목 추가 — POST /api/me/interest-stocks
 */
export async function addInterestStock(stockId: number): Promise<void> {
  await apiClient.post<ApiEnvelope<Record<string, unknown>>>('/api/me/interest-stocks', {
    stockId,
  });
}

/**
 * 관심 종목 제거 — DELETE /api/me/interest-stocks/{stockId}
 */
export async function removeInterestStock(stockId: number): Promise<void> {
  await apiClient.delete<ApiEnvelope<Record<string, unknown>>>(`/api/me/interest-stocks/${stockId}`);
}
