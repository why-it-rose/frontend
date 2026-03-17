import { createBrowserRouter, RouterProvider, Outlet } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import HomePage from '@/pages/Home';
import StockDetailPage from '@/pages/StockDetail';
import AlertCenterPage from '@/pages/AlertCenter';
import MyPage from '@/pages/MyPage';
import ArchivePage from '@/pages/MyPage/ArchivePage';
import PredictionPage from '@/pages/MyPage/PredictionPage';
import NotFoundPage from '@/pages/NotFound';

function ProtectedRoute() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    // TODO: 로그인 유도 팝업으로 교체 예정
    console.warn('로그인이 필요한 페이지입니다. 로그인 유도 팝업은 추후 구현 예정.');
  }
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <HomePage />,
  },
  {
    path: ROUTES.STOCK_DETAIL,
    element: <StockDetailPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ROUTES.ALERTS,
        element: <AlertCenterPage />,
      },
      {
        path: ROUTES.MY,
        element: <MyPage />,
      },
      {
        path: ROUTES.MY_ARCHIVE,
        element: <ArchivePage />,
      },
      {
        path: ROUTES.MY_PREDICTION,
        element: <PredictionPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
