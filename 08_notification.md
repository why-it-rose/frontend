# API 명세서 — Notification 도메인

> **Base Path** `/api/notifications`
> **인증 방식** JWT Bearer Token (전 엔드포인트 인증 필수)
> **최종 수정** 2026.03.18

---

## 설계 메모

### 알림 타입별 역할

| type | 발생 시점 | payload 구조 | 진입 화면 |
|---|---|---|---|
| `NEWS` | 매일 오전 8시 배치 | 관심종목별 뉴스 목록 | 오늘의 뉴스 패널 |
| `EVENT` | 급등락 감지 시 (확장) | 이벤트 정보 | 이벤트 상세 패널 |
| `REVIEW` | 예측 복기 알림 (확장) | 예측 결과 정보 | 예측복기 탭 |
| `SYSTEM` | 운영 공지 (확장) | 공지 텍스트 | - |

> 현재 MVP 기준 `NEWS` 타입이 핵심이며, 나머지는 확장 예정입니다.

### 알림센터 vs 알림 히스토리

- **알림센터 (전체/세부 탭)**: 날짜별로 묶인 관심종목 뉴스 알림 — 필터링 + 읽음 처리 중심
- **알림 히스토리 (마이페이지)**: 모든 타입 알림을 시간순으로 나열 — 이벤트 복기 알림 포함

---

## 에러 코드 (Notification 도메인)

| 코드 | 설명 | HTTP Status |
|---|---|---|
| `NOTI_001` | 존재하지 않는 알림 | 404 |
| `NOTI_002` | 본인의 알림이 아님 | 403 |
| `COMMON_001` | 서버 내부 오류 | 500 |
| `COMMON_002` | 네트워크 오류 / 요청 타임아웃 | 503 |

---

## 엔드포인트 목록

| # | Method | Path | 설명 | 인증 |
|---|---|---|---|---|
| 1 | GET | `/api/notifications/unread-count` | 읽지 않은 알림 수 조회 | ✅ |
| 2 | GET | `/api/notifications` | 알림 목록 조회 (전체 탭) | ✅ |
| 3 | GET | `/api/notifications/{notificationId}` | 알림 세부 조회 | ✅ |
| 4 | PATCH | `/api/notifications/read` | 알림 읽음 처리 (개별/전체) | ✅ |
| 5 | GET | `/api/notifications/history` | 알림 히스토리 조회 | ✅ |

---

## 1. 읽지 않은 알림 수 조회

### 기본 정보

| 항목 | 내용 |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/notifications/unread-count` |
| **인증** | ✅ 필요 |
| **관련 요구사항** | #33 (읽지 않음 배지), #70 (GNB 배지 표시) |
| **관련 DB** | `notifications` (`read_at IS NULL`, `status = ACTIVE`) |

### 동작 정책

- 페이지 진입 시 또는 포커스 복귀 시 폴링 방식으로 호출
- `unreadCount = 0`이면 GNB 배지 미노출

### Request

> 파라미터 없음. Access Token으로 사용자 식별.

### Response

**성공 `200 OK`**

```json
{
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "unreadCount": 3
  }
}
```

**실패**

| 상황 | code | HTTP |
|---|---|---|
| 유효하지 않은 토큰 | `AUTH_003` | 401 |
| 만료된 토큰 | `AUTH_004` | 401 |
| 서버 오류 | `COMMON_001` | 500 |

---

## 2. 알림 목록 조회 (전체 탭)

### 기본 정보

| 항목 | 내용 |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/notifications` |
| **인증** | ✅ 필요 |
| **관련 요구사항** | #30 (날짜별 묶음), #31 (정보 표기), #35 (종목 필터), #36 (태그 필터), #37 (날짜 범위), #38 (읽음·안읽음 필터) |
| **관련 DB** | `notifications`, `notification_logs`, `stocks`, `news`, `news_tags` |

### 동작 정책

- `type = NEWS` 알림만 표시 (MVP 기준)
- 날짜 내림차순 정렬, 동일 날짜 내 종목별로 그룹핑
- payload의 `stock_name`, `ticker`로 종목 JOIN 없이 렌더링 (스냅샷 활용)

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `stockId` | Long | ❌ | - | 특정 종목 필터 |
| `tagName` | String | ❌ | - | 특정 태그 필터 (예: `실적`, `HBM`) |
| `startDate` | Date | ❌ | - | 날짜 범위 시작 (`YYYY-MM-DD`) |
| `endDate` | Date | ❌ | - | 날짜 범위 종료 (`YYYY-MM-DD`) |
| `readStatus` | String | ❌ | - | `READ` \| `UNREAD` |
| `page` | Integer | ❌ | `1` | 페이지 번호 |
| `size` | Integer | ❌ | `20` | 페이지당 항목 수 |

### Response

**성공 `200 OK`**

```json
{
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "page": 1,
    "size": 20,
    "totalCount": 6,
    "items": [
      {
        "notifiedDate": "2026-03-10",
        "daysAgo": 4,
        "isRead": false,
        "notificationId": 301,
        "stocks": [
          {
            "stockId": 11,
            "ticker": "005930",
            "name": "삼성전자",
            "logoUrl": "https://...",
            "newsCount": 3
          },
          {
            "stockId": 2,
            "ticker": "000660",
            "name": "SK하이닉스",
            "logoUrl": "https://...",
            "newsCount": 2
          }
        ]
      },
      {
        "notifiedDate": "2026-03-09",
        "daysAgo": 5,
        "isRead": true,
        "notificationId": 295,
        "stocks": [
          {
            "stockId": 11,
            "ticker": "005930",
            "name": "삼성전자",
            "logoUrl": "https://...",
            "newsCount": 2
          }
        ]
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `notifiedDate` | Date | 알림 발송 날짜 |
| `daysAgo` | Integer | 오늘 기준 경과 일수 (화면 표시용) |
| `isRead` | Boolean | 해당 날짜 알림 읽음 여부 |
| `notificationId` | Long | 세부 조회 및 읽음 처리에 사용 |
| `stocks[].newsCount` | Integer | 해당 종목 당일 수집 뉴스 수 |

> 필터 결과가 없을 경우 `items: []`, `totalCount: 0`으로 응답합니다. (빈 상태 안내는 프론트 처리)

**실패**

| 상황 | code | HTTP |
|---|---|---|
| 잘못된 날짜 형식 | `COMMON_003` | 400 |
| 유효하지 않은 토큰 | `AUTH_003` | 401 |
| 만료된 토큰 | `AUTH_004` | 401 |
| 서버 오류 | `COMMON_001` | 500 |

---

## 3. 알림 세부 조회

### 기본 정보

| 항목 | 내용 |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/notifications/{notificationId}` |
| **인증** | ✅ 필요 |
| **관련 요구사항** | #31 (알림 정보 표기), #32 (알림 클릭 이동), #39 (원문 이동), #64 (종목 상세 이동) |
| **관련 DB** | `notifications`, `notification_logs`, `news`, `news_tags`, `stocks` |

### 동작 정책

- 세부 탭 클릭 또는 알림센터 특정 날짜 항목 클릭 시 호출
- `notification_logs.payload`의 `news_ids`로 뉴스 상세 조회
- 조회 시 자동으로 해당 알림 `read_at` 업데이트 (읽음 처리 병행)

### Path Parameter

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `notificationId` | Long | 알림 ID |

### Response

**성공 `200 OK`**

```json
{
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "notificationId": 301,
    "notifiedDate": "2026-03-15",
    "stockGroups": [
      {
        "stockId": 11,
        "ticker": "005930",
        "name": "삼성전자",
        "logoUrl": "https://...",
        "eventSummary": "급등 +19.47% · HBM 납품 외 2건",
        "newsItems": [
          {
            "newsId": 201,
            "title": "외국인, 삼성전자 3일 연속 순매수 2조원 돌파",
            "source": "연합인포맥스",
            "url": "https://...",
            "publishedAt": "2026-03-15T09:30:00",
            "tags": ["외국인 매수", "HBM"]
          }
        ],
        "eventAlerts": [
          {
            "eventId": 42,
            "eventType": "SURGE",
            "changeRate": 19.47,
            "summary": "HBM3E 납품 재개 기대감으로 외국인 매수세 집중."
          }
        ],
        "reviewAlert": {
          "eventId": 35,
          "changeRate": 6.81,
          "message": "+6.81% 이벤트를 스크랩한 지 1개월이 됐어요. 당시 예측이 맞았는지 확인해보세요."
        }
      },
      {
        "stockId": 2,
        "ticker": "000660",
        "name": "SK하이닉스",
        "logoUrl": "https://...",
        "eventSummary": "급락 -8.23% · 기업·실적 외 1건",
        "newsItems": [
          {
            "newsId": 205,
            "title": "SK하이닉스, 4분기 실적 전망치 하향 조정",
            "source": "연합인포맥스",
            "url": "https://...",
            "publishedAt": "2026-03-15T08:00:00",
            "tags": ["기업", "실적", "HBM"]
          }
        ],
        "eventAlerts": [
          {
            "eventId": 38,
            "eventType": "DROP",
            "changeRate": -8.23,
            "summary": "4분기 실적 전망 하향 조정 및 HBM 납품 지연 우려로 외국인 매도세 집중."
          }
        ],
        "reviewAlert": null
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `stockGroups` | Array | 종목별로 그룹핑된 알림 세부 내용 |
| `stockGroups[].eventSummary` | String | 세부 탭 상단 요약 텍스트 (payload 스냅샷) |
| `stockGroups[].newsItems` | Array | 해당 종목 당일 뉴스 목록 |
| `stockGroups[].eventAlerts` | Array | 급등락 이벤트 알림 (해당 시) |
| `stockGroups[].reviewAlert` | Object | 스크랩 1개월 복기 유도 알림 (해당 시, null 가능) |

**실패**

| 상황 | code | HTTP |
|---|---|---|
| 존재하지 않는 알림 | `NOTI_001` | 404 |
| 본인 알림이 아님 | `NOTI_002` | 403 |
| 유효하지 않은 토큰 | `AUTH_003` | 401 |
| 만료된 토큰 | `AUTH_004` | 401 |
| 서버 오류 | `COMMON_001` | 500 |

---

## 4. 알림 읽음 처리

### 기본 정보

| 항목 | 내용 |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/notifications/read` |
| **인증** | ✅ 필요 |
| **관련 요구사항** | #34 (개별/전체 읽음 처리) |
| **관련 DB** | `notifications.read_at = NOW()` |

### 동작 정책

- `notificationIds`를 비워서 보내면 전체 읽음 처리 (`모두 읽음` 버튼)
- 특정 ID 목록을 보내면 해당 알림만 읽음 처리
- 이미 읽음 처리된 알림은 무시 (멱등성 보장)

### Request Body

**전체 읽음 처리**
```json
{
  "notificationIds": []
}
```

**개별 읽음 처리**
```json
{
  "notificationIds": [301, 295]
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `notificationIds` | Array\<Long\> | ✅ | 읽음 처리할 알림 ID 목록. 빈 배열이면 전체 읽음 처리 |

### Response

**성공 `200 OK`**

```json
{
  "code": "SUCCESS",
  "message": "읽음 처리되었습니다.",
  "data": {
    "updatedCount": 6
  }
}
```

**실패**

| 상황 | code | HTTP |
|---|---|---|
| 목록에 본인 알림이 아닌 ID 포함 | `NOTI_002` | 403 |
| 유효하지 않은 토큰 | `AUTH_003` | 401 |
| 만료된 토큰 | `AUTH_004` | 401 |
| 서버 오류 | `COMMON_001` | 500 |

---

## 5. 알림 히스토리 조회

### 기본 정보

| 항목 | 내용 |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/notifications/history` |
| **인증** | ✅ 필요 |
| **관련 요구사항** | 마이페이지 알림히스토리 탭 |
| **관련 DB** | `notifications`, `notification_logs` |

### 동작 정책

- `NEWS`, `EVENT`, `REVIEW`, `SYSTEM` 전 타입 알림 포함
- 최신순 정렬, 날짜별 그룹핑
- payload 스냅샷 기반으로 렌더링 (stocks 테이블 JOIN 불필요)

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `stockId` | Long | ❌ | - | 특정 종목 필터 |
| `page` | Integer | ❌ | `1` | 페이지 번호 |
| `size` | Integer | ❌ | `20` | 페이지당 항목 수 |

### Response

**성공 `200 OK`**

```json
{
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "page": 1,
    "size": 20,
    "totalCount": 30,
    "groups": [
      {
        "date": "2026-03-15",
        "label": "오늘",
        "items": [
          {
            "notificationId": 301,
            "type": "NEWS",
            "title": "3/15일 관심 종목 알림",
            "description": "삼성전자, SK하이닉스",
            "isRead": false,
            "createdAt": "2026-03-15T08:00:00"
          },
          {
            "notificationId": 300,
            "type": "EVENT",
            "title": "삼성전자 급등 +19.47%",
            "description": "HBM 납품 외 2건",
            "isRead": true,
            "createdAt": "2026-03-15T10:30:00"
          },
          {
            "notificationId": 299,
            "type": "REVIEW",
            "title": "스크랩 이벤트 1개월 복기",
            "description": "+6.81% 이벤트를 스크랩한 지 1개월이 됐어요.",
            "isRead": false,
            "createdAt": "2026-03-15T08:00:00"
          }
        ]
      },
      {
        "date": "2026-03-12",
        "label": "3일 전",
        "items": [
          {
            "notificationId": 290,
            "type": "NEWS",
            "title": "3/12일 관심 종목 알림",
            "description": "삼성전자, SK하이닉스, NAVER",
            "isRead": true,
            "createdAt": "2026-03-12T08:00:00"
          }
        ]
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `groups` | Array | 날짜별 그룹핑된 알림 목록 |
| `groups[].label` | String | 날짜 레이블 (`오늘`, `N일 전` 등) |
| `items[].type` | String | `NEWS` \| `EVENT` \| `REVIEW` \| `SYSTEM` |
| `items[].title` | String | 알림 제목 (payload 스냅샷) |
| `items[].description` | String | 알림 부제목 (payload 스냅샷) |

**실패**

| 상황 | code | HTTP |
|---|---|---|
| 유효하지 않은 토큰 | `AUTH_003` | 401 |
| 만료된 토큰 | `AUTH_004` | 401 |
| 서버 오류 | `COMMON_001` | 500 |
