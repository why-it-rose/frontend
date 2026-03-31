export type PredictionDirection = 'UP' | 'DOWN' | 'SIDEWAYS';

export interface PredictionDto {
  id: number;
  digestId: number;
  stockId: number;
  stockName: string;
  stockTicker: string;
  stockLogoUrl: string | null;
  direction: PredictionDirection;
  reason: string | null;
  actualChangePct: number | null;
  isCorrect: boolean | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface PredictionStatusDto {
  id: number | null;
  direction: PredictionDirection | null;
  reason: string | null;
  canPredict: boolean;
}

export interface PredictionGroup {
  digestDate: string;
  predictions: PredictionDto[];
}

export interface PredictionPageResult {
  groups: PredictionGroup[];
  nextCursor: number | null;
  hasNext: boolean;
}

export interface UpsertPredictionBody {
  digestId: number;
  stockId: number;
  direction: PredictionDirection;
  reason?: string;
}

export interface MyStatsDto {
  totalPredictions: number;
  correctPredictions: number;
  predictionAccuracy: number | null;
  totalScraps: number;
}

export interface WeeklySummaryDto {
  weeklyTotal: number;
  weeklyCorrect: number;
  weeklyAccuracy: number | null;
}
