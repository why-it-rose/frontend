/**
 * GET /api/notifications, GET /api/notifications/{id}, PATCH /api/notifications/read
 * @see 08_notification (1).md
 */

export type NotificationStockInList = {
  stockId: number;
  ticker: string;
  name: string;
  logoUrl: string | null;
  newsCount: number;
};

/** GET /api/notifications — items[] */
export type NotificationListItem = {
  notifiedDate: string;
  daysAgo: number;
  isRead: boolean;
  notificationId: number;
  stocks: NotificationStockInList[];
};

export type NotificationNewsItem = {
  newsId: number;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags: string[];
};

export type NotificationEventAlert = {
  eventId: number;
  eventType: 'SURGE' | 'DROP' | string;
  changeRate: number;
  summary: string;
};

export type NotificationReviewAlert = {
  eventId: number;
  changeRate: number;
  message: string;
};

export type NotificationStockGroup = {
  stockId: number;
  ticker: string;
  name: string;
  logoUrl: string | null;
  eventSummary: string;
  newsItems: NotificationNewsItem[];
  eventAlerts: NotificationEventAlert[];
  reviewAlert: NotificationReviewAlert | null;
};

/** GET /api/notifications/{notificationId} — data */
export type NotificationDetailResponse = {
  notificationId: number;
  notifiedDate: string;
  stockGroups: NotificationStockGroup[];
};
