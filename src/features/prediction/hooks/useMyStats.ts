import { useQuery } from '@tanstack/react-query';
import { getMyStats } from '../api/predictionApi';
import { predictionKeys } from '@/shared/queryKeys';

export function useMyStats() {
  return useQuery({
    queryKey: predictionKeys.myStats(),
    queryFn: getMyStats,
  });
}
