import { useState } from 'react';
import { useNavigate } from 'react-router';
import LoginModal from '@/features/auth/components/LoginModal';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { StockMarket, StockPeriod, StockSort } from '@/features/stock/types';
import HomeLayout from './components/HomeLayout';

const DEFAULT_MARKET: StockMarket = 'ALL';
const DEFAULT_SORT: StockSort = 'TRADING_AMOUNT';
const DEFAULT_PERIOD: StockPeriod = '1D';

export default function HomePage() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [market, setMarket] = useState<StockMarket>(DEFAULT_MARKET);
  const [sort, setSort] = useState<StockSort>(DEFAULT_SORT);
  const [period, setPeriod] = useState<StockPeriod>(DEFAULT_PERIOD);

  return (
    <>
      <HomeLayout
        market={market}
        sort={sort}
        period={period}
        onChangeMarket={setMarket}
        onChangeSort={setSort}
        onChangePeriod={setPeriod}
        onRequireLoginForFavorite={() => setLoginOpen(true)}
      />
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSignup={() => {
            setLoginOpen(false);
            navigate('/signup');
          }}
          onLoginSuccess={async () => {
            await refreshAuth();
            setLoginOpen(false);
          }}
        />
      )}
    </>
  );
}
