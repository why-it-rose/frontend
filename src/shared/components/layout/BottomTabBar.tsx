import { useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import homeIco from '@/assets/Home.svg';
import homeClickIco from '@/assets/Home_click.svg';
import favoriteIco from '@/assets/favorite.svg';
import favoriteClickIco from '@/assets/favorite_click.svg';
import newsIco from '@/assets/today-news.svg';
import newsClickIco from '@/assets/today-news-click.svg';
import mypageIco from '@/assets/mypage.svg';
import mypageClickIco from '@/assets/mypage_click.svg';

const TABS = [
  { label: '홈', icon: homeIco, iconActive: homeClickIco, path: ROUTES.HOME },
  { label: '관심 종목', icon: favoriteIco, iconActive: favoriteClickIco, path: ROUTES.INTEREST_STOCK },
  { label: '오늘의 뉴스', icon: newsIco, iconActive: newsClickIco, path: ROUTES.NEWS },
  { label: '마이페이지', icon: mypageIco, iconActive: mypageClickIco, path: ROUTES.MY },
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
    <nav className="bottom-tab-bar grid lg:hidden shrink-0 bg-white border-t border-[#f0f2f8]">
      {TABS.map(({ label, icon, iconActive, path }) => {
        const isActive = activePath === path;
        return (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="flex flex-col items-center justify-start pt-2.5"
          >
            <img
              src={isActive ? iconActive : icon}
              alt={label}
              className="block h-8 w-8"
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
