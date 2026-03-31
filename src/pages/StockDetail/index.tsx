import TabBar from '@/shared/components/common/TabBar';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import EventTab from '@/features/event/components/EventTab';
import MemoTab from '@/features/event/components/MemoTab';
import { useEventDetail } from '@/features/event/hooks/useEventDetail';
import { useMemos } from '@/features/event/hooks/useMemos';

const TABS = [
  { label: '이벤트', value: 'event' },
  { label: '메모', value: 'memo' },
];

export default function StockDetailPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') ? Number(searchParams.get('eventId')) : null;

  const { event, loading, scrapping, error, scrapError, toggleScrap } = useEventDetail(eventId);
  const { memos, save, update, remove } = useMemos(eventId);

  const [tab, setTab] = useState('event');

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
      <TabBar tabs={TABS} value={tab} onChange={setTab} />
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