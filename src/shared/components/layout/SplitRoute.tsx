import type { ReactNode } from 'react';
import WebSplitLayout from './WebSplitLayout';
import MobileLayout from './MobileLayout';

function useIsMobile() {
  return window.innerWidth <= 768;
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