/**
 * Notification API — `08_notification.md` 명세와 동기화
 * Base: `/api/notifications`
 */

/** 공통 래핑 응답 (성공 시) */
export interface ApiSuccessEnvelope<T> {
  code: string;
  message: string;
  data: T;
}

// --- 1. unread-count ---

export interface UnreadCountData {
  unreadCount: number;
}

// --- 2. GET /notifications (전체 탭 목록) ---

export type NotificationReadStatusFilter = 'READ' | 'UNREAD';

export interface NotificationListParams {
  stockId?: number;
  tagName?: string;
  startDate?: string;
  endDate?: string;
  readStatus?: NotificationReadStatusFilter;
  page?: number;
  size?: number;
}

export interface NotificationListStock {
  stockId: number;
  ticker: string;
  name: string;
  logoUrl: string;
  newsCount: number;
}

export interface NotificationListItem {
  notifiedDate: string;
  daysAgo: number;
  isRead: boolean;
  notificationId: number;
  stocks: NotificationListStock[];
}

export interface NotificationListData {
  page: number;
  size: number;
  totalCount: number;
  items: NotificationListItem[];
}

// --- 3. GET /notifications/{id} (세부) ---

export interface NotificationNewsItem {
  newsId: number;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags: string[];
}

export type EventAlertType = 'SURGE' | 'DROP' | string;

export interface NotificationEventAlert {
  eventId: number;
  eventType: EventAlertType;
  changeRate: number;
  summary: string;
}

export interface NotificationReviewAlert {
  eventId: number;
  changeRate: number;
  message: string;
}

export interface NotificationStockGroup {
  stockId: number;
  ticker: string;
  name: string;
  logoUrl: string;
  eventSummary: string;
  newsItems: NotificationNewsItem[];
  eventAlerts: NotificationEventAlert[];
  reviewAlert: NotificationReviewAlert | null;
}

export interface NotificationDetailData {
  notificationId: number;
  notifiedDate: string;
  stockGroups: NotificationStockGroup[];
}

// --- 4. PATCH /notifications/read ---

export interface NotificationReadRequest {
  notificationIds: number[];
}

export interface NotificationReadResult {
  updatedCount: number;
}

// --- 5. GET /notifications/history ---

export interface NotificationHistoryParams {
  stockId?: number;
  page?: number;
  size?: number;
}

export type NotificationHistoryType = 'NEWS' | 'EVENT' | 'REVIEW' | 'SYSTEM';

export interface NotificationHistoryItem {
  notificationId: number;
  type: NotificationHistoryType;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationHistoryGroup {
  date: string;
  label: string;
  items: NotificationHistoryItem[];
}

export interface NotificationHistoryData {
  page: number;
  size: number;
  totalCount: number;
  groups: NotificationHistoryGroup[];
}
