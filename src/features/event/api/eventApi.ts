import type { StockEvent } from '../types/event.types';
import apiClient from '@/shared/api/axios';

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

  const { data } = await apiClient.get<ApiResponse<ApiEventItem[]>>(`/events?${params.toString()}`);
  if (!data.isSuccess) throw new Error(data.responseMessage);
  return data.result;
}

export async function fetchEventDetail(eventId: number): Promise<StockEvent> {
  const { data } = await apiClient.get<ApiResponse<ApiEventDetail>>(`/events/${eventId}`);
  if (!data.isSuccess) throw new Error(data.responseMessage);
  return toStockEvent(data.result);
}

export async function addEventScrap(eventId: number): Promise<void> {
  try {
    await apiClient.post<ApiResponse<unknown>>(`/events/${eventId}/scraps`);
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: { responseCode?: number; responseMessage?: string } }; message?: string };
    const status = e.response?.status;
    const responseCode = e.response?.data?.responseCode;

    // 이미 스크랩 상태는 성공으로 간주
    if (status === 409 || responseCode === 4022) return;

    const wrapped = new Error(e.response?.data?.responseMessage || e.message || 'event request failed') as ScrapApiError;
    wrapped.responseCode = responseCode;
    throw wrapped;
  }
}

export async function removeEventScrap(eventId: number): Promise<void> {
  try {
    await apiClient.delete<ApiResponse<unknown>>(`/events/${eventId}/scraps`);
  } catch (error: unknown) {
    const e = error as { response?: { status?: number; data?: { responseCode?: number; responseMessage?: string } }; message?: string };
    const status = e.response?.status;
    const responseCode = e.response?.data?.responseCode;

    // 이미 미스크랩 상태는 성공으로 간주
    if (status === 404 || responseCode === 4020) return;

    const wrapped = new Error(e.response?.data?.responseMessage || e.message || 'event request failed') as ScrapApiError;
    wrapped.responseCode = responseCode;
    throw wrapped;
  }
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