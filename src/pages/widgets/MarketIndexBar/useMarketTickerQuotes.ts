import { useCallback, useEffect, useState } from 'react';
import { fetchLsAccessToken } from '@/features/ls/lsTokenScheduler';
import { fetchT1101Quote, type T1101Quote } from '@/features/ls/fetchT1101Quote';
import { MARKET_TICKER_DEFS, type MarketTickerDef } from './marketTickerConfig';

const POLL_MS = 10 * 60 * 1000;

export type TickerRow = MarketTickerDef & {
  quote: T1101Quote | null;
  error?: boolean;
  /** 해당 종목 첫 조회 완료 여부 — 완료 전에는 … 표시 */
  loaded: boolean;
};

/** 한국 시세 UI: 상승 빨강 — change·sign 기준 */
export function isUpQuote(sign: string, change: number): boolean {
  if (change > 0) return true;
  if (change < 0) return false;
  return sign === '1' || sign === '2';
}

export function formatPrice(n: number): string {
  return Math.round(n).toLocaleString('ko-KR');
}

export function formatChange(change: number): string {
  if (change === 0) return '0';
  return change > 0 ? `+${formatPrice(change)}` : formatPrice(change);
}

export function formatPct(p: number): string {
  const s = p.toFixed(2);
  return p > 0 ? `+${s}%` : `${s}%`;
}

export function useMarketTickerQuotes() {
  const [rows, setRows] = useState<TickerRow[]>(() =>
    MARKET_TICKER_DEFS.map((d) => ({ ...d, quote: null, loaded: false }))
  );

  const loadAll = useCallback(async (silent: boolean) => {
    const hasKey = Boolean(
      import.meta.env.VITE_LS_APP_KEY?.trim() && import.meta.env.VITE_LS_APP_SECRET?.trim()
    );
    if (!hasKey) {
      setRows(MARKET_TICKER_DEFS.map((d) => ({ ...d, quote: null, error: true, loaded: true })));
      return;
    }

    await fetchLsAccessToken();

    if (!silent) {
      setRows(MARKET_TICKER_DEFS.map((d) => ({ ...d, quote: null, error: false, loaded: false })));
    }

    MARKET_TICKER_DEFS.forEach((def) => {
      void (async () => {
        try {
          const quote = await fetchT1101Quote(def.shcode);
          setRows((prev) =>
            prev.map((r) =>
              r.id === def.id ? { ...r, quote, error: !quote, loaded: true } : r
            )
          );
        } catch {
          setRows((prev) =>
            prev.map((r) =>
              r.id === def.id ? { ...r, quote: null, error: true, loaded: true } : r
            )
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

  return { rows, reload: () => void loadAll(false) };
}
