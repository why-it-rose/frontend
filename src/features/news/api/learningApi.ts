import type { LearningPinResult, TodayLearningResult } from '@/features/news/types/news.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

/**
 * 차트 핀 표시용 — 인증 불필요
 * GET /api/stocks/{stockId}/learning-pin
 * - 200: LearningPinResult 반환
 * - 204: null 반환 (해당 종목 뉴스 없음)
 */
export async function fetchLearningPin(stockId: number): Promise<LearningPinResult | null> {
  const res = await fetch(`${BASE_URL}/api/stocks/${stockId}/learning-pin`, {
    credentials: 'include',
  });

  if (res.status === 204) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`fetchLearningPin failed: ${res.status}`);
  }

  const json = await res.json();
  return json.result as LearningPinResult;
}

/**
 * 핀 클릭 시 사이드바용 — 선택적 인증 (쿠키 기반)
 * GET /api/stocks/{stockId}/today-learning
 * - 200: TodayLearningResult 반환
 * - 204: null 반환 (해당 종목 뉴스 없음)
 */
export async function fetchTodayLearning(stockId: number): Promise<TodayLearningResult | null> {
  const res = await fetch(`${BASE_URL}/api/stocks/${stockId}/today-learning`, {
    credentials: 'include',
  });

  if (res.status === 204) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`fetchTodayLearning failed: ${res.status}`);
  }

  const json = await res.json();
  return json.result as TodayLearningResult;
}
