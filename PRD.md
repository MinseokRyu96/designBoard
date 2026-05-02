# PRD v5: 디자인팀 업무 관리 웹

> 통합 출력 리포트 기능 포함 최종 버전

---

## 1. 개요

### 목적

디자인팀 3인의 업무를 **기록 → 계획 → 인사이트 → 보고**까지 통합 관리하고,
출력 버튼 클릭 시 **대표 보고용으로 자동 정리된 리포트를 생성**한다.

### 사용자

| 이름 | 역할 |
|------|------|
| 류민석 | 디자인팀 |
| 계은영 | 디자인팀 |
| 한다영 | 디자인팀 |

---

## 2. 핵심 기능

| # | 기능 | 설명 |
|---|------|------|
| 1 | 통합 출력 | 버튼 1개로 3명 업무 자동 정리 |
| 2 | 보고 포맷 자동 구성 | 대표가 보기 좋은 구조로 자동 정렬 |
| 3 | 데이터 자동 그룹핑 | 사람 / 프로젝트 / 날짜 기준 정리 |
| 4 | 일일 기록 | 업무별 진행 내용, 이슈, 인사이트 기록 |
| 5 | 주간 계획 | 차주 예정 업무 관리 |

---

## 3. 출력 기능 상세 설계

### 3.1 출력 트리거

**버튼:** `[출력하기]`

**위치:**
- Daily Log 페이지
- Weekly Report 페이지

---

### 3.2 출력 데이터 범위

```
- 특정 날짜 (일간)
- 특정 주간 (주간)
```

---

### 3.3 출력 정렬 구조

**출력 고정 순서:**
1. 류민석
2. 계은영
3. 한다영

**전체 레이아웃:**

```
[디자인팀 업무 보고]

날짜: YYYY-MM-DD

━━━━━━━━━━━━━━━━━━━

[류민석]

프로젝트 A
- 업무명
- 상태
- 진행 내용
- 이슈
- 다음 작업
- 인사이트

프로젝트 B
...

━━━━━━━━━━━━━━━━━━━

[계은영]

...

━━━━━━━━━━━━━━━━━━━

[한다영]

...

━━━━━━━━━━━━━━━━━━━

[차주 예정 업무]

[류민석]
- 업무명 / 시작일 / 완료일

[계은영]
...

[한다영]
...
```

---

### 3.4 데이터 그룹핑 로직

| 단계 | 기준 | 방식 |
|------|------|------|
| 1단계 | 사용자 | `member_id` 기준 그룹핑 |
| 2단계 | 프로젝트 | `project_id` 기준 그룹핑 |
| 3단계 | 업무 | `task_id` 기준 정렬 |
| 4단계 | 날짜 | 최신 순 정렬 |

---

### 3.5 출력 포함 데이터 (필수 항목)

```
- 업무명
- 목적
- 프로젝트
- 상태
- 업무 시작일
- 완료 예정일
- 오늘 진행 내용
- 이슈
- 다음 작업
- 특별 인사이트
```

---

### 3.6 UI 출력 스타일

**디자인 기준:**
- 흑백 출력 최적화
- 여백 충분히 확보
- 섹션 구분선 사용

**상태 표시 (컬러 제거):**
```
진행중 → [진행중]
완료   → [완료]
```

---

### 3.7 차주 업무 출력

별도 섹션 `[차주 예정 업무]`

```
이름
- 업무명 / 시작일 / 완료일
```

---

### 3.8 출력 방식

- 기본: `window.print()`
- 옵션: PDF 저장 지원

---

## 4. DB 스키마

기존 구조 활용 (신규 테이블 없음)

### 사용 테이블

| 테이블 | 용도 |
|--------|------|
| `tasks` | 업무 정보 (업무명, 상태, 날짜 등) |
| `daily_logs` | 일별 진행 내용, 이슈, 인사이트 |
| `next_week_tasks` | 차주 예정 업무 |

### tasks

```sql
CREATE TABLE tasks (
  id          UUID PRIMARY KEY,
  member_id   UUID NOT NULL,
  project_id  UUID NOT NULL,
  title       TEXT NOT NULL,
  purpose     TEXT,
  status      TEXT CHECK (status IN ('진행중', '완료', '보류')),
  start_date  DATE,
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### daily_logs

```sql
CREATE TABLE daily_logs (
  id           UUID PRIMARY KEY,
  task_id      UUID REFERENCES tasks(id),
  member_id    UUID NOT NULL,
  log_date     DATE NOT NULL,
  progress     TEXT,
  issue        TEXT,
  next_action  TEXT,
  insight      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

### next_week_tasks

```sql
CREATE TABLE next_week_tasks (
  id          UUID PRIMARY KEY,
  member_id   UUID NOT NULL,
  title       TEXT NOT NULL,
  start_date  DATE,
  due_date    DATE,
  week_of     DATE NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API 설계

### 출력 데이터 조회

```http
GET /reports?type=daily&date=YYYY-MM-DD
GET /reports?type=weekly&week=YYYY-Www
```

### 응답 구조

```json
{
  "type": "daily",
  "date": "2026-05-03",
  "members": [
    {
      "id": "uuid",
      "name": "류민석",
      "projects": [
        {
          "project_id": "uuid",
          "project_name": "프로젝트명",
          "tasks": [
            {
              "id": "uuid",
              "title": "업무명",
              "purpose": "목적",
              "status": "진행중",
              "start_date": "2026-05-01",
              "due_date": "2026-05-10",
              "log": {
                "progress": "오늘 진행 내용",
                "issue": "이슈",
                "next_action": "다음 작업",
                "insight": "특별 인사이트"
              }
            }
          ]
        }
      ]
    }
  ],
  "next_week_tasks": [
    {
      "member_name": "류민석",
      "tasks": [
        {
          "title": "업무명",
          "start_date": "2026-05-11",
          "due_date": "2026-05-15"
        }
      ]
    }
  ]
}
```

### 기타 API

```http
POST   /tasks                        # 업무 생성
PUT    /tasks/:id                    # 업무 수정
GET    /tasks?member_id=&date=       # 업무 조회

POST   /daily-logs                   # 일일 로그 기록
GET    /daily-logs?member_id=&date=  # 일일 로그 조회

POST   /next-week-tasks              # 차주 업무 등록
GET    /next-week-tasks?week=        # 차주 업무 조회
```

---

## 6. UI 요구사항

### 페이지 구조

| Route | 설명 |
|-------|------|
| `/` | 대시보드 (팀 전체 현황) |
| `/daily` | Daily Log 입력/조회 |
| `/weekly` | Weekly Report 조회 |
| `/report/print` | 출력 전용 페이지 (미리보기 + 출력) |

### `/report/print` 페이지 기능

- 날짜 / 주간 선택
- 출력 미리보기 화면
- `[출력하기]` 버튼 → `window.print()`
- PDF 저장 옵션

### 공통 UI 원칙

- 입력 폼: 업무명, 상태, 날짜, 진행 내용, 이슈, 다음 작업, 인사이트
- 멤버 탭 전환으로 3인 데이터 분리 표시
- 인쇄 시 CSS `@media print` 적용 (컬러 제거, 여백 확보)

---

## 7. 기술 스택 (권장)

| 영역 | 기술 |
|------|------|
| Frontend | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes 또는 Supabase |
| DB | PostgreSQL (Supabase) |
| 인쇄 | `window.print()` + CSS `@media print` |
| PDF | `react-to-print` 또는 브라우저 기본 PDF 저장 |

---

## 8. KPI

### 정량

| 지표 | 목표 |
|------|------|
| 보고 작성 시간 | 70% 감소 |
| 보고 정확도 | 누락 항목 0건 |

### 정성

- 대표의 업무 현황 이해도 상승
- 보고를 위한 커뮤니케이션 감소

---

## 9. 시스템 전체 흐름

```
1. 차주 계획 등록   →  /weekly (next_week_tasks 입력)
2. 주간 실행       →  /daily (tasks 생성 및 관리)
3. 일일 기록       →  /daily (daily_logs 입력)
4. 인사이트 축적   →  daily_logs.insight 누적
5. 자동 보고 출력  →  /report/print → [출력하기]
```

---

## 10. 핵심 가치

> 버튼 하나로 **"팀 전체 업무 → 대표 보고서"** 자동 생성
>
> "정리해서 보고하는 사람" 필요 없음 → **시스템이 자동으로 정리**
