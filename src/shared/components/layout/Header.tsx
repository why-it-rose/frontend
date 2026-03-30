import { useState, useRef, type RefObject } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROUTES } from "@/shared/constants/routes";
import logoSrc from "@/assets/logo.svg";
import bellSrc from "@/assets/bell.svg";
import bellNotSrc from "@/assets/bell_not.svg";
import SearchDropdown from "@/pages/widgets/SearchDropdown/SearchDropdown";
import LoginModal from "@/features/auth/components/LoginModal";
import SignupModal from "@/features/auth/components/SignupModal";
import MyPagePanel from "@/pages/MyPage/components/MyPagePanel";
import AlertCenter from "@/features/alert/AlertCenter/AlertCenter";
import { alertCenterListHasUnread } from "@/features/alert/AlertCenter/alertCenter.mock";
import { logoutFromServer } from "@/features/auth/api/authApi";


type HeaderProps = {
  onMyPageOpen?: () => void;
  disableMyPagePanel?: boolean;
};

export default function Header({ onMyPageOpen, disableMyPagePanel = false }: HeaderProps) {
  const { isLoggedIn, nickname, refreshAuth, clearAuth} = useAuth();
  const profileInitial = Array.from(nickname.trim())[0] ?? "유";
  const navigate = useNavigate();
  const [modal, setModal] = useState<"login" | "signup" | null>(null);
  const [myPageOpen, setMyPageOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertAnchor, setAlertAnchor] = useState<"mobile" | "desktop" | null>(null);
  const [allListMarkedRead, setAllListMarkedRead] = useState(false);
  const [detailFullyReadIds, setDetailFullyReadIds] = useState<Set<number>>(() => new Set());
  const mobileAlertContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopAlertContainerRef = useRef<HTMLDivElement | null>(null);

  const hasUnread = alertCenterListHasUnread(allListMarkedRead, detailFullyReadIds);

  const renderAlertButton = (
    anchor: "mobile" | "desktop",
    containerRef: RefObject<HTMLDivElement | null>,
    className: string,
  ) => (
    <div ref={containerRef} className={`relative flex items-center justify-center ${className}`}>
      <button
        type="button"
        onClick={() => {
          setAlertAnchor(anchor);
          setAlertOpen((prev) => (alertAnchor === anchor ? !prev : true));
        }}
        className="flex items-center justify-center"
      >
        <img src={hasUnread ? bellSrc : bellNotSrc} alt="알림" className="w-8.5 h-8.5" />
      </button>
      {alertOpen && alertAnchor === anchor && (
        <AlertCenter
          onClose={() => setAlertOpen(false)}
          containerRef={containerRef}
          allListMarkedRead={allListMarkedRead}
          onAllListMarkedRead={() => setAllListMarkedRead(true)}
          detailFullyReadIds={detailFullyReadIds}
          onNotificationDetailFullyRead={(notificationId) => {
            setDetailFullyReadIds((prev) => new Set(prev).add(notificationId));
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <header className="shrink-0 bg-white border-b border-[#d8e2f8]">
        {/* 모바일 헤더 (~ md) */}
        <div className="flex md:hidden items-center justify-between h-[55px] px-4">
          <Link to={ROUTES.HOME}>
            <img
              src={logoSrc}
              alt="왜 올랐지?"
              style={{ height: "58px", width: "auto", objectFit: "contain", marginTop: 6 }}
            />
          </Link>
          {isLoggedIn ? (
            renderAlertButton("mobile", mobileAlertContainerRef, "")
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setModal("login")}
                className="flex items-center justify-center text-sm font-medium text-[#4b5368] bg-white border border-[#d1d5db] rounded-[7px]"
                style={{ padding: "8px 16px", height: "30px", minWidth: "52px" }}
              >
                로그인
              </button>
              <button
                onClick={() => setModal("signup")}
                className="flex items-center justify-center text-sm font-semibold text-white rounded-[7px] bg-primary"
                style={{ padding: "8px 16px", height: "30px", minWidth: "60px" }}
              >
                회원가입
              </button>
            </div>
          )}
        </div>
        {/* 데스크톱 헤더 (md ~) */}
        <div className="hidden md:grid header-grid items-center h-[68px] px-4">
          <Link to={ROUTES.HOME}>
            <img
              src={logoSrc}
              alt="왜 올랐지?"
              style={{
                height: "72px",
                width: "auto",
                maxWidth: "320px",
                objectFit: "contain",
              }}
            />
          </Link>
          <SearchDropdown />
          <div className="flex items-center justify-end gap-2.5">
            {isLoggedIn ? (
              <>
                {renderAlertButton("desktop", desktopAlertContainerRef, "w-8.5 h-8.5")}
                <button
                  onClick={() => {
                    if (onMyPageOpen) {
                      onMyPageOpen();
                      return;
                    }
                    setMyPageOpen(true);
                  }}
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-primary"
                >
                  {profileInitial}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setModal("login")}
                  className="flex items-center justify-center text-sm font-medium text-[#4b5368] bg-white border border-[#d1d5db] rounded-[7px]"
                  style={{ padding: "8px 16px", height: "30px", minWidth: "52px" }}
                >
                  로그인
                </button>
                <button
                  onClick={() => setModal("signup")}
                  className="flex items-center justify-center text-sm font-semibold text-white rounded-[7px] bg-primary"
                  style={{ padding: "8px 16px", height: "30px", minWidth: "60px" }}
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {modal === "login" && (
        <LoginModal
          onClose={() => setModal(null)}
          onSignup={() => setModal("signup")}
          onLoginSuccess={async() => {
            await  refreshAuth();
            setModal(null);
          }}
        />
      )}

      {modal === "signup" && (
        <SignupModal
          onClose={() => setModal(null)}
          onLogin={() => setModal("login")}
        />
      )}
      {!disableMyPagePanel && isLoggedIn && myPageOpen && (
        <MyPagePanel
          onClose={() => setMyPageOpen(false)}
          onLogout={async () => {
              try {
                  await logoutFromServer();
              } finally {
                  clearAuth();
                  setMyPageOpen(false);
                  navigate(ROUTES.HOME);
              }
          }}
        />
      )}
    </>
  );
}
