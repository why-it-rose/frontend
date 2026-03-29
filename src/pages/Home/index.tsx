import { useState } from 'react';
import type { StockMarket, StockPeriod, StockSort } from '@/features/stock/types';
import HomeLayout from './components/HomeLayout';

const DEFAULT_MARKET: StockMarket = 'ALL';
const DEFAULT_SORT: StockSort = 'TRADING_AMOUNT';
const DEFAULT_PERIOD: StockPeriod = '1D';

export default function HomePage() {
  const [market, setMarket] = useState<StockMarket>(DEFAULT_MARKET);
  const [sort, setSort] = useState<StockSort>(DEFAULT_SORT);
  const [period, setPeriod] = useState<StockPeriod>(DEFAULT_PERIOD);

  return (
    <HomeLayout
      market={market}
      sort={sort}
      period={period}
      onChangeMarket={setMarket}
      onChangeSort={setSort}
      onChangePeriod={setPeriod}
    />
  );
}
