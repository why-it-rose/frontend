import { useEffect, useRef, useState, type ReactNode } from 'react';
import Header from './Header';

const SPLIT_RIGHT_WIDTH_KEY = 'web-split-right-width-percent';
const MIN_RIGHT_PERCENT = 20;
const MAX_RIGHT_PERCENT = 40;

function parsePercent(value: string, fallback: number) {
  const parsed = Number.parseFloat(value.replace('%', '').trim());
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function clampPercent(value: number) {
  return Math.max(MIN_RIGHT_PERCENT, Math.min(MAX_RIGHT_PERCENT, value));
}

export default function WebSplitLayout({
  left,
  right,
  rightWidth = '25%',
}: {
  left: ReactNode;
  right: ReactNode;
  rightWidth?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const defaultRightPercent = clampPercent(parsePercent(rightWidth, 25));
  const [rightPercent, setRightPercent] = useState(defaultRightPercent);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(SPLIT_RIGHT_WIDTH_KEY);
    if (!saved) return;
    const parsed = Number.parseFloat(saved);
    if (Number.isNaN(parsed)) return;
    setRightPercent(clampPercent(parsed));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SPLIT_RIGHT_WIDTH_KEY, String(rightPercent));
  }, [rightPercent]);

  const leftPercent = 100 - rightPercent;

  const startResize = () => {
    setIsResizing(true);
    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextRight = ((rect.right - e.clientX) / rect.width) * 100;
      setRightPercent(clampPercent(nextRight));
    };
    const stopResize = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', stopResize);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopResize);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      <div
        ref={containerRef}
        style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', cursor: isResizing ? 'col-resize' : 'default' }}
      >
        <section
          style={{
            width: `${leftPercent}%`,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {left}
        </section>

        <div
          role="separator"
          aria-label="패널 너비 조절"
          onMouseDown={startResize}
          style={{
            width: 6,
            cursor: 'col-resize',
            background: '#eff1f8',
            borderLeft: '1px solid #eff1f8',
            borderRight: '1px solid #eff1f8',
            userSelect: 'none',
          }}
        />

        <section
          style={{
            width: `${rightPercent}%`,
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
