export const RECENT_KEY = "why-it-rose-search-recent-v1";
export const MAX_RECENT = 8;
export const DEBOUNCE_MS = 280;
export const SEARCH_LIMIT = 20;

export type RecentItem = { ticker: string; name: string };

export function readRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is RecentItem =>
        Boolean(x) &&
        typeof x === "object" &&
        typeof (x as RecentItem).ticker === "string" &&
        typeof (x as RecentItem).name === "string"
    );
  } catch {
    return [];
  }
}

export function writeRecent(items: RecentItem[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
}

export function logoInitial(name: string): string {
  const t = name.trim();
  if (t.startsWith("SK")) return "SK";
  if (t.startsWith("LG")) return "LG";
  return Array.from(t)[0] ?? "?";
}

export function logoColor(ticker: string): string {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 42% 46%)`;
}
