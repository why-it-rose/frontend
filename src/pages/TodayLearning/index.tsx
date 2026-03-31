import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import { fetchStockSearch } from '@/features/stock/api';
import LoginModal from '@/features/auth/components/LoginModal';
import TodayLearningSidebar from '@/features/news/components/TodayLearningSidebar';

export default function TodayLearningPage() {
  const { stockCode } = useParams<{ stockCode: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, refreshAuth } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [stockId, setStockId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!stockCode) return;
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
  }, [stockCode]);

  const handleClose = () => {
    navigate(`/chart/${stockCode ?? ''}/stock-detail`);
  };

  return (
    <>
      <TodayLearningSidebar
        stockId={stockId}
        isOpen
        onClose={handleClose}
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
            setLoginModalOpen(false);
          }}
        />
      )}
    </>
  );
}
