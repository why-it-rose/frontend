/** 알림센터 전용 타입 (마이페이지와 데이터/모듈 연동 없음) */

export type AlertTag = {
  label: string;
  variant: 'solid' | 'outline';
  tone?: 'red' | 'blue' | 'neutral';
};

export type AlertItemRow = {
  dotColor: string;
  headline: string;
  chg: string | null;
  desc: string;
  tags?: AlertTag[];
};

export type AlertGroup = {
  ini: string;
  color: string;
  name: string;
  code: string;
  badgeColor: string;
  items: AlertItemRow[];
  relativeTime: string;
  summaryLine?: string;
  date: string;
  isToday: boolean;
  logoUrl?: string | null;
};

