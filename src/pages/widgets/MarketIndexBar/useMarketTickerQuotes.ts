import { useCallback, useEffect, useState } from 'react';
import { fetchLsAccessToken } from '@/features/ls/lsTokenScheduler';
import { fetchT1101Quote, type T1101Quote } from '@/features/ls/fetchT1101Quote';
import { MARKET_TICKER_DEFS, type MarketTickerDef } from './marketTickerConfig';

const POLL_MS = 10 * 60 * 1000;

export type TickerRow = MarketTickerDef & {
  quote: T1101Quote | null;
  error?: boolean;
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
    MARKET_TICKER_DEFS.map((d) => ({ ...d, quote: null }))
  );
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const hasKey = Boolean(
      import.meta.env.VITE_LS_APP_KEY?.trim() && import.meta.env.VITE_LS_APP_SECRET?.trim()
    );
    if (!hasKey) {
      setRows(MARKET_TICKER_DEFS.map((d) => ({ ...d, quote: null, error: true })));
      setLoading(false);
      return;
    }

    setLoading(true);
    await fetchLsAccessToken();

    const results = await Promise.all(
      MARKET_TICKER_DEFS.map(async (def) => {
        try {
          const quote = await fetchT1101Quote(def.shcode);
          return { ...def, quote, error: !quote } as TickerRow;
        } catch {
          return { ...def, quote: null, error: true } as TickerRow;
        }
      })
    );
    setRows(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
    const id = window.setInterval(() => void loadAll(), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadAll]);

  return { rows, loading, reload: loadAll };
}
