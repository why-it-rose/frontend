import { useState } from 'react';
import type { EventType, StockMemo } from '../types/event.types';

interface EventInfo {
  eventType: EventType;
  stockName: string;
  changeRate: number;
}

interface MemoTabProps {
  memos: StockMemo[];
  eventInfo?: EventInfo;
  onSave?: (text: string) => void;
  onDelete?: (memoId: number) => void;
}

const MAX_LENGTH = 300;

function SendIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export default function MemoTab({ memos, eventInfo, onSave, onDelete }: MemoTabProps) {
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleConfirm = () => {
    if (confirmId !== null) onDelete?.(confirmId);
    setConfirmId(null);
  };

  const handleSave = () => {
    if (!text.trim()) return;
    onSave?.(text.trim());
    setText('');
  };

  const info = eventInfo ?? (memos[0] ? { eventType: memos[0].eventType, stockName: memos[0].stockName, changeRate: memos[0].changeRate } : null);
  const isSurge = info?.eventType === 'SURGE';
  const badgeStyle = isSurge
    ? { color: '#e03131', background: '#FFF0F0' }
    : { color: '#1971c2', background: '#EFF6FF' };
  const sign = isSurge ? '+' : '-';

  const groupedByYear = memos.reduce<Record<string, StockMemo[]>>((acc, memo) => {
    const year = memo.date.split('.')[0]?.length === 2 ? '2026' : (memo.date.split('.')[0] ?? '2026');
    if (!acc[year]) acc[year] = [];
    acc[year].push(memo);
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* 외부 클릭 시 토스트 닫기 */}
      {confirmId !== null && (
        <div className="absolute inset-0 z-20" onClick={() => setConfirmId(null)} />
      )}

      {/* 이벤트 정보 고정 상단 */}
      {info && (
        <div className="shrink-0 px-4 py-3 bg-white border-b border-[#f3f4f6]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5" style={{ ...badgeStyle, borderRadius: 4 }}>
              {isSurge ? '급등' : '급락'}
            </span>
            <span className="text-[13px] font-semibold text-text-primary">
              {info?.stockName} {sign}{Math.abs(info?.changeRate ?? 0)}%
            </span>
          </div>
        </div>
      )}

      {/* 메모 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle" style={{ scrollbarGutter: 'stable' }}>
        <div className="px-4 pt-3">
          {memos.length === 0 && (
            <p className="text-center text-sm text-[#9ca3af] mt-10">아직 작성한 메모가 없어요</p>
          )}
          {memos.length > 0 && (
            <div>
              {Object.entries(groupedByYear).map(([year, list]) => (
                <div key={year}>
                  <p className="pt-1 pb-2 text-[12px] text-[#9ca3af] font-medium">{year}</p>
                  <div className="space-y-2.5 mb-3">
                    {list.map((memo) => (
                      <div key={memo.memoId} className="bg-white rounded-[14px] p-[14px_16px]" style={{ border: '1px solid #eeeeee' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs leading-none text-[#9ca3af]">{memo.date}</span>
                          <div className="relative flex items-center">
                            {confirmId === memo.memoId && (
                              <div className="absolute right-6 z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                <span className="text-[11px] text-text-primary font-medium">삭제할까요?</span>
                                <button
                                  onClick={handleConfirm}
                                  className="text-[11px] font-semibold hover:opacity-70 transition-opacity"
                                  style={{ color: '#e03131' }}
                                >
                                  확인
                                </button>
                              </div>
                            )}
                            <button onClick={() => setConfirmId(memo.memoId === confirmId ? null : memo.memoId)} className="flex items-center justify-center hover:opacity-60 transition-opacity">
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                        <p className="text-[13px] text-[#374151] leading-[1.65] break-all">{memo.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모바일: input + 전송 버튼 나란히 */}
      <div className="md:hidden shrink-0 border-t border-border bg-white px-4 pt-2.5 pb-5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="이 이벤트에 대한 메모를 남겨보세요"
            className="flex-1 bg-[#f3f4f6] rounded-xl px-3.5 py-3 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af]"
          />
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity active:opacity-60"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* 데스크톱: 메모 작성 + 저장 버튼 */}
      <div className="hidden md:block shrink-0 px-4 pt-3 pb-5 border-t border-border bg-white">
        <p className="text-[13px] font-semibold text-[#374151] mb-2">메모 작성</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="이 이벤트에 대한 메모를 남겨보세요"
          className="w-full rounded-[10px] px-3.5 py-3 text-[13px] text-[#374151] leading-[1.7] resize-none outline-none bg-bg-subtle placeholder:text-[#9ca3af]"
          style={{ border: '1px solid #e5e7eb', height: 100 }}
        />
        <div className="text-right text-[11px] text-[#9ca3af] mt-1 mb-3">
          {text.length} / {MAX_LENGTH}
        </div>
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="w-full py-3 rounded-[10px] text-[15px] font-bold text-white transition-colors disabled:opacity-40"
          style={{ background: '#014d9d' }}
        >
          메모 저장
        </button>
      </div>
    </div>
  );
}
