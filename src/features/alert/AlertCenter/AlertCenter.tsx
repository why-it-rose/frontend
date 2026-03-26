import { useEffect, useState, type RefObject } from 'react';
import { ALERT_CENTER_NOTIFICATION_LIST, alertCenterListFullyRead } from './alertCenter.mock';
import AlertCenterDetailFeed from './AlertCenterDetailFeed';
import {
  formatDaysAgoLabel,
  formatNotifiedDateTitle,
  stockNamesSubtitle,
} from './alertCenterFormatters';
import bellAlarmSrc from '@/assets/Bell_alarm.svg';

export type AlertCenterTab = 'all' | 'detail';

export interface AlertCenterProps {
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  allListMarkedRead: boolean;
  onAllListMarkedRead: () => void;
  detailFullyReadIds: ReadonlySet<number>;
  onNotificationDetailFullyRead: (notificationId: number) => void;
}

const PANEL_CLASS =
  'flex h-[581px] max-h-[min(581px,85vh)] w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.1)]';

export default function AlertCenter({
  onClose,
  containerRef,
  allListMarkedRead,
  onAllListMarkedRead,
  detailFullyReadIds,
  onNotificationDetailFullyRead,
}: AlertCenterProps) {
  const [tab, setTab] = useState<AlertCenterTab>('all');
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

  const firstListId = ALERT_CENTER_NOTIFICATION_LIST[0]?.notificationId ?? null;
  const effectiveDetailId = selectedNotificationId ?? firstListId;
  const listFullyRead = alertCenterListFullyRead(allListMarkedRead, detailFullyReadIds);

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
      className={`${PANEL_CLASS} absolute right-0 top-full z-[250] mt-1 translate-x-2`}
      role="dialog"
      aria-modal="true"
      aria-label="알림센터"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] px-[18px] pb-5 pt-5">
        <span className="mypage-scrap-kr text-[14px] font-bold leading-tight text-[#111827]">알림센터</span>
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
              className="mypage-scrap-kr shrink-0 border-0 bg-transparent p-0 text-[11.5px] font-bold leading-tight text-[#014d9d]"
              onClick={() => {
                onAllListMarkedRead();
                // TODO: PATCH /api/notifications/read — body { notificationIds: [] }
              }}
            >
              전체 읽음 처리
            </button>
          )
        ) : null}
      </div>

      <div className="grid w-full shrink-0 grid-cols-2 border-b border-[#e5e7eb]">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`mypage-scrap-kr -mb-px cursor-pointer border-0 border-b-[2.5px] bg-transparent py-2.5 text-center text-[13px] transition-colors ${
            tab === 'all'
              ? 'border-[#014d9d] font-bold text-[#014d9d]'
              : 'border-transparent font-medium text-[#9ca3af]'
          }`}
        >
          전체
        </button>
        <button
          type="button"
          onClick={() => setTab('detail')}
          className={`mypage-scrap-kr -mb-px cursor-pointer border-0 border-b-[2.5px] bg-transparent py-2.5 text-center text-[13px] transition-colors ${
            tab === 'detail'
              ? 'border-[#014d9d] font-bold text-[#014d9d]'
              : 'border-transparent font-medium text-[#9ca3af]'
          }`}
        >
          세부 알림
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'all' ? (
          <div className="scrollbar-hide h-full overflow-y-auto">
            {ALERT_CENTER_NOTIFICATION_LIST.map((item) => (
              <button
                key={item.notificationId}
                type="button"
                onClick={() => {
                  setSelectedNotificationId(item.notificationId);
                  setTab('detail');
                }}
                className={`mypage-scrap-kr flex h-[81px] min-h-[81px] w-full shrink-0 cursor-pointer items-center gap-3 border-b border-[#f3f4f6] px-[18px] text-left transition-colors hover:bg-[#F0F2F8] ${
                  allListMarkedRead || detailFullyReadIds.has(item.notificationId) ? 'bg-[#F0F2F8]' : ''
                } ${
                  !allListMarkedRead &&
                  !detailFullyReadIds.has(item.notificationId) &&
                  item.isRead
                    ? 'opacity-90'
                    : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 -translate-y-1 items-center justify-center rounded-lg bg-[#f3f4f6]">
                  <img src={bellAlarmSrc} alt="" aria-hidden className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold leading-snug text-[#111827]">
                    {formatNotifiedDateTitle(item.notifiedDate)}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-snug text-[#6b7280]">{stockNamesSubtitle(item.stocks)}</div>
                  <div className="mt-1 text-[11px] leading-snug text-[#9ca3af]">
                    {formatDaysAgoLabel(item.daysAgo)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="scrollbar-faint h-full overflow-y-auto overflow-x-hidden">
            <AlertCenterDetailFeed
              notificationId={effectiveDetailId}
              onNotificationDetailFullyRead={onNotificationDetailFullyRead}
            />
          </div>
        )}
      </div>
    </div>
  );
}
