import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import logoutButtonImg from '@/assets/logoutButton.svg';
import {
  getApiResponseCode,
  updateMyNickname,
  updateMyPushEnabled,
} from '@/features/auth/api/authApi';
import { useAuth } from '@/features/auth/context/AuthContext';
import { clearAuthTransitionQueries } from '@/features/auth/query/authQuerySync';
import { useMyStats } from '@/features/prediction/hooks/useMyStats';
import type { MyPageTabKey } from './myPage.types';
import MyPageAlarmTab from './MyPageAlarmTab';
import MyPageReviewTab from './MyPageReviewTab';
import MyPageScrapTab from './MyPageScrapTab';
import MyPageSettingsTab from './MyPageSettingsTab';
import WithdrawConfirmModal from './WithdrawConfirmModal';

export interface MyPagePanelProps {
  onClose: () => void;
  onLogout: () => Promise<void>;
  onWithdraw: () => Promise<void>;
  withdrawMessage?: string;
  withdrawMessageType?: 'success' | 'error' | '';
}

const TABS: { key: MyPageTabKey; label: string }[] = [
  { key: 'scrap', label: '스크랩' },
  { key: 'review', label: '예측 복기' },
  { key: 'alarm', label: '알림 히스토리' },
  { key: 'settings', label: '설정' },
];

export default function MyPagePanel({
                                      onClose,
                                      onLogout,
                                      onWithdraw,
                                      withdrawMessage = '',
                                      withdrawMessageType = '',
                                    }: MyPagePanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, nickname, refreshAuth, clearAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<MyPageTabKey>('scrap');
  const [scrapManageMode, setScrapManageMode] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
      user?.pushEnabled ?? true,
  );
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationMessageType, setNotificationMessageType] = useState<
      'success' | 'error' | ''
  >('');

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameMessageType, setNicknameMessageType] = useState<
      'success' | 'error' | ''
  >('');

  const { data: stats } = useMyStats();

  const displayNickname = nickname || user?.nickname || '사용자';
  const displayEmail = user?.email || '';
  const profileInitial = Array.from(displayNickname.trim())[0] ?? '닉';

  useEffect(() => {
    setNicknameDraft(displayNickname);
  }, [displayNickname]);

  useEffect(() => {
    if (typeof user?.pushEnabled === 'boolean') {
      setNotificationsEnabled(user.pushEnabled);
    }
  }, [user?.pushEnabled]);

  const handleNicknameSave = async () => {
    const trimmedNickname = nicknameDraft.trim();

    if (!trimmedNickname) {
      setNicknameMessage('닉네임을 입력해 주세요.');
      setNicknameMessageType('error');
      return;
    }

    if (trimmedNickname === displayNickname) {
      setIsEditingNickname(false);
      setNicknameMessage('');
      setNicknameMessageType('');
      return;
    }

    try {
      setIsSavingNickname(true);
      setNicknameMessage('');
      setNicknameMessageType('');

      await updateMyNickname(trimmedNickname);
      await refreshAuth();

      setIsEditingNickname(false);
      setNicknameMessage('닉네임이 변경되었습니다.');
      setNicknameMessageType('success');
    } catch (error: unknown) {
      const responseCode = getApiResponseCode(error);

      if (responseCode === 4010) {
        setNicknameMessage('이미 사용 중인 닉네임입니다.');
        setNicknameMessageType('error');
        return;
      }

      if (responseCode === 4009) {
        setNicknameMessage('닉네임을 올바르게 입력해 주세요.');
        setNicknameMessageType('error');
        return;
      }

      if (responseCode === 2952) {
        setNicknameMessage('로그인이 필요합니다.');
        setNicknameMessageType('error');
        clearAuth();
        await clearAuthTransitionQueries(queryClient);
        onClose();
        navigate('/login');
        return;
      }

      setNicknameMessage('닉네임 변경 중 오류가 발생했습니다.');
      setNicknameMessageType('error');
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleNicknameCancel = () => {
    setNicknameDraft(displayNickname);
    setIsEditingNickname(false);
    setNicknameMessage('');
    setNicknameMessageType('');
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    if (isUpdatingNotifications) return;

    const prev = notificationsEnabled;
    setNotificationsEnabled(enabled);
    setIsUpdatingNotifications(true);
    setNotificationMessage('');
    setNotificationMessageType('');

    try {
      await updateMyPushEnabled(enabled);
      await refreshAuth();

      setNotificationMessage(enabled ? '알림을 켰습니다.' : '알림을 껐습니다.');
      setNotificationMessageType(enabled ? 'success' : 'error');
    } catch (error: unknown) {
      setNotificationsEnabled(prev);

      const responseCode = getApiResponseCode(error);
      if (responseCode === 2952) {
        setNotificationMessage('로그인이 필요합니다.');
        setNotificationMessageType('error');
        clearAuth();
        await clearAuthTransitionQueries(queryClient);
        onClose();
        navigate('/login');
        return;
      }

      setNotificationMessage('알림 설정 변경 중 오류가 발생했습니다.');
      setNotificationMessageType('error');
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (isWithdrawing) return;
    try {
      setIsWithdrawing(true);
      setShowWithdrawModal(false);
      await onWithdraw();
    } finally {
      setIsWithdrawing(false);
    }
  };

  const panel = (
      <>
        <button
            type="button"
            className="fixed inset-0 z-[200] cursor-default bg-black/15 max-md:bottom-[89px]"
            aria-label="닫기"
            onClick={onClose}
        />

        <div
            className="mypage-inter fixed top-0 right-0 z-[201] flex h-[100dvh] w-[25vw] min-w-[340px] max-w-[480px] flex-col bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.1)] max-md:bottom-[89px] max-md:h-auto max-md:w-full max-md:min-w-0 max-md:max-w-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mypage-panel-title"
        >
          <div className="shrink-0 border-b border-[#eff1f8]">
            <div className="px-[21px] pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="header-profile-initial flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white">
                  {profileInitial}
                </div>
                <div className="min-w-0">
                  {!isEditingNickname ? (
                      <div className="flex items-center gap-1.5">
                        <h2 id="mypage-panel-title" className="text-[15px] font-bold text-[#111827]">
                          {displayNickname}
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                              setIsEditingNickname(true);
                              setNicknameMessage('');
                              setNicknameMessageType('');
                            }}
                            aria-label="닉네임 수정"
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151]"
                        >
                          ✎
                        </button>
                      </div>
                  ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                            value={nicknameDraft}
                            onChange={(e) => setNicknameDraft(e.target.value)}
                            maxLength={50}
                            disabled={isSavingNickname}
                            className="h-7 w-[140px] rounded border border-[#d1d5db] px-2 text-xs text-[#111827] outline-none focus:border-primary"
                        />
                        <button
                            type="button"
                            onClick={handleNicknameSave}
                            disabled={isSavingNickname}
                            className="text-xs font-bold text-primary disabled:opacity-60"
                        >
                          저장
                        </button>
                        <button
                            type="button"
                            onClick={handleNicknameCancel}
                            disabled={isSavingNickname}
                            className="text-xs text-[#9ca3af]"
                        >
                          취소
                        </button>
                      </div>
                  )}

                  {nicknameMessage && (
                      <p
                          className={`mt-1 text-[11px] ${
                              nicknameMessageType === 'error' ? 'text-[#dc2626]' : 'text-[#059669]'
                          }`}
                      >
                        {nicknameMessage}
                      </p>
                  )}

                  <p className="mt-1 text-xs text-[#9ca3af]">{displayEmail}</p>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 border-t border-[#e5e7eb]">
              {([
                [
                  stats?.predictionAccuracy !== null && stats?.predictionAccuracy !== undefined
                      ? `${stats.predictionAccuracy.toFixed(1)}%`
                      : '-',
                  '예측 정답률',
                ],
                [stats?.totalPredictions?.toString() ?? '-', '총 예측'],
                [stats?.totalScraps?.toString() ?? '-', '스크랩'],
              ] as [string, string][]).map(([val, label], i) => (
                  <div key={label} className={`py-3 text-center ${i < 2 ? 'border-r border-[#e5e7eb]' : ''}`}>
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
              className={`${
                  activeTab === 'scrap' || activeTab === 'review' || activeTab === 'alarm'
                      ? 'scrollbar-faint'
                      : 'scrollbar-subtle'
              } ${
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
                    onSelectScrap={onClose}
                />
            )}
            {activeTab === 'review' && <MyPageReviewTab />}
            {activeTab === 'alarm' && <MyPageAlarmTab />}
            {activeTab === 'settings' && (
                <div className="flex flex-1 flex-col">
                  <MyPageSettingsTab
                      notificationsEnabled={notificationsEnabled}
                      onNotificationsChange={handleNotificationsChange}
                      disabled={isUpdatingNotifications}
                  />
                  {notificationMessage && (
                      <p
                          className={`px-[21px] pb-3 text-[11px] ${
                              notificationMessageType === 'error' ? 'text-[#dc2626]' : 'text-[#059669]'
                          }`}
                      >
                        {notificationMessage}
                      </p>
                  )}
                </div>
            )}
          </div>

          {!scrapManageMode && (
              <div className="hidden shrink-0 flex-col items-center gap-2 border-t border-[#eff1f8] px-[21px] pt-6 pb-4 md:flex">
                <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="w-full cursor-pointer overflow-hidden rounded-[10px] border-0 bg-transparent p-0 shadow-none"
                >
                  <img src={logoutButtonImg} alt="로그아웃" className="block h-11.25 w-full" width={348} height={37} />
                </button>
                <button
                    type="button"
                    onClick={() => setShowWithdrawModal(true)}
                    className="border-0 bg-transparent text-xs text-[#9ca3af] underline"
                >
                  회원 탈퇴
                </button>

                {withdrawMessage && (
                    <p className={`text-[11px] ${withdrawMessageType === 'error' ? 'text-[#dc2626]' : 'text-[#059669]'}`}>
                      {withdrawMessage}
                    </p>
                )}
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="flex shrink-0 flex-col items-center gap-2 border-t border-[#eff1f8] px-[21px] pt-6 pb-4 md:hidden">
                <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="w-full cursor-pointer overflow-hidden rounded-[10px] border-0 bg-transparent p-0 shadow-none"
                >
                  <img src={logoutButtonImg} alt="로그아웃" className="block h-11.25 w-full" width={348} height={37} />
                </button>
                <button
                    type="button"
                    onClick={() => setShowWithdrawModal(true)}
                    className="border-0 bg-transparent text-xs text-[#9ca3af] underline"
                >
                  회원 탈퇴
                </button>

                {withdrawMessage && (
                    <p className={`text-[11px] ${withdrawMessageType === 'error' ? 'text-[#dc2626]' : 'text-[#059669]'}`}>
                      {withdrawMessage}
                    </p>
                )}
              </div>
          )}
        </div>

        <WithdrawConfirmModal
            open={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            onConfirmWithdraw={handleConfirmWithdraw}
        />
      </>
  );

  return createPortal(panel, document.body);
}
