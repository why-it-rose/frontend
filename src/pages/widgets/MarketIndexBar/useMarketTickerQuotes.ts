import { useCallback, useEffect, useState } from 'react';
import { fetchStockMarketBottomBar } from '@/features/stock/api';
import type { StockMarketBottomBarItemDto } from '@/features/stock/types';
import { MARKET_TICKER_DEFS, type MarketTickerDef } from './marketTickerConfig';

const POLL_MS = 10 * 60 * 1000;
const SNAPSHOT_MAX_AGE_MS = 10 * 60 * 1000;

let tickerRowsSnapshot: TickerRow[] | null = null;
let tickerSnapshotAt = 0;
let lastFullTickerFetchAt = 0;

function cloneRows(rows: TickerRow[]): TickerRow[] {
  return rows.map((row) => ({ ...row }));
}

function readTickerSnapshot(): TickerRow[] | null {
  if (!tickerRowsSnapshot || Date.now() - tickerSnapshotAt > SNAPSHOT_MAX_AGE_MS) {
    return null;
  }
  return cloneRows(tickerRowsSnapshot);
}

function writeTickerSnapshot(rows: TickerRow[]) {
  if (!rows.some((row) => row.loaded)) return;
  tickerRowsSnapshot = cloneRows(rows);
  tickerSnapshotAt = Date.now();
  const allDefsLoaded = MARKET_TICKER_DEFS.every((def) =>
    rows.some((row) => row.id === def.id && row.loaded)
  );
  if (allDefsLoaded) {
    lastFullTickerFetchAt = Date.now();
  }
}

function defaultRows(): TickerRow[] {
  return MARKET_TICKER_DEFS.map((def) => ({ ...def, loaded: false }));
}

export type TickerRow = MarketTickerDef &
  Partial<StockMarketBottomBarItemDto> & {
    error?: boolean;
    loaded: boolean;
  };

export function isUpQuote(direction?: string): boolean {
  return direction !== 'DOWN';
}

export function formatPrice(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

export function formatChange(change: number, direction?: string): string {
  if (change === 0) return '0';
  const abs = Math.abs(change);
  if (direction === 'DOWN') return `-${formatPrice(abs)}`;
  return `+${formatPrice(abs)}`;
}

export function formatPct(p: number): string {
  const abs = Math.abs(p).toFixed(2);
  return p < 0 ? `-${abs}%` : `+${abs}%`;
}

export function useMarketTickerQuotes() {
  const [rows, setRows] = useState<TickerRow[]>(() => readTickerSnapshot() ?? defaultRows());

  const loadAll = useCallback(async (silent: boolean, forceRefetch = false) => {
    if (!silent) {
      const snap = readTickerSnapshot();
      if (snap?.some((row) => row.loaded)) {
        setRows(snap);
        if (
          !forceRefetch &&
          lastFullTickerFetchAt > 0 &&
          Date.now() - lastFullTickerFetchAt < POLL_MS
        ) {
          return;
        }
      } else {
        setRows(defaultRows());
      }
    }

    try {
      const data = await fetchStockMarketBottomBar();
      const items = Array.isArray(data.items) ? data.items : [];
      const rowsFromApi = MARKET_TICKER_DEFS.map((def) => {
        const hit = items.find((item) => item.id === def.id) ?? null;
        return {
          ...def,
          ...hit,
          loaded: true,
          error: !hit,
        };
      });
      setRows(rowsFromApi);
    } catch {
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          loaded: true,
          error: row.currentPrice == null,
        }))
      );
    }
  }, []);

  useEffect(() => {
    void loadAll(false);
    const id = window.setInterval(() => void loadAll(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadAll]);

  useEffect(() => {
    writeTickerSnapshot(rows);
  }, [rows]);

  return { rows, reload: () => void loadAll(false, true) };
}
