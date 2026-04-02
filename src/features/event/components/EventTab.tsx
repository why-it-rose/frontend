import type { StockEvent } from "../types/event.types";

const RELATED_NEWS_LIMIT = 10;

interface EventTabProps {
  event: StockEvent;
  scrapping?: boolean;
  onScrap?: (eventId: number, isScrapped: boolean) => Promise<void> | void;
  scrapErrorMessage?: string | null;
}

export default function EventTab({
  event,
  scrapping = false,
  onScrap,
  scrapErrorMessage,
}: EventTabProps) {
  const {
    eventId,
    stockName,
    eventType,
    occurredAt,
    changeRate,
    priceBefore,
    priceAfter,
    aiSummary,
    relatedNews,
    isScrapped,
  } = event;

  const isSurge = eventType === "SURGE";
  const sign = isSurge ? "+" : "-";
  const rateColor = isSurge ? "#e03131" : "#1971c2";
  const scrapButtonLabel = scrapping
    ? "처리 중..."
    : isScrapped
      ? "스크랩 취소"
      : "스크랩";

  const date = new Date(occurredAt);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const dateLabel = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} (${weekdays[date.getDay()]})`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-4"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* 이벤트 헤더 카드 */}
        <div
          className="mt-5 mb-2.5 rounded-[14px] p-4"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-[#9ca3af]">{dateLabel}</span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-[4px]"
              style={
                isSurge
                  ? { color: "#e03131", background: "#FFF0F0" }
                  : { color: "#1971c2", background: "#EFF6FF" }
              }
            >
              {isSurge ? "급등" : "급락"}
            </span>
          </div>
          <div className="mb-1">
            <span className="font-bold text-[20px] md:text-[22px] text-text-primary">
              {stockName}{" "}
            </span>
            <span
              className="font-bold text-[20px] md:text-[22px]"
              style={{ color: rateColor }}
            >
              {sign}
              {changeRate}%
            </span>
          </div>
          <p className="text-[13px] text-[#9ca3af]">
            {priceBefore.toLocaleString()}원 → {priceAfter.toLocaleString()}원
          </p>
        </div>

        {/* AI 요약 */}
        <div
          className="rounded-[10px] p-3.5 mb-4"
          style={{ background: "#fff", border: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-600">
              AI 요약 · 참고 정보
            </span>
          </div>
          <p className="text-[13px] text-[#374151] leading-[1.7] mb-2.5">
            {aiSummary}
          </p>
          <div className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[11px] text-[#9ca3af]">
              실제 원인 단정이 아닌 참고 정보입니다
            </span>
          </div>
        </div>

        {/* 관련 뉴스 */}
        <div className="mt-2.5">
          <p className="font-semibold text-sm text-[#374151] mb-2.5">
            관련 뉴스
          </p>
          <div className="space-y-2.5">
            {relatedNews.slice(0, RELATED_NEWS_LIMIT).map((news) => (
              <div
                key={news.newsId}
                onClick={() =>
                  window.innerWidth > 768
                    ? window.open(news.url, "_blank", "width=800,height=600,noopener,noreferrer")
                    : window.open(news.url, "_blank")
                }
                className="block bg-white rounded-[10px] p-[12px_14px] active:bg-bg-subtle md:hover:bg-bg-subtle transition-colors cursor-pointer"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <p className="font-bold text-sm text-text-primary leading-[1.4] mb-1.5">
                  {news.title}
                </p>
                <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-2">
                  {news.body}
                </p>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[11px] text-[#9ca3af]">
                    {news.source} ·{" "}
                    {new Date(news.publishedAt)
                      .toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                      .replace(/\. /g, ".")
                      .slice(0, -1)}
                  </span>
                  {news.tags.length > 0 && (
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {news.tags.map((tag) => (
                        <span
                          key={`${news.newsId}-${tag}`}
                          className="text-[11px] text-[#4b5563] bg-[#f3f4f6] px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="h-4" />
        </div>
      </div>

      {/* 스크랩 버튼 고정 하단 */}
      <div className="shrink-0 px-4 pt-3 pb-5 md:pb-6 border-t border-border bg-white">
        <button
          onClick={() => onScrap?.(eventId, isScrapped)}
          disabled={scrapping}
          className="w-full py-3 md:py-3.25 rounded-[10px] text-[15px] font-bold transition-colors active:opacity-80 disabled:opacity-70"
          style={{
            background: isScrapped ? "#e7f0ff" : "#014d9d",
            color: isScrapped ? "#013d7d" : "#ffffff",
            border: isScrapped ? "1px solid #bfd6ff" : "1px solid #014d9d",
          }}
        >
          {scrapButtonLabel}
        </button>
        {scrapErrorMessage && (
            <p className="mt-2 text-center text-[12px] text-[#dc2626]">{scrapErrorMessage}</p>
        )}
      </div>
    </div>
  );
}
