import { useState } from 'react';
import { loginWithEmail } from '@/features/auth/api/authApi';

type LoginModalProps = {
    onClose: () => void;
    onSignup: () => void;
    onLogin: (nickname: string) => void;
};

export default function LoginModal({ onClose, onSignup, onLogin }: LoginModalProps) {
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

            const result = await loginWithEmail({
                email: email.trim(),
                password,
            });

            localStorage.setItem('accessToken', result.accessToken);
            localStorage.setItem('refreshToken', result.refreshToken);

            onLogin(result.nickname);
        } catch {
            setErrorMessage('로그인에 실패했습니다. 이메일/비밀번호를 확인하세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ width: 430 }}>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: '#014d9d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span style={{ fontSize: 14 }}>🐻</span>
                    </div>
                    <span style={{ fontFamily: 'Noto Sans KR', fontWeight: 900, fontSize: 14, color: '#014d9d' }}>
            왜 올랐지?
          </span>
                </div>

                <div style={{ marginBottom: 6 }}>
          <span style={{ fontFamily: 'Noto Sans KR', fontWeight: 700, fontSize: 22, color: '#111827' }}>
            다시 오셨군요 👋
          </span>
                </div>
                <div style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: 'Noto Sans KR', fontSize: 14, color: '#6b7280' }}>
            계속하려면 로그인하세요.
          </span>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label
                        style={{
                            display: 'block',
                            fontFamily: 'Noto Sans KR',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: 6,
                        }}
                    >
                        이메일
                    </label>
                    <input
                        className="input-field"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label
                        style={{
                            display: 'block',
                            fontFamily: 'Noto Sans KR',
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: 6,
                        }}
                    >
                        비밀번호
                    </label>
                    <input
                        className="input-field active-border"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {errorMessage && (
                    <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#dc2626' }}>{errorMessage}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 18 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" style={{ width: 14, height: 14, accentColor: '#014d9d' }} />
                        <span style={{ fontFamily: 'Noto Sans KR', fontSize: 12, color: '#6b7280' }}>로그인 상태 유지</span>
                    </label>
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    style={{ marginBottom: 20 }}
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
                    <button type="button" className="btn-social">Google로 로그인</button>
                    <button type="button" className="btn-social">
                        <span style={{ color: '#3A1D1D' }}>카카오로 로그인</span>
                    </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Noto Sans KR', fontSize: 13, color: '#6b7280' }}>계정이 없으신가요?</span>
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
