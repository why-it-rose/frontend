import { useState } from 'react';
import HomeLayout from '@/pages/Home/components/HomeLayout';
import type { StockMarket, StockPeriod, StockSort } from '@/features/stock/types';

export default function HomePageWrapper() {
  const [market, setMarket] = useState<StockMarket>('ALL');
  const [sort, setSort]     = useState<StockSort>('TRADING_AMOUNT');
  const [period, setPeriod] = useState<StockPeriod>('DAILY');

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