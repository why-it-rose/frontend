import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/shared/api/notifications/notificationApi';
import { notificationKeys } from '@/shared/queryKeys';

export const useNotificationBadge = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  return {
    count: data?.count ?? 0,
    isLoading,
    isError,
  };
};
