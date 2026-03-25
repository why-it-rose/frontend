# pages/MyPage/components

마이페이지 전용 레이아웃·조합 컴포넌트를 두는 폴더.  
이 폴더의 컴포넌트는 마이페이지 외 다른 곳에서 사용하지 않는다.

## 파일

| 파일 | 설명 |
|------|------|
| `MyPagePanel.tsx` | 헤더 프로필에서 열리는 오른쪽 슬라이드 패널(탭·로그아웃·포털) |
| `MyPageScrapTab.tsx` | 스크랩 탭 |
| `MyPageReviewTab.tsx` | 예측 복기 탭 |
| `MyPageAlarmTab.tsx` | 알림 히스토리 탭 |
| `MyPageSettingsTab.tsx` | 설정 탭(알림 토글·회원탈퇴 진입) |
| `WithdrawConfirmModal.tsx` | 회원탈퇴 확인 모달 |
| `MyPageStockAvatar.tsx` | 종목 이니셜 아바타 |
| `MyPageSearchPlaceholder.tsx` | 검색창 플레이스홀더 UI |
| `myPage.types.ts` | 마이페이지 전용 타입 |
| `myPage.mock.ts` | 목업 데이터(API 연동 전) |

## 예시

- `MyPageLayout.tsx` — 마이페이지 전체 섹션 레이아웃
- `PredictionReviewPage.tsx` — 예측·복기 탭 화면 조합
