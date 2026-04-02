import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import LoginModal from '@/features/auth/components/LoginModal';
import { useAuth } from '@/features/auth/context/AuthContext';
import { invalidateAuthTransitionQueries } from '@/features/auth/query/authQuerySync';
import type { StockMarket, StockPeriod, StockSort } from '@/features/stock/types';
import HomeLayout from './components/HomeLayout';

const DEFAULT_MARKET: StockMarket = 'ALL';
const DEFAULT_SORT: StockSort = 'MARKET_CAP';
const DEFAULT_PERIOD: StockPeriod = '1D';

export default function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
            await invalidateAuthTransitionQueries(queryClient);
            setLoginOpen(false);
          }}
        />
      )}
    </>
  );
}
