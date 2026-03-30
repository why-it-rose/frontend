import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROUTES } from '@/shared/constants/routes';
import MyPagePanel from '@/pages/MyPage/components/MyPagePanel';
import Header from './Header';
import BottomTabBar from './BottomTabBar';

/** 홈 등 내부에서 높이·스크롤을 쓰려면 main은 스크롤 금지 + min-h-0 (padding 없음) */
export default function MobileLayout({
  content,
}: {
  content: ReactNode;
}) {
  const navigate = useNavigate();
  const { isLoggedIn, clearAuth } = useAuth();
  const [myPageOpen, setMyPageOpen] = useState(false);

  const openMyPage = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setMyPageOpen(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header onMyPageOpen={openMyPage} disableMyPagePanel />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{content}</main>
      <BottomTabBar onMyPageOpen={openMyPage} myPageActive={myPageOpen} />
      {isLoggedIn && myPageOpen && (
        <MyPagePanel
          onClose={() => setMyPageOpen(false)}
          onLogout={() => {
            clearAuth();
            setMyPageOpen(false);
            navigate(ROUTES.HOME);
          }}
        />
      )}
    </div>
  );
}
