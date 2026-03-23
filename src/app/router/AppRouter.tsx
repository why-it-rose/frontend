import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import SplitRoute from '@/shared/components/layout/SplitRoute';

import NewsPage from '@/pages/News';
import StockDetailPage from '@/pages/StockDetail';
import HomePage from '@/pages/Home';
import NotFoundPage from '@/pages/NotFound';
import MobileLayout from '@/shared/components/layout/MobileLayout';
import InterestStockPage from '@/pages/InterestStock';
import Chart from '@/pages/Chart';
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },

  {
    path: '/chart/interest-stock',
    element: (
      <SplitRoute
        left={<Chart />}
        right={<InterestStockPage />}
        mobile={<InterestStockPage />}
      />
    ),
  },
  {
    path: '/chart/news',
    element: (
      <SplitRoute
        left={<Chart />}
        right={<NewsPage />}
        mobile={<NewsPage />}
      />
    ),
  },
  {
    path: '/chart/stock-detail',
    element: (
      <SplitRoute
        left={<Chart />}
        right={<StockDetailPage />}
        mobile={<StockDetailPage />}
      />
    ),
  },

  {
    path: '/home',
    element: <MobileLayout content={<HomePage />} />,
  },
  {
    path: '/chart',
    element: <MobileLayout content={<Chart />} />,
  },
  {
    path: '/interest-stock',
    element: <MobileLayout content={<InterestStockPage />} />,
  },
  {
    path: '/stock-detail',
    element: <MobileLayout content={<StockDetailPage />} />,
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}