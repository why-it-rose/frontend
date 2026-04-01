import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { buildAuthQueryScope, interestStockKeys } from '@/shared/queryKeys';
import {
  addInterestStock,
  fetchInterestStocks,
  removeInterestStock,
} from '@/features/stock/api/interestStockApi';

export function useInterestStocksQuery() {
  const { isLoggedIn, user } = useAuth();
  const authScope = buildAuthQueryScope(isLoggedIn, user?.userId);

  return useQuery({
    queryKey: interestStockKeys.list(authScope),
    queryFn: fetchInterestStocks,
    enabled: isLoggedIn,
  });
}

export function useAddInterestStockMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addInterestStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: interestStockKeys.all }),
  });
}

export function useRemoveInterestStockMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeInterestStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: interestStockKeys.all }),
  });
}
