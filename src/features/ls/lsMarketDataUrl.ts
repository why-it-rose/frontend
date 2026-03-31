export function getLsMarketDataPostUrl(): string {
  if (import.meta.env.VITE_LS_MARKET_DATA_URL) {
    return import.meta.env.VITE_LS_MARKET_DATA_URL;
  }
  if (import.meta.env.DEV) {
    return '/ls-api/stock/market-data';
  }
  return 'https://openapi.ls-sec.co.kr:8080/stock/market-data';
}

export function getLsInvestInfoPostUrl(): string {
  if (import.meta.env.VITE_LS_INVESTINFO_URL) {
    return import.meta.env.VITE_LS_INVESTINFO_URL;
  }
  if (import.meta.env.DEV) {
    return '/ls-api/stock/investinfo';
  }
  return 'https://openapi.ls-sec.co.kr:8080/stock/investinfo';
}

export function getLsPostUrlByTr(trCd: string): string {
  const tr = trCd.trim().toLowerCase();
  if (tr === 't3320') {
    return getLsInvestInfoPostUrl();
  }
  return getLsMarketDataPostUrl();
}
