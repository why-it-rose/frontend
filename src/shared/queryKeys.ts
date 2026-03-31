export const predictionKeys = {
  lists: () => ['predictions', 'list'] as const,
  list: (cursor?: number, size?: number) =>
    [...predictionKeys.lists(), { cursor, size }] as const,
  status: (digestId: number, stockId: number) =>
    ['predictions', 'status', digestId, stockId] as const,
  myStats: () => ['me', 'stats'] as const,
  weeklySummary: () => ['me', 'weekly-summary'] as const,
};

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
