import type { ReactNode } from 'react';
import Header from './Header';
import BottomTabBar from './BottomTabBar';

export default function MobileLayout({
  content,
}: {
  content: ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main
        style={{
          flex: 1,
          padding: '16px',
          overflow: 'auto',
        }}
      >
        {content}
      </main>

      <BottomTabBar />
    </div>
  );
}