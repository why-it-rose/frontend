import type { ReactNode } from 'react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROUTES } from '@/shared/constants/routes';
import MyPagePanel from '@/pages/MyPage/components/MyPagePanel';
import Header from './Header';
import BottomTabBar from './BottomTabBar';
import { deleteMyAccount, getApiResponseCode, logoutFromServer } from '@/features/auth/api/authApi';
import { clearAuthTransitionQueries } from '@/features/auth/query/authQuerySync';


/** 홈 등 내부에서 높이·스크롤을 쓰려면 main은 스크롤 금지 + min-h-0 (padding 없음) */
export default function MobileLayout({
  content,
}: {
  content: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoggedIn, clearAuth } = useAuth();
  const [myPageOpen, setMyPageOpen] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [withdrawMessageType, setWithdrawMessageType] = useState<'success' | 'error' | ''>('');


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
              onClose={() => {
                setMyPageOpen(false);
                setWithdrawMessage('');
                setWithdrawMessageType('');
              }}
              onLogout={async () => {
                try {
                  await logoutFromServer();
                } finally {
                  clearAuth();
                  await clearAuthTransitionQueries(queryClient);
                  setMyPageOpen(false);
                  navigate(ROUTES.HOME);
                }
              }}
              onWithdraw={async () => {
                try {
                  await deleteMyAccount();
                  clearAuth();
                  await clearAuthTransitionQueries(queryClient);
                  setMyPageOpen(false);
                  navigate('/login');
                } catch (error: unknown) {
                  const code = getApiResponseCode(error);

                  if (code === 2952) {
                    setWithdrawMessage('로그인이 필요합니다.');
                    setWithdrawMessageType('error');
                    clearAuth();
                    await clearAuthTransitionQueries(queryClient);
                    setMyPageOpen(false);
                    navigate('/login');
                    return;
                  }

                  if (code === 4013) {
                    setWithdrawMessage('이미 탈퇴한 계정입니다.');
                    setWithdrawMessageType('error');
                    return;
                  }

                  setWithdrawMessage('회원 탈퇴 중 오류가 발생했습니다.');
                  setWithdrawMessageType('error');
                }
              }}
              withdrawMessage={withdrawMessage}
              withdrawMessageType={withdrawMessageType}
          />

      )}
    </div>
  );
}
