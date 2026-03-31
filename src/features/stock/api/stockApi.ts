import type {
  StockListParams,
  StockListResponseDto,
  StockChartPeriod,
  StockPricesDataDto,
  StockSearchItemDto,
  StockDetailDto,
} from '@/features/stock/types';
import { fetchKisAccessToken, getKisAccessToken, initKisTokenLifecycle } from './kisTokenScheduler';

type StockListPeriod = NonNullable<StockListParams['period']>;
type StockListQuery = StockListParams;

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080';
const KIS_BASE_URL = import.meta.env.VITE_KIS_BASE_URL?.trim() || '/kis-api';

type MarketCapRankRow = {
  mksc_shrn_iscd: string;
  data_rank: string;
};

export type InvestorTradeTrend = {
  personalEok: number;
  foreignEok: number;
  institutionEok: number;
};

export type FinancialRatioGrowth = {
  stacYymm: string;
  grs: string;
  bsopPrfiInrt: string;
  ntinInrt: string;
};

export type IncomeStatementLatest = {
  stacYymm: string;
  saleAccount: string;
  bsopPrti: string;
  thtrNtin: string;
};

export type StockIndustryDetail = {
  stdIdstClsfCdName: string;
};

function normalizeTicker(t: string): string {
  return t.replace(/\D/g, '').padStart(6, '0').slice(-6);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function cacheKey(market: 'KOSPI' | 'KOSDAQ') {
  return `kis:market-cap-rank:${market}:${todayKey()}`;
}

function investorTrendCacheKey(ticker: string) {
  return `kis:investor-trend:${normalizeTicker(ticker)}:${todayKey()}`;
}

function financialRatioCacheKey(ticker: string, divClsCode: '0' | '1') {
  return `kis:financial-ratio:${normalizeTicker(ticker)}:${divClsCode}:${todayKey()}`;
}

function incomeStatementCacheKey(ticker: string, divClsCode: '0' | '1') {
  return `kis:income-statement:${normalizeTicker(ticker)}:${divClsCode}:${todayKey()}`;
}

function stockIndustryDetailCacheKey(ticker: string) {
  return `kis:stock-industry-detail:${normalizeTicker(ticker)}:${todayKey()}`;
}

const investorTrendInflight = new Map<string, Promise<InvestorTradeTrend | null>>();
const financialRatioInflight = new Map<string, Promise<FinancialRatioGrowth | null>>();
const incomeStatementInflight = new Map<string, Promise<IncomeStatementLatest | null>>();
const stockIndustryDetailInflight = new Map<string, Promise<StockIndustryDetail | null>>();

function yyyymmdd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pbmnToEok(v: unknown): number {
  // 응답 단위: 백만원 -> 억원(=100백만원)
  const eok = toNum(v) / 100;
  // UI는 정수 억 단위 라벨을 사용하므로 반올림
  return Math.round(eok);
}

function buySellDiffPbmnToEok(buyPbmn: unknown, sellPbmn: unknown): number {
  const diffPbmn = toNum(buyPbmn) - toNum(sellPbmn);
  return Math.round(diffPbmn / 100);
}

async function fetchKisTopMarketCapRows(
  market: 'KOSPI' | 'KOSDAQ'
): Promise<MarketCapRankRow[]> {
  const appkey = import.meta.env.VITE_KIS_APP_KEY?.trim();
  const appsecret = import.meta.env.VITE_KIS_APP_SECRET?.trim();
  initKisTokenLifecycle();
  const token =
    getKisAccessToken() ??
    (await fetchKisAccessToken()) ??
    import.meta.env.VITE_KIS_ACCESS_TOKEN?.trim();
  if (!appkey || !appsecret || !token) return [];

  const fid_input_iscd = market === 'KOSPI' ? '0001' : '1001';
  const qs = new URLSearchParams({
    fid_input_price_2: '',
    fid_cond_mrkt_div_code: 'J',
    fid_cond_scr_div_code: '20174',
    fid_div_cls_code: '0',
    fid_input_iscd,
    fid_trgt_cls_code: '0',
    fid_trgt_exls_cls_code: '0',
    fid_input_price_1: '',
    fid_vol_cnt: '',
  });
  const res = await fetch(`${KIS_BASE_URL}/uapi/domestic-stock/v1/ranking/market-cap?${qs}`, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey,
      appsecret,
      tr_id: 'FHPST01740000',
      custtype: 'P',
    },
  });
  if (!res.ok) throw new Error(`fetchKisTopMarketCapRows failed: ${res.status}`);
  const json = await res.json();
  const rows = (json?.output ?? []) as MarketCapRankRow[];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchKisMarketCapRankByTicker(
  ticker: string,
  market: string
): Promise<number | null> {
  const mk = market === 'KOSPI' || market === 'KOSDAQ' ? market : null;
  if (!mk) return null;

  const key = cacheKey(mk);
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const rows = JSON.parse(cached) as MarketCapRankRow[];
      const hit = rows.find((r) => normalizeTicker(r.mksc_shrn_iscd) === normalizeTicker(ticker));
      const rank = Number(hit?.data_rank ?? NaN);
      return Number.isFinite(rank) && rank > 0 ? rank : null;
    }
  } catch {
    // 캐시 파싱 실패 시 네트워크 재조회
  }

  const rows = await fetchKisTopMarketCapRows(mk).catch(() => []);
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    // 스토리지 실패 무시
  }
  const hit = rows.find((r) => normalizeTicker(r.mksc_shrn_iscd) === normalizeTicker(ticker));
  const rank = Number(hit?.data_rank ?? NaN);
  return Number.isFinite(rank) && rank > 0 ? rank : null;
}

async function fetchKisInvestorTradeByDate(
  ticker: string,
  dateYmd: string
): Promise<InvestorTradeTrend | null> {
  const appkey = import.meta.env.VITE_KIS_APP_KEY?.trim();
  const appsecret = import.meta.env.VITE_KIS_APP_SECRET?.trim();
  initKisTokenLifecycle();
  const token =
    getKisAccessToken() ??
    (await fetchKisAccessToken()) ??
    import.meta.env.VITE_KIS_ACCESS_TOKEN?.trim();
  if (!appkey || !appsecret || !token) return null;

  const qs = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: 'J',
    FID_INPUT_ISCD: normalizeTicker(ticker),
    FID_INPUT_DATE_1: dateYmd,
    FID_ORG_ADJ_PRC: '',
    FID_ETC_CLS_CODE: '1',
  });
  const res = await fetch(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/investor-trade-by-stock-daily?${qs.toString()}`,
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        authorization: `Bearer ${token}`,
        appkey,
        appsecret,
        tr_id: 'FHPTJ04160001',
        custtype: 'P',
      },
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (String(json?.rt_cd ?? '') !== '0') return null;
  const rows = Array.isArray(json?.output2) ? (json.output2 as Record<string, unknown>[]) : [];
  if (rows.length === 0) return null;
  const row = rows[0] ?? null;
  if (!row) return null;

  const personalEok = buySellDiffPbmnToEok(
    row.prsn_shnu_tr_pbmn,
    row.prsn_seln_tr_pbmn
  );
  const foreignEok = buySellDiffPbmnToEok(
    row.frgn_shnu_tr_pbmn,
    row.frgn_seln_tr_pbmn
  );
  const institutionEok = buySellDiffPbmnToEok(
    row.orgn_shnu_tr_pbmn,
    row.orgn_seln_tr_pbmn
  );

  // 일부 응답에서 매수/매도 대금이 비는 경우 ntby 필드로 보정
  const fallbackPersonal = pbmnToEok(row.prsn_ntby_tr_pbmn);
  const fallbackForeign = pbmnToEok(row.frgn_ntby_tr_pbmn);
  const fallbackInstitution = pbmnToEok(row.orgn_ntby_tr_pbmn);

  return {
    personalEok:
      personalEok !== 0 || toNum(row.prsn_ntby_tr_pbmn) === 0
        ? personalEok
        : fallbackPersonal,
    foreignEok:
      foreignEok !== 0 || toNum(row.frgn_ntby_tr_pbmn) === 0
        ? foreignEok
        : fallbackForeign,
    institutionEok:
      institutionEok !== 0 || toNum(row.orgn_ntby_tr_pbmn) === 0
        ? institutionEok
        : fallbackInstitution,
  };
}

export async function fetchKisInvestorTradeTrend(
  ticker: string
): Promise<InvestorTradeTrend | null> {
  const ck = investorTrendCacheKey(ticker);
  try {
    const cached = localStorage.getItem(ck);
    if (cached) return JSON.parse(cached) as InvestorTradeTrend;
  } catch {
    // ignore cache parse
  }

  const inflight = investorTrendInflight.get(ck);
  if (inflight) return inflight;

  const today = new Date();
  const candidates = [0, -1, -2].map((d) => yyyymmdd(addDays(today, d)));
  const p = (async () => {
    for (const dt of candidates) {
      const hit = await fetchKisInvestorTradeByDate(ticker, dt).catch(() => null);
      if (hit) {
        try {
          localStorage.setItem(ck, JSON.stringify(hit));
        } catch {
          // ignore cache save
        }
        return hit;
      }
    }
    return null;
  })();
  investorTrendInflight.set(ck, p);
  const out = await p;
  investorTrendInflight.delete(ck);
  return out;
}

export async function fetchKisFinancialRatioGrowth(
  ticker: string,
  divClsCode: '0' | '1' = '0'
): Promise<FinancialRatioGrowth | null> {
  const appkey = import.meta.env.VITE_KIS_APP_KEY?.trim();
  const appsecret = import.meta.env.VITE_KIS_APP_SECRET?.trim();
  initKisTokenLifecycle();
  const token =
    getKisAccessToken() ??
    (await fetchKisAccessToken()) ??
    import.meta.env.VITE_KIS_ACCESS_TOKEN?.trim();
  if (!appkey || !appsecret || !token) return null;

  const ck = financialRatioCacheKey(ticker, divClsCode);
  try {
    const cached = localStorage.getItem(ck);
    if (cached) return JSON.parse(cached) as FinancialRatioGrowth;
  } catch {
    // ignore cache parse
  }

  const inflight = financialRatioInflight.get(ck);
  if (inflight) return inflight;

  const p = (async () => {
    const qs = new URLSearchParams({
      FID_DIV_CLS_CODE: divClsCode,
      fid_cond_mrkt_div_code: 'J',
      fid_input_iscd: normalizeTicker(ticker),
    });
    const res = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/finance/financial-ratio?${qs.toString()}`,
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          authorization: `Bearer ${token}`,
          appkey,
          appsecret,
          tr_id: 'FHKST66430300',
          custtype: 'P',
        },
      }
    );
    if (!res.ok) return null;

    const json = await res.json();
    if (String(json?.rt_cd ?? '') !== '0') return null;

    const rows = Array.isArray(json?.output) ? (json.output as Record<string, unknown>[]) : [];
    if (rows.length === 0) return null;

    const sorted = [...rows].sort((a, b) =>
      String(b.stac_yymm ?? '').localeCompare(String(a.stac_yymm ?? ''))
    );
    const latest = sorted[0] ?? null;
    if (!latest) return null;

    const out: FinancialRatioGrowth = {
      stacYymm: String(latest.stac_yymm ?? '').trim(),
      grs: String(latest.grs ?? '').trim(),
      bsopPrfiInrt: String(latest.bsop_prfi_inrt ?? '').trim(),
      ntinInrt: String(latest.ntin_inrt ?? '').trim(),
    };
    try {
      localStorage.setItem(ck, JSON.stringify(out));
    } catch {
      // ignore cache save
    }
    return out;
  })();

  financialRatioInflight.set(ck, p);
  const out = await p;
  financialRatioInflight.delete(ck);
  return out;
}

export async function fetchKisIncomeStatementLatest(
  ticker: string,
  divClsCode: '0' | '1' = '0'
): Promise<IncomeStatementLatest | null> {
  const appkey = import.meta.env.VITE_KIS_APP_KEY?.trim();
  const appsecret = import.meta.env.VITE_KIS_APP_SECRET?.trim();
  initKisTokenLifecycle();
  const token =
    getKisAccessToken() ??
    (await fetchKisAccessToken()) ??
    import.meta.env.VITE_KIS_ACCESS_TOKEN?.trim();
  if (!appkey || !appsecret || !token) return null;

  const ck = incomeStatementCacheKey(ticker, divClsCode);
  try {
    const cached = localStorage.getItem(ck);
    if (cached) return JSON.parse(cached) as IncomeStatementLatest;
  } catch {
    // ignore cache parse
  }

  const inflight = incomeStatementInflight.get(ck);
  if (inflight) return inflight;

  const p = (async () => {
    const qs = new URLSearchParams({
      FID_DIV_CLS_CODE: divClsCode,
      fid_cond_mrkt_div_code: 'J',
      fid_input_iscd: normalizeTicker(ticker),
    });
    const res = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/finance/income-statement?${qs.toString()}`,
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          authorization: `Bearer ${token}`,
          appkey,
          appsecret,
          tr_id: 'FHKST66430200',
          custtype: 'P',
        },
      }
    );
    if (!res.ok) return null;

    const json = await res.json();
    if (String(json?.rt_cd ?? '') !== '0') return null;

    const rows = Array.isArray(json?.output) ? (json.output as Record<string, unknown>[]) : [];
    if (rows.length === 0) return null;

    const sorted = [...rows].sort((a, b) =>
      String(b.stac_yymm ?? '').localeCompare(String(a.stac_yymm ?? ''))
    );
    const latest = sorted[0] ?? null;
    if (!latest) return null;

    const out: IncomeStatementLatest = {
      stacYymm: String(latest.stac_yymm ?? '').trim(),
      saleAccount: String(latest.sale_account ?? '').trim(),
      bsopPrti: String(latest.bsop_prti ?? '').trim(),
      thtrNtin: String(latest.thtr_ntin ?? '').trim(),
    };
    try {
      localStorage.setItem(ck, JSON.stringify(out));
    } catch {
      // ignore cache save
    }
    return out;
  })();

  incomeStatementInflight.set(ck, p);
  const out = await p;
  incomeStatementInflight.delete(ck);
  return out;
}

export async function fetchKisStockIndustryDetail(
  ticker: string
): Promise<StockIndustryDetail | null> {
  const appkey = import.meta.env.VITE_KIS_APP_KEY?.trim();
  const appsecret = import.meta.env.VITE_KIS_APP_SECRET?.trim();
  initKisTokenLifecycle();
  const token =
    getKisAccessToken() ??
    (await fetchKisAccessToken()) ??
    import.meta.env.VITE_KIS_ACCESS_TOKEN?.trim();
  if (!appkey || !appsecret || !token) return null;

  const ck = stockIndustryDetailCacheKey(ticker);
  try {
    const cached = localStorage.getItem(ck);
    if (cached) return JSON.parse(cached) as StockIndustryDetail;
  } catch {
    // ignore cache parse
  }

  const inflight = stockIndustryDetailInflight.get(ck);
  if (inflight) return inflight;

  const p = (async () => {
    const qs = new URLSearchParams({
      PRDT_TYPE_CD: '300',
      PDNO: normalizeTicker(ticker),
    });
    const res = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/search-stock-info?${qs.toString()}`,
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          authorization: `Bearer ${token}`,
          appkey,
          appsecret,
          tr_id: 'CTPF1002R',
          custtype: 'P',
        },
      }
    );
    if (!res.ok) return null;

    const json = await res.json();
    if (String(json?.rt_cd ?? '') !== '0') return null;
    const outRow = (json?.output ?? null) as Record<string, unknown> | null;
    if (!outRow) return null;

    const stdIdstClsfCdName = String(outRow.std_idst_clsf_cd_name ?? '').trim();
    if (!stdIdstClsfCdName) return null;

    const out: StockIndustryDetail = { stdIdstClsfCdName };
    try {
      localStorage.setItem(ck, JSON.stringify(out));
    } catch {
      // ignore cache save
    }
    return out;
  })();

  stockIndustryDetailInflight.set(ck, p);
  const out = await p;
  stockIndustryDetailInflight.delete(ck);
  return out;
}

function mapPeriodToApi(period?: StockListPeriod): StockListPeriod | undefined {
  if (!period) return undefined;
  return period;
}

function toQueryString(params: StockListQuery) {
  const query = new URLSearchParams();
  if (params.market) query.set('market', params.market);
  if (params.sort) query.set('sort', params.sort);

  const apiPeriod = mapPeriodToApi(params.period);
  if (apiPeriod) query.set('period', apiPeriod);

  if (params.cursor) query.set('cursor', params.cursor);
  if (typeof params.size === 'number') query.set('size', String(params.size));
  return query.toString();
}

/**
 * 홈 종목 리스트 조회
 * - Swagger: GET /api/stocks
 */
export async function fetchStockList(params: StockListQuery = {}): Promise<StockListResponseDto> {
  const qs = toQueryString(params);
  const url = `${BASE_URL}/api/stocks${qs ? `?${qs}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchStockList failed: ${res.status}`);
  }
  const json = await res.json();

  if (json?.result?.items) {
    return {
      code: String(json.responseCode ?? 'SUCCESS'),
      message: String(json.responseMessage ?? ''),
      data: json.result,
    };
  }
  throw new Error('fetchStockList failed: invalid response shape');
}

/**
 * 종목 가격(캔들) 조회 — 이벤트 핀 등은 응답에 있어도 클라이언트에서 무시 가능
 * Swagger: GET /api/stocks/{stockId}/prices?period=1D|1W|1M|1Y
 */
export async function fetchStockPrices(
  stockId: number,
  period: StockChartPeriod
): Promise<StockPricesDataDto> {
  const url = `${BASE_URL}/api/stocks/${stockId}/prices?period=${encodeURIComponent(period)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchStockPrices failed: ${res.status}`);
  }
  const json = await res.json();

  if (json?.result?.candles && Array.isArray(json.result.candles)) {
    return {
      stockId: Number(json.result.stockId ?? stockId),
      period: String(json.result.period ?? period),
      candles: json.result.candles,
    };
  }
  throw new Error('fetchStockPrices failed: invalid response shape');
}

/**
 * 종목 검색 — Swagger: GET /api/stocks/search?q=&limit=
 */
export async function fetchStockSearch(
  q: string,
  limit = 10,
  signal?: AbortSignal
): Promise<StockSearchItemDto[]> {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  const url = `${BASE_URL}/api/stocks/search?${qs.toString()}`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) {
    throw new Error(`fetchStockSearch failed: ${res.status}`);
  }
  const json = await res.json();
  const items = json?.result?.items ?? json?.data?.items;
  if (Array.isArray(items)) {
    return items;
  }
  throw new Error('fetchStockSearch failed: invalid response shape');
}

/**
 * 종목 기본 정보 — Swagger: GET /api/stocks/{stockId}
 */
export async function fetchStockDetail(stockId: number): Promise<StockDetailDto> {
  const url = `${BASE_URL}/api/stocks/${stockId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchStockDetail failed: ${res.status}`);
  }
  const json = await res.json();
  const row = json?.result ?? json?.data;
  if (row && typeof row.stockId === 'number' && row.ticker) {
    return row as StockDetailDto;
  }
  throw new Error('fetchStockDetail failed: invalid response shape');
}

