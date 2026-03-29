import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import MobileLayout from '@/shared/components/layout/MobileLayout';
import { ROUTES } from '@/shared/constants/routes';

export default function LoginPage() {
    const navigate = useNavigate();
    const { isLoggedIn, isAuthLoading } = useAuth();

    useEffect(() => {
        if (!isAuthLoading && isLoggedIn) {
            navigate(ROUTES.HOME, { replace: true });
        }
    }, [isAuthLoading, isLoggedIn, navigate]);

    if (isAuthLoading) {
        return (
            <MobileLayout
                content={
                    <div className="flex flex-1 items-center justify-center text-sm text-[#6b7280]">
                        로그인 상태 확인 중...
                    </div>
                }
            />
        );
    }

    return (
        <MobileLayout
            content={
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <h1 className="text-xl font-bold text-[#111827]">로그인</h1>
                    <p className="text-sm text-[#6b7280]">상단 로그인 버튼(모달)로 로그인해 주세요.</p>
                </div>
            }
        />
    );
}
