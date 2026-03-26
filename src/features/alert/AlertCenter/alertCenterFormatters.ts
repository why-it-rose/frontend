/** 전체 탭 제목: `3/10일 관심 종목 알림` (MVP: type NEWS 가정) */
export function formatNotifiedDateTitle(notifiedDate: string): string {
  const parts = notifiedDate.split('-');
  if (parts.length !== 3) return notifiedDate;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return `${month}/${day}일 관심 종목 알림`;
}

/** `daysAgo` → 화면 라벨 */
export function formatDaysAgoLabel(daysAgo: number): string {
  if (daysAgo <= 0) return '오늘';
  if (daysAgo === 1) return '어제';
  return `${daysAgo}일 전`;
}

export function stockNamesSubtitle(stocks: { name: string }[]): string {
  return stocks.map((s) => s.name).join(', ');
}
