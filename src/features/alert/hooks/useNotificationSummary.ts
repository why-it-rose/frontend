import { useQuery } from '@tanstack/react-query';
import { getNotificationSummary } from '@/shared/api/notifications/notificationApi';
import { notificationKeys } from '@/shared/queryKeys';

export const useNotificationSummary = (days?: number) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: notificationKeys.summary(days),
    queryFn: () => getNotificationSummary(days),
    staleTime: 30 * 1000,
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
  };
};
