import type { PeriodTabsProps } from "../types";
import { PERIOD_TABS } from "../constants/periodTab";

export function PeriodTabs({ active, onChange }: PeriodTabsProps) {
  return (
    <div className="flex items-center bg-[#f3f4f6] rounded-[9px] p-[3px] gap-0">
      {PERIOD_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1 rounded-[7px] text-xs font-medium transition-all duration-150 whitespace-nowrap
            ${
              active === tab
                ? "bg-white text-[#4e5968] font-bold shadow-sm"
                : "text-[#014d9d] hover:bg-white/60"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}