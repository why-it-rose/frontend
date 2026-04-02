import lockIco from '@/assets/lock.svg';

interface GuestLockPanelProps {
  title: string;
  message: React.ReactNode;
  onClose?: () => void;
}

export default function GuestLockPanel({ title, message, onClose }: GuestLockPanelProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 bg-white">
        <div className="relative flex h-12 items-center justify-center px-4">
          <span className="text-[13px] font-semibold text-[#014D9D]">{title}</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f2f4f7] transition-colors"
              aria-label="닫기"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="h-0.5 w-full bg-[#014D9D]" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <img src={lockIco} alt="" className="h-8 w-8 shrink-0" aria-hidden />
        <p className="text-sm leading-6 text-[#9ca3af]">{message}</p>
      </div>
    </div>
  );
}
