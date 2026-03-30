import type { RefObject } from "react";
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
  onPickStock: (ticker: string, name: string) => void;
  onRemoveRecent: (ticker: string) => void;
  /** 데스크톱: 드롭다운 내부 패딩 / 모바일: 풀 너비 */
  variant?: "dropdown" | "sheet";
};

function ResultRow({
  item,
  onPick,
}: {
  item: StockSearchItemDto;
  onPick: (ticker: string, name: string) => void;
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
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 active:bg-gray-100"
        onClick={() => onPick(item.ticker, item.name)}
      >
        {item.logoUrl ? (
          <img
            src={item.logoUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
            style={{ backgroundColor: logoColor(item.ticker) }}
          >
            {logoInitial(item.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900">{item.name}</div>
          <div className="truncate font-mono text-xs text-gray-500">
            {item.ticker}
            {item.market ? ` · ${item.market}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-sm font-semibold tabular-nums text-gray-700">{priceText}</span>
          <span
            className={`text-xs font-medium tabular-nums ${
              up ? "text-red-600" : down ? "text-blue-600" : "text-gray-500"
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
  onRemoveRecent,
  variant = "dropdown",
}: Props) {
  const pad = variant === "sheet" ? "px-4 py-3" : "p-3";

  return (
    <div className={variant === "sheet" ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div className={`border-b border-gray-200 ${pad}`}>
        <div className="flex items-center gap-2 rounded-lg border border-[rgba(2,32,71,0.05)] bg-[#f0f4f9] px-3 py-2">
          <img src={searchIcon} alt="" className="h-4 w-4 opacity-60" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="종목명 또는 티커 검색"
            className="w-full bg-transparent text-sm outline-none"
            autoComplete="off"
          />
        </div>
      </div>

      <div
        className={
          variant === "sheet"
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
            : "max-h-[min(420px,calc(100vh-140px))] overflow-y-auto"
        }
      >
        {showResults ? (
          <div className="p-2">
            {loading ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">검색 중…</div>
            ) : error ? (
              <div className="px-3 py-6 text-center text-sm text-red-600">{error}</div>
            ) : results && results.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
                검색 결과가 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {(results ?? []).map((s) => (
                  <ResultRow key={`${s.ticker}-${s.stockId}`} item={s} onPick={onPickStock} />
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="search-recent-noto p-2">
            {recent.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
                최근 검색이 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((r) => (
                  <li key={r.ticker} className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 active:bg-gray-100"
                      onClick={() => onPickStock(r.ticker, r.name)}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: logoColor(r.ticker) }}
                      >
                        {logoInitial(r.name)}
                      </div>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
