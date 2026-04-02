import { createContext, useContext, useState, type ReactNode } from 'react';

type EventPanelTab = 'event' | 'memo';

const EventPanelTabContext = createContext<{
  tab: EventPanelTab;
  setTab: (tab: EventPanelTab) => void;
}>({ tab: 'event', setTab: () => {} });

export function EventPanelTabProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<EventPanelTab>('event');
  return (
    <EventPanelTabContext.Provider value={{ tab, setTab }}>
      {children}
    </EventPanelTabContext.Provider>
  );
}

export function useEventPanelTab() {
  return useContext(EventPanelTabContext);
}
