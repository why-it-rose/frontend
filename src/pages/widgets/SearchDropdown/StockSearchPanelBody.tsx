import { useEffect, useState, type RefObject } from "react";
import searchIcon from "@/assets/search.svg";
import type { StockSearchItemDto } from "@/features/stock/types";
import { logoColor, logoInitial, type RecentItem } from "./searchShared";

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  showResults: boolean;
  loading: boolean;
  error: string | null;
  results: StockSearchItemDto[] | null;
  recent: RecentItem[];
  onPickStock: (ticker: string, name: string, logoUrl?: string | null) => void;
  onPickFirstResult: () => void;
  onRemoveRecent: (ticker: string) => void;
  /** 데스크톱: 드롭다운 내부 패딩 / 모바일: 풀 너비 */
  variant?: "dropdown" | "sheet";
};

function ResultRow({
  item,
  onPick,
  highlighted = false,
  onHover,
  variant = "dropdown",
}: {
  item: StockSearchItemDto;
  onPick: (ticker: string, name: string, logoUrl?: string | null) => void;
  highlighted?: boolean;
  onHover?: () => void;
  variant?: "dropdown" | "sheet";
}) {
  const up = item.changeDirection === "UP";
  const down = item.changeDirection === "DOWN";
  const rate = item.changeRate ?? 0;
  const rateText = `${rate > 0 ? "+" : ""}${rate}%`;
  const priceText =
    item.currentPrice != null
      ? `${item.currentPrice.toLocaleString("ko-KR")}원`
      : "—";
  return (
    <li>
      <button
        type="button"
        className={`flex w-full items-center text-left active:bg-[#F0F2F8] ${
          variant === "dropdown"
            ? "gap-3 border-0 bg-transparent pl-3 pr-4 py-2.5"
            : "gap-3 px-3 py-2.5"
        } ${
          highlighted ? "bg-[#F0F2F8]" : "hover:bg-[#F0F2F8]"
        }`}
        onMouseEnter={onHover}
        onClick={() => onPick(item.ticker, item.name, item.logoUrl)}
      >
        {item.logoUrl ? (
          <img
            src={item.logoUrl}
            alt=""
            className={variant === "dropdown"
              ? "h-7 w-7 shrink-0 rounded-[7px] object-cover"
              : "h-9 w-9 shrink-0 rounded-lg object-cover"}
          />
        ) : (
          <div
            className={variant === "dropdown"
              ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black text-white"
              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"}
            style={{ backgroundColor: logoColor(item.ticker) }}
          >
            {logoInitial(item.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className={variant === "dropdown"
            ? "truncate font-['Noto_Sans_KR'] text-[13px] font-bold text-[#111827]"
            : "truncate font-['Noto_Sans_KR'] text-sm font-semibold text-gray-900"}>
            {item.name}
          </div>
          <div className={variant === "dropdown"
            ? "truncate font-mono text-[11px] text-[#9ca3af]"
            : "truncate font-mono text-xs text-gray-500"}>
            {item.ticker}
            {item.market ? ` · ${item.market}` : ""}
          </div>
        </div>
        <div className={variant === "dropdown" ? "ml-2 flex shrink-0 flex-col items-end gap-0.5" : "flex shrink-0 flex-col items-end gap-0.5"}>
          <span className={variant === "dropdown"
            ? "font-['Noto_Sans_KR'] text-[12px] font-semibold tabular-nums text-[#374151]"
            : "font-['Noto_Sans_KR'] text-sm font-semibold tabular-nums text-gray-700"}>
            {priceText}
          </span>
          <span
            className={`tabular-nums ${
              variant === "dropdown"
                ? "font-['Noto_Sans_KR'] text-[12px] font-medium"
                : "font-['Noto_Sans_KR'] text-xs font-medium"
            } ${
              up ? "text-red-600" : down ? "text-blue-600" : variant === "dropdown" ? "text-[#6b7280]" : "text-gray-500"
            }`}
          >
            {rateText}
          </span>
        </div>
      </button>
    </li>
  );
}

export function StockSearchPanelBody({
  query,
  onQueryChange,
  inputRef,
  showResults,
  loading,
  error,
  results,
  recent,
  onPickStock,
  onPickFirstResult,
  onRemoveRecent,
  variant = "dropdown",
}: Props) {
      const pad = variant === "sheet" ? "px-4 py-3" : "px-2 pb-2 pt-2.5";
  const [activeResultIndex, setActiveResultIndex] = useState(0);

  useEffect(() => {
    setActiveResultIndex(0);
  }, [results, showResults, query]);

  return (
    <div className={variant === "sheet" ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div className={`border-b border-gray-200 ${pad}`}>
        <div className={variant === "dropdown"
          ? "flex items-center gap-2 rounded-lg border border-[rgba(2,32,71,0.05)] bg-[#f0f4f9] px-3 py-1.5"
          : "flex items-center gap-2 rounded-lg border border-[rgba(2,32,71,0.05)] bg-[#f0f4f9] px-3 py-2"}>
          <img
            src={searchIcon}
            alt=""
            className={variant === "dropdown" ? "h-3.5 w-3.5 shrink-0 opacity-60" : "h-4 w-4 opacity-60"}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const activeResult = results?.[activeResultIndex];
              if (activeResult) {
                onPickStock(
                  activeResult.ticker,
                  activeResult.name,
                  activeResult.logoUrl
                );
                return;
              }
              onPickFirstResult();
            }}
            placeholder="종목명 또는 종목코드"
            className={variant === "dropdown"
              ? "min-w-0 flex-1 border-0 bg-transparent font-sans text-[13px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
              : "w-full bg-transparent text-sm outline-none"}
            autoComplete="off"
          />
        </div>
      </div>

      <div
        className={
          variant === "sheet"
            ? "scrollbar-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "scrollbar-subtle max-h-[min(420px,calc(100vh-140px))] overflow-y-auto"
        }
        style={{ scrollbarGutter: "stable both-edges" }}
      >
        {showResults ? (
          <div className={variant === "dropdown" ? "pb-1" : "p-2"}>
            {variant === "dropdown" && (
              <div className="px-3 pb-1 pt-2 font-['Noto_Sans_KR'] text-xs font-bold text-[#374151]">
                검색 결과
                {results != null && (
                  <span className="ml-1 font-['Noto_Sans_KR'] font-normal text-[#9ca3af]">
                    {loading ? "" : `· ${results.length}건`}
                  </span>
                )}
              </div>
            )}
            {loading ? (
              <div className={variant === "dropdown"
                ? "px-3 py-6 text-center font-sans text-sm text-[#9ca3af]"
                : "px-3 py-6 text-center text-sm text-gray-500"}>
                검색 중…
              </div>
            ) : error ? (
              <div className={variant === "dropdown"
                ? "px-3 py-4 text-center font-sans text-sm text-red-500"
                : "px-3 py-6 text-center text-sm text-red-600"}>
                {error}
              </div>
            ) : results && results.length === 0 ? (
              <div className={variant === "dropdown"
                ? "px-3 py-6 text-center font-sans text-sm text-[#9ca3af]"
                : "px-3 py-6 text-center text-sm text-gray-500"}>
                검색 결과가 없습니다.
              </div>
            ) : (
              <ul className={variant === "dropdown" ? "" : "divide-y divide-gray-100"}>
                {(results ?? []).map((s, index) => (
                  <ResultRow
                    key={`${s.ticker}-${s.stockId}`}
                    item={s}
                    onPick={onPickStock}
                    highlighted={index === activeResultIndex}
                    onHover={() => setActiveResultIndex(index)}
                    variant={variant}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className={variant === "dropdown"
            ? "search-recent-noto border-b border-[#f3f4f6] px-3 pb-3 pt-2"
            : "search-recent-noto p-2"}>
            {recent.length === 0 ? (
              variant === "dropdown" ? (
                <>
                  <div className="mb-2.5 text-xs font-bold text-[#374151]">최근 검색</div>
                  <p className="text-xs text-[#9ca3af]">최근 검색 내역이 없습니다.</p>
                </>
              ) : (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  최근 검색이 없습니다.
                </div>
              )
            ) : (
              variant === "dropdown" ? (
                <>
                  <div className="mb-2.5 text-xs font-bold text-[#374151]">최근 검색</div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <div key={r.ticker} className="search-tag">
                        <button
                          type="button"
                          className="border-0 bg-transparent p-0 text-[12px] font-medium leading-none text-[#374151]"
                          onClick={() => onPickStock(r.ticker, r.name, r.logoUrl)}
                        >
                          {r.name}
                        </button>
                        <button
                          type="button"
                          className="ml-0.5 border-0 bg-transparent p-0 text-[11px] leading-none text-[#9ca3af] hover:text-[#374151]"
                          aria-label={`${r.name} 최근 검색에서 제거`}
                          onClick={() => onRemoveRecent(r.ticker)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recent.map((r) => (
                    <li key={r.ticker} className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left hover:bg-[#F0F2F8] active:bg-[#F0F2F8]"
                        onClick={() => onPickStock(r.ticker, r.name, r.logoUrl)}
                      >
                        {r.logoUrl ? (
                          <img
                            src={r.logoUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: logoColor(r.ticker) }}
                          >
                            {logoInitial(r.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900">{r.name}</div>
                          <div className="truncate text-xs text-gray-500">{r.ticker}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="mr-2 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        onClick={() => onRemoveRecent(r.ticker)}
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
