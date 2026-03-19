import { Outlet } from 'react-router';
import Header from './Header';
import BottomTabBar from './BottomTabBar';

export default function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <BottomTabBar />
    </>
  );
}
