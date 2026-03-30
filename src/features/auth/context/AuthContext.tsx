import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { requestFcmToken } from '@/features/fcm/fcmService';
import { saveFcmToken } from '@/shared/api/fcm/fcmApi';
import { getMe, type AuthUser } from '@/features/auth/api/authApi';

interface AuthState {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  user: AuthUser | null;
  nickname: string;
  refreshAuth: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  isAuthLoading: true,
  user: null,
  nickname: '',
  refreshAuth: async () => {},
  clearAuth: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshAuth = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      setIsLoggedIn(true);

      // FCM 유지
      requestFcmToken().then((token) => {
        if (token) saveFcmToken(token).catch(() => {});
      });
    } catch {
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);
// clearAuth는 로컬 상태만 초기화한다. 서버 로그아웃 API 호출은 호출부(Header/MobileLayout)에서 수행한다.
  const clearAuth = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  return (
      <AuthContext.Provider
          value={{
            isLoggedIn,
            isAuthLoading,
            user,
            nickname: user?.nickname?.trim() ?? '',
            refreshAuth,
            clearAuth,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
