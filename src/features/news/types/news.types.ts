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

// 오늘의 학습 핀 (GET /api/stocks/{stockId}/learning-pin)
export interface LearningPinResult {
  digestDate: string; // "yyyy-MM-dd"
  newsCount: number;
}

// 오늘의 학습 사이드바 (GET /api/stocks/{stockId}/today-learning)
export interface PredictionInfo {
  predictionId: number;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  reason: string;
}

export interface LearningNewsItem {
  newsId: number;
  title: string;
  summary: string;
  source: string;
  publishedAt: string; // "yyyy.MM.dd"
  url: string;
  tags: string[];
}

export interface TodayLearningResult {
  digestDate: string;          // "yyyy.MM.dd (요일)"
  stockName: string;
  changeRate?: string;         // "+1.23%" / "-2.76%", 키 자체가 없을 수 있음
  priceClose?: number;
  prevPriceClose?: number;
  prediction?: PredictionInfo; // 키 자체가 없을 수 있음
  newsList: LearningNewsItem[];
}
