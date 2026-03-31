import { useQuery } from '@tanstack/react-query';
import { fetchLearningPin } from '@/features/news/api/learningApi';
import { stockLearningKeys } from '@/shared/queryKeys';

export function useLearningPin(stockId: number | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: stockLearningKeys.pin(stockId ?? 0),
    queryFn: () => fetchLearningPin(stockId!),
    enabled: stockId != null && stockId > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
  };
}
