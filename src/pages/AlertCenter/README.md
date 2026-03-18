# pages/AlertCenter

알림센터 페이지의 진입점 파일을 두는 폴더.
관심종목 뉴스 목록을 날짜순으로 표시하고, 종목·태그·날짜·읽음 상태로 필터링하는 화면을 렌더링한다.

## 예시 파일
- `index.tsx` — 알림센터 페이지 루트 컴포넌트

## 컴포넌트 배치 기준
- `components/` — 이 페이지 전용 레이아웃·조합 컴포넌트 (예: `AlertCenterLayout.tsx`, `AlertFilterBar.tsx`)
- 뉴스 카드 등 비즈니스 로직 컴포넌트는 `features/alert/components/`에 위치
- 여러 페이지에서 재사용되는 UI는 `shared/components/common/`에 위치
