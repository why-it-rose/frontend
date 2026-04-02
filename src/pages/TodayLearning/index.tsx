import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { invalidateAuthTransitionQueries } from '@/features/auth/query/authQuerySync';
import { getCachedStockIdByTicker, fetchStockSearch } from '@/features/stock/api';
import LoginModal from '@/features/auth/components/LoginModal';
import TodayLearningSidebar from '@/features/news/components/TodayLearningSidebar';

export default function TodayLearningPage() {
  const { stockCode } = useParams<{ stockCode: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoggedIn, refreshAuth } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [stockId, setStockId] = useState<number | undefined>(
    stockCode ? getCachedStockIdByTicker(stockCode) : undefined,
  );

  useEffect(() => {
    if (!stockCode) return;
    if (stockId != null) return;
    let cancelled = false;
    fetchStockSearch(stockCode, 20)
      .then((items) => {
        if (cancelled) return;
        const exact = items.find((i) => i.ticker === stockCode) ?? items[0];
        setStockId(exact?.stockId);
      })
      .catch(() => {
        if (!cancelled) setStockId(undefined);
      });
    return () => { cancelled = true; };
  }, [stockCode, stockId]);

  return (
    <>
      <TodayLearningSidebar
        stockId={stockId}
        isOpen
        isLoggedIn={isLoggedIn}
        onLoginRequired={() => setLoginModalOpen(true)}
      />
      {loginModalOpen && (
        <LoginModal
          onClose={() => setLoginModalOpen(false)}
          onSignup={() => {
            setLoginModalOpen(false);
            navigate('/signup');
          }}
          onLoginSuccess={async () => {
            await refreshAuth();
            await invalidateAuthTransitionQueries(queryClient);
            setLoginModalOpen(false);
          }}
        />
      )}
    </>
  );
}
