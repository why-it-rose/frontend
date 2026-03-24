import { Link } from 'react-router';
import MobileLayout from '@/shared/components/layout/MobileLayout';

export default function SignupPage() {
  return (
    <MobileLayout
      content={
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <h1 className="text-xl font-bold text-[#111827]">회원가입</h1>
          <p className="text-center text-sm text-[#6b7280]">준비 중입니다.</p>
          <Link to="/login" className="text-sm font-medium text-primary underline">
            로그인으로 돌아가기
          </Link>
        </div>
      }
    />
  );
}
