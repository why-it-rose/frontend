import { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const savedNickname = localStorage.getItem('nickname');

    if (accessToken && savedNickname) {
      setNickname(savedNickname);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (nextNickname: string) => {
    const trimmed = nextNickname.trim();
    setNickname(trimmed);
    setIsLoggedIn(true);
    localStorage.setItem('nickname', trimmed);
  };

  const logout = () => {
    setNickname('');
    setIsLoggedIn(false);
    localStorage.removeItem('nickname');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
      <AuthContext.Provider value={{ isLoggedIn, nickname, login, logout }}>
        {children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
