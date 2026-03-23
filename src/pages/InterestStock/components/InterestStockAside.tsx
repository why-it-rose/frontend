import arrowIco from '@/assets/arrow.svg';
import favoriteClickIco from '@/assets/favorite_click.svg';
import lockIco from '@/assets/lock.svg';

export default function InterestStockAside() {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* 헤더 */}
      <div className="flex h-[53px] shrink-0 items-center justify-between border-b border-[#eff1f8] px-4">
        <div className="flex items-center gap-2">
          <img src={favoriteClickIco} alt="" className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-sm font-bold text-[#4e5968]">관심 종목</p>
        </div>
        <button type="button" className="text-xs font-bold text-[#014d9d]">
          <span className="inline-flex items-center gap-1.5">
            관리
            <img src={arrowIco} alt="" className="ml-0.5 h-3 w-2" />
          </span>
        </button>
      </div>

      {/* 바디 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <img src={lockIco} alt="" className="h-8 w-8 shrink-0" aria-hidden />
        <p className="text-sm leading-6 text-[#9ca3af]">
          <span className="font-semibold text-[#9ca3af]">로그인</span> 후 관심 종목을
          <br />
          추가하고 실시간으로
          <br />
          모니터링하세요.
        </p>
      </div>
    </aside>
  );
}