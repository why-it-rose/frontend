import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import searchSrc from "@/assets/search.svg";
import type { StockSearchItemDto } from "@/features/stock/types";
import { logoColor, logoInitial } from "./searchShared";
import { useStockSearchPanel } from "./useStockSearchPanel";

export default function SearchDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelLayout, setPanelLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const {
    query,
    setQuery,
    recent,
    results,
    loading,
    error,
    inputRef,
    showResults,
    goToStock,
    removeRecent,
  } = useStockSearchPanel({
    active: open,
    onAfterPick: () => setOpen(false),
  });

  useLayoutEffect(() => {
    if (!open) {
      setPanelLayout(null);
      return;
    }
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPanelLayout({
        top: r.bottom + 8,
        left: r.left + r.width / 2,
        width: Math.min(620, window.innerWidth - 48),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const renderResultRow = (item: StockSearchItemDto) => {
    const up = item.changeDirection === "UP";
    const down = item.changeDirection === "DOWN";
    const rate = item.changeRate ?? 0;
    const rateText = `${rate > 0 ? "+" : ""}${rate}%`;
    const priceText =
      item.currentPrice != null
        ? `${item.currentPrice.toLocaleString("ko-KR")}원`
        : "—";
    return (
      <button
        key={`${item.ticker}-${item.stockId}`}
        type="button"
        className="popup-item w-full border-0 bg-transparent text-left"
        onClick={() => goToStock(item.ticker, item.name)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {item.logoUrl ? (
            <img
              src={item.logoUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-[7px] object-cover"
            />
          ) : (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black text-white"
              style={{ backgroundColor: logoColor(item.ticker) }}
            >
              {logoInitial(item.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-sans text-[13px] font-bold text-[#111827]">
              {item.name}
            </div>
            <div className="truncate font-mono text-[11px] text-[#9ca3af]">
              {item.ticker} · {item.market}
            </div>
          </div>
        </div>
        <div className="ml-2 flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-sans text-[12px] font-semibold tabular-nums text-[#374151]">
            {priceText}
          </span>
          <span
            className={`font-sans text-[12px] font-medium tabular-nums ${
              up ? "text-red-600" : down ? "text-blue-600" : "text-[#6b7280]"
            }`}
          >
            {rateText}
          </span>
        </div>
      </button>
    );
  };

  const searchPanel =
    open && panelLayout ? (
      <div
        ref={panelRef}
        className="search-dropdown search-dropdown--portal"
        role="dialog"
        aria-label="검색"
        style={{
          top: panelLayout.top,
          left: panelLayout.left,
          width: panelLayout.width,
          transform: "translateX(-50%)",
        }}
      >
        <div className="border-b border-[#f3f4f6] px-3 pb-2 pt-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-[rgba(2,32,71,0.05)] bg-[#f0f4f9] px-3 py-1.5">
            <img src={searchSrc} alt="" className="h-3.5 w-3.5 shrink-0 opacity-60" width={14} height={14} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="종목명 또는 종목코드"
              className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[13px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {showResults ? (
          <div className="max-h-[min(60vh,420px)] overflow-y-auto pb-1">
            <div className="px-4 pb-1 pt-2 font-sans text-xs font-bold text-[#374151]">
              검색 결과
              {results != null && (
                <span className="ml-1 font-normal text-[#9ca3af]">
                  {loading ? "" : `· ${results.length}건`}
                </span>
              )}
            </div>
            {loading && (
              <div className="px-4 py-6 text-center font-sans text-sm text-[#9ca3af]">
                검색 중…
              </div>
            )}
            {!loading && error && (
              <div className="px-4 py-4 text-center font-sans text-sm text-red-500">{error}</div>
            )}
            {!loading && !error && results && results.length === 0 && (
              <div className="px-4 py-6 text-center font-sans text-sm text-[#9ca3af]">
                검색 결과가 없습니다.
              </div>
            )}
            {!loading && !error && results && results.map((item) => renderResultRow(item))}
          </div>
        ) : (
          <div className="search-recent-noto border-b border-[#f3f4f6] px-4 pb-3 pt-2">
            <div className="mb-2.5 text-xs font-bold text-[#374151]">최근 검색</div>
            {recent.length === 0 ? (
              <p className="text-xs text-[#9ca3af]">최근 검색 내역이 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {recent.map((row) => (
                  <div key={row.ticker} className="search-tag">
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0 text-[12px] font-medium leading-none text-[#374151]"
                      onClick={() => goToStock(row.ticker, row.name)}
                    >
                      {row.name}
                    </button>
                    <button
                      type="button"
                      className="ml-0.5 border-0 bg-transparent p-0 text-[11px] leading-none text-[#9ca3af] hover:text-[#374151]"
                      aria-label={`${row.name} 최근 검색에서 제거`}
                      onClick={() => removeRecent(row.ticker)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      {open &&
        createPortal(
          <button
            type="button"
            className="fixed inset-0 z-[200] hidden cursor-default bg-black/15 md:block"
            aria-label="검색 닫기"
            onClick={() => setOpen(false)}
          />,
          document.body
        )}
      {open && searchPanel && createPortal(searchPanel, document.body)}
      <div ref={wrapRef} className="relative mx-6 flex min-w-0 max-w-[514px] flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[rgba(2,32,71,0.05)] bg-[#f0f4f9] px-4"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <img src={searchSrc} alt="" className="h-3.5 w-3.5 shrink-0" width={14} height={14} />
          <span className="min-w-0 truncate font-sans text-[13.1px] font-medium leading-[20.3px] tracking-normal text-[#6b7684]">
            검색어를 입력해주세요
          </span>
        </button>
      </div>
    </>
  );
}
