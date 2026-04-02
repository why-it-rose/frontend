import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import type { CompanyInfo } from '@/pages/StockDetail/types/companyInfo';
import { useCompanyInfoPanel } from '@/pages/StockDetail/hooks/useCompanyInfoPanel';

interface StatCellProps {
  label: string;
  value: string;
  accent?: boolean;
  right?: boolean;
  valueClassName?: string;
}

function StatCell({
  label,
  value,
  right = false,
  valueClassName = '',
}: StatCellProps) {
  return (
    <div className={`flex flex-col gap-1 ${right ? 'pl-4' : 'pr-4'}`}>
      <span className="text-[10px] font-medium text-[#98a2b3]">{label}</span>
      <span
        className={`text-[13px] font-semibold tracking-[-0.01em] ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

interface StockDetailAsideProps {
  /** 라우트 밖에서 쓸 때만 주입 (스토리북 등) */
  company?: CompanyInfo;
  hideHeader?: boolean;
}

export default function StockDetailAside({
  company: companyProp,
  hideHeader = false,
}: StockDetailAsideProps) {
  const { stockCode } = useParams<{ stockCode?: string }>();
  const { company: fromRoute } = useCompanyInfoPanel(stockCode);
  const company = companyProp ?? fromRoute;

  const [expanded, setExpanded] = useState(false);
  const [canExpandOverview, setCanExpandOverview] = useState(false);
  const [useCompactPerfValue, setUseCompactPerfValue] = useState(false);
  const overviewRef = useRef<HTMLParagraphElement | null>(null);
  const latestPerf = company.performance.at(-1);
  const maxAbs = Math.max(
    ...(company.investorTrends.length
      ? company.investorTrends.map((t) => Math.abs(t.amount))
      : [0]),
    1,
  );

  useEffect(() => {
    const updateCompactFlag = () => {
      setUseCompactPerfValue(window.innerWidth < 768);
    };
    updateCompactFlag();
    window.addEventListener('resize', updateCompactFlag);
    return () => window.removeEventListener('resize', updateCompactFlag);
  }, []);

  useEffect(() => {
    const el = overviewRef.current;
    if (!el) return;

    const updateExpandable = () => {
      setCanExpandOverview(el.scrollHeight > el.clientHeight + 1);
    };

    updateExpandable();

    const resizeObserver = new ResizeObserver(() => {
      updateExpandable();
    });

    resizeObserver.observe(el);
    window.addEventListener('resize', updateExpandable);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateExpandable);
    };
  }, [company.overview, expanded]);

  const toCompactJo = (raw: string): string => {
    const m = raw.match(/^([\d,]+)조(?:\s*([\d,]+)억)?$/);
    if (!m) return raw;
    const jo = Number(m[1].replace(/,/g, ''));
    const eok = Number((m[2] ?? '0').replace(/,/g, ''));
    if (!Number.isFinite(jo) || !Number.isFinite(eok)) return raw;
    const compact = jo + eok / 10000;
    const oneDecimal = Math.round(compact * 10) / 10;
    const compactStr = Number.isInteger(oneDecimal)
      ? String(oneDecimal)
      : oneDecimal.toFixed(1);
    return `${compactStr}조`;
  };

  const formatShareCount = (amount: number): string => {
    const abs = Math.abs(Math.round(amount));
    if (abs === 0) return '0주';
    const man = Math.floor(abs / 10000);
    const rest = abs % 10000;
    if (man > 0 && rest > 0) return `${man.toLocaleString('ko-KR')}만 ${rest.toLocaleString('ko-KR')}주`;
    if (man > 0) return `${man.toLocaleString('ko-KR')}만주`;
    return `${abs.toLocaleString('ko-KR')}주`;
  };
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-[#f4f6fb]">
      {!hideHeader && (
        <div className="shrink-0 bg-white">
          <div className="flex h-[48px] items-center justify-center">
            <span className="text-[13px] font-semibold text-[#0158b8]">
              기업 정보
            </span>
          </div>
          <div className="h-[2px] w-full bg-[#0158b8]" />
        </div>
      )}

      <div
        className="scrollbar-subtle flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="bg-white px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-[#eef2f7]"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: company.badgeColor }}
              >
                {company.badgeText === '?' ? '' : company.badgeText}
              </div>
            )}

            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-[#101828]">
                {company.name}
              </p>
              <p className="text-[11px] text-[#98a2b3]">
                {company.code}
                <span className="mx-1 text-[#d0d5dd]">·</span>
                {company.market}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {company.categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className="whitespace-nowrap rounded-full bg-[#f2f4f7] px-2.5 py-[3px] text-[11px] font-medium text-[#667085] transition-colors hover:bg-[#e9eef5]"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 bg-white px-4 py-4">
          <div className="divide-y divide-[#f2f4f7]">
            <div className="grid grid-cols-2 divide-x divide-[#f2f4f7] pb-4">
              <StatCell label="시가총액" value={company.stats.marketCap} />
              <StatCell
                label="기업순위"
                value={company.stats.exchange}
                right
                valueClassName="text-[#e03131] font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#f2f4f7] py-4">
              <StatCell label="주식수" value={company.stats.shares} />
              <StatCell
                label="외국인비중"
                value={company.stats.foreignRatio}
                right
              />
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#f2f4f7] py-4">
              <StatCell label="산업군" value={company.stats.compareIndustry} />
              <StatCell
                label="세부산업군"
                value={company.stats.comparePeer}
                right
              />
            </div>

            <div className="grid grid-cols-2 divide-x divide-[#f2f4f7] pt-4">
              <StatCell
                label="52주 최저"
                value={company.stats.low52w}
                valueClassName="text-[#1971c2] font-semibold"
              />
              <StatCell
                label="52주 최고"
                value={company.stats.high52w}
                right
                valueClassName="text-[#e03131] font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="mt-2 bg-white px-4 py-4">
          <p className="mb-3 text-[12px] font-semibold text-[#475467]">
            기업 개요
          </p>
          <div className="rounded-xl bg-[#f4f6fb] px-3 py-3">
            <p
              ref={overviewRef}
              className={`text-[12px] leading-[1.72] text-[#475467] ${
                !expanded ? 'line-clamp-3' : ''
              }`}
            >
              {company.overview}
            </p>
          </div>

          {canExpandOverview && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="text-[11px] font-medium text-[#0158b8] hover:underline"
              >
                {expanded ? '접기 ↑' : '더 보기 →'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-2 bg-white px-4 py-4">
          <div className="mb-3 flex items-start justify-between">
            <p className="text-[12px] font-semibold text-[#475467]">
              실적 현황
            </p>
            {latestPerf && (
              <span className="flex flex-col items-end text-[10px] text-[#98a2b3]">
                <span>{latestPerf.year} 기준</span>
                <span>(전년도 대비)</span>
              </span>
            )}
          </div>

          {latestPerf ? (
            <div className="grid grid-cols-3 divide-x divide-[#f2f4f7] overflow-hidden rounded-xl bg-[#f4f6fb]">
              {[
                {
                  label: '최근 매출액',
                  value: latestPerf.revenue,
                  growth: latestPerf.revenueGrowth,
                },
                {
                  label: '영업이익',
                  value: latestPerf.operatingProfit,
                  growth: latestPerf.operatingGrowth,
                },
                {
                  label: '순이익',
                  value: latestPerf.netProfit,
                  growth: latestPerf.netGrowth,
                },
              ].map(({ label, value, growth }) => {
                const isDash = growth === '—';
                const isPos = !isDash && growth.startsWith('+');
                const displayValue = useCompactPerfValue ? toCompactJo(value) : value;

                return (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 bg-white px-2 py-3"
                  >
                    <span className="whitespace-nowrap text-[clamp(9px,0.85vw,10px)] font-medium text-[#98a2b3]">
                      {label}
                    </span>
                    <span className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.01em] leading-tight text-[#101828]">
                      {displayValue}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isDash
                          ? 'text-[#98a2b3]'
                          : isPos
                            ? 'text-[#d92d20]'
                            : 'text-[#1971c2]'
                      }`}
                    >
                      {isDash ? growth : `(${growth})`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-[#98a2b3]">실적 데이터 없음</p>
          )}
        </div>

        <div className="mt-2 bg-white px-4 py-4 pb-8">
          <p className="mb-4 text-[12px] font-semibold text-[#475467]">
            투자자별 매매 동향
          </p>

          <div
            className="flex items-end justify-center gap-4"
            style={{ height: 176 }}
          >
            {company.investorTrends.length === 0 ? (
              <span className="self-center text-[13px] font-semibold text-[#98a2b3]">
                —
              </span>
            ) : (
              company.investorTrends.map(({ label, amount }) => {
                const isPos = amount >= 0;
                const barH = (Math.abs(amount) / maxAbs) * 48;
                const formattedAmount = formatShareCount(amount);

                return (
                  <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
                    <div
                      className="relative flex w-full flex-col items-center"
                      style={{ height: 140 }}
                    >
                      <div
                        className="absolute left-0 right-0 flex items-center justify-center"
                        style={{ top: 36, height: 48 }}
                      >
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-[#e5e7eb]" />

                        <div
                          className="absolute flex justify-center"
                          style={{
                            width: '100%',
                            top: '50%',
                            transform: isPos
                              ? `translateY(calc(-100% - ${barH}px - 6px))`
                              : `translateY(calc(${barH}px + 6px))`,
                          }}
                        >
                          <span
                            className={`block max-w-[72px] px-1 text-center text-[10px] font-semibold leading-[1.15] ${
                              isPos ? 'text-[#d92d20]' : 'text-[#1971c2]'
                            }`}
                          >
                            {isPos ? '+' : ''}
                            {formattedAmount}
                          </span>
                        </div>

                        <div
                          style={{
                            height: barH,
                            width: '60%',
                            backgroundColor: isPos ? '#d92d20' : '#1971c2',
                            opacity: 0.82,
                            borderRadius: isPos ? '3px 3px 0 0' : '0 0 3px 3px',
                            transform: isPos
                              ? 'translateY(-50%)'
                              : 'translateY(50%)',
                          }}
                        />
                      </div>
                    </div>

                    <span className="mt-4 whitespace-nowrap text-[10px] text-[#98a2b3]">
                      {label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
