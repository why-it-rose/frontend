import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  addInterestStock,
  fetchInterestStocks,
  removeInterestStock,
} from '@/features/stock/api/interestStockApi';

export const INTEREST_STOCKS_QUERY_KEY = ['interest-stocks'] as const;

export function useInterestStocksQuery() {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: INTEREST_STOCKS_QUERY_KEY,
    queryFn: fetchInterestStocks,
    enabled: isLoggedIn,
  });
}

export function useAddInterestStockMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addInterestStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEREST_STOCKS_QUERY_KEY }),
  });
}

export function useRemoveInterestStockMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeInterestStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEREST_STOCKS_QUERY_KEY }),
  });
}
