import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import SplitRoute from '@/shared/components/layout/SplitRoute';

import NewsPage from '@/pages/News';
import StockDetailPage from '@/pages/StockDetail';
import HomePage from '@/pages/Home';
import NotFoundPage from '@/pages/NotFound';
import MobileLayout from '@/shared/components/layout/MobileLayout';
import { StockDetailMain } from '@/pages/Chart/components/StockDetailMain';
import InterestStockAside from '@/pages/InterestStock/components/InterestStockAside';
import StockDetailAside from '@/pages/StockDetail/components/StockDetailaside';
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home/interest-stock" replace />,
  },

  // ── Split (웹) ──────────────────────────────────────────────────────────────
  {
    path: '/chart/stock-detail',
    element: <Navigate to="/chart/005930/stock-detail" replace />,
  },
  {
    path: '/chart/:stockCode/stock-detail',
    element: (
      <SplitRoute
        left={<StockDetailMain />}
        right={<StockDetailAside />}
        mobile={<StockDetailMain />}
      />
    ),
  },
  {
    path: '/chart/event',
    element: (
      <SplitRoute
        left={<StockDetailMain />}
        right={<StockDetailPage />}
        mobile={<StockDetailMain />}
      />
    ),
  },
  {
    path: '/chart/news',
    element: (
      <SplitRoute
        left={<StockDetailMain />}
        right={<NewsPage />}
        mobile={<NewsPage />}
      />
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/home/interest-stock',
    element: (
      <SplitRoute
        left={<HomePage />}
        right={<InterestStockAside />}
        mobile={<HomePage />}
      />
    ),
  },

  // ── Mobile ──────────────────────────────────────────────────────────────────
  {
    path: '/home',
    element: <Navigate to="/home/interest-stock" replace />,
  },
  {
    path: '/chart',
    element: <MobileLayout content={<StockDetailMain />} />,
  },
  {
    path: '/stock-detail',
    element: <MobileLayout content={<StockDetailAside />} />,
  },
  {
    path: '/event',
    element: <MobileLayout content={<StockDetailPage />} />,
  },
  {
    path: '/interest-stock',
    element: <MobileLayout content={<InterestStockAside />} />,
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}