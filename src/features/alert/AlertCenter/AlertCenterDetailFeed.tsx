import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { AlertItemRow, AlertTag } from './alertCenter.types';
import { getNotificationDetailMock } from './alertCenter.mock';
import { isTodayNotifiedDate, notificationDetailToAlertGroups } from './alertCenterDetailAdapter';
import AlertStockAvatar from './AlertStockAvatar';

function TagChip({ tag }: { tag: AlertTag }) {
  if (tag.variant === 'outline') {
    return (
      <span className="rounded-md border border-[#C7DBFF] bg-[#F4F6FB] px-2 py-0.5 text-[10px] text-[#014D9D]">
        {tag.label}
      </span>
    );
  }
  return (
    <span className="rounded-md border border-[#C7DBFF] bg-[#F4F6FB] px-2 py-0.5 text-[10px] font-medium text-[#014D9D]">
      {tag.label}
    </span>
  );
}

function EventContent({ item }: { item: AlertItemRow }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] leading-snug">
        <span className="font-bold text-[#111827]">{item.headline}</span>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#4b5563]">{item.desc}</p>
      {item.tags && item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <TagChip key={`${item.headline}-${tag.label}`} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}

const PX = 18;

export interface AlertCenterDetailFeedProps {
  /** GET /api/notifications/{notificationId} 조회 키 (목업은 `getNotificationDetailMock`) */
  notificationId: number | null;
  /** 세부 탭에서 해당 알림의 모든 그룹을 읽음 처리했을 때 (전체 탭 행 강조 등) */
  onNotificationDetailFullyRead?: (notificationId: number) => void;
}

export default function AlertCenterDetailFeed({
  notificationId,
  onNotificationDetailFullyRead,
}: AlertCenterDetailFeedProps) {
  const [readStateByGroup, setReadStateByGroup] = useState<Record<string, boolean>>({});

  const sections = useMemo(() => {
    if (notificationId == null) return [];
    const detail = getNotificationDetailMock(notificationId);
    if (!detail) return [];
    const groups = notificationDetailToAlertGroups(detail);
    return [
      {
        date: detail.notifiedDate,
        isToday: isTodayNotifiedDate(detail.notifiedDate),
        groups,
      },
    ];
  }, [notificationId]);

  const allGroupKeys = useMemo(() => {
    const keys: string[] = [];
    for (const s of sections) {
      s.groups.forEach((g) => keys.push(`${s.date}-${g.code}`));
    }
    return keys;
  }, [sections]);

  const isAllRead = allGroupKeys.length > 0 && allGroupKeys.every((k) => readStateByGroup[k]);
  const getGroupKey = (date: string, code: string) => `${date}-${code}`;

  const detailNotifyRef = useRef<number | null>(null);
  useEffect(() => {
    detailNotifyRef.current = null;
  }, [notificationId]);

  useEffect(() => {
    if (notificationId == null || allGroupKeys.length === 0 || !isAllRead) return;
    if (detailNotifyRef.current === notificationId) return;
    detailNotifyRef.current = notificationId;
    onNotificationDetailFullyRead?.(notificationId);
  }, [notificationId, isAllRead, allGroupKeys.length, onNotificationDetailFullyRead]);

  if (sections.length === 0) {
    return (
      <div className="mypage-scrap-kr flex min-h-[120px] items-center justify-center px-[18px] pt-4 text-center text-[13px] text-[#9ca3af]">
        알림을 선택하면 세부 내용이 표시됩니다.
      </div>
    );
  }

  return (
    <div className="mypage-scrap-kr w-full overflow-x-hidden pt-4 pb-4" style={{ paddingLeft: PX, paddingRight: PX }}>
      <div className="flex flex-col gap-4">
        {sections.map(({ date, isToday, groups }, dateIdx) => (
          <section key={date} className="flex flex-col gap-0">
            <div
              className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-2.5"
              style={{ marginLeft: -PX, marginRight: -PX, paddingLeft: PX, paddingRight: PX }}
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <h3 className="mypage-inter text-[12px] font-bold text-[#6b7280]">{date}</h3>
                {isToday && (
                  <span className="rounded-full bg-[#e8efff] px-2 py-0.5 text-[11px] font-medium leading-none text-[#3366ff]">
                    오늘
                  </span>
                )}
              </div>
              {dateIdx === 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setReadStateByGroup(() => {
                      const next: Record<string, boolean> = {};
                      allGroupKeys.forEach((k) => {
                        next[k] = true;
                      });
                      return next;
                    })
                  }
                  className={`shrink-0 translate-x-2 border-0 bg-transparent p-0 text-[11.5px] font-bold ${
                    isAllRead ? 'text-[#9ca3af]' : 'text-[#014d9d]'
                  }`}
                >
                  {isAllRead ? '전체 읽음' : '전체 읽음 처리'}
                </button>
              )}
            </div>

            <div className="relative flex flex-col">
              {groups.map((group, idx) => (
                <Fragment key={`${group.code}-${date}-${idx}`}>
                  {(() => {
                    const groupKey = getGroupKey(date, group.code);
                    const isRead = !!readStateByGroup[groupKey];
                    return (
                      <>
                        <div className="relative z-10 border-b border-[#f3f4f6] last:border-b-0">
                          <div className="flex items-center gap-3 pt-3 pb-3">
                            <div className="relative shrink-0">
                              <AlertStockAvatar color={group.color} ini={group.ini} />
                              {!isRead && (
                                <span
                                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm"
                                  style={{ backgroundColor: group.badgeColor }}
                                >
                                  {group.items.length}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                                <span className="text-[13px] font-bold text-[#111827]">{group.name}</span>
                                <span className="font-mono text-[11px] text-[#9ca3af]">{group.code}</span>
                              </div>
                              {group.summaryLine && (
                                <div className="mt-0 text-[11px] leading-4 text-[#6b7280]">{group.summaryLine}</div>
                              )}
                            </div>
                          </div>

                          <div
                            className="h-[0.5px] bg-[#e5e7eb]"
                            style={{ marginLeft: -PX, marginRight: -PX }}
                            aria-hidden
                          />
                        </div>

                        <div
                          className={`relative z-10 border-b border-[#f3f4f6] last:border-b-0 ${
                            isRead ? 'bg-[#F0F2F8]' : 'bg-white'
                          }`}
                          style={{ marginLeft: -PX, marginRight: -PX, paddingLeft: PX, paddingRight: PX }}
                        >
                          <div className="relative flex flex-col">
                            <div className="absolute top-0 bottom-0 left-[-2px] z-30 w-[2px] bg-[#D8E2F8]" aria-hidden />
                            {group.items.map((item, itemIdx) => (
                              <div
                                key={`${group.code}-${itemIdx}`}
                                className="relative -mx-[18px] flex w-[calc(100%+36px)] items-stretch gap-2.5 px-[18px] py-2 transition-colors hover:bg-[#F0F2F8]"
                              >
                                <div className="flex w-4 shrink-0 flex-col items-center">
                                  <span
                                    className="relative z-30 -ml-[17px] mt-1 h-1.5 w-1.5 shrink-0 rounded-full ring-3 ring-white"
                                    style={{ backgroundColor: item.dotColor }}
                                    aria-hidden
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <EventContent item={item} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div
                          className="relative z-10 flex items-center justify-between gap-3 border-y border-[#f3f4f6] bg-[#F0F2F8] py-2.5"
                          style={{ marginLeft: -PX, marginRight: -PX, paddingLeft: PX, paddingRight: PX }}
                        >
                          <span className="text-[12px] font-medium text-[#6b7280]">총 {group.items.length}건</span>
                          <button
                            type="button"
                            onClick={() =>
                              setReadStateByGroup((prev) => ({
                                ...prev,
                                [groupKey]: true,
                              }))
                            }
                            className={`shrink-0 border-0 bg-transparent p-0 text-[11.5px] font-bold ${
                              isRead ? 'text-[#9ca3af]' : 'text-[#014d9d]'
                            }`}
                          >
                            {isRead ? '읽음' : '읽음 처리'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </Fragment>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
