import { useCallback, useEffect, useRef, useState } from 'react';
import searchSrc from '@/assets/search.svg';

const INITIAL_RECENT = ['SK하이닉스', '삼성전자', '레인보우로보틱스', 'NAVER'] as const;

const POPULAR = [
  { rank: 1, name: 'SK하이닉스', initials: 'SK', logoBg: '#EA1917', change: '+5.05%', up: true },
  { rank: 2, name: '삼성전자', initials: '삼', logoBg: '#014d9d', change: '+2.14%', up: true },
  { rank: 3, name: 'NAVER', initials: 'N', logoBg: '#03c75a', change: '-1.04%', up: false },
] as const;

export default function SearchDropdown() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([...INITIAL_RECENT]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const removeRecent = useCallback((label: string) => {
    setRecent(prev => prev.filter(t => t !== label));
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-6 flex min-w-0 max-w-[514px] flex-1"
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[rgba(2,32,71,0.05)] bg-[#f0f4f9] px-4"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <img src={searchSrc} alt="" className="h-3.5 w-3.5 shrink-0" width={14} height={14} />
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[rgba(2,32,71,0.05)] font-sans text-xs font-bold text-[#8b95a1]">
          /
        </span>
        <span className="font-sans text-[13.1px] font-medium leading-[20.3px] tracking-normal text-[#6b7684]">
          를 눌러 검색하세요
        </span>
      </button>

      {open && (
        <div className="search-dropdown" role="dialog" aria-label="검색">
          <div className="border-b border-[#f3f4f6] px-4 pb-3 pt-2.5">
            <div className="mb-2.5 font-sans text-xs font-bold text-[#374151]">최근 검색</div>
            <div className="flex flex-wrap gap-1.5">
              {recent.map(tag => (
                <div key={tag} className="search-tag">
                  <span>{tag}</span>
                  <button
                    type="button"
                    className="ml-0.5 border-0 bg-transparent p-0 text-[11px] text-[#9ca3af] hover:text-[#374151]"
                    aria-label={`${tag} 최근 검색에서 제거`}
                    onClick={() => removeRecent(tag)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pb-1.5 pt-2.5">
            <div className="mb-1 flex items-center justify-between px-4">
              <span className="font-sans text-xs font-bold text-[#374151]">인기 검색</span>
              <span className="font-sans text-[11px] text-[#9ca3af]">오늘 13:37 기준</span>
            </div>
            {POPULAR.map(row => (
              <button
                key={row.rank}
                type="button"
                className="popup-item w-full border-0 bg-transparent text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="search-popular-rank">{row.rank}</span>
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black text-white"
                    style={{ backgroundColor: row.logoBg }}
                  >
                    {row.initials}
                  </div>
                  <span className="font-sans text-[13px] font-bold text-[#111827]">{row.name}</span>
                </div>
                <span
                  className={`text-[13px] font-medium ${row.up ? 'text-red-600' : 'text-blue-600'}`}
                >
                  {row.change}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
