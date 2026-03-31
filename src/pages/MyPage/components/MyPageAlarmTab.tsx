import { Fragment, useMemo, useState } from 'react';
import bellAlarmSrc from '@/assets/Bell_alarm.svg';
import { notificationDetailToAlertGroups, isTodayNotifiedDate } from '@/features/alert/AlertCenter/alertCenterDetailAdapter';
import AlertStockAvatar from '@/features/alert/AlertCenter/AlertStockAvatar';
import { useNotificationDetail } from '@/features/alert/hooks/useNotificationDetail';
import { useMarkNotificationRead } from '@/features/alert/hooks/useNotificationMutations';
import { useNotificationSummary } from '@/features/alert/hooks/useNotificationSummary';
import type { AlertGroup, AlertItemRow, AlertTag } from '@/features/alert/AlertCenter/alertCenter.types';
import MyPageSearchPlaceholder from './MyPageSearchPlaceholder';

type AlarmSubTab = 'all' | 'detail';

// ─── 공통 서브 컴포넌트 ────────────────────────────────────────────────────────

function TagChip({ tag }: { tag: AlertTag }) {
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

// ─── 전체 탭 ─────────────────────────────────────────────────────────────────

interface AllTabProps {
  searchQuery: string;
  onSelectNotification: (id: number) => void;
}

function AllTab({ searchQuery, onSelectNotification }: AllTabProps) {
  const { data: summaryList, isLoading } = useNotificationSummary();
  const { mutate: markRead } = useMarkNotificationRead();

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return summaryList;
    return summaryList.filter((item) =>
      [item.stockNames, item.message, item.relativeTime, item.date]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [summaryList, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-[13px] text-[#9ca3af]">
        불러오는 중...
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-[13px] text-[#9ca3af]">
        {searchQuery ? '검색 결과가 없습니다.' : '최근 알림이 없습니다.'}
      </div>
    );
  }

  return (
    <>
      {filtered.map((item) => (
        <button
          key={item.notificationId}
          type="button"
          onClick={() => {
            markRead(item.notificationId);
            onSelectNotification(item.notificationId);
          }}
          className={`mypage-scrap-kr flex min-h-[81px] w-full shrink-0 cursor-pointer items-center gap-3 border-b border-[#f3f4f6] px-[21px] text-left transition-colors hover:bg-[#F0F2F8] ${
            item.isRead ? 'bg-[#F0F2F8]' : ''
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 -translate-y-1 items-center justify-center rounded-lg bg-[#f3f4f6]">
            <img src={bellAlarmSrc} alt="" aria-hidden className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] leading-snug text-[#111827]">
              {item.message.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
              )}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-[#9ca3af]">{item.relativeTime}</div>
          </div>
        </button>
      ))}
    </>
  );
}

// ─── 세부 알림 탭 ─────────────────────────────────────────────────────────────

interface DetailTabProps {
  selectedNotificationId: number | null;
}

function DetailTab({ selectedNotificationId }: DetailTabProps) {
  const [collapsedByGroup, setCollapsedByGroup] = useState<Record<string, boolean>>({});
  const { data: allDetails, isLoading } = useNotificationDetail();

  const sections = useMemo(() => {
    if (selectedNotificationId != null) {
      const detail = allDetails.find((n) => n.notificationId === selectedNotificationId) ?? null;
      if (!detail) return [];
      return [{ date: detail.date, isToday: isTodayNotifiedDate(detail.date), groups: notificationDetailToAlertGroups(detail) }];
    }

    // 전체 알림을 날짜별로 그룹핑
    const dateMap = new Map<string, AlertGroup[]>();
    for (const detail of allDetails) {
      const groups = notificationDetailToAlertGroups(detail);
      const existing = dateMap.get(detail.date);
      if (existing) existing.push(...groups);
      else dateMap.set(detail.date, [...groups]);
    }
    return [...dateMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, groups]) => ({ date, groups, isToday: isTodayNotifiedDate(date) }));
  }, [allDetails, selectedNotificationId]);

  const getGroupKey = (date: string, code: string) => `${date}-${code}`;

  if (isLoading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-[13px] text-[#9ca3af]">
        불러오는 중...
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="mypage-scrap-kr flex min-h-[120px] items-center justify-center px-[21px] pt-4 text-center text-[13px] text-[#9ca3af]">
        {selectedNotificationId != null ? '알림을 선택하면 세부 내용이 표시됩니다.' : '세부 알림이 없습니다.'}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden px-[21px] pb-4 pt-4">
      <div className="flex flex-col gap-4">
        {sections.map(({ date, isToday, groups }) => (
          <section key={date} className="flex flex-col gap-0">
            <div className="-mx-[21px] flex items-center gap-3 border-b border-[#e5e7eb] px-[21px] pb-2.5">
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
              {groups.map((group: AlertGroup, idx: number) => {
                const groupKey = getGroupKey(date, group.code);
                const isCollapsed = collapsedByGroup[groupKey] !== false;
                return (
                  <Fragment key={`${group.code}-${date}-${idx}`}>
                    <div className="relative z-10 border-b border-[#f3f4f6] last:border-b-0">
                      <div
                        className="-mx-[21px] flex w-[calc(100%+42px)] cursor-pointer items-center gap-3 px-[21px] py-3 transition-colors hover:bg-[#F0F2F8]"
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

                      <div className="-mx-[21px] h-[0.5px] bg-[#e5e7eb]" aria-hidden />
                    </div>

                    {!isCollapsed && (
                      <div className="relative z-10 -mx-[21px] border-b border-[#f3f4f6] bg-white px-[21px] last:border-b-0">
                        <div className="relative flex flex-col">
                          <div className="absolute top-0 bottom-0 left-[-2px] z-30 w-[2px] bg-[#D8E2F8]" aria-hidden />
                          {group.items.map((item, itemIdx) => (
                            <div
                              key={`${group.code}-${itemIdx}`}
                              className="relative -mx-[21px] flex w-[calc(100%+42px)] items-stretch gap-2.5 px-[21px] py-2 transition-colors hover:bg-[#F0F2F8]"
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
                  </Fragment>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function MyPageAlarmTab() {
  const [subTab, setSubTab] = useState<AlarmSubTab>('all');
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');


  function handleSelectNotification(id: number) {
    setSelectedNotificationId(id);
    setSubTab('detail');
  }

  return (
    <div className="mypage-scrap-kr flex w-full flex-col overflow-x-hidden">
      {/* 헤더: 검색 */}
      <div className="shrink-0 px-[21px] pt-4 pb-2">
        <MyPageSearchPlaceholder
          placeholder="종목명, 이벤트 검색"
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* 서브탭 */}
      <div className="grid w-full shrink-0 grid-cols-2 border-b border-[#e5e7eb]">
        <button
          type="button"
          onClick={() => setSubTab('all')}
          className={`mypage-scrap-kr -mb-px cursor-pointer border-0 border-b-[2.5px] bg-transparent py-3 text-center text-[13px] transition-colors ${
            subTab === 'all'
              ? 'border-[#014d9d] font-bold text-[#014d9d]'
              : 'border-transparent font-medium text-[#9ca3af]'
          }`}
        >
          전체
        </button>
        <button
          type="button"
          onClick={() => setSubTab('detail')}
          className={`mypage-scrap-kr -mb-px cursor-pointer border-0 border-b-[2.5px] bg-transparent py-3 text-center text-[13px] transition-colors ${
            subTab === 'detail'
              ? 'border-[#014d9d] font-bold text-[#014d9d]'
              : 'border-transparent font-medium text-[#9ca3af]'
          }`}
        >
          세부 알림
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="min-h-0 flex-1">
        {subTab === 'all' ? (
          <AllTab searchQuery={searchQuery} onSelectNotification={handleSelectNotification} />
        ) : (
          <DetailTab selectedNotificationId={selectedNotificationId} />
        )}
      </div>
    </div>
  );
}
