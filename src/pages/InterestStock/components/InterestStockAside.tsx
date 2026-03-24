import arrowIco from '@/assets/arrow.svg';
import favoriteClickIco from '@/assets/favorite_click.svg';
import lockIco from '@/assets/lock.svg';
import { useAuth } from '@/features/auth/context/AuthContext';

type WatchRow = {
  name: string;
  code: string;
  initials: string;
  logoBg: string;
  price: string;
  changeLabel: string;
  up: boolean;
};

const MOCK_WATCHLIST: WatchRow[] = [
  {
    name: '삼성전자',
    code: '005930',
    initials: '삼',
    logoBg: '#1428a0',
    price: '184,000',
    changeLabel: '▼ -2.08%',
    up: false,
  },
  {
    name: 'SK하이닉스',
    code: '000660',
    initials: 'SK',
    logoBg: '#EA1917',
    price: '915,000',
    changeLabel: '▲ +3.21%',
    up: true,
  },
  {
    name: 'LG에너지솔루션',
    code: '373220',
    initials: 'LG',
    logoBg: '#a50034',
    price: '305,500',
    changeLabel: '▲ +5.14%',
    up: true,
  },
  {
    name: 'NAVER',
    code: '035420',
    initials: 'N',
    logoBg: '#03c75a',
    price: '198,500',
    changeLabel: '▲ +1.85%',
    up: true,
  },
  {
    name: '알테오젠',
    code: '196170',
    initials: '알',
    logoBg: '#059669',
    price: '361,000',
    changeLabel: '▼ -3.08%',
    up: false,
  },
];

export default function InterestStockAside() {
  const { isLoggedIn } = useAuth();

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* 헤더 — 기존과 동일 */}
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

      {isLoggedIn ? (
        <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col overflow-y-auto">
          {MOCK_WATCHLIST.map((row) => {
            const priceColor = row.up ? 'text-red-600' : 'text-blue-700';
            return (
              <button
                key={row.code}
                type="button"
                className="flex h-auto w-full shrink-0 cursor-pointer items-center justify-between border-b border-[#eff1f8] px-4 py-3 text-left transition-colors hover:bg-[#f9fafb]"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
                    style={{ backgroundColor: row.logoBg }}
                  >
                    {row.initials}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold leading-[18.75px] text-[#111827]">{row.name}</div>
                    <div className="font-mono text-[10px] leading-[15px] text-[#9ca3af]">{row.code}</div>
                  </div>
                </div>
                <div className={`text-right text-[10.5px] font-semibold leading-[15.75px] ${priceColor}`}>
                  <div>{row.price}</div>
                  <div>{row.changeLabel}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
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
      )}
    </aside>
  );
}
