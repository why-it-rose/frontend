import type { OhlcSummaryBarProps } from "../types";

const FIELDS = [
  { key: "open"   as const, label: "시가",   color: "text-gray-700"    },
  { key: "high"   as const, label: "고가",   color: "text-[#e03131]"   },
  { key: "low"    as const, label: "저가",   color: "text-[#1971c2]"   },
  { key: "close"  as const, label: "종가",   color: "text-gray-700"    },
  { key: "volume" as const, label: "거래량", color: "text-gray-700"    },
] as const;

export function OhlcSummaryBar({ summary }: OhlcSummaryBarProps) {
  return (
    <div className="grid w-full grid-cols-5 gap-2 md:flex md:w-auto md:flex-wrap md:items-center md:gap-4">
      {FIELDS.map(({ key, label, color }) => (
        <div key={key} className="flex flex-col items-center">
          <span className="text-[10px] leading-none text-[#9ca3af] md:text-[9px] md:font-bold md:uppercase md:tracking-wider md:text-gray-400">
            {label}
          </span>
          <span className={`mt-1 text-[13px] font-semibold leading-none ${color} md:mt-0 md:text-[11px]`}>
            {summary[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
