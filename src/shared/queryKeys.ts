export function buildAuthQueryScope(
  isLoggedIn: boolean,
  userId?: number | null,
) {
  return isLoggedIn ? `user:${userId ?? 'unknown'}` : 'guest';
}

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
  all: ['stock-learning'] as const,
  pin: (stockId: number, authScope: string) =>
    [...stockLearningKeys.all, 'pin', stockId, authScope] as const,
  today: (stockId: number, authScope: string) =>
    [...stockLearningKeys.all, 'today', stockId, authScope] as const,
};

export const interestStockKeys = {
  all: ['interest-stocks'] as const,
  list: (authScope: string) =>
    [...interestStockKeys.all, authScope] as const,
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
