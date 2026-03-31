export type EventType = 'SURGE' | 'PLUNGE';

export interface StockMemo {
  memoId: number;
  content: string;
  createdAt: string; // ISO: "2026-03-16T10:30:00"
}

export type VoteType = '상승' | '횡보' | '하락' | null;

export interface RelatedNews {
  newsId: number;
  title: string;
  body: string;
  source: string;
  publishedAt: string; // ISO string
  url: string;
  tags: string[];
}

export interface StockEvent {
  eventId: number;
  stockCode: string;
  stockName: string;
  eventType: EventType;
  occurredAt: string; // ISO string
  changeRate: number; // e.g. 17.2
  priceBefore: number;
  priceAfter: number;
  aiSummary: string;
  relatedNews: RelatedNews[];
  isScrapped: boolean;
}
