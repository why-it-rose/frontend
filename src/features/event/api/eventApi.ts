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

  const { data } = await apiClient.get<ApiResponse<ApiEventItem[]>>(`/api/events?${params.toString()}`);
  if (!data.isSuccess) throw new Error(data.responseMessage);
  return data.result;
}

export async function fetchEventDetail(eventId: number): Promise<StockEvent> {
  const { data } = await apiClient.get<ApiResponse<ApiEventDetail>>(`/api/events/${eventId}`);
  if (!data.isSuccess) throw new Error(data.responseMessage);
  return toStockEvent(data.result);
}
