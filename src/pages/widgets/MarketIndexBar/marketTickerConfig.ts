export type MarketTickerDef = {
  id: string;
  label: string;
  shcode: string;
  /** 신한 SOL ETF 상세 페이지 */
  infoUrl: string;
};

/** 하단 마퀴 — LS t1101 시세 · 클릭 시 SOL ETF 안내 URL */
export const MARKET_TICKER_DEFS: MarketTickerDef[] = [
  {
    id: 'sol-200tr',
    label: 'SOL 200TR',
    shcode: '295040',
    infoUrl: 'https://www.soletf.co.kr/ko/fund/etf/210734',
  },
  {
    id: 'sol-kosdaq150',
    label: 'SOL 코스닥150',
    shcode: '450910',
    infoUrl: 'https://www.soletf.co.kr/ko/fund/etf/210961',
  },
  {
    id: 'sol-ai-sobujang',
    label: 'SOL AI반도체소부장',
    shcode: '455850',
    infoUrl: 'https://www.soletf.co.kr/ko/fund/etf/210980',
  },
  {
    id: 'sol-korea-dividend',
    label: 'SOL 코리아고배당',
    shcode: '0105E0',
    infoUrl: 'https://www.soletf.co.kr/ko/fund/etf/211097',
  },
  {
    id: 'sol-smr',
    label: 'SOL 한국원자력SMR',
    shcode: '0092B0',
    infoUrl: 'https://www.soletf.co.kr/ko/fund/etf/211096',
  },
  {
    id: 'sol-ai-top2plus',
    label: 'SOL AI반도체TOP2플러스',
    shcode: '0167A0',
    infoUrl: 'https://www.soletf.co.kr/ko/fund/etf/211106',
  },
];
