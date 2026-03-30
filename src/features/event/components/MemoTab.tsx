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
  onSave?: (content: string) => Promise<void> | void;
  onUpdate?: (memoId: number, content: string) => Promise<void> | void;
  onDelete?: (memoId: number) => Promise<void> | void;
}

const MAX_LENGTH = 300;

function formatDate(createdAt: string): string {
  const d = new Date(createdAt);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

function getYear(createdAt: string): string {
  return String(new Date(createdAt).getFullYear());
}

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

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function MemoTab({ memos = [], eventInfo, onSave, onUpdate, onDelete }: MemoTabProps) {
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const isSurge = eventInfo?.eventType === 'SURGE';
  const badgeStyle = isSurge
    ? { color: '#e03131', background: '#FFF0F0' }
    : { color: '#1971c2', background: '#EFF6FF' };
  const sign = isSurge ? '+' : '-';

  const handleSave = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try { await onSave?.(text.trim()); setText(''); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (memoId: number) => {
    if (!editText.trim() || saving) return;
    setSaving(true);
    try { await onUpdate?.(memoId, editText.trim()); setEditingId(null); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (confirmId === null) return;
    await onDelete?.(confirmId);
    setConfirmId(null);
  };

  const startEdit = (memo: StockMemo) => {
    setEditingId(memo.memoId);
    setEditText(memo.content);
    setConfirmId(null);
  };

  const groupedByYear = memos.reduce<Record<string, StockMemo[]>>((acc, memo) => {
    const year = getYear(memo.createdAt);
    if (!acc[year]) acc[year] = [];
    acc[year].push(memo);
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 외부 클릭 시 confirm 닫기 */}
      {confirmId !== null && (
        <div className="absolute inset-0 z-20" onClick={() => setConfirmId(null)} />
      )}

      {/* 이벤트 정보 고정 상단 */}
      {eventInfo && (
        <div className="shrink-0 px-4 py-3 bg-white border-b border-[#f3f4f6]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5" style={{ ...badgeStyle, borderRadius: 4 }}>
              {isSurge ? '급등' : '급락'}
            </span>
            <span className="text-[13px] font-semibold text-text-primary">
              {eventInfo.stockName} {sign}{Math.abs(eventInfo.changeRate)}%
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
                          <span className="text-xs leading-none text-[#9ca3af]">{formatDate(memo.createdAt)}</span>
                          <div className="relative flex items-center gap-2">
                            {confirmId === memo.memoId && (
                              <div className="absolute right-6 z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                                <span className="text-[11px] text-text-primary font-medium">삭제할까요?</span>
                                <button
                                  onClick={handleDelete}
                                  className="text-[11px] font-semibold hover:opacity-70 transition-opacity"
                                  style={{ color: '#e03131' }}
                                >
                                  확인
                                </button>
                              </div>
                            )}
                            {onUpdate && (
                              <button onClick={() => startEdit(memo)} className="flex items-center justify-center hover:opacity-60 transition-opacity">
                                <EditIcon />
                              </button>
                            )}
                            <button onClick={() => setConfirmId(memo.memoId === confirmId ? null : memo.memoId)} className="flex items-center justify-center hover:opacity-60 transition-opacity">
                              <TrashIcon />
                            </button>
                          </div>
                        </div>

                        {/* 수정 모드 */}
                        {editingId === memo.memoId ? (
                          <div>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value.slice(0, MAX_LENGTH))}
                              className="w-full rounded-[8px] px-3 py-2 text-[13px] text-[#374151] leading-[1.7] resize-none outline-none bg-bg-subtle"
                              style={{ border: '1px solid #e5e7eb', height: 80 }}
                              autoFocus
                            />
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[11px] text-[#9ca3af]">{editText.length} / {MAX_LENGTH}</span>
                              <div className="flex gap-2">
                                <button onClick={() => setEditingId(null)} className="text-[12px] text-[#9ca3af] hover:opacity-70">취소</button>
                                <button
                                  onClick={() => handleUpdate(memo.memoId)}
                                  disabled={!editText.trim() || saving}
                                  className="text-[12px] font-semibold disabled:opacity-40"
                                  style={{ color: '#014d9d' }}
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[13px] text-[#374151] leading-[1.65] break-all">{memo.content}</p>
                        )}
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
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="이 이벤트에 대한 메모를 남겨보세요"
            className="flex-1 bg-[#f3f4f6] rounded-xl px-3.5 py-3 text-sm text-[#374151] outline-none placeholder:text-[#9ca3af]"
          />
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
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
          disabled={!text.trim() || saving}
          className="w-full py-3 rounded-[10px] text-[15px] font-bold text-white transition-colors disabled:opacity-40"
          style={{ background: '#014d9d' }}
        >
          메모 저장
        </button>
      </div>
    </div>
  );
}
