import { Fragment, useMemo, useState } from 'react';
import { MY_PAGE_ALARM_HISTORY } from './myPage.mock';
import type { AlarmGroup, AlarmItemRow, AlarmTag } from './myPage.types';
import MyPageSearchPlaceholder from './MyPageSearchPlaceholder';
import MyPageStockAvatar from './MyPageStockAvatar';

function groupAlarmsByDate(rows: AlarmGroup[]): { date: string; isToday: boolean; groups: AlarmGroup[] }[] {
  const map = new Map<string, AlarmGroup[]>();
  for (const r of rows) {
    const list = map.get(r.date);
    if (list) list.push(r);
    else map.set(r.date, [r]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, groups]) => ({
      date,
      groups,
      isToday: groups.some((g) => g.isToday),
    }));
}

function AlarmTagChip({ tag }: { tag: AlarmTag }) {
  if (tag.variant === 'outline') {
    return (
      <span className="rounded-md border border-[#e5e7eb] bg-white px-2 py-0.5 text-[10px] text-[#6b7280]">
        {tag.label}
      </span>
    );
  }
  const tone = tag.tone ?? 'red';
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-100 text-blue-800'
      : tone === 'neutral'
        ? 'bg-gray-100 text-gray-700'
        : 'bg-red-100 text-red-700';
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${toneClass}`}>{tag.label}</span>
  );
}

function AlarmEventContent({ item }: { item: AlarmItemRow }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] leading-snug">
        <span className="font-bold text-[#111827]">{item.headline}</span>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#4b5563]">{item.desc}</p>
      {item.tags && item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <AlarmTagChip key={`${item.headline}-${tag.label}`} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyPageAlarmTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MY_PAGE_ALARM_HISTORY;

    return MY_PAGE_ALARM_HISTORY.filter((group) => {
      const groupText = [group.name, group.code, group.summaryLine ?? '', group.date].join(' ').toLowerCase();
      const itemText = group.items
        .flatMap((item) => [
          item.headline,
          item.desc,
          ...(item.tags?.map((t) => t.label) ?? []),
        ])
        .join(' ')
        .toLowerCase();
      return `${groupText} ${itemText}`.includes(q);
    });
  }, [searchQuery]);
  const sections = useMemo(() => groupAlarmsByDate(filteredGroups), [filteredGroups]);
  const [readStateByGroup, setReadStateByGroup] = useState<Record<string, boolean>>({});

  const allSections = useMemo(() => groupAlarmsByDate(MY_PAGE_ALARM_HISTORY), []);
  const allGroupKeys = useMemo(() => {
    const keys: string[] = [];
    for (const s of allSections) {
      s.groups.forEach((g) => keys.push(`${s.date}-${g.code}`));
    }
    return keys;
  }, [allSections]);

  const isAllRead = allGroupKeys.length > 0 && allGroupKeys.every((k) => readStateByGroup[k]);

  const getGroupKey = (date: string, code: string) => `${date}-${code}`;

  return (
    <div className="mypage-scrap-kr w-full overflow-x-hidden px-[21px] py-4">
      <MyPageSearchPlaceholder
        placeholder="종목명, 이벤트 검색"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <div className="mt-1 flex flex-col gap-4">
        {sections.map(({ date, isToday, groups }, dateIdx) => (
          <section key={date} className="flex flex-col gap-0">
            <div className="-mx-[21px] flex items-center justify-between gap-3 border-b border-[#e5e7eb] px-[21px] pb-2.5">
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
                  className="shrink-0 border-0 bg-transparent p-0 text-[12px] font-bold text-[#014d9d]"
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
                        <MyPageStockAvatar color={group.color} ini={group.ini} />
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
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                              <span className="text-[13px] font-bold text-[#111827]">{group.name}</span>
                              <span className="font-mono text-[11px] text-[#9ca3af]">{group.code}</span>
                            </div>
                            {group.summaryLine && (
                              <div className="mt-0 text-[11px] leading-4 text-[#6b7280]">
                                {group.summaryLine}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="-mx-[21px] h-[0.5px] bg-[#e5e7eb]" aria-hidden />
                  </div>

                  <div
                    className={`relative z-10 -mx-[21px] px-[21px] border-b border-[#f3f4f6] last:border-b-0 ${
                      isRead ? 'bg-[#F0F2F8]' : 'bg-white'
                    }`}
                  >
                    <div className="relative flex flex-col py-2.5">
                      <div className="absolute top-0 bottom-0 left-[-2px] w-[2px] bg-[#D8E2F8]" aria-hidden />
                      {group.items.map((item, idx) => (
                        <div key={`${group.code}-${idx}`} className="relative flex items-stretch gap-2.5 pb-4 last:pb-0">
                          <div className="flex w-4 shrink-0 flex-col items-center">
                            <span
                              className="relative z-10 -ml-[17px] mt-1 h-1.5 w-1.5 shrink-0 rounded-full ring-3 ring-white"
                              style={{ backgroundColor: item.dotColor }}
                              aria-hidden
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <AlarmEventContent item={item} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="-mx-[21px] relative z-10 flex items-center justify-between gap-3 border-y border-[#f3f4f6] bg-[#F0F2F8] px-[21px] py-2.5">
                    <span className="text-[12px] font-medium text-[#6b7280]">총 {group.items.length}건</span>
                    <button
                      type="button"
                      onClick={() =>
                        setReadStateByGroup((prev) => ({
                          ...prev,
                          [groupKey]: true,
                        }))
                      }
                      className="shrink-0 border-0 bg-transparent p-0 text-[12px] font-bold text-[#014d9d]"
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
