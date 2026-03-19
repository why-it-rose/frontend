import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROUTES } from '@/shared/constants/routes';
import logoSrc from '@/assets/logo.svg';
import searchSrc from '@/assets/search.svg';
import bellSrc from '@/assets/bell.svg';

export default function Header() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const rightActions = isLoggedIn ? (
    <button
      onClick={() => navigate(ROUTES.ALERTS)}
      className="flex items-center justify-center"
    >
      <img src={bellSrc} alt="알림" className="w-8.5 h-8.5" />
    </button>
  ) : (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => navigate('/login')}
        className="flex items-center justify-center text-sm font-medium text-[#4b5368] bg-white border border-[#d1d5db] rounded-[7px]"
        style={{ padding: '8px 16px', height: '30px', minWidth: '52px' }}
      >
        로그인
      </button>
      <button
        onClick={() => navigate('/signup')}
        className="flex items-center justify-center text-sm font-semibold text-white rounded-[7px] bg-primary"
        style={{ padding: '8px 16px', height: '30px', minWidth: '60px' }}
      >
        회원가입
      </button>
    </div>
  );

  return (
    <header className="shrink-0 bg-white border-b border-[#d8e2f8]">
      {/* 모바일 헤더 (~ md) */}
      <div className="flex md:hidden items-center justify-between h-[55px] px-4">
        <Link to={ROUTES.HOME}>
          <img src={logoSrc} alt="왜 올랐지?" style={{ height: '58px', width: 'auto', objectFit: 'contain' }} />
        </Link>
        {rightActions}
      </div>

      {/* 데스크톱 헤더 (md ~) */}
      <div className="hidden md:grid header-grid items-center h-[68px] px-4">
        <Link to={ROUTES.HOME}>
          <img src={logoSrc} alt="왜 올랐지?" style={{ height: '72px', width: 'auto', maxWidth: '320px', objectFit: 'contain' }} />
        </Link>

        <div className="flex items-center justify-center gap-2 w-full bg-[#f0f4f9] rounded-lg h-8 px-4 border border-black/5">
          <img src={searchSrc} alt="" className="w-3.5 h-3.5 shrink-0" />
          <span className="flex items-center justify-center w-5 h-5 rounded-[5px] bg-black/5 text-[#8b95a1] text-xs font-bold">
            /
          </span>
          <span className="text-[#6b7684] text-[13px]">를 눌러 검색하세요</span>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => navigate(ROUTES.ALERTS)}
                className="w-8.5 h-8.5 flex items-center justify-center"
              >
                <img src={bellSrc} alt="알림" className="w-8.5 h-8.5" />
              </button>
              <button
                onClick={() => navigate(ROUTES.MY)}
                className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-primary"
              >
                신
              </button>
            </>
          ) : (
            <>{rightActions}</>
          )}
        </div>
      </div>
    </header>
  );
}
