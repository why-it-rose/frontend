import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import QueryProvider from './QueryProvider';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
