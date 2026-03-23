/** 한 줄에 반복할 코스피·코스닥 쌍 개수 (넓은 화면에서도 칸이 차도록) */
const PAIR_REPEAT = 12;

function IndexPair() {
  return (
    <div className="flex shrink-0 items-center gap-8 text-xs text-[#4b5563]">
      <span className="whitespace-nowrap">
        코스피 <strong className="text-[#111827]">2,690.12</strong>{' '}
        <span className="text-red-500">+1.24%</span>
      </span>
      <span className="whitespace-nowrap">
        코스닥 <strong className="text-[#111827]">842.31</strong>{' '}
        <span className="text-blue-500">-0.48%</span>
      </span>
    </div>
  );
}

function TickerSegment({ segmentKey }: { segmentKey: 'a' | 'b' }) {
  return (
    <div className="flex shrink-0 items-center gap-8 px-6 py-2">
      {Array.from({ length: PAIR_REPEAT }, (_, i) => (
        <IndexPair key={`${segmentKey}-${i}`} />
      ))}
    </div>
  );
}

export default function MarketIndexBar() {
  return (
    <section
      className="hidden min-w-0 w-full shrink-0 overflow-hidden border-t border-[#d8e2f8] bg-white lg:block"
      aria-label="시장 지수"
    >
      <div className="market-index-marquee">
        <TickerSegment segmentKey="a" />
        <TickerSegment segmentKey="b" />
      </div>
    </section>
  );
}
