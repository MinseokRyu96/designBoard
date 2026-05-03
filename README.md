# DesignBoard

디자인팀 업무 기록·계획·보고 통합 관리 웹앱.

**[ktpdesignboard.vercel.app](https://ktpdesignboard.vercel.app)**

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| Daily Log | 업무별 진행 내용·이슈·인사이트 일일 기록 |
| Weekly Report | 차주 예정 업무 등록 및 주간 현황 관리 |
| 첨부 파일 | 업무에 링크 또는 이미지 첨부 (Supabase Storage) |
| 보고서 출력 | 버튼 1개로 팀 전체 업무를 대표 보고서로 자동 생성 |
| 대시보드 캘린더 | 팀 전체 업무 기간을 한눈에 시각화 |

---

## UX 기능 상세

### Daily Log

| 기능 | 동작 |
|------|------|
| 퀵 추가 | 업무명 입력 → Enter로 즉시 등록, 상세 옵션(프로젝트·상태·목적·완료예정일) 선택적 펼침 |
| 자동 저장 | 로그 필드 입력 후 1.5초 뒤 자동 저장, 저장 상태 실시간 표시 |
| 상태 퀵 토글 | 상태 뱃지 클릭 → 진행중 → 완료 → 보류 순환 (수정 모달 없이 즉시 변경) |
| 태스크 복제 | `복제` 버튼으로 동일 업무를 현재 날짜에 새 카드로 즉시 생성 |
| 카드 접기/펼치기 | `▴/▾` 버튼으로 로그 필드 숨김·표시 (업무 많을 때 스크롤 절약) |
| 멤버 선택 기억 | 마지막 선택 멤버를 localStorage에 저장, 재방문 시 자동 복원 |

### Weekly Report

| 기능 | 동작 |
|------|------|
| 이번 주 기록 조회 | 요일별 Daily Log 요약 + 첨부파일 미리보기 |
| 태스크 제목 클릭 | 해당 날짜 Daily Log 페이지로 바로 이동 |
| 차주 예정 업무 | 다음 주 업무 목록 등록·삭제 |

### 대시보드 캘린더

| 기능 | 동작 |
|------|------|
| 업무 기간 칩 | 완료 예정일 설정 시 start_date~due_date 전 기간 표시, 미설정 시 시작일 당일만 표시 |
| 멤버 도트 | 당일 Daily Log 기록 여부를 멤버별 색상 도트로 표시 |
| 날짜 클릭 | 해당 날짜 Daily Log로 바로 이동 |

---

## 페이지 구조

```
/               대시보드 (월별 캘린더)
/daily          Daily Log 입력·조회
/weekly         Weekly Report + 차주 업무 등록
/report/print   출력 전용 페이지 (미리보기 + 출력)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14+ (App Router, TypeScript) |
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
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 입력

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
