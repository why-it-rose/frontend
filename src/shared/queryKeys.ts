export const stockLearningKeys = {
  pin: (stockId: number) => ['stock', stockId, 'learning-pin'] as const,
  today: (stockId: number) => ['stock', stockId, 'today-learning'] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  summary: (days?: number) =>
    [...notificationKeys.all, 'summary', { days }] as const,
  detail: (params?: { days?: number; stockId?: number; read?: boolean }) =>
    [...notificationKeys.all, 'detail', params] as const,
  unreadCount: () =>
    [...notificationKeys.all, 'unreadCount'] as const,
};
