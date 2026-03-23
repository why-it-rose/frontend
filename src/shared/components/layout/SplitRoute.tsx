import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import WebSplitLayout from './WebSplitLayout';
import MobileLayout from './MobileLayout';

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}

type Props = {
  left: ReactNode;
  right: ReactNode;
  mobile: ReactNode;
};

export default function SplitRoute({ left, right, mobile }: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout content={mobile} />;
  }

  return <WebSplitLayout left={left} right={right} />;
}