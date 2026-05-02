# CLAUDE.md — DesignBoard 프로젝트

디자인팀(류민석·계은영·한다영) 업무 관리 웹앱.
PRD.md를 항상 먼저 참조할 것.

---

## 프로젝트 컨텍스트

- **목적:** 디자인팀 3인 업무 기록/계획/보고 통합 관리
- **핵심:** `/report/print` 페이지에서 버튼 하나로 대표 보고서 자동 생성
- **출력 고정 순서:** 류민석 → 계은영 → 한다영 (절대 변경 금지)

---

## 허용 권한 (자동 승인)

### 파일 시스템

```
# 읽기 — 항상 허용
Bash(find:*)
Bash(ls:*)
Bash(cat:*)
Bash(grep:*)
Bash(rg:*)

# 프로젝트 내 쓰기 — 허용
Write(/Users/minseokryu/Desktop/Project/DesignBoard/**)
Edit(/Users/minseokryu/Desktop/Project/DesignBoard/**)
```

### 패키지 관리

```
# 의존성 설치/업데이트 — 허용 (package.json 변경 포함)
Bash(npm install*)
Bash(npm install --save-dev*)
Bash(npm run*)
Bash(npx create-next-app*)
Bash(npx*)
```

### 개발 서버 및 빌드

```
# 개발 서버 실행, 빌드, 타입 체크 — 허용
Bash(npm run dev*)
Bash(npm run build*)
Bash(npm run lint*)
Bash(npm run type-check*)
Bash(npx tsc*)
```

### Git (로컬)

```
# 로컬 git 작업 — 허용
Bash(git init)
Bash(git add*)
Bash(git commit*)
Bash(git status)
Bash(git log*)
Bash(git diff*)
Bash(git checkout*)
Bash(git branch*)
```

### DB / Supabase CLI

```
# 마이그레이션 생성 및 로컬 DB 작업 — 허용
Bash(supabase db diff*)
Bash(supabase migration new*)
Bash(supabase gen types*)
Bash(supabase start)
Bash(supabase stop)
```

---

## 금지 사항 (반드시 확인 후 진행)

```
# 원격 배포 및 push — 사용자 확인 필요
Bash(git push*)
Bash(vercel deploy*)
Bash(supabase db push*)

# DB 데이터 삭제 — 사용자 확인 필요
Bash(supabase db reset*)
DROP TABLE*
DELETE FROM*

# 환경변수 파일 수정 — 사용자 확인 필요
Edit(.env*)
Write(.env*)
```

---

## 코딩 원칙

### 기술 스택

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS (shadcn/ui 선택적 활용)
- **DB:** Supabase (PostgreSQL)
- **인쇄:** `@media print` CSS + `window.print()`

### 파일 구조 규칙

```
src/
  app/
    (dashboard)/
      page.tsx          # 대시보드
    daily/
      page.tsx          # Daily Log
    weekly/
      page.tsx          # Weekly Report
    report/
      print/
        page.tsx        # 출력 전용 페이지
    api/
      reports/
        route.ts        # GET /api/reports
      tasks/
        route.ts
      daily-logs/
        route.ts
      next-week-tasks/
        route.ts
  components/
  lib/
    supabase/
  types/
```

### 코드 스타일

- 주석은 "왜(WHY)"가 자명하지 않을 때만 작성
- `any` 타입 사용 금지 — Supabase 생성 타입 활용
- 컴포넌트는 단일 책임 원칙 준수
- API route는 `/app/api/` 하위에만 작성

### 출력 기능 구현 원칙

- 출력 전용 CSS는 반드시 `@media print` 블록 안에 작성
- 출력 시 컬러 제거, 흑백 최적화 필수
- 멤버 순서(류민석→계은영→한다영)는 DB 조회 후 프론트에서 고정 정렬
- `window.print()` 호출 전 미리보기 화면 반드시 렌더링

### DB 규칙

- 테이블명: `snake_case` 복수형 (`tasks`, `daily_logs`, `next_week_tasks`)
- 모든 PK는 `UUID` 타입
- `created_at` 컬럼 모든 테이블에 필수
- 마이그레이션 파일은 `supabase/migrations/` 에만 작성

---

## 자주 쓰는 명령어

```bash
# 개발 서버
npm run dev

# 타입 체크
npx tsc --noEmit

# Supabase 타입 재생성
supabase gen types typescript --local > src/types/supabase.ts

# 빌드 확인
npm run build
```

---

## 멤버 ID (고정값 — DB 시드 기준)

```
류민석: member_id 는 Supabase auth 또는 별도 members 테이블로 관리
출력 정렬 순서는 name 기준 ['류민석', '계은영', '한다영'] 하드코딩 허용
```

---

## PRD 핵심 요약 (빠른 참조)

```
목표:   버튼 1개 → 팀 전체 업무 → 대표 보고서 자동 생성
출력:   /report/print → [출력하기] → window.print()
정렬:   류민석 > 계은영 > 한다영 (고정)
그룹:   member → project → task → date(최신순)
포맷:   흑백, 섹션 구분선, 충분한 여백
```
