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
    <div className="flex items-center gap-4 flex-wrap">
      {FIELDS.map(({ key, label, color }) => (
        <div key={key} className="flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">
            {label}
          </span>
          <span className={`font-semibold text-[11px] ${color}`}>
            {summary[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
