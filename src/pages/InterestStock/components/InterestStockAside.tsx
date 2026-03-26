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
      className={`flex w-full shrink-0 touch-none select-none items-center justify-between border-b border-[#eff1f8] bg-white px-4 py-3 ${
        isDragging ? 'opacity-30' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
          style={{ backgroundColor: row.logoBg }}
        >
          {row.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{row.name}</div>
          <div className="font-mono text-[10px] leading-[15px] text-[#9ca3af]">
            {row.code} · {row.market}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 cursor-grab items-center gap-2.5 pl-2 active:cursor-grabbing">
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
    <div className="box-border flex w-full min-w-[240px] cursor-grabbing items-center justify-between border-b border-[#eff1f8] bg-white px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
          style={{ backgroundColor: row.logoBg }}
        >
          {row.initials}
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{row.name}</div>
          <div className="font-mono text-[10px] leading-[15px] text-[#9ca3af]">
            {row.code} · {row.market}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5 pl-2 opacity-60">
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
      <div className="flex h-[53px] shrink-0 items-center justify-between border-b border-[#eff1f8] px-4">
        <div className="flex items-center gap-2">
          <img src={favoriteClickIco} alt="" className="h-4 w-4 shrink-0" aria-hidden />
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
                <button
                  key={row.code}
                  type="button"
                  className="flex h-auto w-full shrink-0 cursor-pointer items-center justify-between border-b border-[#eff1f8] px-4 py-3 text-left transition-colors hover:bg-[#f4f5f7]"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
                      style={{ backgroundColor: row.logoBg }}
                    >
                      {row.initials}
                    </div>
                    <div>
                      <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{row.name}</div>
                      <div className="font-mono text-[10px] leading-[15px] text-[#9ca3af]">{row.code}</div>
                    </div>
                  </div>
                  <div className={`text-right text-[10.5px] font-semibold leading-[15.75px] ${priceColor}`}>
                    <div>{row.price}</div>
                    <div>{row.changeLabel}</div>
                  </div>
                </button>
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
