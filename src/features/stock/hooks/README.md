# features/stock/hooks

종목 관련 커스텀 훅을 두는 폴더.
종목 검색, 종목 상세 조회, 관심종목 상태 관리 등을 훅으로 추상화한다.

## 예시 파일
- `useStockSearch.ts` — 검색어 입력에 따른 실시간 종목 검색 훅
- `useWatchlist.ts` — 관심종목 목록 조회 및 추가·해제 뮤테이션 훅
