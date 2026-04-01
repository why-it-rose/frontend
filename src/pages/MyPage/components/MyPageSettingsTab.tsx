import settingBell from '@/assets/setting_bell.svg';

export interface MyPageSettingsTabProps {
  notificationsEnabled: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export default function MyPageSettingsTab({
                                            notificationsEnabled,
                                            onNotificationsChange,
                                            disabled = false,
                                          }: MyPageSettingsTabProps) {
  return (
      <div className="flex flex-1 flex-col px-[21px] py-4">
        <div className="mb-4">
          <div className="mb-2.5 text-[13px] font-bold text-[#374151]">알림</div>
          <div className="flex items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                  src={settingBell}
                  alt=""
                  className="h-8 w-8 shrink-0 object-contain"
                  width={32}
                  height={32}
                  aria-hidden
              />
              <div>
                <div className="text-[13px] font-bold text-[#111827]">전체 알림</div>
                <div className="mt-0.5 text-[11px] text-[#9ca3af]">모든 알림을 켜거나 끕니다</div>
              </div>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                disabled={disabled}
                onClick={() => onNotificationsChange(!notificationsEnabled)}
                className="relative h-6 w-11 shrink-0 overflow-hidden rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: notificationsEnabled ? '#014d9d' : '#d1d5db' }}
            >
            <span
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: notificationsEnabled ? 'translateX(20px)' : 'translateX(0)' }}
            />
            </button>
          </div>
        </div>
      </div>
  );
}
