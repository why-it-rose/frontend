import { useQuery } from '@tanstack/react-query';
import { getNotificationDetail } from '@/shared/api/notifications/notificationApi';
import { notificationKeys } from '@/shared/queryKeys';

interface UseNotificationDetailParams {
  days?: number;
  stockId?: number;
  read?: boolean;
  enabled?: boolean;
}

export const useNotificationDetail = ({
  days,
  stockId,
  read,
  enabled = true,
}: UseNotificationDetailParams = {}) => {
  const params = { days, stockId, read };

  const { data, isLoading, isError } = useQuery({
    queryKey: notificationKeys.detail(params),
    queryFn: () => getNotificationDetail(params),
    staleTime: 30 * 1000,
    enabled,
  });

  return {
    data: data ?? [],
    isLoading,
    isError,
  };
};
