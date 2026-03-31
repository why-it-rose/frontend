import { useState } from 'react';
import { useUpsertPrediction } from '@/features/prediction/hooks/useUpsertPrediction';
import type { PredictionDirection } from '@/features/prediction/types/prediction.types';
import { useTodayLearning } from '@/features/news/hooks/useTodayLearning';
import type { PredictionInfo } from '@/features/news/types/news.types';
import { getApiResponseCode } from '@/features/auth/api/authApi';

interface TodayLearningSidebarProps {
  stockId: number | undefined;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

// ─── 아이콘 ─────────────────────────────────────────────────────────────────

function UpIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function SidewaysIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

// ─── 예측 섹션 ──────────────────────────────────────────────────────────────

const DIRECTION_OPTIONS = [
  { value: 'UP',       label: '상승', Icon: UpIcon,       activeColor: '#e03131', activeBg: '#FFF0F0' },
  { value: 'SIDEWAYS', label: '횡보', Icon: SidewaysIcon, activeColor: '#6b7280', activeBg: '#f3f4f6' },
  { value: 'DOWN',     label: '하락', Icon: DownIcon,     activeColor: '#1971c2', activeBg: '#EFF6FF' },
] as const;

interface PredictionSectionProps {
  isLoggedIn: boolean;
  prediction: PredictionInfo | undefined;
  isPending: boolean;
  pendingDirection: PredictionDirection | null;
  onLoginRequired: () => void;
  onPredict: (direction: PredictionDirection) => void;
}

function PredictionSection({
  isLoggedIn,
  prediction,
  isPending,
  pendingDirection,
  onLoginRequired,
  onPredict,
}: PredictionSectionProps) {
  return (
    <div className="rounded-[10px] p-4 mb-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
      <p className="text-[13px] font-semibold text-[#374151] mb-3">오를까? 내릴까?</p>
      <div className="grid grid-cols-3 gap-2">
        {DIRECTION_OPTIONS.map(({ value, label, Icon, activeColor, activeBg }) => {
          const isActive = isLoggedIn && prediction?.direction === value;
          const isDisabled = isPending;
          const isThisPending = isPending && pendingDirection === value;

          return (
            <button
              key={value}
              type="button"
              disabled={isDisabled || isPending}
              onClick={() => {
                if (!isLoggedIn) {
                  onLoginRequired();
                  return;
                }
                onPredict(value);
              }}
              className="flex flex-col items-center gap-1.5 py-3 rounded-[10px] transition-all active:opacity-70 disabled:opacity-40"
              style={
                isActive
                  ? { color: activeColor, background: activeBg, border: `1.5px solid ${activeColor}` }
                  : { color: '#9ca3af', background: '#f9fafb', border: '1.5px solid #e5e7eb' }
              }
            >
              {isThisPending ? (
                <div className="w-[26px] h-[26px] flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <Icon />
              )}
              <span className="text-[13px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
      {prediction?.reason && (
        <p className="mt-3 text-[12px] text-[#6b7280] leading-[1.6] bg-[#f9fafb] rounded-lg px-3 py-2">
          {prediction.reason}
        </p>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function TodayLearningSidebar({
  stockId,
  isOpen,
  onClose,
  isLoggedIn,
  onLoginRequired,
}: TodayLearningSidebarProps) {
  const { data, isLoading, isError, refetch } = useTodayLearning(stockId, isOpen);
  const { mutate: upsertPrediction, isPending, variables } = useUpsertPrediction();
  const [predictError, setPredictError] = useState<string | null>(null);

  const pendingDirection = isPending ? (variables?.direction ?? null) : null;

  function handlePredict(direction: PredictionDirection) {
    if (!data || stockId == null) return;
    setPredictError(null);
    upsertPrediction(
      { digestId: data.digestId, stockId, direction },
      {
        onSuccess: () => void refetch(),
        onError: (error) => {
          const code = getApiResponseCode(error);
          if (code === 4031) setPredictError('오늘의 학습에서만 예측할 수 있습니다.');
          else if (code === 4030) setPredictError('학습 정보를 찾을 수 없습니다.');
          else if (code === 4032) setPredictError('종목 정보를 찾을 수 없습니다.');
          else setPredictError('예측 등록에 실패했습니다. 다시 시도해 주세요.');
        },
      },
    );
  }

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-[#f4f6fb]">
      {/* 헤더 */}
      <div className="shrink-0 bg-white">
        <div className="relative flex h-[48px] items-center justify-center px-4">
          <span className="text-[13px] font-semibold text-[#014D9D]">오늘의 학습</span>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f2f4f7] transition-colors"
            aria-label="닫기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="h-[2px] w-full bg-[#014D9D]" />
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4" style={{ scrollbarGutter: 'stable' }}>
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#014D9D] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-40 text-sm text-[#e03131]">
            데이터를 불러오지 못했습니다.
          </div>
        )}

        {!isLoading && !isError && data === null && (
          <div className="flex items-center justify-center h-40 text-sm text-[#9ca3af]">
            오늘의 뉴스가 없습니다.
          </div>
        )}

        {!isLoading && !isError && data !== null && data !== undefined && (
          <>
            {/* 섹션 A — 가격 요약 카드 */}
            <div
              className="mt-3 mb-2.5 rounded-[14px] p-4"
              style={{ background: '#014D9D' }}
            >
              <p className="text-[11px] text-[#93c5fd] mb-1">{data.digestDate}</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-[20px] text-white">{data.stockName}</span>
                {data.changeRate !== undefined && (
                  <span
                    className="font-bold text-[18px]"
                    style={{
                      color: data.changeRate.startsWith('+') ? '#fca5a5' : '#93c5fd',
                    }}
                  >
                    {data.changeRate}
                  </span>
                )}
              </div>
              {data.priceClose !== undefined && data.prevPriceClose !== undefined && (
                <p className="text-[13px] text-[#93c5fd]">
                  {data.prevPriceClose.toLocaleString()}원 → {data.priceClose.toLocaleString()}원
                </p>
              )}
            </div>

            {/* 섹션 B — 예측 */}
            <PredictionSection
              isLoggedIn={isLoggedIn}
              prediction={data.prediction}
              isPending={isPending}
              pendingDirection={pendingDirection}
              onLoginRequired={onLoginRequired}
              onPredict={handlePredict}
            />
            {predictError && (
              <p className="-mt-2 mb-3 rounded-lg bg-[#FFF0F0] px-3 py-2 text-[12px] text-[#e03131]">
                {predictError}
              </p>
            )}

            {/* 섹션 C — 관련 뉴스 */}
            <div className="mb-4">
              <p className="font-semibold text-sm text-[#374151] mb-2.5">관련 뉴스</p>
              {data.newsList.length === 0 ? (
                <p className="text-sm text-[#9ca3af]">관련 뉴스가 없습니다.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.newsList.map((item) => (
                    <a
                      key={item.newsId}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white rounded-[10px] p-[12px_14px] hover:bg-[#f9fafb] transition-colors"
                      style={{ border: '1px solid #e5e7eb' }}
                    >
                      <p className="font-bold text-sm text-[#101828] leading-[1.4] mb-1.5">{item.title}</p>
                      <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-2 line-clamp-2">{item.summary}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-[#9ca3af]">
                          {item.source} · {item.publishedAt}
                        </span>
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] text-[#4b5563] bg-[#f3f4f6] px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  );
}
