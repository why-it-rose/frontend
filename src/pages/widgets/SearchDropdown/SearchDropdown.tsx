import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import searchSrc from "@/assets/search.svg";
import { StockSearchPanelBody } from "./StockSearchPanelBody";
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
    goToFirstResult,
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
        <StockSearchPanelBody
          variant="dropdown"
          query={query}
          onQueryChange={setQuery}
          inputRef={inputRef}
          showResults={showResults}
          loading={loading}
          error={error}
          results={results}
          recent={recent}
          onPickStock={goToStock}
          onPickFirstResult={goToFirstResult}
          onRemoveRecent={removeRecent}
        />
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
          onClick={() => {
            setOpen(true);
            window.requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          }}
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
