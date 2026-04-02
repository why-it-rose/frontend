import TabBar from '@/shared/components/common/TabBar';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { sharedEventPanelTab } from '@/features/event/sharedEventPanelTab';
import EventTab from '@/features/event/components/EventTab';
import MemoTab from '@/features/event/components/MemoTab';
import { useEventDetail } from '@/features/event/hooks/useEventDetail';
import { useMemos } from '@/features/event/hooks/useMemos';
import { useAuth } from '@/features/auth/context/AuthContext';
import GuestLockPanel from '@/shared/components/common/GuestLockPanel';
import StockDetailAside from '@/pages/StockDetail/components/StockDetailaside';

const TABS = [
  { label: '기업 정보', value: 'overview' },
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

  const [tab, setTab] = useState<'overview' | 'event' | 'memo'>(sharedEventPanelTab.value);
  const handleTabChange = (v: string) => {
    const next = v as 'overview' | 'event' | 'memo';
    sharedEventPanelTab.value = next;
    setTab(next);
  };

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

  if ((tab === 'event' || tab === 'memo') && !event && error) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#e03131]">{error}</div>;
  }

  if ((tab === 'event' || tab === 'memo') && !event) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#9ca3af]">이벤트를 선택해주세요.</div>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TabBar tabs={TABS} value={tab} onChange={handleTabChange} />
      {tab === 'overview' && (
          <div className="min-h-0 flex-1 overflow-hidden">
            <StockDetailAside hideHeader />
          </div>
      )}
      {tab === 'event' && event && (
          <EventTab
              event={event}
              scrapping={scrapping}
              onScrap={toggleScrap}
              scrapErrorMessage={scrapError}
          />
      )}

      {tab === 'memo' && event && (
          <MemoTab
              memos={memos}
              eventInfo={{
                eventType: event.eventType,
                stockName: event.stockName,
                changeRate: event.changeRate,
              }}
              onSave={save}
              onUpdate={update}
              onDelete={remove}
          />
      )}
    </div>
  );
}
