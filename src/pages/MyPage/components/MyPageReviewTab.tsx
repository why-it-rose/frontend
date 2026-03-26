import { useMemo } from 'react';
import logoHappy from '@/assets/logo_happy.svg';
import { MY_PAGE_REVIEW_DATA } from './myPage.mock';
import type { ReviewItem } from './myPage.types';

const interNums = { fontFamily: 'Inter, "Pretendard Variable", Pretendard, sans-serif' } as const;

function ReviewAvatar({ initials, bg }: { initials: string; bg: string }) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}

function changeRateColorClass(chg: string): string {
  const t = chg.trim();
  if (t.startsWith('+')) return 'text-red-600';
  if (t.startsWith('-')) return 'text-blue-600';
  return 'text-[#111827]';
}

function PredictionLabel({ prediction }: { prediction: string }) {
  if (prediction === '상승예측') {
    return (
      <div className="text-[11px] font-medium leading-4 text-emerald-600">
        상승예측 <span aria-hidden>▲</span>
      </div>
    );
  }
  if (prediction === '하락예측') {
    return (
      <div className="text-[11px] font-medium leading-4 text-red-600">
        하락예측 <span aria-hidden>▼</span>
      </div>
    );
  }
  if (prediction === '횡보예측') {
    return (
      <div className="text-[11px] font-medium leading-4 text-[#6b7280]">
        횡보예측 <span aria-hidden>—</span>
      </div>
    );
  }
  return <div className="text-[11px] leading-4 text-[#6b7280]">{prediction}</div>;
}

function groupReviewByDate(rows: ReviewItem[]): { date: string; items: ReviewItem[] }[] {
  const map = new Map<string, ReviewItem[]>();
  for (const r of rows) {
    const list = map.get(r.date);
    if (list) list.push(r);
    else map.set(r.date, [r]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

export default function MyPageReviewTab() {
  const { total, hits, sections } = useMemo(() => {
    const rows = MY_PAGE_REVIEW_DATA;
    const totalCount = rows.length;
    const hitCount = rows.filter((r) => r.result === '적중').length;
    return {
      total: totalCount,
      hits: hitCount,
      sections: groupReviewByDate(rows),
    };
  }, []);

  return (
    <div className="px-[21px] py-4">
      <div className="mb-3.5 mt-0 flex items-center justify-between rounded-[10px] border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={logoHappy}
            alt=""
            className="h-9 w-9 shrink-0 object-contain"
            width={36}
            height={36}
            aria-hidden
          />
          <span className="text-[13px] font-bold text-[#1e40af]">
            이번 주{' '}
            <span className="tabular-nums" style={interNums}>
              {total}
            </span>
            건 중{' '}
            <span className="tabular-nums" style={interNums}>
              {hits}
            </span>
            건 적중했어요!
          </span>
        </div>
        <span
          className="inline-flex min-w-[2.75rem] shrink-0 items-center justify-center rounded-full bg-[#dbeafe] px-2.5 py-px text-center text-[13px] font-bold leading-tight tabular-nums text-[#2563eb]"
          style={interNums}
        >
          {total > 0 ? `${Math.round((hits / total) * 100)}%` : '0%'}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {sections.map(({ date, items }) => (
          <section key={date} className="flex flex-col gap-0">
            <h3 className="-mx-[21px] border-b border-[#e5e7eb] px-[21px] pb-2.5 text-[12px] font-bold text-[#6b7280]">
              {date}
            </h3>
            <div className="-mx-[21px] flex flex-col">
              {items.map((r, i) => (
                <div
                  key={`${r.code}-${date}-${i}`}
                  className="flex h-auto w-full items-center justify-between border-b border-white px-[21px] py-3"
                  style={{ backgroundColor: r.bg || '#fff' }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <ReviewAvatar initials={r.ini} bg={r.color} />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{r.name}</div>
                      <PredictionLabel prediction={r.prediction} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <span
                      className={`-mt-0.5 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        r.result === '적중'
                          ? 'bg-[#DCFCE7] text-emerald-900'
                          : 'bg-[#FEE2E2] text-red-900'
                      }`}
                    >
                      {r.result}
                    </span>
                    <div
                      className={`mypage-scrap-kr text-[10.5px] font-semibold leading-[15.75px] tabular-nums ${changeRateColorClass(r.chg)}`}
                    >
                      {r.chg}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-2xl border border-dashed border-[#d1d5db] bg-transparent py-2 text-[13px] font-medium text-[#6b7280] transition-colors hover:bg-[#f9fafb]"
      >
        + 이전 기록 더 보기
      </button>
    </div>
  );
}
