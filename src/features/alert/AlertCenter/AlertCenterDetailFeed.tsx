import { Fragment, useMemo, useState } from 'react';
import type { AlertItemRow, AlertTag } from './alertCenter.types';
import { isTodayNotifiedDate, notificationDetailToAlertGroups } from './alertCenterDetailAdapter';
import AlertStockAvatar from './AlertStockAvatar';
import { useNotificationDetail } from '../hooks/useNotificationDetail';

function TagChip({ tag }: { tag: AlertTag }) {
  if (tag.variant === 'outline') {
    return (
      <span className="rounded-md border border-[#C7DBFF] bg-[#F4F6FB] px-2 py-0.5 text-[10px] text-[#014D9D]">
        #{tag.label}
      </span>
    );
  }
  return (
    <span className="rounded-md border border-[#C7DBFF] bg-[#F4F6FB] px-2 py-0.5 text-[10px] font-medium text-[#014D9D]">
      #{tag.label}
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
  notificationId: number | null;
}

export default function AlertCenterDetailFeed({ notificationId }: AlertCenterDetailFeedProps) {
  const [collapsedByGroup, setCollapsedByGroup] = useState<Record<string, boolean>>({});
  const { data: allDetails } = useNotificationDetail({ days: 7 });

  const detail = notificationId != null
    ? allDetails.find((n) => n.notificationId === notificationId) ?? null
    : null;

  const sections = useMemo(() => {
    if (!detail) return [];
    const groups = notificationDetailToAlertGroups(detail);
    return [{ date: detail.date, isToday: isTodayNotifiedDate(detail.date), groups }];
  }, [detail]);

  const getGroupKey = (date: string, code: string) => `${date}-${code}`;

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
        {sections.map(({ date, isToday, groups }) => (
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
            </div>

            <div className="relative flex flex-col">
              {groups.map((group, idx) => (
                <Fragment key={`${group.code}-${date}-${idx}`}>
                  {(() => {
                    const groupKey = getGroupKey(date, group.code);
                    const isCollapsed = collapsedByGroup[groupKey] !== false;
                    return (
                      <>
                        <div className="relative z-10 border-b border-[#f3f4f6] last:border-b-0">
                          <div
                            className="-mx-[18px] flex w-[calc(100%+36px)] cursor-pointer items-center gap-3 px-[18px] py-3 transition-colors hover:bg-[#F0F2F8]"
                            onClick={() =>
                              setCollapsedByGroup((prev) => ({
                                ...prev,
                                [groupKey]: !isCollapsed,
                              }))
                            }
                          >
                            <div className="relative shrink-0">
                              <AlertStockAvatar color={group.color} ini={group.ini} logoUrl={group.logoUrl} />
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

                            <span
                              className={`shrink-0 text-[10px] text-[#9ca3af] transition-transform duration-200 ${
                                isCollapsed ? '' : 'rotate-180'
                              }`}
                            >
                              ▼
                            </span>
                          </div>

                          <div
                            className="h-[0.5px] bg-[#e5e7eb]"
                            style={{ marginLeft: -PX, marginRight: -PX }}
                            aria-hidden
                          />
                        </div>

                        {!isCollapsed && (
                          <div
                            className="relative z-10 border-b border-[#f3f4f6] last:border-b-0 bg-white"
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
                        )}
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
