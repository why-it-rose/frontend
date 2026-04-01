import type { StockMemo } from '../types/event.types';
import apiClient from '@/shared/api/axios';

interface ApiResponse<T> {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
}

export async function fetchMemos(eventId: number): Promise<StockMemo[]> {
  const { data } = await apiClient.get<ApiResponse<StockMemo[]>>(`/api/events/${eventId}/memos`);
  if (!data.isSuccess) throw new Error(data.responseMessage);
  return data.result;
}

export async function createMemo(eventId: number, content: string): Promise<StockMemo> {
  const { data } = await apiClient.post<ApiResponse<StockMemo>>(`/api/events/${eventId}/memos`, { content });
  if (!data.isSuccess) throw new Error(data.responseMessage);
  return data.result;
}

export async function updateMemo(memoId: number, content: string): Promise<StockMemo> {
  const { data } = await apiClient.put<ApiResponse<StockMemo>>(`/api/memos/${memoId}`, { content });
  if (!data.isSuccess) throw new Error(data.responseMessage);
  return data.result;
}

export async function deleteMemo(memoId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`/api/memos/${memoId}`);
  if (!data.isSuccess) throw new Error(data.responseMessage);
}
