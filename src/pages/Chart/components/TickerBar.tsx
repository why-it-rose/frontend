import type { TickerBarProps } from  "../types";

export function TickerBar({ items }: TickerBarProps) {
  // 3배 복제해서 끊김 없는 무한 스크롤 구현
  const repeated = [...items, ...items, ...items];

  return (
    <div className="border-t border-gray-200 h-7 flex items-center overflow-hidden bg-white shrink-0">
      <div className="flex animate-stock-ticker whitespace-nowrap">
        {repeated.map((item, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-1.5 px-4 text-xs border-r border-gray-100 shrink-0"
          >
            <span className="text-gray-500">{item.label}</span>
            <span className="font-semibold text-gray-700">{item.value}</span>
            <span
              className={`font-medium ${
                item.positive ? "text-[#e03131]" : "text-[#1971c2]"
              }`}
            >
              {item.change}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes stock-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-stock-ticker {
          animation: stock-ticker 22s linear infinite;
        }
      `}</style>
    </div>
  );
}
