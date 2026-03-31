import type { AlertGroup, AlertItemRow, AlertTag } from './alertCenter.types';
import type { NotificationDetailItem, StockNewsGroup } from '@/shared/api/notifications/types';

const STOCK_COLORS = ['#1428a0', '#EA1917', '#0f766e', '#7c3aed'] as const;

function initials(name: string): string {
  if (name.length >= 2 && /^[A-Za-z]/.test(name)) return name.slice(0, 2);
  return name.slice(0, 1);
}

function tagsFromStrings(tags: string[]): AlertTag[] {
  return tags.map((label) => ({ label, variant: 'solid' as const, tone: 'neutral' as const }));
}

function stockGroupToAlertGroup(sg: StockNewsGroup, index: number, date: string, isToday: boolean): AlertGroup {
  const color = STOCK_COLORS[index % STOCK_COLORS.length];
  const items: AlertItemRow[] = sg.newsList.map((n) => ({
    dotColor: '#3b82f6',
    headline: n.title,
    chg: null,
    desc: n.source,
    tags: tagsFromStrings(n.tags),
  }));

  return {
    ini: initials(sg.stockName),
    color,
    name: sg.stockName,
    code: sg.ticker,
    badgeColor: '#dc2626',
    relativeTime: '',
    summaryLine: `뉴스 ${sg.newsCount}건`,
    items,
    date,
    isToday,
    logoUrl: sg.logoUrl ?? null,
  };
}

// date format: "yyyy.MM.dd"
export function isTodayNotifiedDate(date: string): boolean {
  const [y, m, d] = date.split('.').map(Number);
  if (!y || !m || !d) return false;
  const t = new Date();
  return t.getFullYear() === y && t.getMonth() + 1 === m && t.getDate() === d;
}

export function notificationDetailToAlertGroups(detail: NotificationDetailItem): AlertGroup[] {
  const { date, stocks } = detail;
  const isToday = isTodayNotifiedDate(date);
  return stocks.map((sg, i) => stockGroupToAlertGroup(sg, i, date, isToday));
}
