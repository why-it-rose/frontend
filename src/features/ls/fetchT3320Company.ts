import { postLsMarketData } from './postLsMarketData';

export type T3320Blocks = {
  main: Record<string, unknown>;
  fin: Record<string, unknown> | null;
};

const LS_MAIN_BIZ_KEYS = [
  'gproduct',
  'mainproduct',
  'mainprd',
  'prd_nm',
  'productnm',
  'bizcont',
] as const;

export function pickLsMainBusinessText(
  main: Record<string, unknown> | null | undefined
): string {
  if (!main) return '';
  for (const k of LS_MAIN_BIZ_KEYS) {
    const v = String(main[k] ?? '').trim();
    if (v.length > 0) return v;
  }
  return '';
}

function coerceRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

/** 본문이 비었거나 키만 있는 응답은 다음 gicode 후보를 시도하도록 null 처리 */
function t3320MainLooksUsable(main: Record<string, unknown>): boolean {
  const str = (k: string) => String(main[k] ?? '').trim();
  const num = (k: string) => {
    const raw = main[k];
    if (typeof raw === 'number') return Number.isNaN(raw) ? 0 : raw;
    if (typeof raw === 'string') {
      const n = parseFloat(raw.replace(/,/g, '').replace(/[^\d.-]/g, ''));
      return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };

  // t3320이 "키는 있는데 전부 0/빈문자" 형태로 내려오는 경우는 실데이터 없음으로 간주
  const hasCompany = str('company').length > 0;
  const hasMarket = str('marketnm').length > 0;
  const hasIndustry = str('upgubunnm').length > 0;
  const hasGroup = str('grdnm').length > 0;
  const hasAddr = str('baddress').length > 0;
  const hasCap = num('sigavalue') > 0;
  const hasShares = num('gstock') > 0;
  const hasFr = num('foreignratio') > 0;

  return hasCompany || hasMarket || hasIndustry || hasGroup || hasAddr || hasCap || hasShares || hasFr;
}

function extractT3320Blocks(json: Record<string, unknown>): T3320Blocks | null {
  let mainRaw = json.t3320OutBlock ?? json.T3320OutBlock;
  if (Array.isArray(mainRaw) && mainRaw.length > 0) {
    mainRaw = mainRaw[0];
  }
  const main = coerceRecord(mainRaw);
  if (!main || !t3320MainLooksUsable(main)) return null;

  let finRaw = json.t3320OutBlock1 ?? json.T3320OutBlock1;
  if (Array.isArray(finRaw) && finRaw.length > 0) {
    finRaw = finRaw[0];
  }
  const fin = coerceRecord(finRaw);

  return { main, fin };
}

/** LS FnGuide 요약 — `gicode` 6자리 또는 A+6자 등 시도 */
export async function fetchT3320Company(gicode: string): Promise<T3320Blocks | null> {
  const json = await postLsMarketData('t3320', {
    t3320InBlock: {
      gicode: gicode.trim(),
    },
  });
  if (!json) return null;
  return extractT3320Blocks(json as Record<string, unknown>);
}

/** 티커(6자)·영문 등 → LS 기업코드 후보 순서대로 시도 */
export function buildGicodeCandidates(ticker: string): string[] {
  const t = ticker.trim().toUpperCase().replace(/\s/g, '');
  const six = t.replace(/\D/g, '').padStart(6, '0').slice(-6);
  const candidates = new Set<string>();
  if (six.length === 6) {
    candidates.add(`A${six}`);
    candidates.add(six);
  }
  if (t.length >= 6 && /[A-Z]/i.test(t)) candidates.add(t);
  return [...candidates];
}
