import apiClient from '@/shared/api/axios';
import type {
  ApiResponse,
  NotificationSummaryItem,
  NotificationDetailItem,
  UnreadCountResult,
} from './types';

// 1. 알림 요약 목록 조회
// GET /api/notifications/summary?days={days}
export const getNotificationSummary = async (
  days?: number
): Promise<NotificationSummaryItem[]> => {
  const { data } = await apiClient.get<ApiResponse<NotificationSummaryItem[]>>(
    '/api/notifications/summary',
    { params: days !== undefined ? { days } : undefined }
  );
  return data.result;
};

// 2. 알림 세부 목록 조회
// GET /api/notifications?days={days}&stockId={stockId}&read={read}
export const getNotificationDetail = async (params?: {
  days?: number;
  stockId?: number;
  read?: boolean;
}): Promise<NotificationDetailItem[]> => {
  const { data } = await apiClient.get<ApiResponse<NotificationDetailItem[]>>(
    '/api/notifications',
    { params }
  );
  return data.result;
};

// 3. 미읽음 알림 수 조회
// GET /api/notifications/unread-count
export const getUnreadCount = async (): Promise<UnreadCountResult> => {
  const { data } = await apiClient.get<ApiResponse<UnreadCountResult>>(
    '/api/notifications/unread-count'
  );
  return data.result;
};

// 4. 개별 알림 읽음 처리
// PATCH /api/notifications/{notificationId}/read
export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await apiClient.patch(`/api/notifications/${notificationId}/read`);
};

// 5. 전체 알림 읽음 처리
// PATCH /api/notifications/read-all
export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.patch('/api/notifications/read-all');
};
