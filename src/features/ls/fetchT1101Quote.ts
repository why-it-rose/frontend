import { getLsAccessToken, fetchLsAccessToken } from './lsTokenScheduler';
import { getLsMarketDataPostUrl } from './lsMarketDataUrl';

export type T1101Quote = {
  hname: string;
  price: number;
  /** 전일대비 절대값 */
  change: number;
  /** 등락률 % */
  diffPct: number;
  sign: string;
};

function parseNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.trim());
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/** KRX 종목코드(숫자·영문 혼합) — LS는 대문자 6자 기대인 경우가 많음 */
function normalizeShcode(shcode: string): string {
  return shcode.trim().toUpperCase();
}

function blockToQuote(blk: Record<string, unknown>): T1101Quote {
  return {
    hname: String(blk.hname ?? ''),
    price: parseNum(blk.price),
    change: parseNum(blk.change),
    diffPct: parseNum(blk.diff),
    sign: String(blk.sign ?? ''),
  };
}

type TrPair = {
  tr_cd: 't1101' | 't1901';
  inKey: 't1101InBlock' | 't1901InBlock';
  outKey: 't1101OutBlock' | 't1901OutBlock';
};

async function fetchQuoteWithTr(
  shcode: string,
  pair: TrPair,
  token: string
): Promise<T1101Quote | null> {
  const body = {
    [pair.inKey]: {
      shcode: normalizeShcode(shcode),
    },
  } as Record<string, { shcode: string }>;

  const res = await fetch(getLsMarketDataPostUrl(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      tr_cd: pair.tr_cd,
      tr_cont: 'N',
      tr_cont_key: '',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (import.meta.env.DEV) {
      console.warn(`[LS ${pair.tr_cd}] HTTP`, shcode, res.status, text);
    }
    return null;
  }

  const json = (await res.json()) as {
    rsp_cd?: string;
    rsp_msg?: string;
    t1101OutBlock?: Record<string, unknown>;
    t1901OutBlock?: Record<string, unknown>;
  };

  if (json.rsp_cd && json.rsp_cd !== '00000') {
    if (import.meta.env.DEV) {
      console.warn(`[LS ${pair.tr_cd}] rsp_cd`, json.rsp_cd, json.rsp_msg ?? '', 'shcode=', shcode);
    }
    return null;
  }

  const blk =
    pair.outKey === 't1101OutBlock' ? json.t1101OutBlock : json.t1901OutBlock;
  if (!blk || typeof blk !== 'object') return null;

  return blockToQuote(blk);
}

/**
 * 현재가 조회: t1101(주식) 우선 → 실패 시 t1901(ETF 현재가) 폴백.
 * 영문 혼합 종목코드(0092B0, 0167A0 등)는 t1101에서 안 나오는 경우가 있어 ETF TR로 재요청.
 */
export async function fetchT1101Quote(shcode: string): Promise<T1101Quote | null> {
  let token = getLsAccessToken();
  if (!token) {
    token = await fetchLsAccessToken();
  }
  if (!token) return null;

  const t1101 = await fetchQuoteWithTr(shcode, {
    tr_cd: 't1101',
    inKey: 't1101InBlock',
    outKey: 't1101OutBlock',
  }, token);

  if (t1101 != null) {
    const empty =
      !String(t1101.hname).trim() && t1101.price === 0 && t1101.change === 0;
    if (!empty) {
      return t1101;
    }
    if (import.meta.env.DEV) {
      console.info('[LS] t1101 데이터 없음 → t1901 시도', normalizeShcode(shcode));
    }
  }

  const t1901 = await fetchQuoteWithTr(shcode, {
    tr_cd: 't1901',
    inKey: 't1901InBlock',
    outKey: 't1901OutBlock',
  }, token);

  if (t1901 != null && import.meta.env.DEV) {
    console.info('[LS] t1901 폴백 성공', normalizeShcode(shcode));
  }

  return t1901;
}
