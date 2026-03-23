import type { StockInfoBarProps } from "../types";

export function StockInfoBar({ stock, onAddWatchlist }: StockInfoBarProps) {
  const changeColor = stock.positive ? "text-[#e03131]" : "text-[#1971c2]";

  return (
    <div className="border-b border-gray-200 px-5 flex items-center justify-between h-[40px] bg-white gap-4">

      {/* 좌측: 종목명 · 가격 · 등락 · 코드 */}
      <div className="flex items-center gap-2.5 min-w-0">

        {/* 종목명 */}
        <span className="text-[15px] font-semibold text-[#333d4b] whitespace-nowrap shrink-0">
          {stock.name}
        </span>

        {/* 현재가 */}
        <span className="text-[22px] font-bold text-[#1a2236] tracking-tight whitespace-nowrap shrink-0 leading-none">
          {stock.price}
        </span>

        {/* 전일 종가 대비 + 등락률 */}
        <div className="flex flex-col justify-center leading-none shrink-0 gap-[1px]">
          <span className="text-[10px] text-[#8b95a1]">전일 종가 대비</span>
          <span className={`text-[12px] font-semibold ${changeColor}`}>
            {stock.changePercent}
          </span>
        </div>

        {/* 종목코드 배지 */}
        <span className="text-[10px] text-[#8b95a1] bg-[#f2f4f6] border border-[#e5e8eb] rounded px-1.5 py-[2px] whitespace-nowrap shrink-0 leading-none">
          {stock.code} · {stock.market}
        </span>
      </div>

      {/* 우측: 관심종목 추가 버튼 */}
      <button
        onClick={onAddWatchlist}
        className="shrink-0 flex items-center gap-1 border border-[#e5e8eb] rounded-md px-2 h-[24px] text-[11px] text-[#4e5968] font-medium hover:bg-[#f2f4f6] transition-colors whitespace-nowrap leading-none"
      >
        <svg
          className="w-2.5 h-2.5 text-[#e03131]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        관심종목 추가
      </button>
    </div>
  );
}