import { useState } from 'react';
import type { TodayNews, VoteType } from '../types/news.types';

interface NewsTabProps {
  news: TodayNews;
}

function VoteIcon({ type }: { type: '상승' | '횡보' | '하락' }) {
  if (type === '상승') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    );
  }
  if (type === '횡보') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    );
  }
  // 하락
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

const VOTE_OPTIONS: { label: '상승' | '횡보' | '하락'; activeColor: string; activeBg: string }[] = [
  { label: '상승', activeColor: '#e03131', activeBg: '#FFF0F0' },
  { label: '횡보', activeColor: '#6b7280', activeBg: '#f3f4f6' },
  { label: '하락', activeColor: '#1971c2', activeBg: '#EFF6FF' },
];

export default function NewsTab({ news }: NewsTabProps) {
  const [vote, setVote] = useState<VoteType>(null);

  const {
    stockName,
    eventType,
    occurredAt,
    changeRate,
    priceBefore,
    priceAfter,
    aiSummary,
    relatedNews,
  } = news;

  const isSurge = eventType === 'SURGE';
  const sign = isSurge ? '+' : '-';
  const rateColor = isSurge ? '#e03131' : '#1971c2';

  const date = new Date(occurredAt);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLabel = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (${weekdays[date.getDay()]})`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-4" style={{ scrollbarGutter: 'stable' }}>

        {/* 이벤트 헤더 카드 */}
        <div className="mt-3 mb-2.5 rounded-[14px] p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-[#9ca3af]">{dateLabel}</span>
          </div>
          <div className="mb-1">
            <span className="font-bold text-[20px] md:text-[22px] text-text-primary">{stockName}{' '}</span>
            <span className="font-bold text-[20px] md:text-[22px]" style={{ color: rateColor }}>
              {sign}{changeRate}%
            </span>
          </div>
          <p className="text-[13px] text-[#9ca3af]">
            {priceBefore.toLocaleString()}원 → {priceAfter.toLocaleString()}원
          </p>
        </div>

        {/* AI 요약 */}
        <div className="rounded-[10px] p-3.5 mb-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-600">AI 요약 · 참고 정보</span>
          </div>
          <p className="text-[13px] text-[#374151] leading-[1.7] mb-2.5">{aiSummary}</p>
          <div className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] text-[#9ca3af]">실제 원인 단정이 아닌 참고 정보입니다</span>
          </div>
        </div>

        {/* 오를까? 내릴까? */}
        <div className="rounded-[10px] p-4 mb-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <p className="text-[13px] font-semibold text-[#374151] mb-3">오를까? 내릴까?</p>
          <div className="grid grid-cols-3 gap-2">
            {VOTE_OPTIONS.map(({ label, activeColor, activeBg }) => {
              const isActive = vote === label;
              return (
                <button
                  key={label}
                  onClick={() => setVote(isActive ? null : label)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-[10px] transition-all active:opacity-70"
                  style={
                    isActive
                      ? { color: activeColor, background: activeBg, border: `1.5px solid ${activeColor}` }
                      : { color: '#9ca3af', background: '#f9fafb', border: '1.5px solid #e5e7eb' }
                  }
                >
                  <VoteIcon type={label} />
                  <span className="text-[13px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 관련 뉴스 */}
        <div>
          <p className="font-semibold text-sm text-[#374151] mb-2.5">관련 뉴스</p>
          <div className="space-y-2.5">
            {relatedNews.map((item) => (
              <div
                key={item.newsId}
                onClick={() => window.open(item.url, '_blank', 'width=800,height=600,noopener,noreferrer')}
                className="block bg-white rounded-[10px] p-[12px_14px] active:bg-bg-subtle md:hover:bg-bg-subtle transition-colors cursor-pointer"
                style={{ border: '1px solid #e5e7eb' }}
              >
                <p className="font-bold text-sm text-text-primary leading-[1.4] mb-1.5">{item.title}</p>
                <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-2">{item.body}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[#9ca3af]">
                    {item.source} ·{' '}
                    {new Date(item.publishedAt)
                      .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                      .replace(/\. /g, '.')
                      .slice(0, -1)}
                  </span>
                  <span className="text-[11px] text-[#4b5563] bg-[#f3f4f6] px-2 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
