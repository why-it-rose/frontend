# features/alert/hooks

알림 관련 커스텀 훅을 두는 폴더.
알림 목록 조회, 읽음 처리, 읽지 않은 알림 수 집계 등을 훅으로 추상화한다.

## 예시 파일
- `useAlerts.ts` — 알림 목록 조회 및 필터링 훅
- `useUnreadCount.ts` — 읽지 않은 알림 수 반환 훅 (GNB 배지용)
