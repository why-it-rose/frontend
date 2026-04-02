export const sharedEventPanelTab: { value: 'overview' | 'event' | 'memo' } = {
  value: 'event',
};

export const pendingMobileNav: { path: string | null } = { path: null };

const RESPONSIVE_ROUTE_REQUEST_EVENT = 'responsive-route-request';

export function requestResponsiveRouteNavigation(path: string) {
  pendingMobileNav.path = path;
  window.dispatchEvent(new CustomEvent(RESPONSIVE_ROUTE_REQUEST_EVENT));
}

export function consumePendingResponsiveRouteNavigation() {
  const nextPath = pendingMobileNav.path;
  pendingMobileNav.path = null;
  return nextPath;
}

export function addResponsiveRouteNavigationListener(listener: () => void) {
  window.addEventListener(RESPONSIVE_ROUTE_REQUEST_EVENT, listener);
  return () =>
    window.removeEventListener(RESPONSIVE_ROUTE_REQUEST_EVENT, listener);
}
