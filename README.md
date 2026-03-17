# why-it-rose — Frontend

주식 급등락 이벤트의 원인을 탐색하고 학습 기록을 남기는 서비스의 프론트엔드 레포.

---

## 기술 스택

| 구분 | 라이브러리 |
|---|---|
| 빌드 | Vite 8 |
| UI | React 19 + TypeScript 5.9 (strict) |
| 스타일 | Tailwind CSS v4 |
| 서버 상태 | TanStack Query v5 |
| 라우팅 | React Router v7 (SPA) |
| HTTP | Axios |

---

## 시작하기

```bash
pnpm install
pnpm dev
```

---

## 폴더 구조

```
src/
├── app/
│   ├── router/       # 라우트 트리 정의 (react-router v7)
│   └── providers/    # 전역 Provider 조합 (QueryClient 등)
├── pages/            # 페이지 진입점 + 페이지 전용 레이아웃 컴포넌트
│   ├── Home/
│   ├── StockDetail/
│   ├── AlertCenter/
│   └── MyPage/
├── features/         # 도메인별 API·컴포넌트·훅·타입
│   ├── auth/         # 로그인, 소셜 로그인, 로그인 유도
│   ├── stock/        # 종목 검색, 종목 상세, 관심종목
│   ├── event/        # 급등락 이벤트, 스크랩, 메모, 예측
│   ├── news/         # 이벤트 연관 뉴스, 오늘의 뉴스
│   └── alert/        # 알림센터, 읽음 처리, 알림 설정
└── shared/
    ├── api/          # axios 인스턴스, 공통 에러 처리
    ├── components/
    │   ├── common/   # 범용 UI (Button, Badge 등)
    │   └── layout/   # GNB, PageWrapper 등
    ├── constants/    # 라우트 경로 등 공통 상수
    ├── hooks/        # useDebounce, useDisclosure 등 범용 훅
    ├── types/        # ApiResponse<T> 등 공통 타입
    └── utils/        # 날짜·숫자 포맷 등 순수 유틸
```

### 컴포넌트 배치 기준

| 위치 | 기준 | 예시 |
|---|---|---|
| `pages/XXX/components/` | 해당 페이지 전용 레이아웃·조합 | `StockDetailLayout` |
| `features/xxx/components/` | 비즈니스 로직 포함 컴포넌트 | `ScrapButton`, `NewsCard` |
| `shared/components/common/` | 여러 페이지에서 재사용되는 범용 UI | `Button`, `Badge` |

---

## 환경변수 설정

`.env.example`을 복사해서 `.env.local`을 만들고 값을 채운다.

```bash
cp .env.example .env.local
```

| 변수 | 설명 | 기본값 |
|---|---|---|
| `VITE_API_BASE_URL` | 백엔드 서버 주소 | `http://localhost:8080` |

---

## API 요청 방법

`src/shared/api/axios.ts`의 인스턴스를 import해서 사용한다.
인스턴스가 로컬스토리지의 `accessToken`을 `Authorization: Bearer` 헤더에 자동으로 첨부한다.

```ts
import apiClient from '@/shared/api/axios';

const { data } = await apiClient.get('/stocks/search', { params: { q: '삼성' } });
```

---

## React Query 설정

`src/app/providers/QueryProvider.tsx`에 설정됨.

| 옵션 | 값 |
|---|---|
| `staleTime` | 1분 (1000 * 60) |
| `retry` | 1회 |

`App.tsx`에서 `QueryProvider`로 앱 전체를 감싸서 사용한다.

---

## 주요 기능 (MVP)

- **종목 탐색** — 종목 검색, 코스피/코스닥 리스트, 관심종목 추가·해제
- **이벤트 탐색** — 급등락 이벤트 핀 차트, 이벤트 상세(요약·뉴스·메모 탭), 오늘의 뉴스 핀
- **학습 기록** — 스크랩, 메모 작성·수정·삭제, 방향 예측, 예측 복기
- **알림센터** — 관심종목 뉴스 모아보기, 종목·태그·날짜·읽음 필터링
- **마이페이지** — 알림 on/off, 보관함, 예측·복기, 계정 관리(로그아웃·탈퇴)
- **인증** — 카카오·네이버·구글 소셜 로그인, 비로그인 접근 시 로그인 유도 팝업
