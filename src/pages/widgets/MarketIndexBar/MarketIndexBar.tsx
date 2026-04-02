import {
  formatChange,
  formatPct,
  formatPrice,
  isUpQuote,
  useMarketTickerQuotes,
  type TickerRow,
} from './useMarketTickerQuotes';

/** 한 줄에 반복할 스트립 개수 (마퀴 루프용) */
const STRIP_REPEAT = 8;

function TickerStrip({ stripKey, rows }: { stripKey: string; rows: TickerRow[] }) {
  return (
    <div className="flex shrink-0 items-center gap-6 px-5 py-2 text-[11px] text-[#4b5563] md:gap-8 md:text-xs">
      {rows.map((item) => {
        const titleName = item.label;
        const pending = !item.loaded && !item.error;
        const priceStr = pending ? '…' : item.currentPrice != null ? formatPrice(item.currentPrice) : '—';
        const changeStr =
          pending
            ? '…'
            : item.priceChange != null
              ? formatChange(item.priceChange, item.changeRate, item.changeDirection)
              : '—';
        const pctStr =
          pending ? '…' : item.changeRate != null ? `(${formatPct(item.changeRate)})` : '(—)';
        const up = isUpQuote(item.changeRate, item.changeDirection);

        return (
          <a
            key={`${stripKey}-${item.id}`}
            href={item.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative z-0 inline-flex items-center whitespace-nowrap px-2 py-0 text-[#4b5563] no-underline transition-colors before:pointer-events-none before:absolute before:inset-x-[-6px] before:inset-y-[-5px] before:-z-10 before:rounded-md before:bg-slate-200/85 before:opacity-0 before:transition-opacity before:content-[''] hover:before:opacity-100"
            title={`${titleName} · ${item.shcode}`}
          >
            <span className="relative z-10">
              <span className="transition-colors group-hover:text-[#111827]">{item.label}</span>{' '}
              <strong className="font-semibold text-[#111827] transition-colors group-hover:text-[#0f172a]">
                {priceStr}
              </strong>{' '}
              <span
                className={
                  up
                    ? 'ml-1 text-red-500 transition-colors group-hover:text-red-600'
                    : 'ml-1 text-blue-500 transition-colors group-hover:text-blue-600'
                }
              >
                {changeStr} {pctStr}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export default function MarketIndexBar() {
  const { rows } = useMarketTickerQuotes();

  return (
    <section
      className="hidden min-w-0 w-full shrink-0 overflow-hidden border-t border-[#d8e2f8] bg-white md:block"
      aria-label="시장 지수 및 시세"
    >
      <div className="market-index-marquee">
        {Array.from({ length: STRIP_REPEAT }, (_, i) => (
          <TickerStrip key={`a-${i}`} stripKey={`a-${i}`} rows={rows} />
        ))}
        {Array.from({ length: STRIP_REPEAT }, (_, i) => (
          <TickerStrip key={`b-${i}`} stripKey={`b-${i}`} rows={rows} />
        ))}
      </div>
    </section>
  );
}
