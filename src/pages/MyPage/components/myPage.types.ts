export type MyPageTabKey = 'scrap' | 'review' | 'alarm' | 'settings';

export type ScrapItem = {
  name: string;
  code: string;
  color: string;
  logoUrl?: string | null;
  ini: string;
  date: string;
  eventType: string;
  chg: string;
};

export type ReviewItem = {
  name: string;
  code: string;
  color: string;
  ini: string;
  prediction: string;
  result: string;
  chg: string;
  date: string;
  bg: string;
  resultColor: string;
};

export type AlarmTag = {
  label: string;
  variant: 'solid' | 'outline';
  /** solid일 때 배경 톤 */
  tone?: 'red' | 'blue' | 'neutral';
};

export type AlarmItemRow = {
  /** 타임라인 점 색 */
  dotColor: string;
  /** 제목 줄 (예: 급등 이벤트) */
  headline: string;
  chg: string | null;
  desc: string;
  tags?: AlarmTag[];
};

export type AlarmGroup = {
  ini: string;
  color: string;
  name: string;
  code: string;
  badge: number;
  badgeColor: string;
  items: AlarmItemRow[];
  /** 상대 시간 (예: 3일 전) */
  relativeTime: string;
  /** 종목명 아래 한 줄 요약 (선택) */
  summaryLine?: string;
  date: string;
  isToday: boolean;
};
