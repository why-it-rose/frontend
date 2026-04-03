export type ScrapSyncDetail = {
  eventId: number;
  isScrapped: boolean;
  delta: 1 | -1;
};

const SCRAP_SYNC_EVENT = 'why-it-rose:scrap-sync';

export function emitScrapSync(detail: ScrapSyncDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ScrapSyncDetail>(SCRAP_SYNC_EVENT, { detail }));
}

export function subscribeScrapSync(listener: (detail: ScrapSyncDetail) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handle = (event: Event) => {
    const customEvent = event as CustomEvent<ScrapSyncDetail>;
    if (!customEvent.detail) return;
    listener(customEvent.detail);
  };

  window.addEventListener(SCRAP_SYNC_EVENT, handle);
  return () => window.removeEventListener(SCRAP_SYNC_EVENT, handle);
}
