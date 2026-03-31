import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import arrowIco from '@/assets/arrow.svg';
import deleteIco from '@/assets/delete.svg';
import dragHandleIco from '@/assets/button.svg';
import { fetchMyScraps, removeEventScrap, type ScrapEventDto } from '@/features/event/api/eventApi';
import type { ScrapItem } from './myPage.types';
import MyPageSearchPlaceholder from './MyPageSearchPlaceholder';
import { useNavigate } from 'react-router';
import { toChartStockEvent } from '@/shared/constants/routes';

export interface MyPageScrapTabProps {
    manageMode: boolean;
    onManageStart: () => void;
    onManageEnd: () => void;
    onSelectScrap?: () => void;
}


type ScrapRow = ScrapItem & { id: string; eventId: number };

function ScrapAvatar({ initials, bg }: { initials: string; bg: string }) {
  return (
      <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
          style={{ backgroundColor: bg }}
      >
        {initials}
      </div>
  );
}

function ScrapSortableEditRow({
                                row,
                                onRemove,
                              }: {
  row: ScrapRow;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
      <div
          ref={setNodeRef}
          style={style}
          className={`flex w-full shrink-0 touch-none select-none items-center justify-between border-b border-[#eff1f8] bg-white px-[21px] py-3 ${
              isDragging ? 'opacity-30' : ''
          }`}
          {...attributes}
          {...listeners}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <ScrapAvatar initials={row.ini} bg={row.color} />
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{row.name}</div>
            <div className="mypage-scrap-kr text-[10px] leading-[15px] text-[#9ca3af]">
              {row.date} · {row.eventType}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 cursor-grab items-center gap-2.5 pl-2 active:cursor-grabbing">
          <button
              type="button"
              data-edit-delete
              className="shrink-0 border-0 bg-transparent p-0"
              aria-label={`${row.name} 스크랩에서 제거`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(row.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
          >
            <img
                src={deleteIco}
                alt=""
                width={26}
                height={26}
                className="block h-[26px] w-[26px] shrink-0"
                aria-hidden
            />
          </button>
          <span className="inline-flex shrink-0 items-center justify-center" aria-hidden>
          <img src={dragHandleIco} alt="" width={8} height={12} className="block h-3 w-2 shrink-0" />
        </span>
        </div>
      </div>
  );
}

function ScrapEditRowOverlay({ row }: { row: ScrapRow }) {
  return (
      <div className="mypage-scrap-kr box-border flex w-full min-w-[240px] cursor-grabbing items-center justify-between border-b border-[#eff1f8] bg-white px-[21px] py-3 shadow-sm">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <ScrapAvatar initials={row.ini} bg={row.color} />
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{row.name}</div>
            <div className="mypage-scrap-kr text-[10px] leading-[15px] text-[#9ca3af]">
              {row.date} · {row.eventType}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pl-2 opacity-60">
          <img src={deleteIco} alt="" width={26} height={26} className="block h-[26px] w-[26px] shrink-0" aria-hidden />
          <span className="inline-flex shrink-0 items-center justify-center" aria-hidden>
          <img src={dragHandleIco} alt="" width={8} height={12} className="block h-3 w-2 shrink-0" />
        </span>
        </div>
      </div>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function mapEventType(eventType: string): string {
  if (eventType === 'DROP') return '급락';
  if (eventType === 'SURGE') return '급등';
  return eventType;
}

function mapScrapRow(item: ScrapEventDto, index: number): ScrapRow {
  const change = Number(item.changePct ?? 0);
  const sign = change >= 0 ? '+' : '';
  const initials = (item.stockName ?? '').trim().slice(0, 1) || '종';

  return {
    id: `scrap-${item.eventId}-${index}`,
    eventId: item.eventId,
    name: item.stockName ?? '-',
    code: item.ticker ?? '-',
    color: '#014d9d',
    ini: initials,
    date: formatDate(item.startDate),
    eventType: mapEventType(item.eventType),
    chg: `${sign}${change.toFixed(2)}%`,
  };
}

export default function MyPageScrapTab({
                                         manageMode,
                                         onManageStart,
                                         onManageEnd,
                                         onSelectScrap,
                                       }: MyPageScrapTabProps) {
  const [items, setItems] = useState<ScrapRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 6 },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMessage('');

    fetchMyScraps()
        .then((rows) => {
          if (!mounted) return;
          setItems(rows.map(mapScrapRow));
        })
        .catch((e: unknown) => {
            if (!mounted) return;
            setErrorMessage(e instanceof Error ? e.message : '스크랩 목록을 불러오지 못했습니다.');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

    return () => {
      mounted = false;
    };
  }, []);

  const sortableIds = useMemo(() => items.map((r) => r.id), [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
        [row.name, row.code, row.eventType, row.date].some((v) => v.toLowerCase().includes(q)),
    );
  }, [items, searchQuery]);

  const removeItem = useCallback(
      async (id: string) => {
        const target = items.find((row) => row.id === id);
        if (!target) return;

        try {
          await removeEventScrap(target.eventId);
          setItems((prev) => prev.filter((row) => row.id !== id));
        } catch {
          setErrorMessage('스크랩 해제 중 오류가 발생했습니다.');
        }
      },
      [items],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeRow = activeId ? items.find((r) => r.id === activeId) : null;
  const navigate = useNavigate();

    return (
      <div className="px-[21px] py-4">
        <MyPageSearchPlaceholder
            placeholder="종목명, 이벤트 검색"
            value={searchQuery}
            onChange={setSearchQuery}
        />

        {loading && <div className="py-6 text-center text-sm text-[#9ca3af]">스크랩 불러오는 중...</div>}
        {!loading && errorMessage && <div className="py-6 text-center text-sm text-[#dc2626]">{errorMessage}</div>}

        {!loading && !errorMessage && (
            <div className="mypage-scrap-kr flex flex-col gap-4">
              <section className="flex flex-col gap-0">
                <div className="-mx-[21px] flex items-center justify-between gap-3 border-b border-[#e5e7eb] px-[21px] pb-3">
                  <h3 className="min-w-0 flex-1 text-left text-[12px] font-bold leading-none text-[#6b7280]">
                    {manageMode ? '스크랩 편집' : '스크랩한 이벤트'}
                  </h3>
                  {manageMode ? (
                      <button
                          type="button"
                          onClick={onManageEnd}
                          className="shrink-0 border-0 bg-transparent p-0 text-[12px] font-bold leading-none text-[#014d9d]"
                      >
                        완료
                      </button>
                  ) : (
                      <button
                          type="button"
                          onClick={onManageStart}
                          className="shrink-0 border-0 bg-transparent p-0 text-[12px] font-bold leading-none text-[#014d9d]"
                      >
                  <span className="inline-flex items-center gap-1">
                    관리
                    <img
                        src={arrowIco}
                        alt=""
                        className="h-[10px] w-[6px] shrink-0 translate-y-[1.5px] object-contain"
                        width={6}
                        height={10}
                        aria-hidden
                    />
                  </span>
                      </button>
                  )}
                </div>

                <div className="-mx-[21px] flex flex-col">
                  {filteredItems.length === 0 ? (
                      <div className="py-6 text-center text-sm text-[#9ca3af]">스크랩한 이벤트가 없습니다.</div>
                  ) : manageMode ? (
                      <DndContext
                          sensors={sensors}
                          collisionDetection={closestCorners}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDragCancel={handleDragCancel}
                      >
                        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                          {items.map((row) => (
                              <ScrapSortableEditRow key={row.id} row={row} onRemove={(id) => void removeItem(id)} />
                          ))}
                        </SortableContext>
                        <DragOverlay adjustScale={false} dropAnimation={null} className="pointer-events-none">
                          {activeRow ? <ScrapEditRowOverlay row={activeRow} /> : null}
                        </DragOverlay>
                      </DndContext>
                  ) : (
                      filteredItems.map((s) => {
                        const priceColor = s.chg.startsWith('+') ? 'text-red-600' : 'text-blue-700';
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    onSelectScrap?.(); // 패널 먼저 닫기
                                    navigate({
                                        pathname: toChartStockEvent(s.code),
                                        search: `?eventId=${s.eventId}`,
                                    });
                                }}
                                className="flex h-auto w-full shrink-0 cursor-pointer items-center justify-between border-b border-[#eff1f8] bg-white px-[21px] py-3 text-left transition-colors hover:bg-[#f4f5f7]"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                <ScrapAvatar initials={s.ini} bg={s.color} />
                                <div className="min-w-0">
                                  <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{s.name}</div>
                                  <div className="mypage-scrap-kr text-[10px] leading-[15px] text-[#9ca3af]">
                                    {s.date} · {s.eventType}
                                  </div>
                                </div>
                              </div>
                              <div
                                  className={`mypage-scrap-kr shrink-0 text-right text-[12px] font-semibold leading-[18px] tabular-nums ${priceColor}`}
                              >
                                <div>{s.chg}</div>
                              </div>
                            </button>
                        );
                      })
                  )}
                </div>
              </section>
            </div>
        )}
      </div>
  );
}