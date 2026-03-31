import type { StockEvent } from '../types/event.types';
import apiClient from '@/shared/api/axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

interface ApiNewsItem {
  newsId: number;
  title: string;
  source: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  relevanceScore: number;
  tags?: string[];
}

export interface ApiEventItem {
  eventId: number;
  stockId: number;
  stockName: string;
  ticker: string;
  eventType: 'SURGE' | 'DROP';
  startDate: string;
  endDate: string;
  changePct: number;
  priceBefore: number;
  priceAfter: number;
}

interface ApiEventDetail extends ApiEventItem {
  summary: string | null;
  newsList: ApiNewsItem[];
  isScrapped?: boolean;
  scrapped?: boolean;
}

interface ApiResponse<T> {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
}

function toStockEvent(d: ApiEventDetail): StockEvent {
  return {
    eventId: d.eventId,
    stockCode: d.ticker,
    stockName: d.stockName,
    eventType: d.eventType === 'DROP' ? 'PLUNGE' : 'SURGE',
    occurredAt: d.startDate,
    changeRate: Math.abs(d.changePct),
    priceBefore: d.priceBefore,
    priceAfter: d.priceAfter,
    aiSummary: d.summary ?? '',
    relatedNews: d.newsList.map((n) => ({
      newsId: n.newsId,
      title: n.title,
      body: '',
      source: n.source,
      publishedAt: n.publishedAt,
      url: n.url,
      tags: n.tags ?? [],
    })),
    isScrapped: d.isScrapped ?? d.scrapped ?? false,
  };
}

async function ensureApiSuccess(
    res: Response,
    ignoreResponseCodes: number[] = [],
    ignoreHttpStatuses: number[] = [],
): Promise<void> {
  const text = await res.text();
  let json: ApiResponse<unknown> | null = null;

  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<unknown>;
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    if (ignoreHttpStatuses.includes(res.status)) return;
    if (json && ignoreResponseCodes.includes(json.responseCode)) return;
    const e = new Error(json?.responseMessage || `event request failed: ${res.status}`) as ScrapApiError;
    if (json) e.responseCode = json.responseCode;
    throw e;
  }

  if (res.status === 204 || !json) return;

  if (ignoreResponseCodes.includes(json.responseCode)) return;
  if (typeof json.isSuccess === 'boolean' && !json.isSuccess) {
    const e = new Error(json.responseMessage || 'event request failed') as ScrapApiError;
    e.responseCode = json.responseCode;
    throw e;
  }
}

export async function fetchEvents(
    stockId: number,
    type?: 'SURGE' | 'DROP',
    page = 0,
    size = 9999,
): Promise<ApiEventItem[]> {
  const params = new URLSearchParams({
    stockId: String(stockId),
    page: String(page),
    size: String(size),
  });

  if (type) params.set('type', type);

  const res = await fetch(`${BASE_URL}/events?${params.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`fetchEvents failed: ${res.status}`);

  const json: ApiResponse<ApiEventItem[]> = await res.json();
  if (!json.isSuccess) throw new Error(json.responseMessage);

  return json.result;
}

export async function fetchEventDetail(eventId: number): Promise<StockEvent> {
  const res = await fetch(`${BASE_URL}/events/${eventId}`, {
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`fetchEventDetail failed: ${res.status}`);

  const json: ApiResponse<ApiEventDetail> = await res.json();
  if (!json.isSuccess) throw new Error(json.responseMessage);

  return toStockEvent(json.result);
}

export async function addEventScrap(eventId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/scraps`, {
    method: 'POST',
    credentials: 'include',
  });

  await ensureApiSuccess(res, [4022], [409]);
}

export async function removeEventScrap(eventId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/events/${eventId}/scraps`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await ensureApiSuccess(res, [4020], [404]);
}

export type ScrapEventDto = {
  eventId: number;
  stockName: string;
  ticker: string;
  eventType: 'SURGE' | 'DROP' | string;
  startDate: string;
  changePct: number;
  isScrapped?: boolean;
  scrapped?: boolean;
};

export type ScrapApiError = Error & { responseCode?: number };

export async function fetchMyScraps(): Promise<ScrapEventDto[]> {
  const { data } = await apiClient.get<ApiResponse<
      ScrapEventDto[] | { items?: ScrapEventDto[]; content?: ScrapEventDto[]; scraps?: ScrapEventDto[] }
  >>('/scraps/my');

  if (!data?.isSuccess) {
    const e = new Error(data?.responseMessage || '스크랩 목록 조회 실패') as ScrapApiError;
    e.responseCode = data?.responseCode;
    throw e;
  }

  const result = data.result;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.scraps)) return result.scraps;
  return [];
}

export async function addScrap(eventId: number): Promise<void> {
  try {
    await addEventScrap(eventId);
  } catch (error: unknown) {
    throw error as ScrapApiError;
  }
}

export async function removeScrap(eventId: number): Promise<void> {
  try {
    await removeEventScrap(eventId);
  } catch (error: unknown) {
    throw error as ScrapApiError;
  }
}
