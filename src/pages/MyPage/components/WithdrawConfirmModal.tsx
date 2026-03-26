import { useState } from 'react';

export interface WithdrawConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmWithdraw: () => void;
}

export default function WithdrawConfirmModal({ open, onClose, onConfirmWithdraw }: WithdrawConfirmModalProps) {
  const [pwInput, setPwInput] = useState('');
  const [agreedDelete, setAgreedDelete] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/35 px-4" role="presentation">
      <div
        className="relative w-full max-w-[400px] rounded-2xl bg-white px-9 pb-7 pt-9 shadow-2xl"
        role="dialog"
        aria-labelledby="withdraw-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-lg text-[#9ca3af]"
          aria-label="닫기"
        >
          ✕
        </button>
        <div className="mb-4 text-center text-4xl" aria-hidden>
          🐻
        </div>
        <h3 id="withdraw-title" className="mb-2.5 text-center text-xl font-bold text-[#111827]">
          정말 탈퇴하시겠어요?
        </h3>
        <p className="mb-5 text-center text-[13px] leading-relaxed text-[#6b7280]">
          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
          <br />
          이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="mb-3">
          <label htmlFor="withdraw-pw" className="mb-1.5 block text-[13px] font-medium text-[#374151]">
            비밀번호 확인
          </label>
          <input
            id="withdraw-pw"
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            placeholder="현재 비밀번호 입력"
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm outline-none focus:border-[#3b82f6]"
          />
        </div>
        <label className="mb-5 flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={agreedDelete}
            onChange={(e) => setAgreedDelete(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 accent-primary"
          />
          <span className="text-xs text-[#6b7280]">
            계정 삭제 시 모든 데이터가 삭제되는 것을 이해했습니다.
          </span>
        </label>
        <button
          type="button"
          className="mb-2.5 w-full cursor-pointer rounded-lg border-0 bg-primary py-3 text-[15px] font-bold text-white"
          onClick={() => {
            onClose();
            onConfirmWithdraw();
          }}
        >
          계정 탈퇴
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer rounded-lg border-0 bg-[#f3f4f6] py-3 text-[15px] font-medium text-[#374151]"
        >
          취소
        </button>
      </div>
    </div>
  );
}
