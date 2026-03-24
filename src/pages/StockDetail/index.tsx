import TabBar from '@/shared/components/common/TabBar';
import { useState } from 'react';
import EventTab from '@/features/event/components/EventTab';
import MemoTab from '@/features/event/components/MemoTab';
import type { StockEvent, StockMemo } from '@/features/event/types/event.types';

const mockEvent: StockEvent = {
  eventId: 1,
  stockCode: '005930',
  stockName: '삼성전자',
  eventType: 'SURGE',
  occurredAt: '2025-11-26T09:00:00',
  changeRate: 17.2,
  priceBefore: 125000,
  priceAfter: 146500,
  aiSummary:
    '이 구간에서는 엔비디아 GTC 컨퍼런스 이후 HBM3E 공급 기대감이 급격히 확대되었습니다. 삼성전자의 AI 칩 납품 재개 가능성이 보도되며 외국인 매수세가 집중된 것으로 확인됩니다.',
  relatedNews: [
    { newsId: 1, title: '외국인, 삼성전자 3일 연속 순매수 2조원 돌파', body: '외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.', source: '연합인포맥스', publishedAt: '2025-11-26T10:00:00', url: '#', tag: '외국인' },
    { newsId: 2, title: '외국인, 삼성전자 3일 연속 순매수 2조원 돌파', body: '외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.', source: '연합인포맥스', publishedAt: '2025-11-26T11:00:00', url: '#', tag: '외국인' },
    { newsId: 3, title: '외국인, 삼성전자 3일 연속 순매수 2조원 돌파', body: '외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.', source: '연합인포맥스', publishedAt: '2025-11-26T12:00:00', url: '#', tag: '외국인' },
  ],
  isScrapped: false,
};

const mockMemos: StockMemo[] = [
  { memoId: 1, eventType: 'SURGE', stockName: '삼성전자', changeRate: 19.47, date: '03.16', text: 'HBM 납품 기대감으로 외국인 매수세가 강하게 불은 구간. 단기 과열은 있었지만 수급이 생각보다 오래 유지됨. 다음엔 뉴스보다 외국인 수급 강도를 더 먼저 봐야겠음.' },
  { memoId: 2, eventType: 'PLUNGE', stockName: '삼성전자', changeRate: -8.23, date: '03.02', text: '실적 하향과 납품 지연 우려가 겹치면 섹터 전체가 같이 흔들리는 패턴. 개별 종목 이슈처럼 보여도 섹터 체인으로 같이 봐야 함.' },
];

const TABS = [
  { label: '이벤트', value: 'event' },
  { label: '메모', value: 'memo' },
];

export default function StockDetailPage() {
  const [tab, setTab] = useState('event');
  const [memos, setMemos] = useState<StockMemo[]>(mockMemos);

  const handleSave = (text: string) => {
    setMemos((prev) => [
      { memoId: Date.now(), eventType: 'SURGE', stockName: '삼성전자', changeRate: 17.2, date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').slice(0, -1), text },
      ...prev,
    ]);
  };

  const handleDelete = (memoId: number) => {
    setMemos((prev) => prev.filter((m) => m.memoId !== memoId));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TabBar tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'event' && <EventTab event={mockEvent} onScrap={(id, s) => console.log(id, s)} />}
      {tab === 'memo' && <MemoTab memos={memos} onSave={handleSave} onDelete={handleDelete} />}
    </div>
  );
}
