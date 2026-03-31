import logoHappy from '@/assets/logo_happy.svg';
import { usePredictions } from '@/features/prediction/hooks/usePredictions';
import { useWeeklySummary } from '@/features/prediction/hooks/useWeeklySummary';
import type { PredictionDirection, PredictionDto } from '@/features/prediction/types/prediction.types';

const interNums = { fontFamily: 'Inter, "Pretendard Variable", Pretendard, sans-serif' } as const;

const AVATAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  if (name.length >= 2 && /^[A-Za-z]/.test(name)) return name.slice(0, 2);
  return Array.from(name.trim()).slice(0, 1).join('');
}

/** "2026-03-31" → "2026.03.31" */
function formatDigestDate(date: string): string {
  return date.replace(/-/g, '.');
}

function ReviewAvatar({ initials, bg, logoUrl }: { initials: string; bg: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-[7px] object-cover"
      />
    );
  }
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

function directionLabel(direction: PredictionDirection): string {
  if (direction === 'UP') return '상승예측';
  if (direction === 'DOWN') return '하락예측';
  return '횡보예측';
}

function formatChangePct(pct: number | null): string {
  if (pct === null) return '-';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function rowBg(isCorrect: boolean | null): string {
  if (isCorrect === true) return '#f0fdf4';
  if (isCorrect === false) return '#fef2f2';
  return '#fff';
}

function PredictionLabel({ direction }: { direction: PredictionDirection }) {
  if (direction === 'UP') {
    return (
      <div className="text-[11px] font-medium leading-4 text-emerald-600">
        상승예측 <span aria-hidden>▲</span>
      </div>
    );
  }
  if (direction === 'DOWN') {
    return (
      <div className="text-[11px] font-medium leading-4 text-red-600">
        하락예측 <span aria-hidden>▼</span>
      </div>
    );
  }
  return (
    <div className="text-[11px] font-medium leading-4 text-[#6b7280]">
      횡보예측 <span aria-hidden>—</span>
    </div>
  );
}

function PredictionRow({ item }: { item: PredictionDto }) {
  const bg = rowBg(item.isCorrect);
  const color = getAvatarColor(item.stockName);
  const ini = getInitials(item.stockName);
  const chg = formatChangePct(item.actualChangePct);
  const resultLabel = item.isCorrect === true ? '적중' : item.isCorrect === false ? '미적중' : '집계 중';
  const resultPending = item.isCorrect === null;

  return (
    <div
      className="flex h-auto w-full items-center justify-between border-b border-white px-[21px] py-3"
      style={{ backgroundColor: bg }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <ReviewAvatar initials={ini} bg={color} logoUrl={item.stockLogoUrl} />
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{item.stockName}</div>
          <PredictionLabel direction={item.direction} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        <span
          className={`-mt-0.5 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
            resultPending
              ? 'bg-[#f3f4f6] text-[#6b7280]'
              : item.isCorrect
                ? 'bg-[#DCFCE7] text-emerald-900'
                : 'bg-[#FEE2E2] text-red-900'
          }`}
        >
          {resultLabel}
        </span>
        <div
          className={`mypage-scrap-kr text-[10.5px] font-semibold leading-[15.75px] tabular-nums ${changeRateColorClass(chg)}`}
        >
          {chg}
        </div>
      </div>
    </div>
  );
}

export default function MyPageReviewTab() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = usePredictions();

  const { data: weekly } = useWeeklySummary();

  const weeklyTotal = weekly?.weeklyTotal ?? 0;
  const weeklyCorrect = weekly?.weeklyCorrect ?? 0;
  const weeklyAccuracy =
    weekly?.weeklyAccuracy !== null && weekly?.weeklyAccuracy !== undefined
      ? `${weekly.weeklyAccuracy.toFixed(1)}%`
      : weeklyTotal > 0
        ? `${Math.round((weeklyCorrect / weeklyTotal) * 100)}%`
        : '0%';

  const groups = data?.pages.flatMap((page) => page.groups) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-[21px] py-12 text-[13px] text-[#9ca3af]">
        불러오는 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center px-[21px] py-12 text-[13px] text-red-500">
        데이터를 불러오지 못했습니다.
      </div>
    );
  }

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
              {weeklyTotal}
            </span>
            건 중{' '}
            <span className="tabular-nums" style={interNums}>
              {weeklyCorrect}
            </span>
            건 적중했어요!
          </span>
        </div>
        <span
          className="inline-flex min-w-[2.75rem] shrink-0 items-center justify-center rounded-full bg-[#dbeafe] px-2.5 py-px text-center text-[13px] font-bold leading-tight tabular-nums text-[#2563eb]"
          style={interNums}
        >
          {weeklyAccuracy}
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-[#9ca3af]">아직 예측 기록이 없어요.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(({ digestDate, predictions }) => (
            <section key={digestDate} className="flex flex-col gap-0">
              <h3 className="-mx-[21px] border-b border-[#e5e7eb] px-[21px] pb-2.5 text-[12px] font-bold text-[#6b7280]">
                {formatDigestDate(digestDate)}
              </h3>
              <div className="-mx-[21px] flex flex-col">
                {predictions.map((item) => (
                  <PredictionRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 w-full rounded-2xl border border-dashed border-[#d1d5db] bg-transparent py-2 text-[13px] font-medium text-[#6b7280] transition-colors hover:bg-[#f9fafb] disabled:opacity-60"
        >
          {isFetchingNextPage ? '불러오는 중...' : '+ 이전 기록 더 보기'}
        </button>
      )}
    </div>
  );
}

export { directionLabel };
