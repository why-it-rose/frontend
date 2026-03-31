import { useCallback, useEffect, useState } from 'react';
import { fetchLsAccessToken } from '@/features/ls/lsTokenScheduler';
import { fetchT1101Quote, type T1101Quote } from '@/features/ls/fetchT1101Quote';
import { MARKET_TICKER_DEFS, type MarketTickerDef } from './marketTickerConfig';

const POLL_MS = 10 * 60 * 1000;

/** 라우트 전환 시 MarketIndexBar가 언마운트되므로, 직전 시세를 메모리에 두어 빈 로딩 없이 이어짐 */
const SNAPSHOT_MAX_AGE_MS = 10 * 60 * 1000;
let tickerRowsSnapshot: TickerRow[] | null = null;
let tickerSnapshotAt = 0;
/** `MARKET_TICKER_DEFS` 전부 최소 1회 로드 완료된 시각 — POLL_MS 이내면 라우트 전환 시 재조회 생략 */
let lastFullTickerFetchAt = 0;

function cloneRows(rows: TickerRow[]): TickerRow[] {
  return rows.map((r) => ({
    ...r,
    quote: r.quote ? { ...r.quote } : null,
  }));
}

function readTickerSnapshot(): TickerRow[] | null {
  if (!tickerRowsSnapshot || Date.now() - tickerSnapshotAt > SNAPSHOT_MAX_AGE_MS) {
    return null;
  }
  return cloneRows(tickerRowsSnapshot);
}

function writeTickerSnapshot(rows: TickerRow[]) {
  if (!rows.some((r) => r.loaded)) return;
  tickerRowsSnapshot = cloneRows(rows);
  tickerSnapshotAt = Date.now();
  const allDefsLoaded = MARKET_TICKER_DEFS.every((d) =>
    rows.some((r) => r.id === d.id && r.loaded)
  );
  if (allDefsLoaded) {
    lastFullTickerFetchAt = Date.now();
  }
}

function defaultRows(): TickerRow[] {
  return MARKET_TICKER_DEFS.map((d) => ({ ...d, quote: null, loaded: false }));
}

export type TickerRow = MarketTickerDef & {
  quote: T1101Quote | null;
  error?: boolean;
  /** 해당 종목 첫 조회 완료 여부 — 완료 전에는 … 표시 */
  loaded: boolean;
};

/** 한국 시세 UI: 상승 빨강 — change·sign 기준 */
export function isUpQuote(sign: string, change: number): boolean {
  if (sign === '1' || sign === '2') return true;
  if (sign === '4' || sign === '5') return false;
  return change > 0;
}

export function formatPrice(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

function signToDirection(sign: string): -1 | 0 | 1 {
  if (sign === '5' || sign === '4') return -1;
  if (sign === '1' || sign === '2') return 1;
  return 0;
}

export function formatChange(change: number, sign: string): string {
  if (change === 0) return '0';
  const abs = Math.abs(change);
  const dir = signToDirection(sign);
  if (dir < 0) return `-${formatPrice(abs)}`;
  if (dir > 0) return `+${formatPrice(abs)}`;
  return formatPrice(change);
}

export function formatPct(p: number): string {
  const s = p.toFixed(2);
  return p > 0 ? `+${s}%` : `${s}%`;
}

export function useMarketTickerQuotes() {
  const [rows, setRows] = useState<TickerRow[]>(() => readTickerSnapshot() ?? defaultRows());

  const loadAll = useCallback(async (silent: boolean, forceRefetch = false) => {
    const hasKey = Boolean(
      import.meta.env.VITE_LS_APP_KEY?.trim() && import.meta.env.VITE_LS_APP_SECRET?.trim()
    );
    if (!hasKey) {
      setRows(MARKET_TICKER_DEFS.map((d) => ({ ...d, quote: null, error: true, loaded: true })));
      return;
    }

    await fetchLsAccessToken();

    if (!silent) {
      const snap = readTickerSnapshot();
      if (snap?.some((r) => r.loaded)) {
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

    MARKET_TICKER_DEFS.forEach((def) => {
      void (async () => {
        try {
          const quote = await fetchT1101Quote(def.shcode);
          setRows((prev) =>
            prev.map((r) => {
              if (r.id !== def.id) return r;
              /** 재조회 실패 시에도 직전 성공 시세 유지(상세 진입 직후 일시 오류 등) */
              const merged = quote ?? r.quote;
              return { ...r, quote: merged, error: !merged, loaded: true };
            })
          );
        } catch {
          setRows((prev) =>
            prev.map((r) => {
              if (r.id !== def.id) return r;
              return { ...r, loaded: true, error: !r.quote };
            })
          );
        }
      })();
    });
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
