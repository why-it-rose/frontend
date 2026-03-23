import type { ReactNode } from 'react';
import Header from './Header';
import BottomTabBar from './BottomTabBar';

/** 홈 등 내부에서 높이·스크롤을 쓰려면 main은 스크롤 금지 + min-h-0 (padding 없음) */
export default function MobileLayout({
  content,
}: {
  content: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{content}</main>
      <BottomTabBar />
    </div>
  );
}
