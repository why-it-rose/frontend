import type { StockEvent } from "../types/event.types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// ─── 백엔드 응답 타입 ────────────────────────────────────────────────────────────

interface ApiNewsItem {
  newsId: number;
  title: string;
  source: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  relevanceScore: number;
}

export interface ApiEventItem {
  eventId: number;
  stockId: number;
  stockName: string;
  ticker: string;
  eventType: "SURGE" | "DROP";
  startDate: string;
  endDate: string;
  changePct: number;
  priceBefore: number;
  priceAfter: number;
}

interface ApiEventDetail extends ApiEventItem {
  summary: string | null;
  newsList: ApiNewsItem[];
}

interface ApiResponse<T> {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
}

// ─── 백엔드 → 프론트 타입 변환 ───────────────────────────────────────────────────

function toStockEvent(d: ApiEventDetail): StockEvent {
  return {
    eventId: d.eventId,
    stockCode: d.ticker,
    stockName: d.stockName,
    eventType: d.eventType === "DROP" ? "PLUNGE" : "SURGE",
    occurredAt: d.startDate,
    changeRate: Math.abs(d.changePct),
    priceBefore: d.priceBefore,
    priceAfter: d.priceAfter,
    aiSummary: d.summary ?? "",
    relatedNews: d.newsList.map((n) => ({
      newsId: n.newsId,
      title: n.title,
      body: "",
      source: n.source,
      publishedAt: n.publishedAt,
      url: n.url,
      tag: "",
    })),
    isScrapped: false,
  };
}

// ─── API 함수 ─────────────────────────────────────────────────────────────────

export async function fetchEvents(
  stockId: number,
  type?: "SURGE" | "DROP",
  page = 0,
  size = 9999,
): Promise<ApiEventItem[]> {
  const params = new URLSearchParams({
    stockId: String(stockId),
    page: String(page),
    size: String(size),
  });
  if (type) params.set("type", type);

  const res = await fetch(`${BASE_URL}/events?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`fetchEvents failed: ${res.status}`);
  const json: ApiResponse<ApiEventItem[]> = await res.json();
  if (!json.isSuccess) throw new Error(json.responseMessage);
  return json.result;
}

export async function fetchEventDetail(eventId: number): Promise<StockEvent> {
  const res = await fetch(`${BASE_URL}/events/${eventId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`fetchEventDetail failed: ${res.status}`);
  const json: ApiResponse<ApiEventDetail> = await res.json();
  if (!json.isSuccess) throw new Error(json.responseMessage);
  return toStockEvent(json.result);
}
