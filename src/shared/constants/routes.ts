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

/**
 * 스플릿뷰 차트 종목 상세 — `/chart/{종목코드}/stock-detail`
 * 예: `/chart/005930/stock-detail`
 */
export function toChartStockDetail(stockCode: string) {
  return `/chart/${encodeURIComponent(stockCode)}/stock-detail`;
}

/**
 * 스플릿뷰 이벤트 패널 — `/chart/{종목코드}/event`
 * 예: `/chart/005930/event`
 */
export function toChartStockEvent(stockCode: string) {
  return `/chart/${encodeURIComponent(stockCode)}/event`;
}
