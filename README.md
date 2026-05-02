# DesignBoard

디자인팀(류민석·계은영·한다영) 업무 기록·계획·보고 통합 관리 웹앱.

**[design-board-omega.vercel.app](https://design-board-omega.vercel.app)**

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| Daily Log | 업무별 진행 내용·이슈·인사이트 일일 기록 |
| Weekly Report | 차주 예정 업무 등록 및 주간 현황 관리 |
| 첨부 파일 | 업무에 링크 또는 이미지 첨부 (Supabase Storage) |
| 보고서 출력 | 버튼 1개로 팀 전체 업무를 대표 보고서로 자동 생성 |

---

## 페이지 구조

```
/           대시보드
/daily      Daily Log 입력·조회
/weekly     Weekly Report + 차주 업무 등록
/report/print   출력 전용 페이지 (미리보기 + 출력)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| DB / Storage | Supabase (PostgreSQL + Storage) |
| 인쇄 | `window.print()` + `@media print` CSS |
| 배포 | Vercel |

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 입력

# 3. 개발 서버 실행
npm run dev
```

---

## DB 세팅

Supabase SQL Editor에서 실행:

```
supabase/migrations/20260503000000_init.sql
supabase/migrations/20260503000001_attachments.sql
```

---

## 출력 흐름

```
차주 계획 등록 → 주간 실행 → 일일 기록 → 인사이트 축적 → 자동 보고 출력
```
