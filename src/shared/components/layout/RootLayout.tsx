import { Outlet } from 'react-router';
import Header from './Header';
import BottomTabBar from './BottomTabBar';

export default function RootLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
