import { useInfiniteQuery } from '@tanstack/react-query';
import { getPredictions } from '../api/predictionApi';
import { predictionKeys } from '@/shared/queryKeys';

export function usePredictions(size = 10) {
  return useInfiniteQuery({
    queryKey: predictionKeys.list(undefined, size),
    queryFn: ({ pageParam }) =>
      getPredictions(pageParam as number | undefined, size),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}
