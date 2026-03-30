/**
 * LS Open API OAuth2 access_token — 하루 1회 오전 6시 갱신 + 최초 부트스트랩.
 *
 * 공식 가이드: POST `oauth2/token`, param은 grant_type, appkey, appsecretkey, scope=oob
 * (Python `requests.post(..., params=param)` = URL 쿼리로 전달)
 *
 * 환경: `VITE_LS_APP_KEY`, `VITE_LS_APP_SECRET` (`.env.local`, 커밋 금지)
 */

const STORAGE_KEY = 'ls_oauth_access_token';
const SIX_AM_HOUR = 6;

let accessToken: string | null =
  typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;

let dailySixAmTimeoutId: ReturnType<typeof setTimeout> | null = null;

function getOAuthUrl(): string {
  if (import.meta.env.VITE_LS_OAUTH_URL) {
    return import.meta.env.VITE_LS_OAUTH_URL;
  }
  if (import.meta.env.DEV) {
    return '/ls-oauth/oauth2/token';
  }
  return 'https://openapi.ls-sec.co.kr:8080/oauth2/token';
}

/** 공식 샘플과 동일: 쿼리스트링 + POST (본문 비움). 실패 시 x-www-form-urlencoded 본문으로 1회 재시도. */
function resolveOAuthFetchUrl(): string {
  const base = getOAuthUrl();
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base;
  }
  return new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').toString();
}

function msUntilNextSixAM(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(SIX_AM_HOUR, 0, 0, 0);
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function logDevTokenOk(prefix: string): void {
  if (import.meta.env.DEV) {
    console.info('[LS OAuth] 발급 성공 · 토큰 앞 12자:', `${prefix.slice(0, 12)}…`);
  }
}

function logDevTokenFail(status: number, detail: string): void {
  if (import.meta.env.DEV) {
    console.warn('[LS OAuth] 발급 실패', status, detail);
  }
}

export async function fetchLsAccessToken(): Promise<string | null> {
  const appkey = import.meta.env.VITE_LS_APP_KEY?.trim();
  const appsecretkey = import.meta.env.VITE_LS_APP_SECRET?.trim();
  if (!appkey || !appsecretkey) {
    if (import.meta.env.DEV) {
      console.warn('[LS OAuth] VITE_LS_APP_KEY / VITE_LS_APP_SECRET 미설정(.env.local 확인)');
    }
    return accessToken;
  }

  const target = resolveOAuthFetchUrl();
  const u = new URL(target);
  u.searchParams.set('grant_type', 'client_credentials');
  u.searchParams.set('appkey', appkey);
  u.searchParams.set('appsecretkey', appsecretkey);
  u.searchParams.set('scope', 'oob');

  let res = await fetch(u.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      appkey,
      appsecretkey,
      scope: 'oob',
    });
    res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: body.toString(),
    });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logDevTokenFail(res.status, text);
    return null;
  }

  const json = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  const token = json.access_token;
  if (typeof token === 'string' && token.length > 0) {
    accessToken = token;
    logDevTokenOk(token);
    try {
      sessionStorage.setItem(STORAGE_KEY, token);
    } catch {
      /* ignore */
    }
  } else {
    logDevTokenFail(res.status, JSON.stringify(json));
  }
  return accessToken;
}

export function getLsAccessToken(): string | null {
  return accessToken;
}

function scheduleDailySixAmTokenRefresh(): void {
  if (dailySixAmTimeoutId != null) {
    clearTimeout(dailySixAmTimeoutId);
  }
  dailySixAmTimeoutId = window.setTimeout(() => {
    void fetchLsAccessToken();
    scheduleDailySixAmTokenRefresh();
  }, msUntilNextSixAM());
}

export function initLsTokenLifecycle(): void {
  const appkey = import.meta.env.VITE_LS_APP_KEY?.trim();
  const secret = import.meta.env.VITE_LS_APP_SECRET?.trim();
  if (!appkey || !secret) {
    return;
  }

  if (!accessToken) {
    void fetchLsAccessToken();
  }

  scheduleDailySixAmTokenRefresh();
}
