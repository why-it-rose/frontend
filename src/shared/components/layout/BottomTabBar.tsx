import { useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import homeIco from '@/assets/Home.svg';
import favoriteIco from '@/assets/favorite.svg';
import newsIco from '@/assets/today-news.svg';
import mypageIco from '@/assets/mypage.svg';

const TABS = [
  { label: '홈',        icon: homeIco,     path: ROUTES.HOME },
  { label: '관심 종목', icon: favoriteIco, path: ROUTES.INTEREST_STOCK },
  { label: '오늘의 뉴스', icon: newsIco,   path: ROUTES.NEWS },
  { label: '마이페이지', icon: mypageIco,  path: ROUTES.MY },
] as const;

const MY_PATHS = [ROUTES.MY, ROUTES.MY_ARCHIVE, ROUTES.MY_PREDICTION];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const getActivePath = () => {
    if (MY_PATHS.some(p => pathname.startsWith(p))) return ROUTES.MY;
    return pathname;
  };

  const activePath = getActivePath();

  return (
    <nav className="bottom-tab-bar grid md:hidden shrink-0 bg-white border-t border-[#f0f2f8]">
      {TABS.map(({ label, icon, path }) => {
        const isActive = activePath === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center justify-start pt-2.5"
          >
            <img
              src={icon}
              alt={label}
              className="w-8 h-8 block"
              style={{ opacity: isActive ? 1 : 0.4 }}
            />
            <span
              className="text-[10px] font-medium mt-1"
              style={{ color: isActive ? '#014D9D' : '#9ca3af' }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
