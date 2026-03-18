export const ROUTES = {
  HOME: '/',
  STOCK_DETAIL: '/stocks/:stockCode',
  ALERTS: '/alerts',
  MY: '/my',
  MY_ARCHIVE: '/my/archive',
  MY_PREDICTION: '/my/prediction',
} as const;

/** 종목 상세 경로 생성 헬퍼 */
export const toStockDetail = (stockCode: string) => `/stocks/${stockCode}`;
