import { useAuth } from "@/features/auth/context/AuthContext";
import {
  useAddInterestStockMutation,
  useRemoveInterestStockMutation,
} from "@/features/stock/hooks/useInterestStocks";
import type { StockInfoBarProps } from "../types";
import favoriteSrc from "@/assets/favorite.svg";
import favoriteClickSrc from "@/assets/favorite_click.svg";

export function StockInfoBar({
  stock,
  stockId,
  isInterested = false,
  onBack,
  onAddWatchlist,
  onRequireLogin,
}: StockInfoBarProps) {
  const changeColor = stock.positive ? "text-[#e03131]" : "text-[#1971c2]";
  const arrow = stock.positive ? "▲" : "▼";
  const { isLoggedIn } = useAuth();
  const addMut = useAddInterestStockMutation();
  const removeMut = useRemoveInterestStockMutation();
  const pending = addMut.isPending || removeMut.isPending;

  const handleFavoriteClick = () => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    if (stockId == null || stockId <= 0) return;
    if (isInterested) {
      removeMut.mutate(stockId, {
        onSuccess: () => onAddWatchlist?.(),
      });
    } else {
      addMut.mutate(stockId, {
        onSuccess: () => onAddWatchlist?.(),
      });
    }
  };

  return (
    <div className="flex min-h-[44px] items-center gap-4 max-md:flex-wrap max-md:gap-x-3 max-md:gap-y-1.5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#4b5563] transition-colors hover:bg-[#f3f4f6]"
          aria-label="뒤로 가기"
        >
          <span className="text-lg leading-none">←</span>
        </button>
      )}

      <span className="shrink-0 -ml-0.5 text-[18px] font-bold leading-none text-[#111827] max-md:order-1">{stock.name}</span>

      <span className="shrink-0 self-center -translate-y-[-0.8px] text-[13px] leading-none text-[#6b7280] max-md:order-2">
        {stock.code} · {stock.market}
      </span>

      <span className="hidden shrink-0 self-center text-[18px] font-bold tabular-nums leading-none tracking-tight text-[#1f4fc9] md:text-[20px] max-md:order-4 max-md:basis-full max-md:pl-9 md:inline">
        {stock.price}
      </span>

      <div className="ml-1.5 hidden shrink-0 flex-col items-center justify-center self-center leading-none max-md:order-5 max-md:ml-0 max-md:pl-9 md:flex">
        <span className="text-[10px] leading-none text-[#8b95a1]">전일 종가 대비</span>
        <span className={`mt-0.5 inline-flex items-center gap-1 text-[14px] font-medium leading-none ${changeColor}`}>
          <span aria-hidden className="text-[12px] leading-none">
            {arrow}
          </span>
          <span className="tabular-nums tracking-tight">{stock.changePercent}</span>
        </span>
      </div>

      <div className="hidden max-md:order-4 max-md:flex max-md:basis-full max-md:items-end max-md:gap-2 max-md:pl-9">
        <span className="shrink-0 text-[22px] font-bold tabular-nums leading-none tracking-tight text-[#1f4fc9]">
          {stock.price}
        </span>
        <span className={`inline-flex items-center gap-1 text-[12px] font-medium leading-none ${changeColor}`}>
          <span aria-hidden className="text-[10px] leading-none">
            {arrow}
          </span>
          <span className="tabular-nums tracking-tight">{stock.changePercent}</span>
        </span>
      </div>

      <div className="hidden max-md:order-5 max-md:mb-[-15px] max-md:mt-0 max-md:block max-md:basis-full max-md:border-b max-md:border-[#eff1f8]" />

      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={pending || (isLoggedIn && (stockId == null || stockId <= 0))}
        className="ml-auto flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] max-[860px]:w-9 max-[860px]:px-0 max-md:order-3 disabled:opacity-60"
      >
        <img
          src={isInterested ? favoriteClickSrc : favoriteSrc}
          alt=""
          className="h-4.5 w-4.5 shrink-0"
          width={14}
          height={14}
          aria-hidden
        />
        <span className="max-[860px]:hidden">{isInterested ? "관심종목 해제" : "관심종목 추가"}</span>
      </button>
    </div>
  );
}
