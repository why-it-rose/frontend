import { useEffect } from "react";
import { StockSearchPanelBody } from "./StockSearchPanelBody";
import { useStockSearchPanel } from "./useStockSearchPanel";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileSearchSheet({ open, onClose }: Props) {
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
    onAfterPick: onClose,
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-white md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="종목 검색"
    >
      <header
        className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
      >
        <h1 className="text-base font-semibold text-gray-900">종목 검색</h1>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          닫기
        </button>
      </header>
      <StockSearchPanelBody
        variant="sheet"
        query={query}
        onQueryChange={setQuery}
        inputRef={inputRef}
        showResults={showResults}
        loading={loading}
        error={error}
        results={results}
        recent={recent}
        onPickStock={goToStock}
        onRemoveRecent={removeRecent}
      />
    </div>
  );
}
