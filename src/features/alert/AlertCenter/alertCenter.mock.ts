import type { NotificationDetailResponse, NotificationListItem } from './notificationApi.types';

export const ALERT_CENTER_NOTIFICATION_LIST: NotificationListItem[] = [
  {
    notifiedDate: '2026-03-10',
    daysAgo: 4,
    isRead: false,
    notificationId: 301,
    stocks: [
      {
        stockId: 11,
        ticker: '005930',
        name: '삼성전자',
        logoUrl: '',
        newsCount: 3,
      },
      {
        stockId: 2,
        ticker: '000660',
        name: 'SK하이닉스',
        logoUrl: '',
        newsCount: 2,
      },
    ],
  },
  {
    notifiedDate: '2026-03-09',
    daysAgo: 5,
    isRead: true,
    notificationId: 295,
    stocks: [
      {
        stockId: 11,
        ticker: '005930',
        name: '삼성전자',
        logoUrl: '',
        newsCount: 2,
      },
    ],
  },
];

/**
 * 전체 목록의 알림을 모두 처리한 상태인지.
 * - 「전체 읽음 처리」로 일괄 처리했거나
 * - 목록에 보이는 모든 notificationId에 대해 세부 알림을 끝까지 읽음
 */
export function alertCenterListFullyRead(
  allListMarkedRead: boolean,
  detailFullyReadIds: ReadonlySet<number>,
): boolean {
  if (allListMarkedRead) return true;
  return ALERT_CENTER_NOTIFICATION_LIST.every((item) =>
    detailFullyReadIds.has(item.notificationId),
  );
}

/** 헤더 종 아이콘 등 — 위가 아니면 미읽음 */
export function alertCenterListHasUnread(
  allListMarkedRead: boolean,
  detailFullyReadIds: ReadonlySet<number>,
): boolean {
  return !alertCenterListFullyRead(allListMarkedRead, detailFullyReadIds);
}

/** GET /api/notifications/{notificationId} — 세부 탭 목업 */
export const NOTIFICATION_DETAIL_MOCK: Record<number, NotificationDetailResponse> = {
  301: {
    notificationId: 301,
    notifiedDate: '2026-03-15',
    stockGroups: [
      {
        stockId: 11,
        ticker: '005930',
        name: '삼성전자',
        logoUrl: '',
        eventSummary: '급등 +19.47% · HBM 납품 외 2건',
        newsItems: [
          {
            newsId: 201,
            title: '외국인, 삼성전자 3일 연속 순매수 2조원 돌파',
            source: '연합인포맥스',
            url: 'https://example.com',
            publishedAt: '2026-03-15T09:30:00',
            tags: ['외국인 매수', 'HBM'],
          },
        ],
        eventAlerts: [
          {
            eventId: 42,
            eventType: 'SURGE',
            changeRate: 19.47,
            summary: 'HBM3E 납품 재개 기대감으로 외국인 매수세 집중.',
          },
        ],
        reviewAlert: {
          eventId: 35,
          changeRate: 6.81,
          message:
            '+6.81% 이벤트를 스크랩한 지 1개월이 됐어요. 당시 예측이 맞았는지 확인해보세요.',
        },
      },
      {
        stockId: 2,
        ticker: '000660',
        name: 'SK하이닉스',
        logoUrl: '',
        eventSummary: '급락 -8.23% · 기업·실적 외 1건',
        newsItems: [
          {
            newsId: 205,
            title: 'SK하이닉스, 4분기 실적 전망치 하향 조정',
            source: '연합인포맥스',
            url: 'https://example.com',
            publishedAt: '2026-03-15T08:00:00',
            tags: ['기업', '실적', 'HBM'],
          },
        ],
        eventAlerts: [
          {
            eventId: 38,
            eventType: 'DROP',
            changeRate: -8.23,
            summary: '4분기 실적 전망 하향 조정 및 HBM 납품 지연 우려로 외국인 매도세 집중.',
          },
        ],
        reviewAlert: null,
      },
    ],
  },
  295: {
    notificationId: 295,
    notifiedDate: '2026-03-09',
    stockGroups: [
      {
        stockId: 11,
        ticker: '005930',
        name: '삼성전자',
        logoUrl: '',
        eventSummary: '관심 뉴스 2건',
        newsItems: [
          {
            newsId: 180,
            title: '삼성전자, 차세대 파운드리 로드맵 발표',
            source: '매일경제',
            url: 'https://example.com',
            publishedAt: '2026-03-09T10:00:00',
            tags: ['반도체'],
          },
        ],
        eventAlerts: [],
        reviewAlert: null,
      },
    ],
  },
};

export function getNotificationDetailMock(notificationId: number): NotificationDetailResponse | null {
  return NOTIFICATION_DETAIL_MOCK[notificationId] ?? null;
}
