import type { MouseEvent } from 'react';
import signupLogo from '@/assets/logo.svg';

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
            <input className="input-field" type="password" placeholder="8자 이상, 영문+숫자+특수문자" />
          </div>

          <div style={{ marginBottom: 36 }}>
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

          <button type="button" className="btn-primary" style={{ marginBottom: 12 }}>
            가입하기
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
