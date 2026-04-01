import { useQuery } from '@tanstack/react-query';
import { fetchLearningPin } from '@/features/news/api/learningApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { buildAuthQueryScope, stockLearningKeys } from '@/shared/queryKeys';

export function useLearningPin(stockId: number | undefined) {
  const { isLoggedIn, user } = useAuth();
  const authScope = buildAuthQueryScope(isLoggedIn, user?.userId);

  const { data, isLoading, isError } = useQuery({
    queryKey: stockLearningKeys.pin(stockId ?? 0, authScope),
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
