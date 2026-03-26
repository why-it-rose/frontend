import { useState } from 'react';

interface PerformanceRow {
  year: string;
  revenue: string; revenueGrowth: string;
  operatingProfit: string; operatingGrowth: string;
  netProfit: string; netGrowth: string;
}
interface InvestorTrend { label: string; amount: number; }
interface CompanyInfo {
  name: string; code: string; market: string;
  badgeText: string; badgeColor: string;
  categories: string[];
  stats: {
    marketCap: string; exchange: string;
    shares: string; foreignRatio: string;
    compareIndustry: string; comparePeer: string;
    low52w: string; high52w: string;
  };
  overview: string;
  performance: PerformanceRow[];
  investorTrends: InvestorTrend[];
}

const MOCK_COMPANY: CompanyInfo = {
  name: '삼성전자', code: '005930', market: 'KOSPI',
  badgeText: '삼', badgeColor: '#1d4ed8',
  categories: ['스마트폰', '차세대이동통신', '자율주행', '반도체', 'OLED'],
  stats: {
    marketCap: '1,086조 2,535억', exchange: '코스피 1위',
    shares: '59.2억 주', foreignRatio: '49.66%',
    compareIndustry: '하드웨어/IT장비', comparePeer: '반도체/반도체장비',
    low52w: '52,900', high52w: '228,500',
  },
  overview: '삼성전자는 1969년 설립된 기업으로 반도체, 전자 제품 제조·판매업을 영위하고 있다. 메모리 반도체(DRAM·NAND), 시스템 반도체(AP·이미지센서), 디스플레이에 패널, 스마트폰·가전 사업 부문으로 구성된다.',
  performance: [
    { year: '2023.12', revenue: '258조', revenueGrowth: '-14.58%', operatingProfit: '6조',  operatingGrowth: '-84.86%', netProfit: '15조', netGrowth: '-71.42%' },
    { year: '2024.12', revenue: '333조', revenueGrowth: '+10.88%', operatingProfit: '43조', operatingGrowth: '+33.23%', netProfit: '45조', netGrowth: '+31.22%' },
    { year: '2025.12', revenue: '360조', revenueGrowth: '+8.10%',  operatingProfit: '52조', operatingGrowth: '+20.93%', netProfit: '51조', netGrowth: '+13.33%' },
  ],
  investorTrends: [
    { label: '개인', amount: 65 }, { label: '외국인', amount: -40 }, { label: '기관', amount: -25 },
  ],
};

interface StatCellProps {
  label: string; value: string; accent?: boolean; right?: boolean;
}

function StatCell({ label, value, accent = false, right = false }: StatCellProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${right ? 'pl-4' : 'pr-4'}`}>
      <span className="text-[10px] text-[#9ca3af]">{label}</span>
      <span className={`text-[13px] font-bold ${accent ? 'text-[#e03131]' : 'text-[#111827]'}`}>
        {value}
      </span>
    </div>
  );
}

interface StockDetailAsideProps { company?: CompanyInfo; }

export default function StockDetailAside({ company = MOCK_COMPANY }: StockDetailAsideProps) {
  const [expanded, setExpanded]       = useState(false);
  const latestPerf                    = company.performance.at(-1)!;
  const maxAbs = Math.max(...company.investorTrends.map(t => Math.abs(t.amount)), 1);

  // 더보기 표시 여부: 4줄 초과 시에만 버튼 표시 (약 280자 기준)
  const isLongText = company.overview.length > 100;

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-[#f4f6fb]">

      {/* ── 헤더: 탭 선택 제거, 텍스트만 + 전체 너비 파란 하단 선 ── */}
      <div className="shrink-0 bg-white">
        <div className="flex h-[48px] items-center justify-center">
          <span className="text-[13px] font-bold text-[#014d9d]">기업 정보</span>
        </div>
        {/* 전체 너비 파란 선 */}
        <div className="h-[2px] w-full bg-[#014d9d]" />
      </div>

      {/* ── 스크롤 바디 ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* 배지 + 종목명 */}
        <div className="bg-white px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: company.badgeColor }}
            >
              {company.badgeText}
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#111827]">{company.name}</p>
              {/* 코스피 · 005930 순서 */}
              <p className="text-[11px] text-[#9ca3af]">
                {company.code}
                <span className="mx-1 text-[#d1d5db]">·</span>
                {company.market}
              </p>
            </div>
          </div>

          {/* 카테고리 칩: 선택 기능 제거, 스타일만 */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {company.categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`rounded-full px-2.5 py-[3px] text-[11px] font-medium whitespace-nowrap transition-colors ${
                    'bg-[#f0f2f8] text-[#6b7280] hover:bg-[#e0e7ef]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── 핵심 통계 ── */}
        <div className="mt-2 bg-white px-4 py-4">
          <div className="divide-y divide-[#f3f4f6]">
            <div className="grid grid-cols-2 divide-x divide-[#f3f4f6] pb-4">
              <StatCell label="시가총액"   value={company.stats.marketCap} />
              <StatCell label="기업순위"   value={company.stats.exchange}  accent right />
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#f3f4f6] py-4">
              <StatCell label="주식수"     value={company.stats.shares} />
              <StatCell label="외국인비중" value={company.stats.foreignRatio} right />
            </div>
            <div className="py-4">
              <p className="mb-2 text-[11px] text-[#9ca3af]">비교기업</p>
              <div className="grid grid-cols-2 divide-x divide-[#f3f4f6]">
                <StatCell label="업종"     value={company.stats.compareIndustry} />
                <StatCell label="동종업계" value={company.stats.comparePeer}     right />
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#f3f4f6] pt-4">
              <StatCell label="52W 저" value={company.stats.low52w}  />
              <StatCell label="52W 고" value={company.stats.high52w} right />
            </div>
          </div>
        </div>

        {/* ── 기업 개요 ── */}
        <div className="mt-2 bg-white px-4 py-4">
          <p className="mb-3 text-[12px] font-bold text-[#4b5563]">기업 개요</p>
          <div className="rounded-xl bg-[#f4f6fb] px-3 py-3">
            <p className={`text-[12px] leading-[1.75] text-[#4b5563] ${!expanded ? 'line-clamp-3' : ''}`}>
              {company.overview}
            </p>
          </div>
          {/* 긴 텍스트일 때만 버튼 표시 */}
          {isLongText && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-0.5 text-[11px] font-semibold text-[#014d9d] hover:underline"
              >
                {expanded ? (
                  <>접기 <span className="text-[10px]">↑</span></>
                ) : (
                  <>더 보기 <span className="text-[10px]">→</span></>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── 실적 현황 ── */}
        <div className="mt-2 bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-bold text-[#4b5563]">실적 현황</p>
            <span className="text-[10px] text-[#9ca3af]">{latestPerf.year} 기준</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#f3f4f6] overflow-hidden rounded-xl bg-[#f4f6fb]">
            {[
              { label: '최근 매출액', value: latestPerf.revenue,        growth: latestPerf.revenueGrowth    },
              { label: '영업이익',    value: latestPerf.operatingProfit, growth: latestPerf.operatingGrowth  },
              { label: '순이익',      value: latestPerf.netProfit,       growth: latestPerf.netGrowth        },
            ].map(({ label, value, growth }) => {
              const isPos = growth.startsWith('+');
              return (
                <div key={label} className="flex flex-col items-center gap-0.5 bg-white px-2 py-3">
                  <span className="text-[10px] text-[#9ca3af]">{label}</span>
                  <span className="text-[16px] font-bold text-[#111827]">{value}</span>
                  <span className={`text-[10px] font-semibold ${isPos ? 'text-[#e03131]' : 'text-[#1971c2]'}`}>
                    {growth}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 투자자별 매매 동향 ── */}
        <div className="mt-2 bg-white px-4 py-4 pb-8">
          <p className="mb-4 text-[12px] font-bold text-[#4b5563]">투자자별 매매 동향</p>
          <div className="flex items-end gap-4" style={{ height: 80 }}>
            {company.investorTrends.map(({ label, amount }) => {
              const isPos = amount >= 0;
              const barH  = (Math.abs(amount) / maxAbs) * 56;
              return (
                <div key={label} className="flex flex-1 flex-col items-center gap-1">
                  <span className={`text-[10px] font-semibold ${isPos ? 'text-[#e03131]' : 'text-[#1971c2]'}`}>
                    {isPos ? '+' : ''}{amount}억
                  </span>
                  <div className="flex w-full flex-col items-center justify-end" style={{ height: 56 }}>
                    <div style={{
                      height: barH, width: '60%',
                      backgroundColor: isPos ? '#e03131' : '#1971c2',
                      opacity: 0.75,
                      borderRadius: isPos ? '3px 3px 0 0' : '0 0 3px 3px',
                    }} />
                  </div>
                  <span className="text-[10px] text-[#9ca3af]">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
}