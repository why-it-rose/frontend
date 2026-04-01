import type { QueryClient } from '@tanstack/react-query';
import {
  interestStockKeys,
  notificationKeys,
  predictionKeys,
  stockLearningKeys,
} from '@/shared/queryKeys';

export async function invalidateAuthTransitionQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: stockLearningKeys.all }),
    queryClient.invalidateQueries({ queryKey: interestStockKeys.all }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    queryClient.invalidateQueries({ queryKey: predictionKeys.myStats() }),
  ]);
}

export async function clearAuthTransitionQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: stockLearningKeys.all }),
    queryClient.cancelQueries({ queryKey: interestStockKeys.all }),
    queryClient.cancelQueries({ queryKey: notificationKeys.all }),
    queryClient.cancelQueries({ queryKey: predictionKeys.myStats() }),
  ]);

  queryClient.removeQueries({ queryKey: stockLearningKeys.all });
  queryClient.removeQueries({ queryKey: interestStockKeys.all });
  queryClient.removeQueries({ queryKey: notificationKeys.all });
  queryClient.removeQueries({ queryKey: predictionKeys.myStats() });
}
