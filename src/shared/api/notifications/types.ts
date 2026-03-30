/**
 * Notification API 타입 정의
 * Base: /api/notifications
 */

// 공통 응답 래퍼
export interface ApiResponse<T> {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
}

// 알림 요약 아이템 (GET /api/notifications/summary)
export interface NotificationSummaryItem {
  notificationId: number;
  date: string;         // "yyyy.MM.dd"
  stockNames: string;   // "삼성전자, SK하이닉스" 또는 "삼성전자 외 N개"
  relativeTime: string; // "오늘", "1일 전", "N일 전"
  message: string;      // **bold** 마크다운 포함
  isRead: boolean;
}

// 뉴스 아이템
export interface NewsItem {
  newsId: number;
  title: string;
  summary: string;
  publishedAt: string; // "yyyy.MM.dd HH:mm"
  source: string;
  url: string;
  tags: string[];
}

// 종목별 뉴스 그룹
export interface StockNewsGroup {
  stockId: number;
  stockName: string;
  ticker: string;
  newsCount: number;
  newsList: NewsItem[];
}

// 알림 세부 아이템 (GET /api/notifications)
export interface NotificationDetailItem {
  date: string;
  notificationId: number;
  isRead: boolean;
  stocks: StockNewsGroup[];
}

// 미읽음 수 (GET /api/notifications/unread-count)
export interface UnreadCountResult {
  count: number;
}
