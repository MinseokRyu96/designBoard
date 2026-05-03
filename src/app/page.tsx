"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MEMBER_ORDER, type MemberName } from "@/types";

const MEMBER_COLORS: Record<MemberName, { dot: string; chip: string; text: string }> = {
  류민석: { dot: "bg-[#3366FF]", chip: "bg-[#EEF3FF]", text: "text-[#3366FF]" },
  계은영: { dot: "bg-[#FF4E6A]", chip: "bg-[#FFF0F2]", text: "text-[#FF4E6A]" },
  한다영: { dot: "bg-[#F5A623]", chip: "bg-[#FFF8EC]", text: "text-[#C87D00]" },
};

const MEMBER_IDS: Record<MemberName, string> = {
  류민석: "11111111-1111-1111-1111-111111111111",
  계은영: "22222222-2222-2222-2222-222222222222",
  한다영: "33333333-3333-3333-3333-333333333333",
};

interface LogEntry {
  log_date: string;
  member_id: string;
}

interface TaskEntry {
  id: string;
  member_id: string;
  title: string;
  start_date: string | null;
  due_date: string | null;
}

interface TaskStreak {
  taskId: string;
  title: string;
  memberName: MemberName;
  dates: string[]; // start_date ~ due_date 전체 구간
}

function getMemberName(id: string): MemberName | null {
  return (Object.entries(MEMBER_IDS).find(([, v]) => v === id)?.[0] as MemberName) ?? null;
}

function dateRange(start: string, end: string, clampFrom: string, clampTo: string): string[] {
  const from = start < clampFrom ? clampFrom : start;
  const to = end > clampTo ? clampTo : end;
  const dates: string[] = [];
  const d = new Date(from + "T00:00:00");
  while (toDateStr(d) <= to) {
    dates.push(toDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDow(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=일, 1=월, ... 6=토
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function getChipPos(dates: string[], date: string, col: number): "solo" | "start" | "middle" | "end" {
  const idx = dates.indexOf(date);
  const prevConsec = idx > 0 && dates[idx - 1] === addDays(date, -1) && col > 0;
  const nextConsec = idx < dates.length - 1 && dates[idx + 1] === addDays(date, 1) && col < 6;
  if (prevConsec && nextConsec) return "middle";
  if (prevConsec) return "end";
  if (nextConsec) return "start";
  return "solo";
}

const chipClass: Record<string, string> = {
  solo:   "mx-1.5 rounded-full",
  start:  "ml-1.5 mr-0 rounded-l-full rounded-r-none",
  middle: "mx-0 rounded-none",
  end:    "ml-0 mr-1.5 rounded-l-none rounded-r-full",
};

// 대한민국 공휴일 (2024–2028)
const KOREAN_HOLIDAYS: Record<string, string> = {
  // 2024
  "2024-01-01": "신정",
  "2024-02-09": "설날 연휴",
  "2024-02-10": "설날",
  "2024-02-11": "설날 연휴",
  "2024-02-12": "대체공휴일",
  "2024-03-01": "삼일절",
  "2024-05-05": "어린이날",
  "2024-05-06": "대체공휴일",
  "2024-05-15": "부처님오신날",
  "2024-06-06": "현충일",
  "2024-08-15": "광복절",
  "2024-09-16": "추석 연휴",
  "2024-09-17": "추석",
  "2024-09-18": "추석 연휴",
  "2024-10-03": "개천절",
  "2024-10-09": "한글날",
  "2024-12-25": "성탄절",
  // 2025
  "2025-01-01": "신정",
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2025-03-01": "삼일절",
  "2025-03-03": "대체공휴일",
  "2025-05-05": "어린이날",
  "2025-05-06": "대체공휴일",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-08": "대체공휴일",
  "2025-10-09": "한글날",
  "2025-12-25": "성탄절",
  // 2026
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-06": "현충일",
  "2026-06-08": "대체공휴일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-09-28": "대체공휴일",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  // 2027
  "2027-01-01": "신정",
  "2027-02-05": "설날 연휴",
  "2027-02-06": "설날",
  "2027-02-07": "설날 연휴",
  "2027-02-08": "대체공휴일",
  "2027-03-01": "삼일절",
  "2027-05-05": "어린이날",
  "2027-05-13": "부처님오신날",
  "2027-06-06": "현충일",
  "2027-06-07": "대체공휴일",
  "2027-08-15": "광복절",
  "2027-08-16": "대체공휴일",
  "2027-09-14": "추석 연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석 연휴",
  "2027-10-03": "개천절",
  "2027-10-04": "대체공휴일",
  "2027-10-09": "한글날",
  "2027-10-11": "대체공휴일",
  "2027-12-25": "성탄절",
  "2027-12-27": "대체공휴일",
  // 2028
  "2028-01-01": "신정",
  "2028-01-03": "대체공휴일",
  "2028-01-25": "설날 연휴",
  "2028-01-26": "설날",
  "2028-01-27": "설날 연휴",
  "2028-03-01": "삼일절",
  "2028-05-02": "부처님오신날",
  "2028-05-05": "어린이날",
  "2028-06-06": "현충일",
  "2028-08-15": "광복절",
  "2028-10-02": "추석 연휴",
  "2028-10-03": "추석·개천절",
  "2028-10-04": "추석 연휴",
  "2028-10-05": "대체공휴일",
  "2028-10-09": "한글날",
  "2028-12-25": "성탄절",
};

const SHORTCUTS = [
  { href: "/daily", label: "Daily Log", desc: "오늘 업무 기록" },
  { href: "/weekly", label: "Weekly", desc: "주간 현황 & 차주 계획" },
  { href: "/report/print", label: "보고서 출력", desc: "대표 보고서 자동 생성" },
];

export default function DashboardPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [streaks, setStreaks] = useState<TaskStreak[]>([]);
  const [memberDots, setMemberDots] = useState<Map<string, MemberName[]>>(new Map());

  useEffect(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    // member dots: daily_logs 기반
    const logsPromise = fetch(`/api/daily-logs?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: LogEntry[]) => {
        if (!Array.isArray(data)) return;
        const dotMap = new Map<string, MemberName[]>();
        for (const entry of data) {
          const memberName = getMemberName(entry.member_id);
          if (!memberName) continue;
          if (!dotMap.has(entry.log_date)) dotMap.set(entry.log_date, []);
          if (!dotMap.get(entry.log_date)!.includes(memberName)) {
            dotMap.get(entry.log_date)!.push(memberName);
          }
        }
        setMemberDots(dotMap);
      });

    // chips: tasks의 start_date ~ due_date 전체 구간 기반
    const tasksPromise = fetch(`/api/tasks?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: TaskEntry[]) => {
        if (!Array.isArray(data)) return;
        const streakList: TaskStreak[] = [];
        for (const task of data) {
          const memberName = getMemberName(task.member_id);
          if (!memberName || !task.start_date) continue;
          const end = task.due_date ?? task.start_date;
          const dates = dateRange(task.start_date, end, from, to);
          if (dates.length > 0) {
            streakList.push({ taskId: task.id, title: task.title, memberName, dates });
          }
        }
        setStreaks(streakList);
      });

    Promise.all([logsPromise, tasksPromise]);
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDow(year, month);
  const todayStr = toDateStr(today);

  // 주(week) 단위로 슬롯을 고정 배정 → 같은 태스크가 여러 날에 걸쳐 동일한 행(row)에 표시됨
  const MAX_CHIP_ROWS = 3;
  const chipSlotMap = new Map<string, (TaskStreak | null)[]>(); // date → 슬롯 배열
  const chipOverflowMap = new Map<string, number>();            // date → 넘친 칩 수

  const numWeeks = Math.ceil((firstDow + daysInMonth) / 7);

  for (let weekRow = 0; weekRow < numWeeks; weekRow++) {
    // 이번 주 7칸의 날짜 (빈 셀 = null)
    const weekDates: (string | null)[] = [];
    for (let col = 0; col < 7; col++) {
      const dayIdx = weekRow * 7 + col - firstDow;
      if (dayIdx < 0 || dayIdx >= daysInMonth) {
        weekDates.push(null);
      } else {
        const d = dayIdx + 1;
        weekDates.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      }
    }

    // 이번 주에 등장하는 태스크와 주 내 열 범위 수집
    const weekTaskMap = new Map<string, { streak: TaskStreak; startCol: number; endCol: number }>();
    for (let col = 0; col < 7; col++) {
      const date = weekDates[col];
      if (!date) continue;
      for (const streak of streaks) {
        if (!streak.dates.includes(date) || weekTaskMap.has(streak.taskId)) continue;
        let startCol = col, endCol = col;
        for (let c = 0; c < 7; c++) {
          const d = weekDates[c];
          if (d && streak.dates.includes(d)) {
            if (c < startCol) startCol = c;
            if (c > endCol) endCol = c;
          }
        }
        weekTaskMap.set(streak.taskId, { streak, startCol, endCol });
      }
    }

    // 시작 열 순으로 정렬 후 슬롯 배정 (그리디: 가장 낮은 빈 슬롯)
    const weekTasks = Array.from(weekTaskMap.values())
      .sort((a, b) => a.startCol - b.startCol || a.streak.taskId.localeCompare(b.streak.taskId));

    const slotOccupancy: { startCol: number; endCol: number }[][] = [];
    const taskSlot = new Map<string, number>();

    for (const task of weekTasks) {
      let slot = 0;
      while (true) {
        const conflict = (slotOccupancy[slot] ?? []).some(
          o => !(o.endCol < task.startCol || o.startCol > task.endCol)
        );
        if (!conflict) break;
        slot++;
      }
      if (!slotOccupancy[slot]) slotOccupancy[slot] = [];
      slotOccupancy[slot].push({ startCol: task.startCol, endCol: task.endCol });
      taskSlot.set(task.streak.taskId, slot);
    }

    const numSlots = Math.min(slotOccupancy.length, MAX_CHIP_ROWS);

    // 날짜별 슬롯 배열 & 오버플로우 수 저장
    for (let col = 0; col < 7; col++) {
      const date = weekDates[col];
      if (!date) continue;

      const slots: (TaskStreak | null)[] = Array(numSlots).fill(null);
      let overflow = 0;
      for (const [taskId, slot] of taskSlot.entries()) {
        const task = weekTaskMap.get(taskId);
        if (!task || !task.streak.dates.includes(date)) continue;
        if (slot < MAX_CHIP_ROWS) slots[slot] = task.streak;
        else overflow++;
      }
      chipSlotMap.set(date, slots);
      if (overflow > 0) chipOverflowMap.set(date, overflow);
    }
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-[#191F28] tracking-tight">이번 달 현황</h1>
          <p className="text-sm text-[#A0AAB4] mt-1">{year}년 {month + 1}월 팀 활동 캘린더</p>
        </div>
        <Link
          href="/report/print"
          className="px-4 py-2 bg-[#191F28] text-white rounded-xl text-sm font-medium hover:bg-[#2D3748] transition-colors"
        >
          보고서 출력
        </Link>
      </div>

      {/* 멤버 범례 */}
      <div className="flex gap-5 mb-6">
        {MEMBER_ORDER.map((name) => (
          <div key={name} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${MEMBER_COLORS[name].dot}`} />
            <span className="text-xs font-medium text-[#6B7685]">{name}</span>
          </div>
        ))}
      </div>

      {/* 캘린더 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F6]">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A0AAB4] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors text-base"
          >
            ‹
          </button>
          <span className="font-semibold text-[#191F28] text-sm">{year}년 {month + 1}월</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#A0AAB4] hover:bg-[#F4F6FA] hover:text-[#191F28] transition-colors text-base"
          >
            ›
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-[#F9FAFB]">
          {weekdays.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] font-semibold py-2.5 tracking-wide ${
                i === 0 ? "text-[#FF4E6A]" : i === 6 ? "text-[#3366FF]" : "text-[#A0AAB4]"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-r border-[#EEF1F6] min-h-[76px]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const col = (firstDow + i) % 7;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dots = memberDots.get(dateStr) ?? [];
            const dateSlots = chipSlotMap.get(dateStr) ?? [];
            const hasAnyChip = dateSlots.some(s => s !== null);
            const overflow = chipOverflowMap.get(dateStr) ?? 0;
            const isToday = dateStr === todayStr;
            const isSat = col === 6;
            const isSun = col === 0;
            const holiday = KOREAN_HOLIDAYS[dateStr];
            const isRed = isSun || !!holiday;

            return (
              <Link
                key={day}
                href={`/daily?date=${dateStr}`}
                className={`border-b border-r border-[#EEF1F6] min-h-[76px] flex flex-col hover:bg-[#F8FAFF] transition-colors ${
                  isSat ? "text-[#3366FF]" : isRed ? "text-[#FF4E6A]" : "text-[#6B7685]"
                }`}
              >
                {/* 날짜 + 도트 — 수평 패딩 유지 */}
                <div className="px-1.5 pt-1.5 flex flex-col items-center">
                  <span
                    className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                      isToday
                        ? "bg-[#3366FF] text-white"
                        : "hover:bg-[#EEF3FF]"
                    }`}
                  >
                    {day}
                  </span>

                  {holiday && (
                    <span className="text-[8px] font-medium text-[#FF4E6A] leading-tight mt-0.5 text-center truncate w-full px-0.5">
                      {holiday}
                    </span>
                  )}

                  {dots.length > 0 && !hasAnyChip && (
                    <div className="flex gap-0.5 justify-center mt-1">
                      {MEMBER_ORDER.filter(n => dots.includes(n)).map(name => (
                        <span key={name} className={`w-1.5 h-1.5 rounded-full ${MEMBER_COLORS[name].dot}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* 칩 — 슬롯 고정 배치로 같은 태스크가 동일한 행에 표시됨 */}
                {dateSlots.length > 0 && (
                  <div className="mt-0.5 space-y-0.5 pb-1.5">
                    {dateSlots.map((streak, slotIdx) => {
                      if (!streak) {
                        // 빈 슬롯 — 아래 칩 정렬을 위한 spacer
                        return <div key={`empty-${slotIdx}`} className="h-4" />;
                      }
                      const pos = getChipPos(streak.dates, dateStr, col);
                      const colors = MEMBER_COLORS[streak.memberName];
                      return (
                        <div
                          key={streak.taskId}
                          className={`h-4 flex items-center ${colors.chip} ${chipClass[pos]}`}
                          title={streak.title}
                        >
                          {(pos === "solo" || pos === "start") && (
                            <span className={`text-[9px] font-semibold truncate px-1.5 ${colors.text}`}>
                              {streak.title}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {overflow > 0 && (
                      <span className="text-[9px] text-[#A0AAB4] px-1.5">+{overflow}</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 바로가기 */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {SHORTCUTS.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="p-4 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#3366FF] hover:shadow-sm transition-all group"
          >
            <p className="font-semibold text-[#191F28] text-sm group-hover:text-[#3366FF] transition-colors">{f.label}</p>
            <p className="text-xs text-[#A0AAB4] mt-1">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
