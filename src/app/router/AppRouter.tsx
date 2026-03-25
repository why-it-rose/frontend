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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },

  // ── Split (웹) ──────────────────────────────────────────────────────────────
  {
    path: '/chart/stock-detail',
    element: (
      <SplitRoute
        left={<StockDetailMain />}
        right={<StockDetailAside />}
        mobile={<StockDetailAside />}
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
    path: '/home/interest-stock',
    element: (
      <SplitRoute
        left={<HomePage />}
        right={<InterestStockAside />}
        mobile={<InterestStockAside />}
      />
    ),
  },

  // ── Mobile ──────────────────────────────────────────────────────────────────
  {
    path: '/home',
    element: <MobileLayout content={<HomePage />} />,
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