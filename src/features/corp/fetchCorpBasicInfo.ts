/** 금융위 GetCorpBasicInfoService_V2 — 개요·종속기업. 키: VITE_DATA_GO_SERVICE_KEY */

const DATA_GO_BASE =
  import.meta.env.VITE_DATA_GO_BASE_URL?.trim() || '/data-go';

/** 포털에서 "인증키(Encoding)" 를 넣은 경우 `.env` 에 `VITE_DATA_GO_SERVICE_KEY_ENCODING=1` — 이중 인코딩 방지 */
function isEncodingServiceKey(): boolean {
  return import.meta.env.VITE_DATA_GO_SERVICE_KEY_ENCODING === '1';
}

function attachServiceKey(queryWithoutKey: string, key: string): string {
  const sep = queryWithoutKey.includes('?') ? '&' : '?';
  if (isEncodingServiceKey()) {
    return `${queryWithoutKey}${sep}serviceKey=${key}`;
  }
  return `${queryWithoutKey}${sep}serviceKey=${encodeURIComponent(key)}`;
}

const SVC_PATH = '/1160100/service/GetCorpBasicInfoService_V2';

function serviceKey(): string {
  return import.meta.env.VITE_DATA_GO_SERVICE_KEY?.trim() || '';
}

let warnedMissingKey = false;

type FssConsSubsidiaryBrief = {
  name: string;
  mainBizCtt: string;
  /** `mainSbrdEnpYnCtt` 등 — 주요 연결 종속 여부 힌트(정렬용) */
  rankHint: number;
};

type FssLoadedData = {
  outline: Record<string, unknown>;
  subsidiaries: FssConsSubsidiaryBrief[];
};

const fssDataCache = new Map<string, Promise<FssLoadedData | null>>();
const FSS_DATA_CACHE_KEY_VER = 'v5';
function fssCacheKey(corpNm: string): string {
  return `${FSS_DATA_CACHE_KEY_VER}\t${corpNm.trim()}`;
}

function parseItems(json: unknown): Record<string, unknown>[] {
  const root = json as Record<string, unknown>;
  const response = root.response as Record<string, unknown> | undefined;
  const body = (response?.body ?? root.body) as Record<string, unknown> | undefined;
  if (!body) return [];
  const itemsRaw = body.items;
  if (itemsRaw == null || itemsRaw === '') return [];
  const itemsWrap =
    typeof itemsRaw === 'object' && !Array.isArray(itemsRaw)
      ? (itemsRaw as Record<string, unknown>)
      : null;
  if (!itemsWrap) return [];
  const raw = itemsWrap.item;
  if (raw == null) return [];
  return Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : [raw as Record<string, unknown>];
}

function parseItemsDeep(json: unknown): Record<string, unknown>[] {
  const direct = parseItems(json);
  if (direct.length) return direct;

  const out: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();

  function walk(node: unknown): void {
    if (node == null || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const x of node) walk(x);
      return;
    }
    const o = node as Record<string, unknown>;
    if ('items' in o) {
      const items = o.items;
      if (items && typeof items === 'object' && !Array.isArray(items)) {
        const raw = (items as Record<string, unknown>).item;
        if (raw != null) {
          const rows = Array.isArray(raw) ? raw : [raw];
          for (const r of rows) {
            if (r && typeof r === 'object') out.push(r as Record<string, unknown>);
          }
          return;
        }
      }
    }
    for (const v of Object.values(o)) walk(v);
  }

  walk(json);
  return out;
}

function isOkHeader(json: unknown): boolean {
  const root = json as Record<string, unknown>;
  const response = root.response as Record<string, unknown> | undefined;
  const header = (response?.header ?? root.header) as Record<string, unknown> | undefined;
  const code = String(header?.resultCode ?? header?.RESULT_CODE ?? '').trim();
  const msg = String(header?.resultMsg ?? header?.RESULT_MSG ?? '').trim();
  if (
    code === '00' ||
    code === '0' ||
    code === 'INFO-000' ||
    code === 'NORMAL_SERVICE'
  ) {
    return true;
  }
  if (/normal|info-000/i.test(msg)) return true;
  const deep = parseItemsDeep(json);
  if (!header && deep.length > 0) return true;
  if (deep.length > 0 && (code === '' || code === '03')) return true;
  return false;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    if (import.meta.env.DEV) {
      console.warn('[FSS GetCorpBasicInfo]', res.status, url.split('?')[0]);
    }
    throw new Error(`data.go.kr ${res.status}`);
  }
  return res.json();
}

function normalizeCorpBaseName(s: string): string {
  let t = s.replace(/\s/g, '');
  t = t.replace(/^\(주\)/, '').replace(/^㈜/, '');
  const endSuffixes = ['주식회사', '유한회사', '합자회사', '합명회사'];
  for (const suf of endSuffixes) {
    if (t.endsWith(suf)) t = t.slice(0, -suf.length);
  }
  if (t.endsWith('(주)')) t = t.slice(0, -3);
  if (t.endsWith('㈜')) t = t.slice(0, -1);
  t = t.replace(/^\(주\)/, '').replace(/^㈜/, '');
  return t;
}

/** 화면용 법인명 — (주)·㈜·주식회사 등만 제거(공백 정리) */
function stripCorpDisplayName(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^\(주\)\s*/g, '').replace(/^㈜\s*/g, '');
  s = s.replace(/^주식회사\s+/g, '').replace(/\s+주식회사$/g, '');
  s = s.replace(/\s*\(주\)\s*$/g, '').replace(/\s*㈜\s*$/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

function stripLatinLetters(s: string): string {
  return s.replace(/[A-Za-z]+/g, ' ');
}

function hasHangul(s: string): boolean {
  return /[\uac00-\ud7a3]/.test(s);
}

/** API/원문에 섞인 `&;;`, 엔티티, 잔여 &·연속 ; 제거(일반 단일 `;` 는 유지) */
function sanitizeOverviewText(s: string): string {
  let t = String(s ?? '')
    .replace(/&[a-zA-Z#][a-zA-Z0-9#]*;/gi, ' ')
    .replace(/&+/g, ' ')
    .replace(/(?:\s*;\s*){2,}/g, ' ')
    .replace(/;\s*;/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function rankFromMainSubsYn(v: unknown): number {
  const s = String(v ?? '').replace(/\s/g, '');
  if (!s) return 0;
  if (/^(Y|예|주|1)/i.test(s) || /주요|해당/.test(s)) return 2;
  if (/^(N|아|무|0)/i.test(s)) return -1;
  return 0;
}

function subsidiaryRelevance(parentBase: string, sub: FssConsSubsidiaryBrief): number {
  const nm = stripCorpDisplayName(sub.name);
  const subBase = normalizeCorpBaseName(nm);
  let sc = sub.rankHint * 4000;
  if (parentBase.length >= 2) {
    if (subBase.startsWith(parentBase)) sc += 2500;
    else if (subBase.includes(parentBase)) sc += 1500;
    else if (parentBase.length >= 4 && subBase.startsWith(parentBase.slice(0, 4))) sc += 800;
    else if (parentBase.length >= 2 && subBase.startsWith(parentBase.slice(0, 2))) sc += 300;
  }
  sc -= Math.min(40, Math.max(0, subBase.length - 14) * 2);
  return sc;
}

/** corpNm 부분일치 다건 응답에서 본점에 가까운 행 선택 */
function pickBestCorpOutlineRow(
  rows: Record<string, unknown>[],
  query: string
): Record<string, unknown> {
  const first = rows[0]!;
  const q = normalizeCorpBaseName(query);
  const qCompact = query.replace(/\s/g, '');
  if (!q) return first;

  type Cand = { row: Record<string, unknown>; tier: number; len: number };
  const cands: Cand[] = [];

  for (const row of rows) {
    const raw = String(row.corpNm ?? '').trim();
    const compact = raw.replace(/\s/g, '');
    const base = normalizeCorpBaseName(raw);

    if (base === q) {
      cands.push({ row, tier: 0, len: base.length });
      continue;
    }
    if (compact === qCompact) {
      cands.push({ row, tier: 1, len: compact.length });
      continue;
    }
    if (q.length >= 3 && base.startsWith(q)) {
      cands.push({ row, tier: 2, len: base.length });
    }
  }

  if (!cands.length) return first;

  cands.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.len !== b.len) return a.len - b.len;
    return 0;
  });

  return cands[0].row;
}

async function fetchCorpOutlineByName(
  corpNm: string
): Promise<Record<string, unknown> | null> {
  const key = serviceKey();
  const name = corpNm.trim();
  if (!key || !name) return null;

  const qs = new URLSearchParams({
    pageNo: '1',
    numOfRows: '100',
    resultType: 'json',
    corpNm: name,
  });
  const baseUrl = `${DATA_GO_BASE}${SVC_PATH}/getCorpOutline_V2?${qs.toString()}`;
  const url = attachServiceKey(baseUrl, key);
  const json = await fetchJson(url).catch(() => null);
  if (!json || !isOkHeader(json)) return null;
  const rows = parseItemsDeep(json);
  if (!rows.length) return null;
  return pickBestCorpOutlineRow(rows, name);
}

function estbYearFrom(dt: unknown): string {
  const s = String(dt ?? '').replace(/\D/g, '');
  if (s.length >= 4) return s.slice(0, 4);
  return '';
}

const MAIN_BIZ_OUTLINE_KEYS = ['enpMainBizNm', 'mainBizNm'] as const;

function getOutlineStr(outline: Record<string, unknown>, key: string): string {
  const direct = outline[key];
  if (direct != null && String(direct).trim()) return String(direct).trim();
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(outline)) {
    if (k.toLowerCase() === lower && v != null) {
      const s = String(v).trim();
      if (s) return s;
    }
  }
  return '';
}

function pickMainBizFromOutline(outline: Record<string, unknown>): string {
  for (const k of MAIN_BIZ_OUTLINE_KEYS) {
    const v = getOutlineStr(outline, k);
    if (v) return v;
  }
  for (const [k, val] of Object.entries(outline)) {
    const kl = k.toLowerCase();
    if (!(kl.includes('mainbiz') || kl.includes('enpmainbiz'))) continue;
    if (kl.includes('sic')) continue;
    const s = String(val ?? '').trim();
    if (s) return s;
  }
  return '';
}

function briefFromConsSubsRow(r: Record<string, unknown>): FssConsSubsidiaryBrief | null {
  const name = String(r.sbrdEnpNm ?? '').trim();
  if (!name) return null;
  const mainBizCtt = getOutlineStr(r, 'sbrdEnpMainBizCtt');
  const yn = getOutlineStr(r, 'mainSbrdEnpYnCtt') || String(r.mainSbrdEnpYnCtt ?? '');
  const rankHint = rankFromMainSubsYn(yn);
  return { name, mainBizCtt, rankHint };
}

async function fetchConsSubsidiariesBrief(crno: string): Promise<FssConsSubsidiaryBrief[]> {
  const key = serviceKey();
  const c = crno.replace(/\D/g, '').trim();
  if (!key || c.length < 10) return [];

  const qs = new URLSearchParams({
    pageNo: '1',
    numOfRows: '100',
    resultType: 'json',
    crno: c,
  });
  const baseUrl = `${DATA_GO_BASE}${SVC_PATH}/getConsSubsComp_V2?${qs.toString()}`;
  const url = attachServiceKey(baseUrl, key);
  const json = await fetchJson(url).catch(() => null);
  if (!json || !isOkHeader(json)) return [];

  const rows = parseItemsDeep(json);
  const byName = new Map<string, FssConsSubsidiaryBrief>();
  for (const row of rows) {
    const b = briefFromConsSubsRow(row);
    if (!b) continue;
    const prev = byName.get(b.name);
    if (!prev) byName.set(b.name, b);
    else {
      const next = { ...prev, rankHint: Math.max(prev.rankHint, b.rankHint) };
      if (!prev.mainBizCtt && b.mainBizCtt) next.mainBizCtt = b.mainBizCtt;
      byName.set(b.name, next);
    }
  }
  return [...byName.values()];
}

const SUBSIDIARY_LIST_MAX = 5;
const SUBS_MAIN_BIZ_SNIPPET_MAX = 56;
const SUBS_MAIN_BIZ_MAX_PARTS = 4;

function shortenPhrase(s: string, maxLen: number): string {
  const t = sanitizeOverviewText(s).replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

function displaySubsidiaryNameKo(sub: FssConsSubsidiaryBrief): string {
  const n = sanitizeOverviewText(stripLatinLetters(stripCorpDisplayName(sub.name)))
    .replace(/\s+/g, ' ')
    .trim();
  return n;
}

function displaySubsidiaryNameAny(sub: FssConsSubsidiaryBrief): string {
  return sanitizeOverviewText(stripCorpDisplayName(sub.name))
    .replace(/\s+/g, ' ')
    .trim();
}

function collectMainBizFromSubs(
  sortedSubs: FssConsSubsidiaryBrief[]
): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  for (const s of sortedSubs) {
    let t = sanitizeOverviewText(stripLatinLetters(s.mainBizCtt)).replace(/\s+/g, ' ').trim();
    if (!hasHangul(t)) continue;
    const snippet = shortenPhrase(t, SUBS_MAIN_BIZ_SNIPPET_MAX);
    if (seen.has(snippet)) continue;
    seen.add(snippet);
    parts.push(snippet);
    if (parts.length >= SUBS_MAIN_BIZ_MAX_PARTS) break;
  }

  return parts.join(', ');
}

function collectMainBizFromSubsAny(
  sortedSubs: FssConsSubsidiaryBrief[]
): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  for (const s of sortedSubs) {
    const t = sanitizeOverviewText(s.mainBizCtt).replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const snippet = shortenPhrase(t, SUBS_MAIN_BIZ_SNIPPET_MAX);
    if (seen.has(snippet)) continue;
    seen.add(snippet);
    parts.push(snippet);
    if (parts.length >= SUBS_MAIN_BIZ_MAX_PARTS) break;
  }

  return parts.join(', ');
}

type GetFssOverviewOpts = {
  mainBizFromLs?: string;
  industryFromLs?: string;
};

function buildFssOverviewParagraph(
  outline: Record<string, unknown>,
  subsidiaries: FssConsSubsidiaryBrief[],
  opts?: GetFssOverviewOpts
): string {
  const corpNmRaw = String(outline.corpNm ?? '').trim() || '해당 기업';
  const corpDisp = stripCorpDisplayName(corpNmRaw);
  const parentBase = normalizeCorpBaseName(corpDisp);
  const yy = estbYearFrom(outline.enpEstbDt);
  const sicFromApi = sanitizeOverviewText(
    stripLatinLetters(String(outline.sicNm ?? ''))
  )
    .replace(/\s+/g, ' ')
    .trim();
  const sicFromLs = sanitizeOverviewText(
    stripLatinLetters(opts?.industryFromLs ?? '')
  )
    .replace(/\s+/g, ' ')
    .trim();
  const sic = sicFromApi || sicFromLs;

  const parts: string[] = [];

  if (yy && sic) {
    parts.push(`${corpDisp}는 ${yy}년 설립된 기업으로 ${sic} 사업을 영위하고 있다.`);
  } else if (yy) {
    parts.push(`${corpDisp}는 ${yy}년 설립된 기업이다.`);
  } else if (sic) {
    parts.push(`${corpDisp}는 ${sic} 영위하는 기업이다.`);
  } else {
    parts.push(`${corpDisp}에 대한 공공 개요 정보이다.`);
  }

  const sortedSubs = [...subsidiaries].sort((a, b) => {
    const d = subsidiaryRelevance(parentBase, b) - subsidiaryRelevance(parentBase, a);
    if (d !== 0) return d;
    return stripCorpDisplayName(a.name).localeCompare(
      stripCorpDisplayName(b.name),
      'ko'
    );
  });
  const namesFive = sortedSubs
    .map((s) => displaySubsidiaryNameKo(s))
    .filter((n) => hasHangul(n))
    .slice(0, SUBSIDIARY_LIST_MAX);
  const namesFiveAny = sortedSubs
    .map((s) => displaySubsidiaryNameAny(s))
    .filter(Boolean)
    .slice(0, SUBSIDIARY_LIST_MAX);
  const namesForLine = namesFive.length > 0 ? namesFive : namesFiveAny;
  if (namesForLine.length > 0) {
    parts.push(`주요 종속 기업은 ${namesForLine.join(', ')} 등이 있다.`);
  }

  const subsLine = collectMainBizFromSubs(sortedSubs);
  const subsLineAny = collectMainBizFromSubsAny(sortedSubs);
  let outlineSrc = pickMainBizFromOutline(outline);
  if (!outlineSrc && opts?.mainBizFromLs?.trim()) outlineSrc = opts.mainBizFromLs.trim();
  const outlineLine = sanitizeOverviewText(stripLatinLetters(outlineSrc))
    .replace(/\s+/g, ' ')
    .trim();
  const outlineLineAny = sanitizeOverviewText(outlineSrc)
    .replace(/\s+/g, ' ')
    .trim();

  let mainBizLine = '';
  if (subsLine) mainBizLine = subsLine;
  else if (hasHangul(outlineLine)) mainBizLine = outlineLine;
  else if (subsLineAny) mainBizLine = subsLineAny;
  else if (outlineLineAny) mainBizLine = outlineLineAny;

  if (mainBizLine) {
    parts.push(`주요 사업은 ${mainBizLine} 등이 있다.`);
  }

  return parts.join(' ');
}

async function loadFssOutlineAndSubs(corpNm: string): Promise<FssLoadedData | null> {
  const outline = await fetchCorpOutlineByName(corpNm);
  if (!outline) return null;
  const crno = String(outline.crno ?? '').trim();
  const subsidiaries = crno ? await fetchConsSubsidiariesBrief(crno) : [];
  return { outline, subsidiaries };
}

export function getFssCompanyOverviewCached(
  corpNm: string,
  opts?: GetFssOverviewOpts
): Promise<string | null> {
  const key = corpNm.trim();
  if (!key) return Promise.resolve(null);
  if (!serviceKey()) {
    if (import.meta.env.DEV && !warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        '[FSS] VITE_DATA_GO_SERVICE_KEY 가 비어 있어 공공데이터(기업개요) 호출을 건너뜁니다.'
      );
    }
    return Promise.resolve(null);
  }
  const cacheKey = fssCacheKey(key);
  let dataP = fssDataCache.get(cacheKey);
  if (!dataP) {
    dataP = loadFssOutlineAndSubs(key);
    fssDataCache.set(cacheKey, dataP);
  }
  return dataP.then((d) => {
    if (!d) return null;
    const text = buildFssOverviewParagraph(d.outline, d.subsidiaries, opts);
    return text.trim() || null;
  });
}

export function prefetchFssCompanyOverview(corpNm: string): void {
  const key = corpNm.trim();
  if (!key || !serviceKey()) return;
  const cacheKey = fssCacheKey(key);
  if (!fssDataCache.has(cacheKey)) {
    fssDataCache.set(cacheKey, loadFssOutlineAndSubs(key));
  }
}
