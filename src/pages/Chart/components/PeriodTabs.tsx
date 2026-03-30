import type { PeriodTabsProps } from "../types";
import { PERIOD_TABS } from "../constants/periodTab";

export function PeriodTabs({ active, onChange }: PeriodTabsProps) {
  return (
    <div className="flex w-full items-center gap-0 rounded-[9px] bg-[#f3f4f6] p-[3px] md:w-auto">
      {PERIOD_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 rounded-[7px] px-3 py-1 text-center text-xs font-medium whitespace-nowrap transition-all duration-150 md:flex-none
            ${
              active === tab
                ? "bg-white text-[#014d9d] font-bold shadow-sm"
                : "text-[#9ca3af] hover:bg-white/60"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
