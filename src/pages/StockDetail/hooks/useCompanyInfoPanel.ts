import { useEffect, useState } from 'react';
import { fetchStockCompany, fetchStockSearch } from '@/features/stock/api';
import type { CompanyInfo } from '../types/companyInfo';
import { buildCompanyInfoFromCompanyApi } from '../utils/buildCompanyInfo';

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
        const query = stockCode.trim();
        const search = await fetchStockSearch(query, 25);
        const normalizedQuery = normalizeTicker(query);
        const exact = search.find((item) => normalizeTicker(item.ticker) === normalizedQuery);

        if (!exact || cancelled) {
          if (!cancelled) {
            setCompany({ ...EMPTY, code: query, name: query });
          }
          return;
        }

        const companyData = await fetchStockCompany(exact.stockId);
        if (cancelled) return;

        setCompany(buildCompanyInfoFromCompanyApi(companyData));
      } catch {
        if (!cancelled) {
          setCompany({
            ...EMPTY,
            name: stockCode,
            code: stockCode,
            overview: '기업 정보를 불러오지 못했습니다.',
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
