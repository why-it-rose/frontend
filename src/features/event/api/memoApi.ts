import type { StockMemo } from '../types/event.types';

const BASE_URL = '';

interface ApiResponse<T> {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) throw new Error(`${options?.method ?? 'GET'} ${url} failed: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.isSuccess) throw new Error(json.responseMessage);
  return json.result;
}

export async function fetchMemos(eventId: number): Promise<StockMemo[]> {
  return request<StockMemo[]>(`${BASE_URL}/events/${eventId}/memos`);
}

export async function createMemo(eventId: number, content: string): Promise<StockMemo> {
  return request<StockMemo>(`${BASE_URL}/events/${eventId}/memos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function updateMemo(memoId: number, content: string): Promise<StockMemo> {
  return request<StockMemo>(`${BASE_URL}/memos/${memoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export async function deleteMemo(memoId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/memos/${memoId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`DELETE /memos/${memoId} failed: ${res.status}`);
}
