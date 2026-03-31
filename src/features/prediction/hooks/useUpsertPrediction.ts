import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertPrediction } from '../api/predictionApi';
import { predictionKeys } from '@/shared/queryKeys';
import type { UpsertPredictionBody } from '../types/prediction.types';

export function useUpsertPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpsertPredictionBody) => upsertPrediction(body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: predictionKeys.status(variables.digestId, variables.stockId),
      });
      void queryClient.invalidateQueries({
        queryKey: predictionKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: predictionKeys.myStats(),
      });
    },
  });
}
