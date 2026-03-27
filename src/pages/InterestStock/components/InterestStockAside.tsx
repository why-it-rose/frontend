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

type WatchRow = {
  name: string;
  code: string;
  market: string;
  initials: string;
  logoBg: string;
  price: string;
  changeLabel: string;
  up: boolean;
};

const INITIAL_WATCHLIST: WatchRow[] = [
  {
    name: '삼성전자',
    code: '005930',
    market: 'KOSPI',
    initials: '삼',
    logoBg: '#1428a0',
    price: '184,000',
    changeLabel: '▼ -2.08%',
    up: false,
  },
  {
    name: 'SK하이닉스',
    code: '000660',
    market: 'KOSPI',
    initials: 'SK',
    logoBg: '#EA1917',
    price: '915,000',
    changeLabel: '▲ +3.21%',
    up: true,
  },
  {
    name: 'LG에너지솔루션',
    code: '373220',
    market: 'KOSDAQ',
    initials: 'LG',
    logoBg: '#a50034',
    price: '305,500',
    changeLabel: '▲ +5.14%',
    up: true,
  },
  {
    name: 'NAVER',
    code: '035420',
    market: 'KOSPI',
    initials: 'N',
    logoBg: '#03c75a',
    price: '198,500',
    changeLabel: '▲ +1.85%',
    up: true,
  },
  {
    name: '알테오젠',
    code: '196170',
    market: 'KOSDAQ',
    initials: '알',
    logoBg: '#059669',
    price: '361,000',
    changeLabel: '▼ -3.08%',
    up: false,
  },
];

function getWatchLogoText(row: WatchRow) {
  if (row.name === 'SK하이닉스') return 'SK';
  if (row.name === 'LG에너지솔루션') return 'LG';
  return Array.from(row.name.trim())[0] ?? row.initials;
}

function WatchIdentityBlock({ row, showMarket = true }: { row: WatchRow; showMarket?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <div
        className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white max-md:-translate-y-[0.8px]"
        style={{ backgroundColor: row.logoBg }}
      >
        <span className="max-md:translate-y-[1px]">{getWatchLogoText(row)}</span>
      </div>
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
  onRemove: (code: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.code,
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
            onRemove(row.code);
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
  const { isLoggedIn } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [items, setItems] = useState<WatchRow[]>(() => [...INITIAL_WATCHLIST]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortableIds = useMemo(() => items.map((r) => r.code), [items]);

  useEffect(() => {
    if (!isLoggedIn) setEditMode(false);
  }, [isLoggedIn]);

  const removeItem = useCallback((code: string) => {
    setItems((prev) => prev.filter((row) => row.code !== code));
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.code === active.id);
      const newIndex = prev.findIndex((i) => i.code === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeRow = activeId ? items.find((r) => r.code === activeId) : null;

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
          {editMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {items.map((row) => (
                  <SortableEditRow key={row.code} row={row} onRemove={removeItem} />
                ))}
              </SortableContext>
              <DragOverlay adjustScale={false} dropAnimation={null} className="pointer-events-none">
                {activeRow ? <EditRowOverlay row={activeRow} /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            items.map((row) => {
              const priceColor = row.up ? 'text-red-600' : 'text-blue-700';
              return (
                <div
                  key={row.code}
                  className="box-border grid h-[58px] w-full shrink-0 grid-cols-[minmax(0,1fr)_74px] items-center overflow-hidden border-0 border-b border-[#e5e7eb] bg-white px-4 text-left transition-colors hover:bg-[#f4f5f7]"
                >
                  <WatchIdentityBlock row={row} showMarket={false} />
                  <div className={`ml-auto w-[74px] text-right text-[11.5px] font-semibold leading-[17px] tabular-nums ${priceColor}`}>
                    <div>{row.price}</div>
                    <div>{row.changeLabel}</div>
                  </div>
                </div>
              );
            })
          )}
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
