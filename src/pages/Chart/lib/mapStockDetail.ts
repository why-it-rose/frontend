import type { StockDetailDto } from "@/features/stock/types";
import type { StockInfo } from "../types";

export function mapStockDetailToStockInfo(d: StockDetailDto): StockInfo {
  const arrow = d.priceChange > 0 ? "▲" : d.priceChange < 0 ? "▼" : "";
  return {
    name: d.name,
    code: d.ticker,
    market: d.market,
    price: `${Number(d.currentPrice).toLocaleString("ko-KR")}원`,
    change: `${arrow} ${d.priceChange.toLocaleString("ko-KR")}`.trim(),
    changePercent: `${d.changeRate >= 0 ? "+" : ""}${d.changeRate.toFixed(2)}%`,
    positive: d.changeDirection === "UP",
  };
}
