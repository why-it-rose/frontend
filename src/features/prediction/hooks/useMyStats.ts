import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyStats } from '../api/predictionApi';
import { predictionKeys } from '@/shared/queryKeys';
import type { MyStatsDto } from '../types/prediction.types';
import { subscribeScrapSync } from '@/features/scrap/scrapSync';

export function useMyStats() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: predictionKeys.myStats(),
    queryFn: getMyStats,
  });

  useEffect(() => {
    return subscribeScrapSync(({ delta }) => {
      queryClient.setQueryData<MyStatsDto | undefined>(predictionKeys.myStats(), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalScraps: Math.max(0, prev.totalScraps + delta),
        };
      });
      void queryClient.invalidateQueries({ queryKey: predictionKeys.myStats() });
    });
  }, [queryClient]);

  return query;
}
