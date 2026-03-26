import type { MouseEvent } from 'react'
type SignupModalProps = {
    onClose: () => void;
    onLogin: () => void;
};

export default function SignupModal({ onClose, onLogin }: SignupModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-box"
                onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                style={{ width: 430 }}
            >
                <button
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

                <div style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: 'Noto Sans KR', fontWeight: 700, fontSize: 22, color: '#111827' }}>
            회원가입
          </span>
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
                        <input className="input-field" placeholder="김범창" />
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
                        <input className="input-field" placeholder="신범창" />
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
                    <input className="input-field" type="email" placeholder="example@gmail.com" />
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
                    <input className="input-field active-border" type="password" placeholder="8자 이상, 영문+숫자+특수문자" />
                </div>

                <div style={{ marginBottom: 20 }}>
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
                    <input className="input-field" type="password" placeholder="비밀번호를 한 번 더 입력하세요" />
                </div>

                <button className="btn-primary" style={{ marginBottom: 12 }}>
                    가입하기
                </button>

                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'Noto Sans KR', fontSize: 13, color: '#6b7280' }}>이미 계정이 있으신가요?</span>
                    <button
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
