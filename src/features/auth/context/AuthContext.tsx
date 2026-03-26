import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  nickname: string;
  login: (nickname: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  nickname: '',
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');

  const login = (nextNickname: string) => {
    setNickname(nextNickname.trim());
    setIsLoggedIn(true);
  };

  const logout = () => {
    setNickname('');
    setIsLoggedIn(false);
  };

  return (
      <AuthContext.Provider value={{ isLoggedIn, nickname, login, logout }}>
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
