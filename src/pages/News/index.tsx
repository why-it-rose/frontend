import NewsTab from '@/features/news/components/NewsTab';
import type { TodayNews } from '@/features/news/types/news.types';

const mockNews: TodayNews = {
  newsId: 1,
  stockCode: '005930',
  stockName: '삼성전자',
  eventType: 'PLUNGE',
  occurredAt: '2026-03-17T09:00:00',
  changeRate: 2.08,
  priceBefore: 188000,
  priceAfter: 184000,
  aiSummary:
    '이 구간에서는 엔비디아 GTC 컨퍼런스 이후 HBM3E 공급 기대감이 급격히 확대되었습니다. 삼성전자의 AI 칩 납품 재개 가능성이 보도되며 외국인 매수세가 집중된 것으로 확인됩니다.',
  relatedNews: [
    { newsId: 1, title: '외국인, 삼성전자 3일 연속 순매수 2조원 돌파', body: '외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.', source: '연합인포맥스', publishedAt: '2026-03-16T10:00:00', url: '#', tag: '외국인' },
    { newsId: 2, title: '외국인, 삼성전자 3일 연속 순매수 2조원 돌파', body: '외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.', source: '연합인포맥스', publishedAt: '2026-03-16T11:00:00', url: '#', tag: '외국인' },
    { newsId: 3, title: '외국인, 삼성전자 3일 연속 순매수 2조원 돌파', body: '외국인 투자자들이 삼성전자를 3거래일 연속 순매수하며 코스피 상승을 이끌었다.', source: '연합인포맥스', publishedAt: '2026-03-16T12:00:00', url: '#', tag: '외국인' },
  ],
};

export default function NewsPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0 px-5 py-3 border-b border-[#e5e7eb] bg-white">
        <h2 className="text-[15px] font-bold text-text-primary text-center">오늘의 뉴스</h2>
      </div>
      <NewsTab news={mockNews} />
    </div>
  );
}
