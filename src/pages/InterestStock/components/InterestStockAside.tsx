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
import favoriteClickIco from '@/assets/favorite_click.svg';
import lockIco from '@/assets/lock.svg';
import deleteIco from '@/assets/delete.svg';
import dragHandleIco from '@/assets/button.svg';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { InterestStockItemDto } from '@/features/stock/types';
import {
  useInterestStocksQuery,
  useRemoveInterestStockMutation,
} from '@/features/stock/hooks/useInterestStocks';
import { useNavigate } from 'react-router';
import { toChartStockDetail } from '@/shared/constants/routes';

type WatchRow = {
  stockId: number;
  name: string;
  code: string;
  market: string;
  initials: string;
  logoBg: string;
  logoUrl?: string | null;
  price: string;
  changeLabel: string;
  up: boolean;
};

function logoSeedColor(seed: string) {
  const palette = ['#002C5F', '#1428a0', '#EA1917', '#a50034', '#03c75a', '#059669'];
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function interestToWatchRow(item: InterestStockItemDto): WatchRow {
  const up = item.changeDirection === 'UP';
  const rate = item.changeRate ?? 0;
  const changeLabel =
    rate > 0
      ? `▲ +${rate.toFixed(2)}%`
      : rate < 0
        ? `▼ ${rate.toFixed(2)}%`
        : '0.00%';
  return {
    stockId: item.stockId,
    name: item.name,
    code: item.ticker,
    market: item.market,
    initials: item.name.trim().slice(0, 1),
    logoBg: logoSeedColor(item.ticker),
    logoUrl: item.logoUrl ?? null,
    price: `${Number(item.currentPrice).toLocaleString('ko-KR')}원`,
    changeLabel,
    up,
  };
}

function getWatchLogoText(row: WatchRow) {
  if (row.name === 'SK하이닉스') return 'SK';
  if (row.name === 'LG에너지솔루션') return 'LG';
  return Array.from(row.name.trim())[0] ?? row.initials;
}

function WatchIdentityBlock({ row, showMarket = true }: { row: WatchRow; showMarket?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      {row.logoUrl ? (
        <img
          src={row.logoUrl}
          alt=""
          className="h-[28px] w-[28px] shrink-0 rounded-[7px] object-cover max-md:-translate-y-[0.8px]"
        />
      ) : (
        <div
          className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white max-md:-translate-y-[0.8px]"
          style={{ backgroundColor: row.logoBg }}
        >
          <span className="max-md:translate-y-[1px]">{getWatchLogoText(row)}</span>
        </div>
      )}
      <div className="min-w-0 overflow-hidden">
        <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{row.name}</div>
        <div className="font-mono text-[10px] leading-[15px] text-[#9ca3af]">
          {showMarket ? `${row.code} · ${row.market}` : row.code}
        </div>
      </div>
    </div>
  );
}

function SortableEditRow({
  row,
  onRemove,
}: {
  row: WatchRow;
  onRemove: (stockId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.stockId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`box-border grid h-[58px] w-full shrink-0 grid-cols-[minmax(0,1fr)_74px] items-center overflow-hidden border-b border-[#e5e7eb] bg-white px-4 touch-none select-none ${
        isDragging ? 'opacity-30' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <WatchIdentityBlock row={row} />
      <div className="ml-auto flex w-[74px] shrink-0 cursor-grab items-center justify-end gap-2.5 active:cursor-grabbing">
        <button
          type="button"
          data-edit-delete
          className="shrink-0 border-0 bg-transparent p-0"
          aria-label={`${row.name} 관심종목에서 제거`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(row.stockId);
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

function EditRowOverlay({ row }: { row: WatchRow }) {
  return (
    <div className="box-border grid h-[58px] w-full min-w-[240px] grid-cols-[minmax(0,1fr)_74px] cursor-grabbing items-center overflow-hidden border-b border-[#e5e7eb] bg-white px-4">
      <WatchIdentityBlock row={row} />
      <div className="ml-auto flex w-[74px] shrink-0 items-center justify-end gap-2.5 opacity-60">
        <img
          src={deleteIco}
          alt=""
          width={26}
          height={26}
          className="block h-[26px] w-[26px] shrink-0"
          aria-hidden
        />
        <span className="inline-flex shrink-0 items-center justify-center" aria-hidden>
          <img src={dragHandleIco} alt="" width={8} height={12} className="block h-3 w-2 shrink-0" />
        </span>
      </div>
    </div>
  );
}

export default function InterestStockAside() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: interestData, isLoading, isError } = useInterestStocksQuery();
  const removeMut = useRemoveInterestStockMutation();

  const [editMode, setEditMode] = useState(false);
  const [orderOverride, setOrderOverride] = useState<WatchRow[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const baseRows = useMemo(
    () => (interestData ?? []).map(interestToWatchRow),
    [interestData]
  );

  const items = orderOverride ?? baseRows;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortableIds = useMemo(() => items.map((r) => r.stockId), [items]);

  useEffect(() => {
    if (!isLoggedIn) setEditMode(false);
  }, [isLoggedIn]);

  useEffect(() => {
    setOrderOverride(null);
  }, [interestData]);

  const removeItem = useCallback(
    (stockId: number) => {
      removeMut.mutate(stockId);
      setOrderOverride((prev) =>
        prev ? prev.filter((r) => r.stockId !== stockId) : null
      );
    },
    [removeMut]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setOrderOverride((prev) => {
      const list = prev ?? baseRows;
      const oldIndex = list.findIndex((i) => i.stockId === active.id);
      const newIndex = list.findIndex((i) => i.stockId === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(list, oldIndex, newIndex);
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeRow = activeId != null ? items.find((r) => r.stockId === activeId) : null;

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="flex h-[53px] shrink-0 items-center justify-between border-b border-[#e5e7eb] px-4">
        <div className="flex items-center gap-2">
          <img src={favoriteClickIco} alt="" className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <p className="text-sm font-bold text-[#4e5968]">
            {editMode ? '관심 종목 편집' : '관심 종목'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => isLoggedIn && setEditMode((v) => !v)}
          className={`text-xs font-bold text-[#014d9d] ${!isLoggedIn ? 'pointer-events-none' : ''}`}
          aria-disabled={!isLoggedIn}
        >
          {editMode && isLoggedIn ? (
            '완료'
          ) : (
            <span className="inline-flex items-center gap-1.5">
              관리
              <img src={arrowIco} alt="" className="ml-0.5 h-3 w-2" />
            </span>
          )}
        </button>
      </div>

      {isLoggedIn ? (
        <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-[#9ca3af]">불러오는 중…</div>
          )}
          {isError && !isLoading && (
            <div className="px-4 py-8 text-center text-sm text-red-500">
              관심 종목을 불러오지 못했습니다.
            </div>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-[#9ca3af]">
              등록된 관심 종목이 없습니다.
            </div>
          )}
          {!isLoading && !isError && items.length > 0 && editMode && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {items.map((row) => (
                  <SortableEditRow key={row.stockId} row={row} onRemove={removeItem} />
                ))}
              </SortableContext>
              <DragOverlay adjustScale={false} dropAnimation={null} className="pointer-events-none">
                {activeRow ? <EditRowOverlay row={activeRow} /> : null}
              </DragOverlay>
            </DndContext>
          )}
          {!isLoading && !isError && items.length > 0 && !editMode &&
            items.map((row) => {
              const priceColor = row.up ? 'text-red-600' : 'text-blue-700';
              return (
                <div
                  key={row.stockId}
                  onClick={() => navigate(toChartStockDetail(row.code))}
                  className="box-border grid h-[58px] w-full shrink-0 grid-cols-[minmax(0,1fr)_74px] items-center overflow-hidden border-0 border-b border-[#e5e7eb] bg-white px-4 text-left transition-colors hover:bg-[#f4f5f7]"
                >
                  <WatchIdentityBlock row={row} showMarket={false} />
                  <div
                    className={`ml-auto w-[74px] text-right text-[11.5px] font-semibold leading-[17px] tabular-nums ${priceColor}`}
                  >
                    <div>{row.price}</div>
                    <div>{row.changeLabel}</div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <img src={lockIco} alt="" className="h-8 w-8 shrink-0" aria-hidden />
          <p className="text-sm leading-6 text-[#9ca3af]">
            <span className="font-semibold text-[#9ca3af]">로그인</span> 후 관심 종목을
            <br />
            추가하고 실시간으로
            <br />
            모니터링하세요.
          </p>
        </div>
      )}
    </aside>
  );
}
