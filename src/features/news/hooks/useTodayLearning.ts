import { useQuery } from '@tanstack/react-query';
import { fetchTodayLearning } from '@/features/news/api/learningApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { buildAuthQueryScope, stockLearningKeys } from '@/shared/queryKeys';

export function useTodayLearning(stockId: number | undefined, enabled: boolean) {
  const { isLoggedIn, user } = useAuth();
  const authScope = buildAuthQueryScope(isLoggedIn, user?.userId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: stockLearningKeys.today(stockId ?? 0, authScope),
    queryFn: () => fetchTodayLearning(stockId!),
    enabled: enabled && stockId != null && stockId > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
    refetch,
  };
}
