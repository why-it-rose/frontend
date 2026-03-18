# pages/MyPage

마이페이지의 진입점 파일을 두는 폴더.
알림 on/off, 관심 설정, 보관함, 예측·복기, 계정 관리(로그아웃·탈퇴) 화면을 렌더링한다.

## 예시 파일
- `index.tsx` — 마이페이지 루트 컴포넌트

## 컴포넌트 배치 기준
- `components/` — 이 페이지 전용 레이아웃·조합 컴포넌트 (예: `MyPageLayout.tsx`, `ScrapArchivePage.tsx`)
- 인증 관련 비즈니스 로직 컴포넌트는 `features/auth/components/`에 위치
- 여러 페이지에서 재사용되는 UI는 `shared/components/common/`에 위치
