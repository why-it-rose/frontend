import type { StockDetailDto, StockPriceCandleDto } from '@/features/stock/types';
import type { InvestorTradeTrend } from '@/features/stock/api/stockApi';
import type { FinancialRatioGrowth } from '@/features/stock/api/stockApi';
import type { IncomeStatementLatest } from '@/features/stock/api/stockApi';
import type { StockIndustryDetail } from '@/features/stock/api/stockApi';
import type { CompanyInfo, PerformanceRow } from '../types/companyInfo';
import type { T3320Blocks } from '@/features/ls/fetchT3320Company';

function parseLsBigNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const normalized = v.replace(/,/g, '').replace(/[^\d.-]/g, '');
    const n = parseFloat(normalized.replace(/^0+(?=\d)/, ''));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function getLsField(
  rec: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const k of keys) {
    if (rec[k] != null) return rec[k];
    const lower = k.toLowerCase();
    if (rec[lower] != null) return rec[lower];
    const upper = k.toUpperCase();
    if (rec[upper] != null) return rec[upper];
  }
  const byLower = new Map<string, unknown>();
  for (const [k, v] of Object.entries(rec)) byLower.set(k.toLowerCase(), v);
  for (const k of keys) {
    const v = byLower.get(k.toLowerCase());
    if (v != null) return v;
  }
  return undefined;
}

/** 시가총액(억 단위 정수) → `~조 ~억` */
function formatMarketCapEok(eok: number): string {
  if (!eok || eok <= 0) return '—';
  const jo = Math.floor(eok / 10000);
  const restEok = Math.floor(eok % 10000);
  if (jo > 0 && restEok > 0) {
    return `${jo.toLocaleString('ko-KR')}조 ${restEok.toLocaleString('ko-KR')}억`;
  }
  if (jo > 0) return `${jo.toLocaleString('ko-KR')}조`;
  return `${Math.floor(eok).toLocaleString('ko-KR')}억`;
}

/** LS 시가총액 단위(원/억) 혼재 대응 */
function formatMarketCapAuto(raw: number): string {
  if (!raw || raw <= 0) return '—';
  // 실무에서 t3320 sigavalue가 억 단위로 내려오는 경우가 많음.
  // 값이 너무 작으면(1e10 미만) 억 단위로 간주해 표시.
  if (raw < 1e10) return formatMarketCapEok(raw);
  // 원 단위로 내려오면 억으로 환산해 동일 포맷 적용
  return formatMarketCapEok(raw / 1e8);
}

function formatSharesStr(n: number): string {
  if (!n || n <= 0) return '—';
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억 주`;
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString('ko-KR')}만 주`;
  return `${Math.round(n).toLocaleString('ko-KR')}주`;
}

function tickerHue(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 55% 42%)`;
}

function parseCandleDateMs(dateStr: string): number | null {
  const s = dateStr.trim();
  // yyyy-mm-dd[ ...] / yyyy.mm.dd / yyyymmdd 대응
  const m = s.match(/^(\d{4})[-./]?(\d{2})[-./]?(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  const ms = Date.UTC(y, mo - 1, d);
  return Number.isNaN(ms) ? null : ms;
}

function stripFicsPrefix(text: string): string {
  return text
    .replace(/\bFICS\b/gi, '')
    .replace(/^\s*[-:]\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** t3320 결산년월 `YYYYMM` 등 → `YYYY.MM` */
function formatFinPeriod(raw: string): string {
  const s = raw.replace(/\D/g, '');
  if (s.length >= 6) {
    return `${s.slice(0, 4)}.${s.slice(4, 6)}`;
  }
  if (s.length === 4) return `${s}.12`;
  return raw.trim() || '—';
}

/** 금액(원) → `N조 M억` (0 미만은 —) */
function formatWonAsJoEok(won: number): string {
  if (!won || won <= 0 || !Number.isFinite(won)) return '—';
  return formatMarketCapEok(won / 1e8);
}

/** KIS 손익계산서 금액: 원/억 혼재 가능성에 대비한 자동 포맷 */
function formatKisIncomeAmount(raw: unknown): string {
  const n = parseLsBigNum(raw);
  if (!n || !Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e10) return formatMarketCapEok(n / 1e8);
  return formatMarketCapEok(n);
}

/**
 * EBITDA: t3320에서는 보통 **억 원** 규모 숫자로 내려오는 경우가 많음.
 * 값이 매우 크면(원 단위 추정) 억으로 나눔.
 */
function formatEbitdaJoEok(raw: number): string {
  if (!raw || raw <= 0) return '—';
  if (raw >= 1e9) return formatMarketCapEok(raw / 1e8);
  return formatMarketCapEok(raw);
}

function formatYoyPct(v: unknown, allowZero = false): string {
  if (v == null) return '—';
  const s = String(v).trim().replace(/%/g, '');
  if (!s) return '—';
  let n = parseLsBigNum(s);
  if (!Number.isFinite(n)) return '—';
  if (n === 0 && !allowZero) return '—';
  if (Math.abs(n) <= 1 && !s.includes('%')) n *= 100;
  const rounded = Math.round(n * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

const DASH_PERF: PerformanceRow = {
  year: '—',
  revenue: '—',
  revenueGrowth: '—',
  operatingProfit: '—',
  operatingGrowth: '—',
  netProfit: '—',
  netGrowth: '—',
};

function panelIndustryLabelFromT3320(t3320: T3320Blocks | null): string {
  if (!t3320?.main) return '';
  const raw = String(getLsField(t3320.main, ['upgubunnm']) ?? '').trim();
  return stripFicsPrefix(raw) || '';
}

/** 종목 상세·t3320·KIS 순위·1Y 캔들·공공 개요 → 패널용 `CompanyInfo`. 빈 값은 '—'. */
export function buildCompanyInfoFromSources(
  detail: StockDetailDto,
  t3320: T3320Blocks | null,
  marketCapRank: number | null,
  candles1y: StockPriceCandleDto[] | null,
  fssOverview: string | null = null,
  investorTrade: InvestorTradeTrend | null = null,
  stockIndustryDetail: StockIndustryDetail | null = null,
  incomeStatement: IncomeStatementLatest | null = null,
  financialRatio: FinancialRatioGrowth | null = null
): CompanyInfo {
  const m = t3320?.main ?? {};
  const fin = t3320?.fin ?? {};
  const sector = String(detail.sector ?? '').trim();

  const capRaw = parseLsBigNum(
    getLsField(m, ['sigavalue', 'siga', 'marketcap', 'mktcap', 'totmktcap'])
  );
  const shareNum = parseLsBigNum(
    getLsField(m, ['gstock', 'lststock', 'stocks', 'listedstock'])
  );
  const priceNum = parseLsBigNum(getLsField(m, ['price', 'curprice', 'close']));
  const capNum = capRaw > 0 ? capRaw : (priceNum > 0 && shareNum > 0 ? priceNum * shareNum : 0);
  const marketCap = capNum > 0 ? formatMarketCapAuto(capNum) : '—';
  const shares = shareNum > 0 ? formatSharesStr(shareNum) : '—';

  const frRaw = String(
    getLsField(m, ['foreignratio', 'frgnrate', 'frgratio']) ?? ''
  ).trim();
  const foreignRatio =
    frRaw.length > 0 ? (frRaw.includes('%') ? frRaw : `${frRaw}%`) : '—';

  const industryLs = panelIndustryLabelFromT3320(t3320);
  const industry = industryLs || '—';
  const peer =
    stockIndustryDetail?.stdIdstClsfCdName?.trim() ||
    String(getLsField(m, ['grdnm', 'groupnm', 'subindustry', 'marketnm']) ?? '').trim() ||
    '—';

  const marketLabel =
    detail.market === 'KOSPI' ? '코스피' : detail.market === 'KOSDAQ' ? '코스닥' : detail.market;

  const marketCapRankNum = parseLsBigNum(
    getLsField(m, ['sigarank', 'mktcaprank', 'marketcaprank', 'rank'])
  );
  const rankStr =
    marketCapRank != null && marketCapRank > 0
      ? `${marketLabel} ${Math.round(marketCapRank)}위`
      : marketCapRankNum > 0
      ? `${marketLabel} ${Math.round(marketCapRankNum)}위`
      : '—';

  let low52w = '—';
  let high52w = '—';
  if (candles1y && candles1y.length > 0) {
    const withDate = candles1y
      .map((c) => ({ c, ms: parseCandleDateMs(c.date) }))
      .filter((x): x is { c: StockPriceCandleDto; ms: number } => x.ms != null);

    const source =
      withDate.length > 0
        ? (() => {
            const latest = Math.max(...withDate.map((x) => x.ms));
            const from = latest - 365 * 24 * 60 * 60 * 1000;
            const windowed = withDate.filter((x) => x.ms >= from).map((x) => x.c);
            return windowed.length > 0 ? windowed : candles1y;
          })()
        : candles1y;

    const hi = Math.max(...source.map((c) => c.high));
    const lo = Math.min(...source.map((c) => c.low));
    high52w = Math.round(hi).toLocaleString('ko-KR');
    low52w = Math.round(lo).toLocaleString('ko-KR');
  }

  const overview =
    fssOverview != null && fssOverview.trim().length > 0
      ? fssOverview.trim()
      : '기업 개요를 불러오는 중입니다.';

  const cats: string[] = [];
  if (sector) cats.push(sector);
  const indLabel = industryLs;
  if (indLabel && !cats.includes(indLabel)) cats.push(indLabel);

  const gsymRaw = String(getLsField(fin, ['t_gsym', 'gsym']) ?? '').trim();
  const finYear = gsymRaw ? formatFinPeriod(gsymRaw) : '—';

  const sps = parseLsBigNum(getLsField(fin, ['sps']));
  const ebitdaRaw = parseLsBigNum(getLsField(fin, ['ebitda']));
  const eps = parseLsBigNum(getLsField(fin, ['eps']));

  const salesWon = sps > 0 && shareNum > 0 ? sps * shareNum : 0;
  const netWonApprox = eps > 0 && shareNum > 0 ? eps * shareNum : 0;

  const perf: PerformanceRow = {
    year: incomeStatement?.stacYymm ? formatFinPeriod(incomeStatement.stacYymm) : finYear,
    revenue:
      incomeStatement != null
        ? formatKisIncomeAmount(incomeStatement.saleAccount)
        : formatWonAsJoEok(salesWon),
    revenueGrowth: financialRatio != null ? formatYoyPct(financialRatio.grs, true) : '—',
    operatingProfit:
      incomeStatement != null
        ? formatKisIncomeAmount(incomeStatement.bsopPrti)
        : formatEbitdaJoEok(ebitdaRaw),
    operatingGrowth:
      financialRatio != null ? formatYoyPct(financialRatio.bsopPrfiInrt, true) : '—',
    netProfit:
      incomeStatement != null
        ? formatKisIncomeAmount(incomeStatement.thtrNtin)
        : formatWonAsJoEok(netWonApprox),
    netGrowth: financialRatio != null ? formatYoyPct(financialRatio.ntinInrt, true) : '—',
  };

  return {
    name: detail.name,
    code: detail.ticker,
    market: detail.market,
    logoUrl: detail.logoUrl,
    badgeText: detail.name.slice(0, 1),
    badgeColor: tickerHue(detail.ticker),
    categories: cats.slice(0, 6),
    stats: {
      marketCap,
      exchange: rankStr,
      shares,
      foreignRatio,
      compareIndustry: industry,
      comparePeer: peer,
      low52w,
      high52w,
    },
    overview: overview || '—',
    performance: [perf.revenue === '—' && perf.operatingProfit === '—' && perf.netProfit === '—' ? DASH_PERF : perf],
    investorTrends: investorTrade
      ? [
          { label: '개인', amount: investorTrade.personalEok },
          { label: '외국인', amount: investorTrade.foreignEok },
          { label: '기관', amount: investorTrade.institutionEok },
        ]
      : [],
  };
}
