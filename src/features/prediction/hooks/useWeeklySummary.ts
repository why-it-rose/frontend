import { useQuery } from '@tanstack/react-query';
import { getWeeklySummary } from '../api/predictionApi';
import { predictionKeys } from '@/shared/queryKeys';

export function useWeeklySummary() {
  return useQuery({
    queryKey: predictionKeys.weeklySummary(),
    queryFn: getWeeklySummary,
  });
}
