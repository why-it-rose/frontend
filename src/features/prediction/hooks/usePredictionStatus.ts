import { useQuery } from '@tanstack/react-query';
import { getPredictionStatus } from '../api/predictionApi';
import { predictionKeys } from '@/shared/queryKeys';

export function usePredictionStatus(digestId: number, stockId: number) {
  return useQuery({
    queryKey: predictionKeys.status(digestId, stockId),
    queryFn: () => getPredictionStatus(digestId, stockId),
    enabled: digestId > 0 && stockId > 0,
  });
}
