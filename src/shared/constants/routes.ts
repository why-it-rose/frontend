export const ROUTES = {
  /** 앱 진입 시 기본 홈(좌: 홈 / 우: 관심종목) */
  HOME: '/home/interest-stock',
  STOCK_DETAIL: '/stocks/:stockCode',
  INTEREST_STOCK: '/interest-stock',
  NEWS: '/news',
  ALERTS: '/alerts',
  MY: '/my',
  MY_ARCHIVE: '/my/archive',
  MY_PREDICTION: '/my/prediction',
} as const;

/** 종목 상세 경로 생성 헬퍼 */
export const toStockDetail = (stockCode: string) => `/stocks/${stockCode}`;
