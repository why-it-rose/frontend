import { useState } from 'react';
import { createPortal } from 'react-dom';
import logoutButtonImg from '@/assets/logoutButton.svg';
import type { MyPageTabKey } from './myPage.types';
import MyPageAlarmTab from './MyPageAlarmTab';
import MyPageReviewTab from './MyPageReviewTab';
import MyPageScrapTab from './MyPageScrapTab';
import MyPageSettingsTab from './MyPageSettingsTab';
import WithdrawConfirmModal from './WithdrawConfirmModal';

export interface MyPagePanelProps {
  onClose: () => void;
  onLogout: () => void;
}

const TABS: { key: MyPageTabKey; label: string }[] = [
  { key: 'scrap', label: '스크랩' },
  { key: 'review', label: '예측 복기' },
  { key: 'alarm', label: '알림 히스토리' },
  { key: 'settings', label: '설정' },
];

export default function MyPagePanel({ onClose, onLogout }: MyPagePanelProps) {
  const [activeTab, setActiveTab] = useState<MyPageTabKey>('scrap');
  const [scrapManageMode, setScrapManageMode] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const panel = (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] cursor-default bg-black/15"
        aria-label="닫기"
        onClick={onClose}
      />

      <div
        className="mypage-inter fixed top-0 right-0 z-[201] flex h-[100dvh] w-full max-w-[400px] flex-col bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.1)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mypage-panel-title"
      >
        <div className="shrink-0 border-b border-[#eff1f8]">
          <div className="px-[21px] pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="header-profile-initial flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white">
                신
              </div>
              <div className="min-w-0">
                <h2 id="mypage-panel-title" className="text-[15px] font-bold text-[#111827]">
                  신범창
                </h2>
                <p className="text-xs text-[#9ca3af]">example@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 border-t border-[#e5e7eb]">
            {[
              ['75%', '예측 정답률'],
              ['100', '총 예측'],
              ['12', '스크랩'],
            ].map(([val, label], i) => (
              <div
                key={label}
                className={`py-3 text-center ${i < 2 ? 'border-r border-[#e5e7eb]' : ''}`}
              >
                <div className="text-lg font-bold text-primary">{val}</div>
                <div className="mt-0.5 text-[11px] text-[#9ca3af]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 border-b border-[#e5e7eb]">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                setScrapManageMode(false);
              }}
              className={`relative flex min-h-[44px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center px-1 py-2 text-center text-xs transition-colors ${
                activeTab === t.key
                  ? "z-[1] font-bold text-primary after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-[2.5px] after:bg-primary after:content-['']"
                  : 'font-medium text-[#9ca3af]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          className={`${activeTab === 'scrap' || activeTab === 'review' || activeTab === 'alarm' ? 'scrollbar-faint' : 'scrollbar-subtle'} ${
            activeTab === 'scrap' || activeTab === 'review' || activeTab === 'alarm'
              ? 'scrollbar-overlay-right'
              : ''
          } flex min-h-0 flex-1 flex-col overflow-y-auto`}
        >
          {activeTab === 'scrap' && (
            <MyPageScrapTab
              manageMode={scrapManageMode}
              onManageStart={() => setScrapManageMode(true)}
              onManageEnd={() => setScrapManageMode(false)}
            />
          )}
          {activeTab === 'review' && <MyPageReviewTab />}
          {activeTab === 'alarm' && <MyPageAlarmTab />}
          {activeTab === 'settings' && (
            <MyPageSettingsTab
              notificationsEnabled={notificationsEnabled}
              onNotificationsChange={setNotificationsEnabled}
            />
          )}
        </div>

        {!scrapManageMode && (
          <div className="flex shrink-0 flex-col items-center gap-2 border-t border-[#eff1f8] px-[21px] pt-6 pb-4">
            <button
              type="button"
              onClick={onLogout}
              className="w-full cursor-pointer overflow-hidden rounded-lg border-0 bg-transparent p-0 shadow-none"
            >
              <img src={logoutButtonImg} alt="로그아웃" className="block h-auto w-full" width={348} height={37} />
            </button>
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="border-0 bg-transparent text-xs text-[#9ca3af] underline"
            >
              회원 탈퇴
            </button>
          </div>
        )}
      </div>

      <WithdrawConfirmModal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onConfirmWithdraw={onLogout}
      />
    </>
  );

  return createPortal(panel, document.body);
}
