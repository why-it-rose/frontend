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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <section
          style={{
            width: leftWidth,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #eff1f8',
            overflow: 'hidden',
          }}
        >
          {left}
        </section>

        <section
          style={{
            width: rightWidth,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {right}
        </section>
      </div>
    </div>
  );
}
