import type { StockCompanyDto } from '@/features/stock/types';
import type { CompanyInfo, PerformanceRow } from '../types/companyInfo';

const DASH_PERF: PerformanceRow = {
  year: '—',
  revenue: '—',
  revenueGrowth: '—',
  operatingProfit: '—',
  operatingGrowth: '—',
  netProfit: '—',
  netGrowth: '—',
};

function tickerHue(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 55% 42%)`;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatEok(eok: number): string {
  if (!Number.isFinite(eok) || eok <= 0) return '—';
  const jo = Math.floor(eok / 10000);
  const restEok = Math.floor(eok % 10000);
  if (jo > 0 && restEok > 0) return `${jo.toLocaleString('ko-KR')}조 ${restEok.toLocaleString('ko-KR')}억`;
  if (jo > 0) return `${jo.toLocaleString('ko-KR')}조`;
  return `${Math.round(eok).toLocaleString('ko-KR')}억`;
}

function formatWonAsJoEok(won: number): string {
  if (!Number.isFinite(won) || won <= 0) return '—';
  return formatEok(won / 1e8);
}

function formatMarketCapAuto(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  // 현재 백엔드 실제 응답은 명세와 달리 억 단위 숫자를 주고 있음.
  // 값이 충분히 작으면 억 단위로 간주하고, 크면 원 단위로 본다.
  if (value < 1e12) return formatEok(value);
  return formatWonAsJoEok(value);
}

function formatShares(totalShares: number): string {
  if (!Number.isFinite(totalShares) || totalShares <= 0) return '—';
  if (totalShares >= 1e8) return `${(totalShares / 1e8).toFixed(1)}억 주`;
  if (totalShares >= 1e4) return `${Math.round(totalShares / 1e4).toLocaleString('ko-KR')}만 주`;
  return `${Math.round(totalShares).toLocaleString('ko-KR')}주`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 100) / 100;
  return `${rounded.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return Math.round(value).toLocaleString('ko-KR');
}

function formatGrowth(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 100) / 100;
  const abs = Math.abs(rounded).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  if (rounded > 0) return `+${abs}%`;
  if (rounded < 0) return `-${abs}%`;
  return '0%';
}

function formatBaseDate(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 6) return `${digits.slice(0, 4)}.${digits.slice(4, 6)}`;
  return value.trim() || '—';
}

function normalizeInvestorAmountToEok(value: unknown): number | null {
  const parsed = toNumber(value);
  if (parsed == null) return null;

  // 명세는 원 단위지만, 서버가 이미 억 단위로 내려주는 경우도 버티도록 보정.
  if (Math.abs(parsed) >= 1e8) {
    return Math.round(parsed / 1e8);
  }
  return Math.round(parsed);
}

export function buildCompanyInfoFromCompanyApi(data: StockCompanyDto): CompanyInfo {
  const marketCap = toNumber(data.marketCap);
  const marketRank = toNumber(data.marketRank);
  const totalShares = toNumber(data.totalShares);
  const foreignRatio = toNumber(data.foreignRatio);
  const week52Low = toNumber(data.week52Low);
  const week52High = toNumber(data.week52High);

  const perf: PerformanceRow | null = data.financials
    ? {
        year: formatBaseDate(data.financials.baseDate),
        revenue: formatEok(toNumber(data.financials.revenue) ?? NaN),
        revenueGrowth: formatGrowth(toNumber(data.financials.revenueGrowthRate) ?? NaN),
        operatingProfit: formatEok(toNumber(data.financials.operatingProfit) ?? NaN),
        operatingGrowth: formatGrowth(toNumber(data.financials.operatingProfitGrowthRate) ?? NaN),
        netProfit: formatEok(toNumber(data.financials.netProfit) ?? NaN),
        netGrowth: formatGrowth(toNumber(data.financials.netProfitGrowthRate) ?? NaN),
      }
    : null;

  return {
    name: data.name,
    code: data.ticker,
    market: data.market,
    logoUrl: data.logoUrl,
    badgeText: data.name.slice(0, 1) || '?',
    badgeColor: tickerHue(data.ticker),
    categories: Array.isArray(data.sectorTags) && data.sectorTags.length > 0 ? data.sectorTags : ['—'],
    stats: {
      marketCap: formatMarketCapAuto(marketCap ?? NaN),
      exchange: marketRank != null && marketRank > 0 ? `${data.market} ${Math.round(marketRank)}위` : '—',
      shares: formatShares(totalShares ?? NaN),
      foreignRatio: formatPercent(foreignRatio ?? NaN),
      compareIndustry: data.industryGroup?.trim() || '—',
      comparePeer: data.subIndustry?.trim() || data.industryGroup?.trim() || '—',
      low52w: formatNumber(week52Low ?? NaN),
      high52w: formatNumber(week52High ?? NaN),
    },
    overview: data.overview?.trim() || '기업 개요 정보가 없습니다.',
    performance: perf ? [perf] : [DASH_PERF],
    investorTrends: data.investorTrading
      ? [
          { label: '개인', amount: normalizeInvestorAmountToEok(data.investorTrading.individual) ?? 0 },
          { label: '외국인', amount: normalizeInvestorAmountToEok(data.investorTrading.foreign) ?? 0 },
          { label: '기관', amount: normalizeInvestorAmountToEok(data.investorTrading.institution) ?? 0 },
        ]
      : [],
  };
}
