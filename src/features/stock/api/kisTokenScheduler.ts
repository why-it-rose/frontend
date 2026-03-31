const TOKEN_KEY = 'kis_oauth_access_token';
const EXPIRES_AT_KEY = 'kis_oauth_expires_at';
const REFRESH_BUFFER_MS = 10 * 60 * 1000; // 만료 10분 전 선갱신

let accessToken: string | null =
  typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
let expiresAtMs =
  typeof sessionStorage !== 'undefined'
    ? Number(sessionStorage.getItem(EXPIRES_AT_KEY) ?? 0)
    : 0;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<string | null> | null = null;

function now() {
  return Date.now();
}

function getKisOAuthUrl(): string {
  if (import.meta.env.VITE_KIS_OAUTH_URL) return import.meta.env.VITE_KIS_OAUTH_URL;
  if (import.meta.env.DEV) return '/kis-oauth/oauth2/tokenP';
  return 'https://openapi.koreainvestment.com:9443/oauth2/tokenP';
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (!expiresAtMs) return;
  const delay = Math.max(5_000, expiresAtMs - now() - REFRESH_BUFFER_MS);
  refreshTimer = window.setTimeout(() => {
    void fetchKisAccessToken();
  }, delay);
}

function setToken(token: string, expiresInSec: number) {
  accessToken = token;
  expiresAtMs = now() + Math.max(60, expiresInSec) * 1000;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(EXPIRES_AT_KEY, String(expiresAtMs));
  } catch {
    // ignore
  }
  scheduleRefresh();
}

export function getKisAccessToken(): string | null {
  if (!accessToken) return null;
  if (expiresAtMs && now() >= expiresAtMs - REFRESH_BUFFER_MS) return null;
  return accessToken;
}

export async function fetchKisAccessToken(): Promise<string | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    const appkey = import.meta.env.VITE_KIS_APP_KEY?.trim();
    const appsecret = import.meta.env.VITE_KIS_APP_SECRET?.trim();
    if (!appkey || !appsecret) {
      return accessToken;
    }

    const res = await fetch(getKisOAuthUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey,
        appsecret,
      }),
    });
    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.warn('[KIS OAuth] 발급 실패', res.status, await res.text().catch(() => ''));
      }
      return null;
    }
    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number | string;
    };
    const token = String(json.access_token ?? '').trim();
    const expiresIn = Number(json.expires_in ?? 0);
    if (!token) return null;
    setToken(token, Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 24 * 60 * 60);
    return accessToken;
  })();
  const out = await inflight;
  inflight = null;
  return out;
}

export function initKisTokenLifecycle(): void {
  const appkey = import.meta.env.VITE_KIS_APP_KEY?.trim();
  const appsecret = import.meta.env.VITE_KIS_APP_SECRET?.trim();
  if (!appkey || !appsecret) return;

  if (!getKisAccessToken()) {
    void fetchKisAccessToken();
  } else {
    scheduleRefresh();
  }
}

