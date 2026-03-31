import { getLsAccessToken, fetchLsAccessToken } from './lsTokenScheduler';
import { getLsPostUrlByTr } from './lsMarketDataUrl';

/** LS REST 공통 POST — TR별 엔드포인트 분기 */
const TR_RATE_LIMIT_MS: Record<string, number> = {
  t3320: 1000,
  t1101: 350,
};
const trNextAllowedAt = new Map<string, number>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTrWindow(trCdRaw: string): Promise<string> {
  const trCd = trCdRaw.trim().toLowerCase();
  const limit = TR_RATE_LIMIT_MS[trCd] ?? 0;
  if (limit <= 0) return trCd;

  const now = Date.now();
  const nextAt = trNextAllowedAt.get(trCd) ?? 0;
  if (nextAt > now) {
    await sleep(nextAt - now);
  }
  trNextAllowedAt.set(trCd, Date.now() + limit);
  return trCd;
}

export async function postLsMarketData(
  tr_cd: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const trCd = await waitForTrWindow(tr_cd);
  let token = getLsAccessToken();
  if (!token) token = await fetchLsAccessToken();
  if (!token) return null;

  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    authorization: `Bearer ${token}`,
    tr_cd: trCd,
    tr_cont: 'N',
    tr_cont_key: '',
  };
  const mac = import.meta.env.VITE_LS_MAC_ADDRESS?.trim();
  if (mac) headers.mac_address = mac;

  const url = getLsPostUrlByTr(trCd);
  const doFetch = () =>
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

  let res = await doFetch();
  if (!res.ok && res.status === 500) {
    const text = await res.text().catch(() => '');
    if (text.includes('IGW00201')) {
      // LS 거래건수 초과: 짧게 대기 후 1회 재시도
      await sleep(1100);
      res = await doFetch();
    } else {
      // 아래 공통 로깅으로 전달하기 위해 기존 body를 유지
      (res as Response & { __lsBodyText?: string }).__lsBodyText = text;
    }
  }

  if (!res.ok) {
    if (import.meta.env.DEV) {
      const text =
        (res as Response & { __lsBodyText?: string }).__lsBodyText ??
        (await res.text().catch(() => ''));
      console.warn('[LS]', trCd, res.status, url, text);
    }
    return null;
  }
  const json = (await res.json()) as Record<string, unknown>;
  const rsp = json.rsp_cd;
  if (rsp && rsp !== '00000') {
    if (import.meta.env.DEV) {
      console.warn('[LS]', trCd, 'rsp_cd', rsp, json.rsp_msg);
    }
    return null;
  }
  return json;
}
