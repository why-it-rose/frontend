import { postLsMarketData } from './postLsMarketData';

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

function isEmptyQuote(q: T1101Quote): boolean {
  return !String(q.hname).trim() && q.price === 0 && q.change === 0;
}

export type TrPair = {
  tr_cd: 't1101';
  inKey: 't1101InBlock';
  outKey: 't1101OutBlock';
};

const TR_T1101: TrPair = {
  tr_cd: 't1101',
  inKey: 't1101InBlock',
  outKey: 't1101OutBlock',
};

function blockToQuote(blk: Record<string, unknown>): T1101Quote {
  return {
    hname: String(blk.hname ?? ''),
    price: parseNum(blk.price),
    change: parseNum(blk.change),
    diffPct: parseNum(blk.diff),
    sign: String(blk.sign ?? ''),
  };
}

async function fetchQuoteWithTr(
  shcode: string,
  pair: TrPair
): Promise<T1101Quote | null> {
  const body = {
    [pair.inKey]: {
      shcode: normalizeShcode(shcode),
    },
  } as Record<string, { shcode: string }>;

  const json = (await postLsMarketData(pair.tr_cd, body)) as
    | {
        rsp_cd?: string;
        rsp_msg?: string;
        t1101OutBlock?: Record<string, unknown>;
      }
    | null;
  if (!json) return null;

  if (json.rsp_cd && json.rsp_cd !== '00000') {
    if (import.meta.env.DEV) {
      console.warn(
        `[LS ${pair.tr_cd}] rsp_cd`,
        json.rsp_cd,
        json.rsp_msg ?? '',
        'shcode=',
        shcode
      );
    }
    return null;
  }

  const blk = json.t1101OutBlock;
  if (!blk || typeof blk !== 'object') return null;

  return blockToQuote(blk);
}

/**
 * 현재가 조회(t1101 only).
 */
export async function fetchT1101Quote(shcode: string): Promise<T1101Quote | null> {
  const t1101 = await fetchQuoteWithTr(shcode, TR_T1101);
  if (t1101 != null && !isEmptyQuote(t1101)) {
    return t1101;
  }
  return t1101;
}
