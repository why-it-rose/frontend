import { useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/context/AuthContext';
import MobileLayout from '@/shared/components/layout/MobileLayout';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <MobileLayout
      content={
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <h1 className="text-xl font-bold text-[#111827]">로그인</h1>
          <p className="text-center text-sm text-[#6b7280]">
            로그인 연동 전까지는 아래 버튼으로 세션만 시뮬레이션합니다.
          </p>
          <button
            type="button"
            onClick={() => {
              login();
              navigate('/home', { replace: true });
            }}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white"
          >
            로그인하기
          </button>
        </div>
      }
    />
  );
}
