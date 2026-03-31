export interface PerformanceRow {
  year: string;
  revenue: string;
  revenueGrowth: string;
  operatingProfit: string;
  operatingGrowth: string;
  netProfit: string;
  netGrowth: string;
}

export interface InvestorTrend {
  label: string;
  amount: number;
}

/** 우측 기업 정보 패널 — LS·백엔드 매핑용 */
export interface CompanyInfo {
  name: string;
  code: string;
  market: string;
  /** `GET /api/stocks/{stockId}` 등 백엔드 `logoUrl` — 있으면 우측 패널에서 이미지 표시 */
  logoUrl?: string | null;
  badgeText: string;
  badgeColor: string;
  categories: string[];
  stats: {
    marketCap: string;
    /** 기업 순위(문구) — 예: 코스피 시가총액 7위 */
    exchange: string;
    shares: string;
    foreignRatio: string;
    compareIndustry: string;
    comparePeer: string;
    low52w: string;
    high52w: string;
  };
  overview: string;
  performance: PerformanceRow[];
  investorTrends: InvestorTrend[];
}
