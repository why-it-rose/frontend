import lockIco from '@/assets/lock.svg';

interface GuestLockPanelProps {
  title: string;
  message: React.ReactNode;
  onClose?: () => void;
}

export default function GuestLockPanel({ title, message }: GuestLockPanelProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 bg-white">
        <div className="flex h-12 items-center justify-center px-4">
          <span className="text-[13px] font-semibold text-[#014D9D]">{title}</span>
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
