import { useEffect, useState, type RefObject } from 'react';
import AlertCenterDetailFeed from './AlertCenterDetailFeed';
import bellAlarmSrc from '@/assets/Bell_alarm.svg';
import { useNotificationSummary } from '../hooks/useNotificationSummary';
import { useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotificationMutations';

export type AlertCenterTab = 'all' | 'detail';

export interface AlertCenterProps {
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
}

const PANEL_CLASS =
  'flex h-[581px] max-h-[min(581px,85vh)] w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-md:fixed max-md:left-0 max-md:right-0 max-md:top-[55px] max-md:bottom-[89px] max-md:mt-0 max-md:h-auto max-md:max-h-none max-md:w-screen max-md:max-w-none max-md:translate-x-0 max-md:rounded-none max-md:border-x-0 max-md:border-b-0 max-md:shadow-none';

export default function AlertCenter({ onClose, containerRef }: AlertCenterProps) {
  const [tab, setTab] = useState<AlertCenterTab>('all');
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

  const { data: summaryList, isLoading } = useNotificationSummary(7);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const firstListId = summaryList[0]?.notificationId ?? null;
  const effectiveDetailId = selectedNotificationId ?? firstListId;
  const listFullyRead = summaryList.length > 0 && summaryList.every((item) => item.isRead);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      onClose();
    }
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [containerRef, onClose]);

  return (
    <div
      className={`${PANEL_CLASS} absolute right-0 top-full z-250 mt-1 translate-x-2`}
      role="dialog"
      aria-modal="true"
      aria-label="알림센터"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4.5 pb-3 pt-5 max-md:hidden">
        <span className="mypage-scrap-kr -translate-y-1 text-[14px] font-bold leading-tight text-text-primary">알림센터</span>
        {tab === 'all' ? (
          listFullyRead ? (
            <span
              className="mypage-scrap-kr shrink-0 text-[11.5px] font-bold leading-tight text-[#9ca3af]"
              aria-live="polite"
            >
              전체 읽음
            </span>
          ) : (
            <button
              type="button"
              className="mypage-scrap-kr shrink-0 border-0 bg-transparent p-0 text-[11.5px] font-bold leading-tight text-primary"
              onClick={() => markAllRead()}
            >
              전체 읽음 처리
            </button>
          )
        ) : null}
      </div>

      <div className="grid w-full shrink-0 grid-cols-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`mypage-scrap-kr -mb-px cursor-pointer border-0 border-b-[2.5px] bg-transparent py-3.5 text-center text-[13px] transition-colors ${
            tab === 'all'
              ? 'border-primary font-bold text-primary'
              : 'border-transparent font-medium text-[#9ca3af]'
          }`}
        >
          전체
        </button>
        <button
          type="button"
          onClick={() => setTab('detail')}
          className={`mypage-scrap-kr -mb-px cursor-pointer border-0 border-b-[2.5px] bg-transparent py-3.5 text-center text-[13px] transition-colors ${
            tab === 'detail'
              ? 'border-primary font-bold text-primary'
              : 'border-transparent font-medium text-[#9ca3af]'
          }`}
        >
          세부 알림
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'all' ? (
          <div className="scrollbar-hide h-full overflow-y-auto">
            {isLoading && (
              <div className="mypage-scrap-kr flex min-h-30 items-center justify-center text-[13px] text-[#9ca3af]">
                불러오는 중...
              </div>
            )}
            {!isLoading && summaryList.length === 0 && (
              <div className="mypage-scrap-kr flex min-h-30 items-center justify-center text-[13px] text-[#9ca3af]">
                최근 알림이 없습니다.
              </div>
            )}
            {summaryList.map((item) => (
              <button
                key={item.notificationId}
                type="button"
                onClick={() => {
                  markRead(item.notificationId);
                  setSelectedNotificationId(item.notificationId);
                  setTab('detail');
                }}
                className={`mypage-scrap-kr flex h-20.25 min-h-20.25 w-full shrink-0 cursor-pointer items-center gap-3 border-b border-[#f3f4f6] px-4.5 text-left transition-colors hover:bg-[#F0F2F8] ${
                  item.isRead ? 'bg-[#F0F2F8]' : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 -translate-y-1 items-center justify-center rounded-lg bg-[#f3f4f6]">
                  <img src={bellAlarmSrc} alt="" aria-hidden className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] leading-snug text-text-primary">
                    {item.message.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </div>
                  <div className="mt-1 text-[11px] leading-snug text-[#9ca3af]">
                    {item.relativeTime}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="scrollbar-faint h-full overflow-y-auto overflow-x-hidden">
            <AlertCenterDetailFeed notificationId={effectiveDetailId} onNavigate={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}
