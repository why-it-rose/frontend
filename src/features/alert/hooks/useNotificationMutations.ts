import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/shared/api/notifications/notificationApi';
import { notificationKeys } from '@/shared/queryKeys';

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
