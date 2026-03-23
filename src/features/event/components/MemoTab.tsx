import { useState } from 'react';
import type { StockMemo } from '../types/event.types';

interface MemoTabProps {
  memos: StockMemo[];
  onSave?: (text: string) => void;
  onDelete?: (memoId: number) => void;
}

const MAX_LENGTH = 300;

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

// 연도별로 메모 그룹핑
function groupByYear(memos: StockMemo[]) {
  const groups: Record<string, StockMemo[]> = {};
  memos.forEach((m) => {
    const year = m.date.split('.')[0]?.length === 2 ? '2026' : m.date.split('.')[0] ?? '2026';
    if (!groups[year]) groups[year] = [];
    groups[year].push(m);
  });
  return groups;
}

export default function MemoTab({ memos, onSave, onDelete }: MemoTabProps) {
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) return;
    onSave?.(text.trim());
    setText('');
  };

  const groups = groupByYear(memos);

  return (
    <div className="relative flex-1 min-h-0">
      {/* 메모 목록 */}
      <div className="absolute inset-0 overflow-y-auto scrollbar-subtle pb-17 md:pb-43">
        {memos.length === 0 && (
          <p className="text-center text-sm text-[#9ca3af] mt-10">아직 작성한 메모가 없어요</p>
        )}

        {/* 모바일: 연도 그룹 헤더 */}
        {Object.entries(groups).map(([year, list]) => (
          <div key={year}>
            <p className="md:hidden px-4 pt-2.5 pb-1 text-[13px] text-[#9ca3af] font-medium">{year}</p>
            {list.map((memo) => {
              const isSurge = memo.eventType === 'SURGE';
              const sign = isSurge ? '+' : '-';
              const badgeStyle = isSurge
                ? { color: '#ef4444', background: '#FFF0F0' }
                : { color: '#3b82f6', background: '#EFF6FF' };

              return (
                <div
                  key={memo.memoId}
                  className="mx-4 mb-2.5 bg-white rounded-[14px] p-[14px_16px]
                             md:rounded-[10px]"
                  style={{ border: '1px solid #eeeeee' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5"
                        style={{ ...badgeStyle, borderRadius: 4 }}
                      >
                        {isSurge ? '급등' : '급락'}
                      </span>
                      <span className="text-[13px] font-semibold text-text-primary">
                        {memo.stockName} {sign}{Math.abs(memo.changeRate)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-[#9ca3af]">{memo.date}</span>
                      <button
                        onClick={() => onDelete?.(memo.memoId)}
                        className="flex items-center p-0.5 hover:opacity-60 transition-opacity"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#374151] leading-[1.65]">{memo.text}</p>
                </div>
              );
            })}
          </div>
        ))}

        {/* 데스크톱: 글자수 표시 위치 */}
        <div className="hidden md:block text-right px-5 py-0.5 text-[11px] text-[#9ca3af]">
          {text.length} / {MAX_LENGTH}
        </div>
      </div>

      {/* 입력 영역 — 항상 하단 고정 */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-white">

        {/* 모바일: 단줄 입력 + 파란 원형 버튼 */}
        <div className="md:hidden relative px-4 py-2.5 pb-6">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="이 이벤트에 대한 메모를 남겨보세요"
            className="w-full bg-[#f3f4f6] rounded-xl px-3.5 py-3 pr-14 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af]"
          />
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="absolute right-7 top-1/2 -translate-y-1/2 -mt-2 w-9.5 h-9.5 rounded-full bg-blue-600 flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <EditIcon />
          </button>
        </div>

        {/* 데스크톱: textarea + 저장 버튼 */}
        <div className="hidden md:block">
          <div className="mx-5 mt-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="이 이벤트에 대한 메모를 남겨보세요"
              className="w-full rounded-[10px] px-3.5 py-3 text-[13px] text-[#374151] leading-[1.7] resize-none outline-none bg-bg-subtle placeholder:text-[#9ca3af]"
              style={{ border: '1px solid #e5e7eb', height: 100 }}
            />
            <div className="text-right text-[11px] text-[#9ca3af] mt-1 mb-2">
              {text.length} / {MAX_LENGTH}
            </div>
          </div>
          <div className="px-5 pb-4">
            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className="w-full py-3.25 rounded-[10px] text-[15px] font-bold text-white transition-colors disabled:opacity-40"
              style={{ background: '#014d9d' }}
            >
              메모 저장
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
