import TabBar from '@/shared/components/common/TabBar';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import EventTab from '@/features/event/components/EventTab';
import MemoTab from '@/features/event/components/MemoTab';
import { useEventDetail } from '@/features/event/hooks/useEventDetail';
import { useMemos } from '@/features/event/hooks/useMemos';
import { useAuth } from '@/features/auth/context/AuthContext';
import GuestLockPanel from '@/shared/components/common/GuestLockPanel';

const TABS = [
  { label: '이벤트', value: 'event' },
  { label: '메모', value: 'memo' },
];

export default function StockDetailPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') ? Number(searchParams.get('eventId')) : null;

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { stockCode } = useParams<{ stockCode?: string }>();

  const gatedEventId = isLoggedIn ? eventId : null;
  const { event, loading, scrapping, error, scrapError, toggleScrap } = useEventDetail(gatedEventId, isLoggedIn);
  const { memos, save, update, remove } = useMemos(gatedEventId, isLoggedIn);

  const requestedTab = searchParams.get('tab') === 'memo' ? 'memo' : 'event';
  const [tab, setTab] = useState<'event' | 'memo'>(requestedTab);

  useEffect(() => {
    setTab(requestedTab);
  }, [requestedTab]);

  if (!isLoggedIn) {
    return (
      <GuestLockPanel
        title="이벤트"
        message={
          <>
            <span className="font-semibold text-text-primary">로그인</span> 후 급등락 이벤트<br />
            관련 뉴스를 확인하고<br />
            학습 내용을 메모해보세요.
          </>
        }
        onClose={() => navigate(stockCode ? `/chart/${stockCode}/stock-detail` : -1 as never)}
      />
    );
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#9ca3af]">불러오는 중...</div>;
  }

  if (!event && error) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#e03131]">{error}</div>;
  }

  if (!event) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#9ca3af]">이벤트를 선택해주세요.</div>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TabBar tabs={TABS} value={tab} onChange={(v) => setTab(v as 'event' | 'memo')} />
      {tab === 'event' && (
          <EventTab
              event={event}
              scrapping={scrapping}
              onScrap={toggleScrap}
              scrapErrorMessage={scrapError}
          />
      )}
      {tab === 'memo' && (
          <MemoTab
              memos={memos}
              eventInfo={{ eventType: event.eventType, stockName: event.stockName, changeRate: event.changeRate }}
              onSave={save}
              onUpdate={update}
              onDelete={remove}
          />
      )}
    </div>
  );
}
