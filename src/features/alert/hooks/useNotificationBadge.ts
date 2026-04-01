import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getUnreadCount } from '@/shared/api/notifications/notificationApi';
import { notificationKeys } from '@/shared/queryKeys';

export const useNotificationBadge = () => {
  const { isLoggedIn } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  return {
    count: data?.count ?? 0,
    isLoading,
    isError,
  };
};
