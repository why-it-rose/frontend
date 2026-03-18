# pages/Home

메인 홈 페이지의 진입점 파일을 두는 폴더.
코스피/코스닥 종목 리스트, 관심종목 위젯으로 구성된 홈 화면을 렌더링한다.

## 예시 파일
- `index.tsx` — 홈 페이지 루트 컴포넌트

## 컴포넌트 배치 기준
- `components/` — 이 페이지 전용 레이아웃·조합 컴포넌트 (예: `HomeLayout.tsx`, `MarketTabPanel.tsx`)
- 비즈니스 로직이 담긴 컴포넌트는 `features/stock/components/` 또는 `features/alert/components/`에 위치
- 여러 페이지에서 재사용되는 UI는 `shared/components/common/`에 위치
