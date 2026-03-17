# shared/api

모든 features에서 공통으로 사용하는 API 기반 설정을 두는 폴더.
axios 인스턴스, 인터셉터, 공통 에러 처리 등을 관리한다.

## 예시 파일
- `client.ts` — baseURL·인터셉터가 설정된 axios 인스턴스
- `queryKeys.ts` — TanStack Query 쿼리 키 팩토리 모음
