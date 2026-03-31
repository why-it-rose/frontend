import { useEffect, useState } from 'react';
import {
  fetchKisMarketCapRankByTicker,
  fetchKisFinancialRatioGrowth,
  fetchKisIncomeStatementLatest,
  fetchKisStockIndustryDetail,
  fetchKisInvestorTradeTrend,
  fetchStockDetail,
  fetchStockPrices,
  fetchStockSearch,
} from '@/features/stock/api';
import {
  buildGicodeCandidates,
  fetchT3320Company,
  pickLsMainBusinessText,
} from '@/features/ls/fetchT3320Company';
import { getFssCompanyOverviewCached } from '@/features/corp/fetchCorpBasicInfo';
import type { CompanyInfo } from '../types/companyInfo';
import { buildCompanyInfoFromSources } from '../utils/buildCompanyInfo';

function normalizeTicker(t: string): string {
  return t.replace(/\D/g, '').padStart(6, '0').slice(-6);
}

const EMPTY: CompanyInfo = {
  name: '—',
  code: '—',
  market: '—',
  badgeText: '?',
  badgeColor: '#64748b',
  categories: ['—'],
  stats: {
    marketCap: '—',
    exchange: '—',
    shares: '—',
    foreignRatio: '—',
    compareIndustry: '—',
    comparePeer: '—',
    low52w: '—',
    high52w: '—',
  },
  overview: '종목을 불러오는 중입니다.',
  performance: [
    {
      year: '—',
      revenue: '—',
      revenueGrowth: '—',
      operatingProfit: '—',
      operatingGrowth: '—',
      netProfit: '—',
      netGrowth: '—',
    },
  ],
  investorTrends: [],
};

/**
 * `/chart/:stockCode/stock-detail` 우측 패널 — DB 종목 + LS t3320 + KIS 시총순위 + 1Y 캔들(52주)
 */
export function useCompanyInfoPanel(stockCode: string | undefined): {
  company: CompanyInfo;
  loading: boolean;
} {
  const [company, setCompany] = useState<CompanyInfo>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stockCode?.trim()) {
      setCompany(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const q = stockCode.trim();
        const search = await fetchStockSearch(q, 25);
        const qNorm = normalizeTicker(q);
        const exact = search.find((s) => normalizeTicker(s.ticker) === qNorm);
        if (!exact || cancelled) {
          if (!cancelled) {
            setCompany({ ...EMPTY, code: q, name: q });
            setLoading(false);
          }
          return;
        }

        const [detail, prices1y] = await Promise.all([
          fetchStockDetail(exact.stockId),
          fetchStockPrices(exact.stockId, '1Y').catch(() => null),
        ]);
        if (cancelled) return;

        let t3320 = null;
        for (const gicode of buildGicodeCandidates(detail.ticker)) {
          t3320 = await fetchT3320Company(gicode);
          if (t3320) break;
        }
        if (cancelled) return;

        const investorTradePromise = fetchKisInvestorTradeTrend(detail.ticker).catch(() => null);
        const stockIndustryDetailPromise = fetchKisStockIndustryDetail(detail.ticker).catch(
          () => null
        );
        const incomeStatementPromise = fetchKisIncomeStatementLatest(detail.ticker, '0').catch(
          () => null
        );
        const financialRatioPromise = fetchKisFinancialRatioGrowth(detail.ticker, '0').catch(
          () => null
        );
        const marketCapRank = await fetchKisMarketCapRankByTicker(
          detail.ticker,
          detail.market
        ).catch(() => null);
        if (cancelled) return;

        const t3320Main =
          t3320?.main && typeof t3320.main === 'object'
            ? (t3320.main as Record<string, unknown>)
            : undefined;
        const lsCompany = String(t3320Main?.company ?? '').trim();
        const fssNameCandidates = [...new Set([lsCompany, detail.name].filter(Boolean))];
        const mainBizFromLs = pickLsMainBusinessText(t3320Main);
        const industryFromLs = String(t3320Main?.upgubunnm ?? '').trim();
        const fssOverviewPromise = (async (): Promise<string | null> => {
          for (const nm of fssNameCandidates) {
            const text = await getFssCompanyOverviewCached(nm, {
              mainBizFromLs: mainBizFromLs || undefined,
              industryFromLs: industryFromLs || undefined,
            }).catch(() => null);
            if (text?.trim()) return text;
          }
          return null;
        })();

        const t3320NoFin =
          t3320 && t3320.main
            ? { main: t3320.main, fin: null }
            : null;
        const merged = buildCompanyInfoFromSources(
          detail,
          t3320NoFin,
          marketCapRank,
          prices1y?.candles ?? null,
          null,
          null,
          null,
          null,
          null
        );
        setCompany(merged);
        if (!cancelled) setLoading(false);

        const stockIndustryDetail = await stockIndustryDetailPromise;
        if (cancelled) return;

        const incomeStatement = await incomeStatementPromise;
        if (cancelled) return;

        const financialRatio = await financialRatioPromise;
        if (cancelled) return;

        const mergedWithPerf = buildCompanyInfoFromSources(
          detail,
          t3320,
          marketCapRank,
          prices1y?.candles ?? null,
          null,
          null,
          stockIndustryDetail,
          incomeStatement,
          financialRatio
        );
        queueMicrotask(() => {
          if (cancelled) return;
          setCompany((prev) => {
            if (prev.code !== detail.ticker) return prev;
            return {
              ...prev,
              performance: mergedWithPerf.performance,
              stats: {
                ...prev.stats,
                comparePeer: mergedWithPerf.stats.comparePeer,
              },
            };
          });
        });

        void fssOverviewPromise.then((fssOverview) => {
          if (cancelled) return;
          setCompany((prev) => {
            if (prev.code !== detail.ticker) return prev;
            if (fssOverview?.trim()) {
              return { ...prev, overview: fssOverview.trim() };
            }
            return {
              ...prev,
              overview: '기업 개요 정보를 불러오지 못했습니다.',
            };
          });
        });

        void investorTradePromise.then((investorTrade) => {
          if (cancelled || !investorTrade) return;
          setCompany((prev) => {
            if (prev.code !== detail.ticker) return prev;
            return {
              ...prev,
              investorTrends: [
                { label: '개인', amount: investorTrade.personalEok },
                { label: '외국인', amount: investorTrade.foreignEok },
                { label: '기관', amount: investorTrade.institutionEok },
              ],
            };
          });
        });
      } catch {
        if (!cancelled) {
          setCompany({
            ...EMPTY,
            name: stockCode,
            code: stockCode,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stockCode]);

  return { company, loading };
}
