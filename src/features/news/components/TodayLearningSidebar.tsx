import { useState } from 'react';
import { getApiResponseCode } from '@/features/auth/api/authApi';
import { useTodayLearning } from '@/features/news/hooks/useTodayLearning';
import type { PredictionInfo } from '@/features/news/types/news.types';
import { useUpsertPrediction } from '@/features/prediction/hooks/useUpsertPrediction';
import type { PredictionDirection } from '@/features/prediction/types/prediction.types';

interface TodayLearningSidebarProps {
  stockId: number | undefined;
  isOpen: boolean;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

function UpIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function SidewaysIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

const DIRECTION_OPTIONS = [
  { value: 'UP', label: '상승', Icon: UpIcon, activeColor: '#e03131', activeBg: '#FFF0F0' },
  { value: 'SIDEWAYS', label: '횡보', Icon: SidewaysIcon, activeColor: '#6b7280', activeBg: '#f3f4f6' },
  { value: 'DOWN', label: '하락', Icon: DownIcon, activeColor: '#1971c2', activeBg: '#EFF6FF' },
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
    <div className="mb-4 rounded-[10px] p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
      <p className="mb-3 text-[13px] font-semibold text-[#374151]">오를까? 내릴까?</p>
      <div className="grid grid-cols-3 gap-2">
        {DIRECTION_OPTIONS.map(({ value, label, Icon, activeColor, activeBg }) => {
          const isActive = isLoggedIn && prediction?.direction === value;
          const isThisPending = isPending && pendingDirection === value;

          return (
            <button
              key={value}
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!isLoggedIn) {
                  onLoginRequired();
                  return;
                }
                onPredict(value);
              }}
              className="flex flex-col items-center gap-1.5 rounded-[10px] py-3 transition-all active:opacity-70 disabled:opacity-40"
              style={
                isActive
                  ? { color: activeColor, background: activeBg, border: `1.5px solid ${activeColor}` }
                  : { color: '#9ca3af', background: '#f9fafb', border: '1.5px solid #e5e7eb' }
              }
            >
              {isThisPending ? (
                <div className="flex h-[26px] w-[26px] items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
        <p className="mt-3 rounded-lg bg-[#f9fafb] px-3 py-2 text-[12px] leading-[1.6] text-[#6b7280]">
          {prediction.reason}
        </p>
      )}
    </div>
  );
}

export default function TodayLearningSidebar({
  stockId,
  isOpen,
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
          if (code === 4031) setPredictError('오늘의 학습에서는 예측이 이미 등록되어 있습니다.');
          else if (code === 4030) setPredictError('학습 정보를 찾을 수 없습니다.');
          else if (code === 4032) setPredictError('종목 정보를 찾을 수 없습니다.');
          else setPredictError('예측 등록에 실패했습니다. 다시 시도해 주세요.');
        },
      },
    );
  }

  if (!isOpen) return null;

  return (
    <div className="flex h-full flex-col bg-[#f4f6fb]">
      <div className="hidden shrink-0 bg-white md:block">
        <div className="flex h-12 items-center justify-center px-4">
          <span className="text-sm font-medium text-[#014D9D]">오늘의 학습</span>
        </div>
        <div className="h-0.5 w-full bg-[#014D9D]" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4" style={{ scrollbarGutter: 'stable' }}>
        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#014D9D] border-t-transparent" />
          </div>
        )}

        {isError && (
          <div className="flex h-40 items-center justify-center text-sm text-[#e03131]">
            데이터를 불러오지 못했습니다.
          </div>
        )}

        {!isLoading && !isError && data === null && (
          <div className="flex h-40 items-center justify-center text-sm text-[#9ca3af]">
            오늘의 뉴스가 없습니다.
          </div>
        )}

        {!isLoading && !isError && data !== null && data !== undefined && (
          <>
            <div className="mb-2.5 mt-3 rounded-[14px] p-4" style={{ background: '#014D9D' }}>
              <p className="mb-1 text-[11px] text-[#93c5fd]">{data.digestDate}</p>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-[20px] font-bold text-white">{data.stockName}</span>
                {data.changeRate !== undefined && (
                  <span
                    className="text-[18px] font-bold"
                    style={{ color: data.changeRate.startsWith('+') ? '#fca5a5' : '#93c5fd' }}
                  >
                    {data.changeRate}
                  </span>
                )}
              </div>
              {data.priceClose !== undefined && data.prevPriceClose !== undefined && (
                <p className="text-[13px] text-[#93c5fd]">
                  {data.prevPriceClose.toLocaleString()}원에서 {data.priceClose.toLocaleString()}원
                </p>
              )}
            </div>

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

            <div className="mb-4">
              <p className="mb-2.5 text-sm font-semibold text-[#374151]">관련 뉴스</p>
              {data.newsList.length === 0 ? (
                <p className="text-sm text-[#9ca3af]">관련 뉴스가 없습니다.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.newsList.map((item) => (
                    <a
                      key={item.newsId}
                      href={item.url}
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.innerWidth > 768) {
                          window.open(item.url, '_blank', 'width=800,height=600,noopener,noreferrer');
                          return;
                        }
                        window.open(item.url, '_blank');
                      }}
                      className="block rounded-[10px] bg-white p-[12px_14px] transition-colors hover:bg-[#f9fafb]"
                      style={{ border: '1px solid #e5e7eb' }}
                    >
                      <p className="mb-1.5 text-sm font-bold leading-[1.4] text-[#101828]">{item.title}</p>
                      <p className="mb-2 line-clamp-2 text-[13px] leading-[1.6] text-[#6b7280]">{item.summary}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-[#9ca3af]">
                          {item.source} · {item.publishedAt}
                        </span>
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[11px] text-[#4b5563]"
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
