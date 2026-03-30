import type { RelatedNews } from '@/features/event/types/event.types';

export type VoteType = '상승' | '횡보' | '하락' | null;

export interface TodayNews {
  newsId: number;
  stockCode: string;
  stockName: string;
  eventType: 'SURGE' | 'PLUNGE';
  occurredAt: string; // ISO string
  changeRate: number;
  priceBefore: number;
  priceAfter: number;
  aiSummary: string;
  relatedNews: RelatedNews[];
}
