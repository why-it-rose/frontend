import { useState } from 'react';
import { loginWithEmail } from '@/features/auth/api/authApi';
import loginLogo from '@/assets/logo.svg';
import googleIcon from '@/assets/google.svg';
import kakaoIcon from '@/assets/kakao.svg';

type LoginModalProps = {
    onClose: () => void;
    onSignup: () => void;
    onLoginSuccess: () => Promise<void>;
};

export default function LoginModal({ onClose, onSignup, onLoginSuccess }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            setErrorMessage('이메일과 비밀번호를 입력하세요.');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');

            await loginWithEmail({
                email: email.trim(),
                password,
            });

            await onLoginSuccess();
        } catch {
            setErrorMessage('로그인에 실패했습니다. 이메일/비밀번호를 확인하세요.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ width: 390, height: 621 }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#9ca3af',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6,
                    }}
                >
                    ✕
                </button>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 0, marginLeft: -2, marginTop: -6 }}>
                    <img src={loginLogo} alt="왜 올랐지 로고" style={{ height: 54, width: 'auto' }} />
                </div>

                <div style={{ marginBottom: 6, marginLeft: 8 }}>
          <span style={{ fontFamily: 'Noto Sans KR Black', fontWeight: 900, fontSize: 20, color: '#111827' }}>
            반갑습니다 👋
          </span>
                </div>
                <div style={{ marginBottom: 24, marginLeft: 8 }}>
          <span style={{ fontFamily: 'Noto Sans KR', fontSize: 14, color: '#6b7280' }}>
            계속하려면 로그인하세요.
          </span>
                </div>

                <div style={{ marginBottom: 14, marginLeft: 8 }}>
                    <label
                        style={{
                            display: 'block',
                            fontFamily: 'Noto Sans KR',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: 6,
                            marginLeft: 3,
                        }}
                    >
                        이메일
                    </label>
                    <input
                        className="input-field"
                        style={{ width: 'calc(100% - 16px)', marginLeft: 4}}
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div style={{ marginBottom: 10, marginLeft: 8 }}>
                    <label
                        style={{
                            display: 'block',
                            fontFamily: 'Noto Sans KR',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: 6,
                            marginLeft: 4,
                        }}
                    >
                        비밀번호
                    </label>
                    <input
                        className="input-field"
                        style={{ width: 'calc(100% - 16px)', marginLeft: 4 }}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {errorMessage && (
                    <p style={{ margin: '0 0 12px 12px', fontSize: 12, color: '#dc2626' }}>{errorMessage}</p>
                )}

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        marginBottom: 12,
                        marginLeft: 8,
                        width: 'calc(100% - 12px)',
                    }}
                >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" style={{ width: 14, height: 14, accentColor: '#014d9d', marginLeft: 4 }} />
                        <span style={{ fontFamily: 'Noto Sans KR', fontSize: 12, color: '#6b7280', transform: 'translateY(-1px)' }}>로그인 상태 유지</span>
                    </label>
                    <button
                        type="button"
                        style={{
                            border: 'none',
                            background: 'none',
                            padding: 0,
                            fontFamily: 'Noto Sans KR',
                            fontSize: 12,
                            color: '#6b7280',
                            cursor: 'pointer',
                        }}
                    >
                        비밀번호 찾기
                    </button>
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    style={{ marginBottom: 20, width: 'calc(100% - 12px)', marginLeft: 8 }}
                    onClick={handleLogin}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '로그인 중...' : '로그인'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <span style={{ fontFamily: 'Noto Sans KR', fontSize: 12, color: '#9ca3af' }}>또는 소셜 로그인</span>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    <button
                        type="button"
                        className="btn-social"
                        disabled
                        aria-disabled="true"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            width: 'calc(100% - 12px)',
                            marginLeft: 8,
                        }}
                    >
                        <img src={googleIcon} alt="" aria-hidden style={{ width: 18, height: 18 }} />
                        <span>Google로 로그인</span>
                    </button>
                    <button
                        type="button"
                        className="btn-social"
                        disabled
                        aria-disabled="true"
                        style={{ width: 'calc(100% - 12px)', marginLeft: 8 }}
                    >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: '#3A1D1D' }}>
                            <img src={kakaoIcon} alt="" aria-hidden style={{ width: 18, height: 18 }} />
                            <span>카카오로 로그인</span>
                        </span>
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: -10 }}>
                    <span style={{ fontFamily: 'Noto Sans KR', fontSize: 13, color: '#6b7280', marginRight: 6 }}>계정이 없으신가요?</span>
                    <button
                        type="button"
                        onClick={onSignup}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'Noto Sans KR',
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#014d9d',
                        }}
                    >
                        회원가입
                    </button>
                </div>
            </div>
        </div>
    );
}
