import apiClient from '@/shared/api/axios';
import type {
  MyStatsDto,
  PredictionDto,
  PredictionPageResult,
  PredictionStatusDto,
  UpsertPredictionBody,
  WeeklySummaryDto,
} from '../types/prediction.types';

type BaseResponse<T> = {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
};

export async function upsertPrediction(body: UpsertPredictionBody): Promise<PredictionDto> {
  const res = await apiClient.post<BaseResponse<PredictionDto>>('/api/predictions', body);
  return res.data.result;
}

export async function getPredictionStatus(
  digestId: number,
  stockId: number,
): Promise<PredictionStatusDto> {
  const res = await apiClient.get<BaseResponse<PredictionStatusDto>>(
    `/api/predictions/digest/${digestId}/stocks/${stockId}`,
  );
  return res.data.result;
}

export async function getPredictions(
  cursor?: number,
  size = 10,
): Promise<PredictionPageResult> {
  const params: Record<string, unknown> = { size };
  if (cursor !== undefined) params.cursor = cursor;
  const res = await apiClient.get<BaseResponse<PredictionPageResult>>('/api/predictions', {
    params,
  });
  return res.data.result;
}

export async function getMyStats(): Promise<MyStatsDto> {
  const res = await apiClient.get<BaseResponse<MyStatsDto>>('/api/me/stats');
  return res.data.result;
}

export async function getWeeklySummary(): Promise<WeeklySummaryDto> {
  const res = await apiClient.get<BaseResponse<WeeklySummaryDto>>('/api/me/weekly-summary');
  return res.data.result;
}
