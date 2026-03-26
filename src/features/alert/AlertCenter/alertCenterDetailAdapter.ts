import type { AlertGroup, AlertItemRow, AlertTag } from './alertCenter.types';
import type { NotificationDetailResponse, NotificationStockGroup } from './notificationApi.types';

const STOCK_COLORS = ['#1428a0', '#EA1917', '#0f766e', '#7c3aed'] as const;

function initials(name: string): string {
  if (name.length >= 2 && /^[A-Za-z]/.test(name)) return name.slice(0, 2);
  return name.slice(0, 1);
}

function tagsFromStrings(tags: string[]): AlertTag[] {
  return tags.map((label) => ({ label, variant: 'solid' as const, tone: 'neutral' as const }));
}

function stockGroupToAlertGroup(sg: NotificationStockGroup, index: number, date: string, isToday: boolean): AlertGroup {
  const color = STOCK_COLORS[index % STOCK_COLORS.length];
  const items: AlertItemRow[] = [];

  for (const n of sg.newsItems) {
    items.push({
      dotColor: '#3b82f6',
      headline: n.title,
      chg: null,
      desc: n.source,
      tags: tagsFromStrings(n.tags),
    });
  }

  for (const e of sg.eventAlerts) {
    const sign = e.changeRate >= 0 ? '+' : '';
    items.push({
      dotColor: e.eventType === 'SURGE' ? '#ef4444' : '#2563eb',
      headline: `${e.eventType === 'SURGE' ? '급등' : '급락'} ${sign}${e.changeRate}%`,
      chg: `${sign}${e.changeRate}%`,
      desc: e.summary,
      tags: [{ label: '기업·실적', variant: 'solid', tone: 'neutral' }],
    });
  }

  if (sg.reviewAlert) {
    items.push({
      dotColor: '#f97316',
      headline: '📌 스크랩 이벤트 1개월 복기',
      chg: null,
      desc: sg.reviewAlert.message,
      tags: [{ label: '#스크랩 복기', variant: 'solid', tone: 'neutral' }],
    });
  }

  return {
    ini: initials(sg.name),
    color,
    name: sg.name,
    code: sg.ticker,
    badgeColor: '#dc2626',
    relativeTime: '',
    summaryLine: sg.eventSummary,
    items,
    date,
    isToday,
  };
}

export function isTodayNotifiedDate(isoDate: string): boolean {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return false;
  const t = new Date();
  return t.getFullYear() === y && t.getMonth() + 1 === m && t.getDate() === d;
}

/** GET /notifications/{id} 응답 → 세부 탭 그룹 (동일 날짜 섹션 1개) */
export function notificationDetailToAlertGroups(detail: NotificationDetailResponse): AlertGroup[] {
  const { notifiedDate, stockGroups } = detail;
  const isToday = isTodayNotifiedDate(notifiedDate);
  return stockGroups.map((sg, i) => stockGroupToAlertGroup(sg, i, notifiedDate, isToday));
}
