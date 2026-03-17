# app/providers

앱 최상위에서 감싸는 전역 Provider를 정의하는 폴더.
QueryClient, RouterProvider 등 앱 전체에 영향을 주는 컨텍스트를 한 곳에서 조합한다.

## 예시 파일
- `QueryProvider.tsx` — `@tanstack/react-query` QueryClient 설정 및 Provider
- `index.tsx` — 모든 Provider를 하나로 합쳐 export하는 AppProviders 컴포넌트
