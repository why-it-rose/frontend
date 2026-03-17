# shared/types

도메인에 속하지 않는 공통 TypeScript 타입을 두는 폴더.
API 응답 래퍼, 페이지네이션, 공통 유틸리티 타입 등을 관리한다.

## 예시 파일
- `api.types.ts` — `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError` 등 공통 응답 타입
- `common.types.ts` — `Nullable<T>`, `DateString` 등 범용 유틸리티 타입
