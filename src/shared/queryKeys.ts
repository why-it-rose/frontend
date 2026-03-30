export const notificationKeys = {
  all: ['notifications'] as const,
  summary: (days?: number) =>
    [...notificationKeys.all, 'summary', { days }] as const,
  detail: (params?: { days?: number; stockId?: number; read?: boolean }) =>
    [...notificationKeys.all, 'detail', params] as const,
  unreadCount: () =>
    [...notificationKeys.all, 'unreadCount'] as const,
};
