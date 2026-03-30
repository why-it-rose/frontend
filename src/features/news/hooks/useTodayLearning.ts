import { useQuery } from '@tanstack/react-query';
import { fetchTodayLearning } from '@/features/news/api/learningApi';
import { stockLearningKeys } from '@/shared/queryKeys';

export function useTodayLearning(stockId: number | undefined, enabled: boolean) {
  const { data, isLoading, isError } = useQuery({
    queryKey: stockLearningKeys.today(stockId ?? 0),
    queryFn: () => fetchTodayLearning(stockId!),
    enabled: enabled && stockId != null && stockId > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
  };
}
