import { useState, type MouseEvent } from 'react';
import axios from 'axios';
import { signupWithEmail } from '@/features/auth/api/authApi';
import signupLogo from '@/assets/logo.svg';

type SignupModalProps = {
    onClose: () => void;
    onLogin: () => void;
};

export default function SignupModal({ onClose, onLogin }: SignupModalProps) {
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPasswordValid = (value: string) =>
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);

    const handleSignup = async () => {
        const trimmedName = name.trim();
        const trimmedNickname = nickname.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName || !trimmedNickname || !trimmedEmail || !password || !passwordConfirm) {
            setErrorMessage('모든 항목을 입력해 주세요.');
            return;
        }

        if (trimmedName.length > 100) {
            setErrorMessage('이름은 100자 이하로 입력해 주세요.');
            return;
        }

        if (trimmedNickname.length > 50) {
            setErrorMessage('닉네임은 50자 이하로 입력해 주세요.');
            return;
        }

        if (!isEmailValid(trimmedEmail)) {
            setErrorMessage('올바른 이메일 형식을 입력해 주세요.');
            return;
        }

        if (!isPasswordValid(password)) {
            setErrorMessage('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
            return;
        }

        if (password !== passwordConfirm) {
            setErrorMessage('비밀번호 확인이 일치하지 않습니다.');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');

            await signupWithEmail({
                name: trimmedName,
                nickname: trimmedNickname,
                email: trimmedEmail,
                password,
            });

            onLogin();
        } catch (error: unknown) {
            const responseCode = axios.isAxiosError(error) ? error.response?.data?.responseCode : undefined;

            if (responseCode === 4002) {
                setErrorMessage('이미 가입된 이메일입니다.');
            } else if (responseCode === 4010) {
                setErrorMessage('이미 사용 중인 닉네임입니다.');
            } else {
                setErrorMessage('회원가입에 실패했습니다. 입력값을 확인해 주세요.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-box"
                onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                style={{ width: 390 }}
            >
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
                    <img src={signupLogo} alt="왜 올랐지 로고" style={{ height: 54, width: 'auto' }} />
                </div>

                <div style={{ marginLeft: 8, marginRight: 8 }}>
                    <div style={{ marginBottom: 18 }}>
                        <span style={{ fontFamily: 'Noto Sans KR Black', fontWeight: 900, fontSize: 20, color: '#111827' }}>회원가입</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div>
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
                                이름
                            </label>
                            <input
                                className="input-field"
                                placeholder="김범창"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
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
                                닉네임
                            </label>
                            <input
                                className="input-field"
                                placeholder="신범창"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                            />
                        </div>
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
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
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
                            비밀번호
                        </label>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="8자 이상, 영문+숫자+특수문자"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
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
                            비밀번호 확인
                        </label>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="비밀번호를 한 번 더 입력하세요"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                    </div>

                    {errorMessage && (
                        <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#dc2626' }}>{errorMessage}</p>
                    )}

                    <button
                        type="button"
                        className="btn-primary"
                        style={{ marginBottom: 12 }}
                        onClick={handleSignup}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '가입 중...' : '가입하기'}
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'Noto Sans KR', fontSize: 13, color: '#6b7280', marginRight: 6 }}>이미 계정이 있으신가요?</span>
                    <button
                        type="button"
                        onClick={onLogin}
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
                        로그인
                    </button>
                </div>
            </div>
        </div>
    );
}
