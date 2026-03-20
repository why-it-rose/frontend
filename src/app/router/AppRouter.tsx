import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import SplitRoute from '@/shared/components/layout/SplitRoute';

import NewsPage from '@/pages/News';
import MyPage from '@/pages/MyPage';
import AlertCenterPage from '@/pages/AlertCenter';
import StockDetailPage from '@/pages/StockDetail';
import ArchivePage from '@/pages/MyPage/ArchivePage';
import HomePage from '@/pages/Home';
import NotFoundPage from '@/pages/NotFound';
import MobileLayout from '@/shared/components/layout/MobileLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/news/mypage" replace />,
  },

  {
    path: '/news/mypage',
    element: (
      <SplitRoute
        left={<NewsPage />}
        right={<MyPage />}
        mobile={<MyPage />}
      />
    ),
  },
  {
    path: '/news/alerts',
    element: (
      <SplitRoute
        left={<NewsPage />}
        right={<AlertCenterPage />}
        mobile={<AlertCenterPage />}
      />
    ),
  },
  {
    path: '/stock/archive',
    element: (
      <SplitRoute
        left={<StockDetailPage />}
        right={<ArchivePage />}
        mobile={<ArchivePage />}
      />
    ),
  },

  {
    path: '/home',
    element: <MobileLayout content={<HomePage />} />,
  },
  {
    path: '/stock',
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