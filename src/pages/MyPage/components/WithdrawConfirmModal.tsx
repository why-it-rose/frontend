import { useState } from 'react';
import logoSad from '@/assets/logo_sad.svg';

export interface WithdrawConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmWithdraw: () => void;
}

export default function WithdrawConfirmModal({ open, onClose, onConfirmWithdraw }: WithdrawConfirmModalProps) {
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

          <div className="mb-2.5 flex justify-center" aria-hidden>
            <img src={logoSad} alt="" className="h-16 w-auto" />
          </div>

          <h3 id="withdraw-title" className="mb-2.5 text-center text-xl font-bold text-[#111827]">
            정말 탈퇴하시겠어요?
          </h3>

          <p className="mb-5 text-center text-[13px] leading-relaxed text-[#6b7280]">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
            <br />
            이 작업은 되돌릴 수 없습니다.
          </p>

          <label className="mb-5 flex cursor-pointer items-start gap-2">
            <input
                type="checkbox"
                checked={agreedDelete}
                onChange={(e) => setAgreedDelete(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-primary"
            />
            <span className="text-xs text-[#6b7280]">
            위 내용을 확인했으며, 계정 삭제에 동의합니다.
          </span>
          </label>

          <button
              type="button"
              disabled={!agreedDelete}
              className="mb-2.5 w-full rounded-lg border-0 bg-primary py-3 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
