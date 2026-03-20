import type { ReactNode } from 'react';
import Header from './Header';

export default function WebSplitLayout({
  left,
  right,
  leftWidth = '70%',
  rightWidth = '30%',
}: {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string;
  rightWidth?: string;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1 }}>
        <section
          style={{
            width: leftWidth,
            borderRight: '1px solid #ddd',
            padding: '24px',
            overflow: 'auto',
          }}
        >
          {left}
        </section>

        <section
          style={{
            width: rightWidth,
            padding: '24px',
            overflow: 'auto',
          }}
        >
          {right}
        </section>
      </div>
    </div>
  );
}