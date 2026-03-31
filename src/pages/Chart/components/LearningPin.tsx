import type { LearningPinResult } from '@/features/news/types/news.types';

interface LearningPinProps {
  data: LearningPinResult;
  onClick: () => void;
}

/**
 * 오늘의 학습 핀 — 모바일 차트 탭 칩 영역에서 사용
 * 데스크톱 차트 핀은 LightweightCandleChart 내부 DOM 오버레이로 렌더링됨
 */
export function LearningPin({ data, onClick }: LearningPinProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-medium transition-colors active:opacity-70"
      style={{
        borderColor: '#93c5fd',
        backgroundColor: '#eff6ff',
        color: '#014D9D',
      }}
    >
      {/* 마름모 아이콘 */}
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          backgroundColor: '#014D9D',
          transform: 'rotate(45deg)',
          flexShrink: 0,
        }}
      />
      오늘의 뉴스 · {data.newsCount}건
    </button>
  );
}
