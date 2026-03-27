import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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

    } catch {
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

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